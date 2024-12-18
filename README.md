# quill-header-list

## options

| name            | type                     | description                                                                                                                            | default     | required |
| --------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | ----------- | -------- |
| container       | `string \| HTMLElement`  | the list container. string must be the element id                                                                                      | -           | `true`   |
| scrollContainer | `string \| HTMLElement`  | editor scroll container. default is `quill.root`                                                                                       | -           | `false`  |
| hideClass       | `number`                 | the class name when list hidden                                                                                                        | `is-hidden` | `false`  |
| topOffset       | `number \| () => number` | the offset from the top                                                                                                                | `0`         | `false`  |
| headerHeight    | `number`                 | the header height in editor. this is for calculate header scroll highligh. don't make the height difference between h1 and h6 too much | `36`        | `false`  |
| onBeforeShow    | `() => boolean`          | trigger before display. return `true` will cancel display                                                                              | -           | `false`  |
| onBeforeHide    | `() => boolean`          | trigger before hidden. return `true` will cancel hidden                                                                                | -           | `false`  |
| onItemClick     | `(id: string) => void`   | trigger when click list item. id is the header element id                                                                              | -           | `false`  |
