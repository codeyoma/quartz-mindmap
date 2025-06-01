import { registerEscapeHandler, removeAllChildren } from "./util"
import { mouseEnterHandler, clearActivePopover } from './popover.inline'
import { GlobalMindmapConfig, LocalMindmapConfig } from '../Mindmap'
import { Markmap, deriveOptions } from "markmap-view"
import { Toolbar } from "markmap-toolbar"
import { IPureNode } from 'markmap-common'
import { h } from 'preact'

const externalIcon = `
<svg aria-hidden="true" class="external-icon" style="max-width:0.8em;max-height:0.8em; margin-left:0.2em;" viewBox="0 0 512 512">
    <path
        d="M320 0H288V64h32 82.7L201.4 265.4 178.7 288 224 333.3l22.6-22.6L448 109.3V192v32h64V192 32 0H480 320zM32 32H0V64 480v32H32 456h32V480 352 320H424v32 96H64V96h96 32V32H160 32z"/>
</svg>`

const fullIcon = `
<svg xmlns="http://www.w3.org/2000/svg" height="15" viewBox="0 -960 960 960" width="15" aria-hidden="true">
    <path stroke="none" fill="currentColor" fill-rule="evenodd"
        d="M120-120v-320h80v184l504-504H520v-80h320v320h-80v-184L256-200h184v80H120Z"/>
</svg>`

const closeIcon = `
<svg xmlns="http://www.w3.org/2000/svg" height="15" viewBox="0 -960 960 960" width="15" aria-hidden="true">
    <path stroke="none" fill="currentColor" fill-rule="evenodd"
    d="m136-80-56-56 264-264H160v-80h320v320h-80v-184L136-80Zm344-400v-320h80v184l264-264 56 56-264 264h184v80H480Z"/>
</svg>`

const exitIcon = `
<svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 -960 960 960" width="18" >
    <path stroke="none" fill="currentColor" fill-rule="evenodd"
        d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/>
</svg>`

function fixForeignObjectReplaceElementErrorInSafari(layout: HTMLElement) {
  layout.querySelectorAll("video, audio, iframe").forEach(el => {
    const src = el.getAttribute("data-src") ?? el.getAttribute("src") ?? el.querySelector("source")?.getAttribute("src")
    if (!src) return
    const type = el.getAttribute("data-type") ?? el.tagName.toLowerCase()
    const place = el.getAttribute("data-place") ?? "internal"

    const a = Object.assign(document.createElement("a"), {
      href: src,
      target: "_blank",
      className: `media-fallback ${place}`,
      textContent: `${type} - ${src}`,
    })

    el.parentElement?.replaceChild(a, el)
    a.style.display = "inline-block"
  })
}

function renderMermaidInMindmap(svg: SVGSVGElement) {
  requestAnimationFrame(async () => {
    const codeBlocks = svg.querySelectorAll("foreignObject code.language-mermaid")

    if (codeBlocks.length === 0) return

    const { default: mermaid } = await import(
      "https://cdnjs.cloudflare.com/ajax/libs/mermaid/11.4.0/mermaid.esm.min.mjs"
    )

    mermaid.initialize({
      startOnLoad: false,
      theme: document.documentElement.getAttribute("saved-theme") === "dark" ? "dark" : "base",
      securityLevel: "loose",
    })

    for (const code of codeBlocks) {
      const data = code.textContent?.trim()
      const pre = code.closest("pre")
      const div = code.closest("div")
      if (!data || !div || !pre) continue

      pre.remove()

      const tempDiv = Object.assign(document.createElement("div"), {
        style: "visibility:hidden; position:absolute; top:-9999px",
      })

      const mermaidDiv = Object.assign(document.createElement("div"), {
        className: "mermaid",
        textContent: data,
      })

      tempDiv.appendChild(mermaidDiv)
      document.body.appendChild(tempDiv)

      try {
        await mermaid.run({ nodes: [mermaidDiv] })
        const svg = mermaidDiv.querySelector("svg")?.cloneNode(true)
        if (svg) div.appendChild(svg)
      } catch (err) {
        console.error("❌ Mermaid render failed:", err)
      } finally {
        tempDiv.remove()
      }
    }
  })
}

function renderPopoverInMindmap() {
  const mindmapLinks = document.querySelectorAll(".mindmap .markmap-foreign a.internal") as NodeListOf<HTMLAnchorElement>
  for (const link of mindmapLinks) {
    if (link.dataset.noPopover === "true") continue

    link.addEventListener("mouseenter", mouseEnterHandler)
    link.addEventListener("mouseleave", clearActivePopover)
    window.addCleanup?.(() => {
      link.removeEventListener("mouseenter", mouseEnterHandler)
      link.removeEventListener("mouseleave", clearActivePopover)
    })
  }
}

