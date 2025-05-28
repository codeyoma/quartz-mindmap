import { QuartzTransformerPlugin } from "../quartz/plugins/types"
import {
  TransformOptions,
  FullSlug,
  transformLink,
  slugifyFilePath,
  FilePath,
  SimpleSlug,
  transformInternalLink,
  RelativeURL
} from "../quartz/util/path"
import { defaultOptions, Options } from '../quartz/plugins/transformers/links'
import { IPureNode } from 'markmap-common'
import { Transformer } from "markmap-lib"
import hePkg from "he";

// import { JSResource, CSSResource } from "../../util/resources"

export const Mindmap: QuartzTransformerPlugin<Partial<Options>> = (userOpts) => {
  const opts = { ...defaultOptions, ...userOpts }

  return {
    name: "Mindmap",
    markdownPlugins(ctx) {
      const transformer = new Transformer()
      const transformOptions: TransformOptions = {
        strategy: opts.markdownLinkResolution,
        allSlugs: ctx.allSlugs,
      }
      const { decode } = hePkg;

      // todo : bfs replace all links in the tree
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

      const wikilinkRegex = /(!)?\[\[(?<link>[^|\]]+)\|?(?<displayText>[^\]]*)\]\]|(?<!:)#(?<tag>[A-Za-z0-9_-]+)(?=\s|$)/g

      // todo: allow for all types
      function replacement(currentSlug: FullSlug) {
        return (match: RegExpExecArray) => {
          const { link, displayText, tag } = match.groups!

          if (link) {
            const isImage = /\.(png|jpg|jpeg|gif|bmp|svg|webp)$/.test(link)
            const url = transformLink(currentSlug, encodeURI(decode(link.trim())), transformOptions)

            if (isImage) {
              return `<img src="${url}" alt="${displayText || link}" />`
            }

            return `<a href="${url}" class="internal">${displayText || link}</a>`
          } else if (tag) {
            return `<a href="/tags/${tag}" class="internal">#${tag}</a>`
          }
          return match[0] ?? ""
        }
      }

      return [() => {
        return (_, file) => {
          const slug = file.data.slug!
          const root: IPureNode = transformer.transform(String(file.value)).root

          recurseChildren((node) => {
            node.content = replaceMatches(
              node.content,
              wikilinkRegex,
              replacement(slug)
            )
          })(root)

          file.data.mindmap = root
        }
      }]
    },
  }
}
