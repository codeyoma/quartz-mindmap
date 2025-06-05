# Quartz-Mindmap
- It’s a custom plugin that enables mindmap in [Quartz 4](https://quartz.jzhao.xyz/).
  - built using [markmap](https://markmap.js.org/).
- [demo](https://yoma.kr/z-index/Guideline)
  - `cmd / ctrl` + `m`
  - click button
- The mindmap is built from Markdown headings and lists.

<br/>

## Supported Features
- Popover
- Mermaid
- Callout
- Toolbar
- Button mode
- Preview mode
- Portal mode
- Support for various file formats
  - image `png|jpg|jpeg|gif|bmp|svg|webp`
  - chrome
    - video `mp4|webm|ogv|avi|mov|flv|wmv|mkv|mpg|mpeg|m4v`
    - audio `mp3|wav|m4a|ogg|3gp|flac`
    - iframe `pdf`
    - youtube link
  - safari
    - Partial support video, audio, iframe, youtube

<br/>

# Installation
- You must complete all of the following steps for it to work.

<br/>

## 1. Install required packages
```sh
npm i markmap-lib markmap-view markmap-toolbar he @types/he
```

<br/>

## 2. Add files
- `mindmap.ts` -> `quartz/plugins/transformers/`
- `Mindmap.tsx` -> `quartz/components/`
- `mindmap.inline.ts` -> `quartz/components/scripts/`
- `mindmap.scss` -> `quartz/components/styles/`

<br/>

## 3. Edit `quartz/components/index.ts`
```ts
import Mindmap from './Mindmap'

export{
  ...,
  Mindmap
}
```

<br/>

## 4. Edit `quartz/plugins/transformers/index.ts`
```ts
export { Mindmap } from "./mindmap"
```

<br/>

## 5. Edit `quartz/plugins/transformers/links.ts`
- Add `export` before `interface Options` and `const defaultOptions`
```ts
17 export interface Options {
  ...
}

27 export const defaultOptions: Options = {
  ...
}
```

<br/>

## 6. Edit `quartz/plugins/transformers/ofm.ts`
- add `export` before `function canonicalizeCallout(calloutName: string): keyof typeof calloutMapping {`
```ts
104 export function canonicalizeCallout(calloutName: string): keyof typeof calloutMapping {
```

<br/>

## 7. Edit `quartz/components/scripts/popover.inline.ts`
- Add this at the end of the file
```ts
export { mouseEnterHandler, clearActivePopover }
```

<br/>

## 8. Replace `i18n` (option)
- `quartz/components/Mindmap.tsx`
- If using i18n
```ts
130         <h3>{i18n(cfg.locale).components.mindmap.title}</h3> // by replacing the i18n
```
<br/>

## 9. Edit `quartz.config.ts`
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

<br/>

## 10. Edit `quartz.layout.ts`
- Use one of three mode options: view, button, or global.
```ts
Component.Mindmap({
  mode: "view" | "button" | "global", // choose  one
  localOptions: {},
  globalOptions: {}, // for global mode
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
  afterBody: [
    ...,
    Component.Mindmap(), // view mode
    Component.Mindmap({
      mode: "global",  // global portal
      globalOptions: {}, // globalOptions
    }),
  ]
}

export const defaultContentPageLayout: PageLayout = {
// or export const defaultListPageLayout: PageLayout = {
  left: [
    Component.Flex({
      components:[
        ...,
        { Component: Component.Mindmap({ mode: "button", localOptions: {}}) },
      ]
    })
  ]
}
```

### Options
- [markmap options](https://markmap.js.org/docs/json-options)
- `localOptions` default
  ```ts
  {
    // json options
    colorFreezeLevel: 2,
    duration: 500,
    maxWidth: 0,
    initialExpandLevel: -1,
    zoom: true,
    pan: true,
    spacingHorizontal: 80,
    spacingVertical: 5,

    // https://markmap.js.org/api/interfaces/markmap-view.IMarkmapOptions.html
    scrollForPan: false,

    // toolbar on|off
    zoomInIcon: true,
    zoomOutIcon: true,
    resetIcon: true,
    recurseIcon: false,
  }
  ```
- `globalOptions` default
  ```ts
  {
    // json options
    colorFreezeLevel: 2,
    duration: 500,
    maxWidth: 0,
    initialExpandLevel: -1,
    zoom: true,
    pan: true,
    spacingHorizontal: 80,
    spacingVertical: 7,

    // https://markmap.js.org/api/interfaces/markmap-view.IMarkmapOptions.html
    scrollForPan: false,

    // toolbar on|off
    zoomInIcon: true,
    zoomOutIcon: true,
    resetIcon: true,
    recurseIcon: true,

    //only global
    expandIcon: true,
    closeIcon: true,
  }
  ```

<br/>

# Done!
- Enjoy the Mind Map!
