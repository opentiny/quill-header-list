# quill-header-list

[demo](https://opentiny.github.io/quill-header-list/)

## Usage

```bash
npm install quill-header-list
```

```js
import HeaderList from 'quill-header-list';
import 'quill-header-list/dist/index.css';

Quill.register({ 'modules/header-list': HeaderList }, true);
new Quill('#editor', {
  theme: 'snow',
  modules: {
    'toolbar': {
      container: [[{ header: [null, 1, 2, 3, 4, 5, 6] }, 'header-list']],
      handlers: {
        'header-list': HeaderList.toolbarHandle
      }
    },
    'header-list': {
      container: document.getElementById('directory'), // specify a element to receive the header list
    },
  },
});
```

## Options

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

> Module changed the `header` value struct in delta. If you have other custom values in `header` value, you need change `class XXX extend Header` with `class XXX extend HeaderWithID` and update `formats` function.

## Other

### Fixed Element On Page

If you have a fixed element in your page, you can use `topOffset` to return the height of the fixed element. Then the header-list-item scroll position will not cover by the fixed element.

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

### Custom Header Id attribute

```js
import HeaderList, { HeaderWithID } from 'quill-header-list';
import 'quill-header-list/dist/index.css';

// set custom header id attribute to 'id' (default is 'data-block-id')
HeaderWithID.idKey = 'id';
Quill.register({ 'modules/header-list': HeaderList }, true);
```
