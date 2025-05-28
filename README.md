# Quartz-Mindmap
- built with quartz and markmap
- [x] popover
- [x] toolbar
- [x] button-mode
- [x] preview-mode
- [ ] Support all file formats
  - image
  - video
  - embed
  - ...


# How to Install

## Package
- `npm i markmap-lib markmap-view markmap-toolbar he @types/he`

## Add File
- `mindmap.ts` -> `quartz/plugins/transformers`
- `Mindmap.tsx` -> `quartz/components`
- `mindmap.inline.ts` -> `quartz/components/scripts`
- `mindmap.scss` -> `quartz/components/styles`

## Edit File
- `quartz.config.ts`
  - Add to plugins > transformers
  - (!) **The options must be the same as those of CrawlLinks.**
  ```ts
  Plugin.Mindmap({
    markdownLinkResolution: "shortest",
  }),
  ```
  - Code preview
  ```ts
    plugins:{
      ...
      transformers: {
        ...
        Plugin.Mindmap({
          markdownLinkResolution: "shortest",
        }),
      }
    }
  ```
---
- `quartz.layout.ts`
  - There are three options: `view`, `button`, and `global`.
  ```ts
  Component.Mindmap({
    mode: "view" | "button" | "global", // pick one
    localOptions: {},
  }),
  ```
  - `view`(default)
    - similar to the graph plugin’s inline view
  - `button`
    - appears like a dark mode toggle button.
    - opens the mindmap when clicked.
  - `global`
    - Must be included only once in sharedPageComponents.
    - A portal to open the mindmap.
  - code preview
  ```ts
  export const sharedPageComponents: SharedLayout = {
    ...
    anywhere: [
      Component.Mindmap({
        mode: "global",
        globalOptions: {},
      }),
    ]
    ...
  }

  export const defaultContentPageLayout: PageLayout = {
  // or export const defaultListPageLayout: PageLayout = {
    left: [
      ...
      Component.Mindmap({
        mode: "button",
        localOptions: {},
      }),
    ]

    right:[
      ...
      Component.Mindmap({
        mode: "view",
        localOptions: {},
      }),
    ]
  }
  ```
---
- `quartz/components/index.ts`
  - Add the following code.
  ```ts
  ...
  import Mindmap from './Mindmap'

  export{
    ...,
    Mindmap
  }
  ```
---
- `quartz/plugins/transformers/index.ts`
  - Add the following code.
  ```ts
  export { Mindmap } from "./mindmap"
  ```
---
- `quartz/plugins/transformers/links.ts`
  - Add `export` before `interface Options` and `const defaultOptions`
  ```ts
  ...
  export interface Options {
  ...
  export const defaultOptions: Options = {
  ...
  ```
---
- `quartz/components/scripts/popover.inline.ts`
  - Add this at the end of the file
  ```ts
  export { mouseEnterHandler, clearActivePopover }
  ```
---
- Replace all `i18n` files or *edit code*
  - `quartz/components/Mindmap.tsx`
  ```ts
  130         <h3>{i18n(cfg.locale).components.mindmap.title}</h3>
  ```
  ```ts
  130         <h3>Mind Map</h3>
  ```


# Done!
- Enjoy the Mind Map!
