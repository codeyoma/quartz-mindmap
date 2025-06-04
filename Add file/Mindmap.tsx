import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
// @ts-ignore
import script from "./scripts/mindmap.inline"
import style from "./styles/mindmap.scss"
import { i18n } from "../i18n"
import { classNames } from "../util/lang"

export interface LocalMindmapConfig {
  colorFreezeLevel: number
  duration: number
  maxWidth: number
  initialExpandLevel: number
  zoom: boolean
  pan: boolean
  spacingHorizontal: number
  spacingVertical: number
  lineWidth?: number
  nodeMinHeight?: number
  paddingX?: number
  fitRatio?: number
  scrollForPan: boolean
  zoomInIcon: boolean
  zoomOutIcon: boolean
  resetIcon: boolean
  recurseIcon: boolean
}

export interface GlobalMindmapConfig extends LocalMindmapConfig {
  expandIcon: boolean
  closeIcon: boolean
}

interface MindmapOptions {
  mode: "view" | "button" | "global"
  localOptions: Partial<LocalMindmapConfig> | undefined
  globalOptions: Partial<GlobalMindmapConfig> | undefined
}

const defaultOptions: MindmapOptions = {
  mode: "view",
  localOptions: {
    colorFreezeLevel: 2,
    duration: 500,
    maxWidth: 0,
    initialExpandLevel: -1,
    zoom: true,
    pan: true,
    spacingHorizontal: 80,
    spacingVertical: 5,
    scrollForPan: false,
    zoomInIcon: true,
    zoomOutIcon: true,
    resetIcon: true,
    recurseIcon: false,
  },
  globalOptions: {
    colorFreezeLevel: 2,
    duration: 500,
    maxWidth: 0,
    initialExpandLevel: -1,
    zoom: true,
    pan: true,
    spacingHorizontal: 80,
    spacingVertical: 7,
    paddingX: 20,
    scrollForPan: false,
    zoomInIcon: true,
    zoomOutIcon: true,
    resetIcon: true,
    recurseIcon: true,
    expandIcon: true,
    closeIcon: true,
  },
}

export default ((opts?: Partial<MindmapOptions>) => {
  const Mindmap: QuartzComponent = ({ displayClass, cfg, fileData }: QuartzComponentProps) => {
    const mode = opts?.mode ?? defaultOptions.mode
    const localOption = { ...defaultOptions.localOptions, ...opts?.localOptions }
    const globalOption = { ...defaultOptions.globalOptions, ...opts?.globalOptions }

    const button = (
      <svg
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        x="0px"
        y="0px"
        width="20px"
        height="20px"
        viewBox="0 -960 960 960"
        fill="currentColor"
        xmlSpace="preserve"
      >
        <path d="M200-80q-50 0-85-35t-35-85q0-39 22.5-70t57.5-43v-87q0-50 35-85t85-35h160v-127q-35-12-57.5-43T360-760q0-50 35-85t85-35q50 0 85 35t35 85q0 39-22.5 70T520-647v127h160q50 0 85 35t35 85v87q35 12 57.5 43t22.5 70q0 50-35 85t-85 35q-50 0-85-35t-35-85q0-39 22.5-70t57.5-43v-87q0-17-11.5-28.5T680-440H520v127q35 12 57.5 43t22.5 70q0 50-35 85t-85 35q-50 0-85-35t-35-85q0-39 22.5-70t57.5-43v-127H280q-17 0-28.5 11.5T240-400v87q35 12 57.5 43t22.5 70q0 50-35 85t-85 35Zm0-80q17 0 28.5-11.5T240-200q0-17-11.5-28.5T200-240q-17 0-28.5 11.5T160-200q0 17 11.5 28.5T200-160Zm280 0q17 0 28.5-11.5T520-200q0-17-11.5-28.5T480-240q-17 0-28.5 11.5T440-200q0 17 11.5 28.5T480-160Zm280 0q17 0 28.5-11.5T800-200q0-17-11.5-28.5T760-240q-17 0-28.5 11.5T720-200q0 17 11.5 28.5T760-160ZM480-720q17 0 28.5-11.5T520-760q0-17-11.5-28.5T480-800q-17 0-28.5 11.5T440-760q0 17 11.5 28.5T480-720Z" />
      </svg>
    )

    if (mode === "button") {
      return (
        <div class={classNames(displayClass, "mindmap-button")}>
          <button class="mindmap-icon" aria-label="Mindmap Toggle">
            {button}
          </button>
        </div>
      )
    }

    if (!fileData.mindmap) {
      return null
    }

    const portal = (
      <div class="global-mindmap-outer">
        <div
          class="global-mindmap-container"
          data-cfg={JSON.stringify(globalOption)}
          data-mindmap={encodeURIComponent(JSON.stringify(fileData.mindmap))}
        >
        </div>
      </div>
    )

    if (mode === "global") {
      return (
        <div class={classNames(displayClass, "global-mindmap mindmap")}>
          {portal}
        </div>
      )
    }

    return (
      <div class={classNames(displayClass, "local-mindmap mindmap")}>
        <h3>{i18n(cfg.locale).components.mindmap.title}</h3>
        <div class="mindmap-outer">
          <div
            class="mindmap-container"
            data-cfg={JSON.stringify(localOption)}
            data-mindmap={encodeURIComponent(JSON.stringify(fileData.mindmap))}
          >
          </div>
          <button class="mindmap-icon" aria-label="Mindmap Toggle">
            {button}
          </button>
        </div>
      </div>
    )
  }

  Mindmap.css = style
  Mindmap.afterDOMLoaded = script

  return Mindmap
}) satisfies QuartzComponentConstructor
