# Quartz-Mindmap
- It’s a custom plugin that enables mindmap in [Quartz 4](https://quartz.jzhao.xyz/).
- built using [markmap](https://markmap.js.org/).
- [demo](https://yoma.kr/Computer-Science/1-Foundations--and--Theory/Algorithms/DP)
  - `cmd / ctrl` + `m`
  - click button

## Supported Features
- [x] Popover
- [x] Mermaid
- [x] Toolbar
- [x] Button mode
- [x] Preview mode
- [x] Portal mode
- [ ] Support for all file formats
  - images
  - videos
  - embeds
  - ...
- [ ] Performance improvements


## Installation

### 1. Install required packages
```sh
npm i markmap-lib markmap-view markmap-toolbar he @types/he
```

### 2. Add files
- `mindmap.ts` -> `quartz/plugins/transformers`
- `Mindmap.tsx` -> `quartz/components`
- `mindmap.inline.ts` -> `quartz/components/scripts`
- `mindmap.scss` -> `quartz/components/styles`

### 3. Edit files
#### `quartz/components/index.ts`
```ts
import Mindmap from './Mindmap'

export{
  ...,
  Mindmap
}
```
---
#### `quartz/plugins/transformers/index.ts`
```ts
export { Mindmap } from "./mindmap"
```
---
#### `quartz/plugins/transformers/links.ts`
- Add `export` before `interface Options` and `const defaultOptions`
```ts
export interface Options {
  ...
}

export const defaultOptions: Options = {
  ...
}
```
---
#### `quartz/components/scripts/popover.inline.ts`
- Add this at the end of the file
```ts
export { mouseEnterHandler, clearActivePopover }
```
---
#### `Replace or edit i18n`
- `quartz/components/Mindmap.tsx`
```ts
130         <h3>{i18n(cfg.locale).components.mindmap.title}</h3>
```
- If not using i18n
```ts
130         <h3>Mind Map</h3>
```
---
#### `quartz.config.ts`
- Add the transformer
- (!) **The options must be the same as those of CrawlLinks.**
```ts
  plugins:{
    ...
    transformers: {
      ...
      Plugin.Mindmap({
        markdownLinkResolution: "shortest", // Must match CrawlLinks option
      }),
    }
  }
```

---

#### `quartz.layout.ts`
- Use one of three mode options: view, button, or global.
```ts
Component.Mindmap({
  mode: "view" | "button" | "global", // choose  one
  localOptions: {},
}),
```
- `global`
  - acts as a portal to open the mindmap, must be added only once to sharedPageComponents
- `view`(default)
  - similar to the graph plugin’s inline view
- `button`
  - appears like a dark mode toggle button.
  - opens the mindmap when clicked.

```ts
export const sharedPageComponents: SharedLayout = {
  anywhere: [
    Component.Mindmap({
      mode: "global",
      globalOptions: {},
    }),
  ]
}

export const defaultContentPageLayout: PageLayout = {
// or export const defaultListPageLayout: PageLayout = {
  left: [
    Component.Mindmap({
      mode: "button",
      localOptions: {},
    }),
  ]

  right:[
    Component.Mindmap({
      mode: "view",
      localOptions: {},
    }),
  ]
}
```

# Done!
- Enjoy the Mind Map!