function renderToolbar(root: HTMLElement, mm: Markmap, option: LocalMindmapConfig | GlobalMindmapConfig) {
  const toolbar = document.createElement("div")
  toolbar.id = "mindmap-toolbar"
  toolbar.className = "mindmap-toolbar"
  const mmToolbar = Toolbar.create(mm).render()
  toolbar.append(mmToolbar)
  root.appendChild(toolbar)

  if (!option.zoomInIcon) {
    document.querySelector('div.mm-toolbar-item[title="Zoom in"]')?.classList.add("hide")
  }

  if (!option.zoomOutIcon) {
    document.querySelector('div.mm-toolbar-item[title="Zoom out"]')?.classList.add("hide")
  }

  if (!option.resetIcon) {
    document.querySelector('div.mm-toolbar-item[title="Fit window size"]')?.classList.add("hide")
  }

  if (!option.recurseIcon) {
    document.querySelector('div.mm-toolbar-item[title="Toggle recursively"]')?.classList.add("hide")
  }

  if ("expandIcon" in option) {
    let isToggled = root.classList.contains('fullscreen');
    const customFullscreen = document.createElement("div");
    customFullscreen.className = "mm-toolbar-item";
    customFullscreen.title = "Toggle Fullscreen Mindmap";
    customFullscreen.innerHTML = isToggled ? closeIcon : fullIcon

    mmToolbar.appendChild(customFullscreen)
    customFullscreen.addEventListener('click', () => {
      root.classList.toggle('fullscreen')
      isToggled = !isToggled;
      customFullscreen.innerHTML = isToggled ? closeIcon : fullIcon;
    })
  }

  if ("closeIcon" in option) {
    const customClose = document.createElement("div");
    customClose.className = "mm-toolbar-item";
    customClose.title = "Close Mindmap";
    customClose.innerHTML = exitIcon

    mmToolbar.appendChild(customClose)
    customClose.addEventListener("click", () => {
      const escEvent = new KeyboardEvent("keydown", {
        key: "Escape",
        code: "Escape",
        keyCode: 27,
        which: 27,
        bubbles: true,
      });
      document.dispatchEvent(escEvent);
    });

  }

}

function addExternalIcon(svg: SVGSVGElement) {
  svg.querySelectorAll<HTMLAnchorElement>('a[href^="http"]').forEach(a => {
    a.classList.add('external')
  })

  svg.querySelectorAll<HTMLAnchorElement>('a.external').forEach(a => {
    a.insertAdjacentHTML('beforeend', externalIcon)
  })
}

async function renderMindmap(mindmap: HTMLElement, isSafari = false) {
  removeAllChildren(mindmap)

  if (!mindmap.dataset["mindmap"]) {
    return () => { }
  }

  const data: IPureNode = JSON.parse(decodeURIComponent(mindmap.dataset["mindmap"]))

  const option = JSON.parse(mindmap.dataset["cfg"]!)
  const markmapOptions = deriveOptions(option);
  markmapOptions.scrollForPan = option.scrollForPan;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  svg.setAttribute("width", "100%")
  svg.setAttribute("height", "100%")
  mindmap.appendChild(svg)
  const mm = Markmap.create(svg, markmapOptions, data)
  mm.fit()

  renderToolbar(mindmap, mm, option)
  renderMermaidInMindmap(svg)
  renderPopoverInMindmap()
  isSafari && fixForeignObjectReplaceElementErrorInSafari(mindmap)
  addExternalIcon(svg)

  return () => {
    mindmap.innerHTML = ""
  }
}

let localMindmapCleanups: (() => void)[] = []
let globalMindmapCleanups: (() => void)[] = []

function cleanupLocalMindmaps() {
  for (const cleanup of localMindmapCleanups) {
    cleanup()
  }
  localMindmapCleanups = []
}

function cleanupGlobalMindmaps() {
  for (const cleanup of globalMindmapCleanups) {
    cleanup()
  }
  globalMindmapCleanups = []
}

document.addEventListener("nav", async () => {

  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

  async function renderLocalMindmap() {
    cleanupLocalMindmaps()
    const mindmapContainers = document.getElementsByClassName("mindmap-container")
    for (const container of mindmapContainers) {
      isSafari && container.classList.add("is-safari")
      localMindmapCleanups.push(await renderMindmap(container as HTMLElement, isSafari))
    }
  }

  await renderLocalMindmap()
  const handleThemeChange = () => {
    void renderLocalMindmap()
  }

  document.addEventListener("themechange", handleThemeChange)
  window.addCleanup(() => {
    document.removeEventListener("themechange", handleThemeChange)
  })

  const containers = [...document.getElementsByClassName("global-mindmap-outer")] as HTMLElement[]
  async function renderGlobalMindmap() {
    for (const container of containers) {
      container.classList.add("active")
      const sidebar = container.closest(".sidebar") as HTMLElement
      if (sidebar) {
        sidebar.style.zIndex = "1"
      }

      const mindmapContainer = container.querySelector(".global-mindmap-container") as HTMLElement
      registerEscapeHandler(container, hideGlobalMindmap)
      if (mindmapContainer) {
        isSafari && mindmapContainer.classList.add("is-safari")
        globalMindmapCleanups.push(await renderMindmap(mindmapContainer, isSafari))
      }
    }
  }

  function hideGlobalMindmap() {
    cleanupGlobalMindmaps()
    for (const container of containers) {
      container.classList.remove("active")
      const sidebar = container.closest(".sidebar") as HTMLElement
      if (sidebar) {
        sidebar.style.zIndex = ""
      }
    }
  }

  async function shortcutHandler(e: HTMLElementEventMap["keydown"]) {
    if (e.key === "m" && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
      e.preventDefault()
      const anyGlobalMindmapOpen = containers.some((container) =>
        container.classList.contains("active"),
      )
      anyGlobalMindmapOpen ? hideGlobalMindmap() : renderGlobalMindmap()
    }
  }

  const containerIcons = document.getElementsByClassName("mindmap-icon")
  Array.from(containerIcons).forEach((icon) => {
    icon.addEventListener("click", renderGlobalMindmap)
    window.addCleanup(() => icon.removeEventListener("click", renderGlobalMindmap))
  })

  document.addEventListener("keydown", shortcutHandler)
  window.addCleanup(() => {
    document.removeEventListener("keydown", shortcutHandler)
    cleanupLocalMindmaps()
  })
})
