# quill-header-list

[demo](https://opentiny.github.io/quill-header-list/)

## usage

```bash
npm install quill-header-list
```

```js
new Quill('#editor', {
  theme: 'snow',
  modules: {
    'toolbar': [[{ header: [null, 1, 2, 3, 4, 5, 6] }, 'header-list'],],
    'header-list': {
      container: document.getElementById('directory'), // specify a element to receive the header list
    },
  },
});
```

## options

| name            | type                     | description                                                                                                                            | default     | required |
| --------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | ----------- | -------- |
| container       | `string \| HTMLElement`  | the list container. string must be the element id                                                                                      | -           | `true`   |
| scrollContainer | `string \| HTMLElement`  | editor scroll container. default is `quill.root`                                                                                       | -           | `false`  |
| hideClass       | `number`                 | the class name when list hidden                                                                                                        | `is-hidden` | `false`  |
| topOffset       | `number \| () => number` | the offset from the top(`px`)                                                                                                          | `0`         | `false`  |
| headerHeight    | `number`                 | the header height in editor. this is for calculate header scroll highligh. don't make the height difference between h1 and h6 too much | `36`        | `false`  |
| onBeforeShow    | `() => boolean`          | trigger before display. return `true` will cancel display                                                                              | -           | `false`  |
| onBeforeHide    | `() => boolean`          | trigger before hidden. return `true` will cancel hidden                                                                                | -           | `false`  |
| onItemClick     | `(id: string) => void`   | trigger when click list item. id is the header element id                                                                              | -           | `false`  |

## other

if you have a fixed element in your page. you can use `topOffset` to return the height of the fixed element. then the header-list-item scroll position will not cover by the fixed element.

```js
new Quill('#editor', {
  theme: 'snow',
  modules: {
    'toolbar': [[{ header: [null, 1, 2, 3, 4, 5, 6] }, 'header-list'],],
    'header-list': {
      container: document.getElementById('directory'), // specify a element to receive the header list
      topOffset: () => {
        // get the height of the fixed element
        const navOffset = document.querySelector('.fixed')?.getBoundingClientRect().height || 0;
        return navOffset;
      },
      // or if you already know the height
      // topOffset: 36,
    },
  },
});
```
