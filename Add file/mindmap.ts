import { QuartzTransformerPlugin } from "../types"
import {
  TransformOptions,
  FullSlug,
  transformLink,
} from "../../util/path"
import { defaultOptions, Options } from './links'
import { IPureNode } from 'markmap-common'
import { Transformer, builtInPlugins } from "markmap-lib"
import { canonicalizeCallout } from "./ofm"
import hePkg from "he";

const { decode } = hePkg;

const wikilinkRegex = /(!)?\[\[(?<link>[^|\]#]+)(?:#(?<fragment>[^|\]]+))?\|?(?<displayText>[^\]]*)\]\]|(?<!:)#(?<tag>[A-Za-z0-9_-]+)(?=\s|$)/g
const imageEmbedRegex = /^(?<width>\d+)(x(?<height>\d+))?$/
const youtubeImageRegex = /<img\b[^>]*\bsrc=["'](https?:\/\/(?:www\.)?youtu[^\s"'>]*)["'][^>]*>/g
const calloutRegex = /<blockquote\b[^>]*>\s*<p\b[^>]*>\s*\[!(?<type>\w+)\]\s*(?<remain>[\s\S]*?)<\/p>/g
const codeBlockRegex = /<code\b[^>]*>[\s\S]*?<\/code>/g

const transformer = new Transformer([
  ...builtInPlugins,
])

const recurseChildren = (fn: (node: IPureNode) => void) => (node: IPureNode) => {
  fn(node)
  node.children?.forEach(recurseChildren(fn))
}

function* matchRegex(str: string, regex: RegExp) {
  while (true) {
    const match = regex.exec(str)
    if (!match) break
    yield match
  }
}

function replaceMatches(str: string, regex: RegExp, replacer: (match: RegExpExecArray) => string) {
  let accumulator = str
  const matches = matchRegex(str, regex)
  for (const match of matches)
    accumulator = accumulator.replace(match[0], replacer(match))
  return accumulator
}

function replaceMatchesExcept(
  str: string,
  regex: RegExp,
  replacer: (match: RegExpExecArray) => string,
  exceptRegex: RegExp,
  exceptPlaceholder: string
): string {
  const codeBlocks: string[] = []
  let protectedStr = str.replace(exceptRegex, (codeBlock) => {
    codeBlocks.push(codeBlock)
    return `___${exceptPlaceholder}_${codeBlocks.length - 1}___`
  })

  protectedStr = replaceMatches(protectedStr, regex, replacer)
  const restoreRegex = new RegExp(`___${exceptPlaceholder}_(\\d+)___`, 'g')

  return protectedStr.replace(restoreRegex, (_, i) => codeBlocks[+i])
}

function toYouTubeEmbedURL(link: string) {
  try {
    const url = new URL(link)

    if (url.hostname === "youtu.be") {
      const id = url.pathname.slice(1)
      return `https://www.youtube.com/embed/${id}`
    }

    if (url.hostname.includes("youtube.com")) {
      const playlistId = url.searchParams.get("list")
      if (url.pathname.startsWith("/playlist") && playlistId) {
        return `https://www.youtube.com/embed/videoseries?list=${playlistId}`
      }

      const videoId = url.searchParams.get("v")
      if (url.pathname.startsWith("/watch") && videoId) {
        return `https://www.youtube.com/embed/${videoId}`
      }

      if (url.pathname.startsWith("/embed/")) {
        return link
      }
    }

    return null
  } catch {
    return null
  }
}

function wikilinkReplacement(currentSlug: FullSlug, transformOptions: TransformOptions) {
  return (match: RegExpExecArray) => {
    const { link, fragment, displayText, tag } = match.groups!

    if (link) {
      let url = transformLink(currentSlug, encodeURI(decode(link.trim() + (fragment ? "#" + fragment.trim() : ""))), transformOptions)

      if (match[1] !== "!") {
        return `<a href="${url}" class="internal">${displayText || link + (fragment ? "#" + fragment : "")}</a>`
      }

      if (/\.(png|jpg|jpeg|gif|bmp|svg|webp)$/.test(link)) {
        if (fragment) {
          url = transformLink(currentSlug, encodeURI(decode(link.trim())), transformOptions)
        }
        const imageEmbedMatch = imageEmbedRegex.exec(displayText || "")
        const width = imageEmbedMatch?.groups?.width ? imageEmbedMatch?.groups?.width + "px" : "auto"
        const height = imageEmbedMatch?.groups?.height ? imageEmbedMatch?.groups?.height + "px" : "auto"
        return `<img src="${url}" alt="${fragment ?? displayText ?? link}" style="height:${height}; width:${width};" />`
      }
      else if (/\.(mp4|webm|ogv|avi|mov|flv|wmv|mkv|mpg|mpeg|m4v)$/.test(link)) {
        return `
            <video src="${url}" data-type="video" controls width="640px" height="360px"/>
        `
      } else if (/\.(mp3|wav|m4a|ogg|3gp|flac)$/.test(link)) {
        return `
            <audio src="${url}" data-type="audio" controls />
        `
      } else if (/\.(pdf)$/.test(link)) {
        return `
            <iframe src="${url}" class="pdf" data-type="pdf" />
        `
      }

      return `<a href="${url}" class="internal">${displayText || link}</a>`
    } else if (tag) {
      return `<a href="/tags/${tag}" class="internal">#${tag}</a>`
    }
    return match[0]
  }
}

function ytLinkReplacement() {
  return (match: RegExpExecArray) => {
    if (match[1]) {
      const embedUrl = toYouTubeEmbedURL(match[1])
      if (embedUrl) {
        return `
          <iframe
            data-type="youtube"
            data-place="external"
            data-src="${match[1]}"
            class="external-embed youtube"
            allow="fullscreen"
            frameborder="0"
            src="${embedUrl}">
          </iframe>
        `
      }
    }
    return match[0]
  }
}

function calloutReplacement() {
  return (match: RegExpExecArray) => {
    const { type, remain } = match.groups!

    if (type) {
      const typeClass = canonicalizeCallout(type.toLowerCase())
      const contents = remain.replace(/<br\s*\/?>/g, "")
      return `
            <blockquote class="callout ${typeClass}" data-callout="${typeClass}">
              <div class="callout-title">
                <div class="callout-icon"></div>
                <div class="callout-title-inner"><p>${type}</p></div>
              </div>
              ${contents ?
          `
                <div class="callout-content">
                  <div class="callout-content-inner">
                    <p>${contents}</p>
                  </div>
                </div>
                `
          : ""}
            </blockquote>
            `
    }
    return match[0]
  }
}

export const Mindmap: QuartzTransformerPlugin<Partial<Options>> = (userOpts) => {
  const opts = { ...defaultOptions, ...userOpts }

  return {
    name: "Mindmap",
    markdownPlugins(ctx) {
      const transformOptions: TransformOptions = {
        strategy: opts.markdownLinkResolution,
        allSlugs: ctx.allSlugs,
      }

      function processMindmapFile(file: any, transformer: Transformer, slug: FullSlug) {
        const root: IPureNode = transformer.transform(String(file.value)).root

        recurseChildren((node) => {
          node.content = replaceMatchesExcept(
            node.content,
            wikilinkRegex,
            wikilinkReplacement(slug, transformOptions),
            codeBlockRegex,
            "CODEBLOCK"
          )
          node.content = replaceMatches(
            node.content,
            youtubeImageRegex,
            ytLinkReplacement()
          )
          node.content = replaceMatches(
            node.content,
            calloutRegex,
            calloutReplacement()
          )
        })(root)

        file.data.mindmap = root
      }

      return [() => {
        return (_: any, file: any) => {
          const slug = file.data.slug!
          processMindmapFile(file, transformer, slug)
        }
      }]
    },
  }
}
