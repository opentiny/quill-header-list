import type TypeToolbar from 'quill/modules/toolbar';
import Quill from 'quill';
import { HeaderWithID } from './formats';
import headerListSvg from './svg/header-list.svg';
import { createBEM, isFunction, isString } from './utils';

export interface HeaderListOptions {
  container: HTMLElement;
  scrollContainer: HTMLElement | undefined;
  hideClass: string;
  topOffset: number | (() => number | Promise<number>);
  headerHeight: number;
  onBeforeShow: () => boolean | Promise<boolean>;
  onBeforeHide: () => boolean | Promise<boolean>;
  onItemClick: (id: string) => void;
}
export type InputHeaderListOptions = Partial<Omit<HeaderListOptions, 'container' | 'scrollContainer'>> & {
  container: HTMLElement | string;
  scrollContainer: HTMLElement | string;
};
export class HeaderList {
  static moduleName = 'header-list';
  static toolName = 'header-list';
  static toolbarHandle = async function (this: TypeToolbar) {
    const headerListModule = this.quill.getModule(HeaderList.moduleName) as HeaderList;
    if (!headerListModule) return;
    headerListModule.toggleDisplay();
  };

  static register() {
    const icons = Quill.import('ui/icons') as Record<string, string>;
    icons[HeaderList.toolName] = headerListSvg;

    Quill.register({
      'formats/header': HeaderWithID,
    }, true);
  }

  editorHeaders: { el: HTMLElement; text: string }[] = [];
  isHidden: boolean = false;
  bem = createBEM('header-list');
  root?: HTMLElement;
  options: HeaderListOptions;
  resizeObserver?: ResizeObserver;
  intersectionObserver?: IntersectionObserver;
  highlightedItem?: Element;
  constructor(public quill: Quill, options: InputHeaderListOptions) {
    this.options = this.resolveOptions({ ...options });
    if (this.options.container) {
      this.hide();
      this.root = this.buildList();
      this.options.container.appendChild(this.root);

      this.quill.on(Quill.events.TEXT_CHANGE, () => {
        const currentHeaders = Array.from(this.quill.root.querySelectorAll<HTMLElement>(':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6'));
        const removedHeaders = this.editorHeaders.map(item => item.el).filter(header => !currentHeaders.includes(header));
        const newHeaders: { el: HTMLElement; index: number }[] = [];
        const modifiedHeaders: HTMLElement[] = [];
        for (const [index, header] of currentHeaders.entries()) {
          if (!this.editorHeaders.some(item => item.el === header)) {
            newHeaders.push({ el: header, index });
          }
          else if (this.editorHeaders.some(({ el, text }) => el === header && text !== header.textContent)) {
            modifiedHeaders.push(header);
          }
        }

        this.update(newHeaders, removedHeaders, modifiedHeaders);
        this.editorHeaders = currentHeaders.map(el => ({ el, text: el.textContent || '' }));
      });
      this.quill.on(Quill.events.EDITOR_CHANGE, () => {
        const [range] = this.quill.selection.getRange();
        if (range === null) {
          this.activeToolbarControl();
        }
      });

      // specify the scrollContainer height and header height to calculate the intersection
      // more accurate height will be more easy calculate highlight header
      this.resizeObserver = new ResizeObserver(() => {
        if (this.intersectionObserver) {
          this.intersectionObserver.disconnect();
        }
        // create new intersection observer
        this.intersectionObserver = new IntersectionObserver(this.handleIntersection.bind(this), {
          root: this.options.scrollContainer,
          rootMargin: `0px 0px ${this.calculateIntersectionRootMargin()}px 0px`,
        });
        // update current header to new intersection observer
        for (const { el } of this.editorHeaders) {
          this.intersectionObserver.observe(el);
        }
        const { removeEl, addEl } = this.editorHeaders.reduce((acc, { el }, index) => {
          acc.addEl.push({ el, index });
          acc.removeEl.push(el);
          return acc;
        }, {
          removeEl: [] as Parameters<typeof this.update>[1],
          addEl: [] as Parameters<typeof this.update>[0],
        });
        this.update(addEl, removeEl, []);
      });
      this.resizeObserver.observe(this.options.scrollContainer || document.documentElement);
    }
    else {
      console.warn('header-list: options.container is required');
    }
  }

  calculateIntersectionRootMargin() {
    const containerRect = (this.options.scrollContainer || document.documentElement).getBoundingClientRect();
    // if root is window. use window.innerHeight
    let marginTop = -1 * containerRect.height + this.options.headerHeight;
    if (!this.options.scrollContainer) {
      marginTop = -1 * window.innerHeight + this.options.headerHeight;
    }
    return marginTop;
  }

  resolveOptions(options: InputHeaderListOptions): HeaderListOptions {
    const container = isString(options.container) ? document.getElementById(options.container) : options.container;
    let scrollContainer = options.scrollContainer
      ? isString(options.scrollContainer)
        ? document.getElementById(options.scrollContainer)
        : options.scrollContainer
      : this.quill.root;
    // @ts-ignore
    if (scrollContainer === window || scrollContainer === document.documentElement) scrollContainer = undefined;
    if (!isFunction(options.topOffset) && Number.isNaN(options.topOffset)) options.topOffset = 0;

    return Object.assign({
      hideClass: this.bem.is('hidden'),
      topOffset: 0,
      headerHeight: 36,
      onBeforeShow: () => false,
      onBeforeHide: () => false,
      onItemClick: () => {},
      container,
    }, options, { scrollContainer });
  }

  buildList() {
    const root = document.createElement('div');
    root.classList.add(this.bem.b());
    return root;
  }

  createListItem(id: string, text: string, level: number) {
    const item = document.createElement('div');
    item.classList.add(this.bem.be('item'), `level-${level}`);
    item.dataset.id = id;
    item.textContent = text;
    item.addEventListener('click', async () => {
      const headerTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
      const selector = headerTags.map(tag => `:scope > ${tag}[id="${id}"]`).join(', ');
      const targetHeader = this.quill.root.querySelector(selector) as HTMLElement;
      if (targetHeader) {
        const container = this.options.scrollContainer || document.documentElement;
        // if container is window. then need add editor root offsetTop to scrollTo
        let containerOffsetTop = 0;
        if (container === document.documentElement) {
          const rect = this.quill.root.getBoundingClientRect();
          containerOffsetTop = rect.top + window.scrollY;
        }
        const topOffset = isFunction(this.options.topOffset) ? await this.options.topOffset() : this.options.topOffset;
        const offsetPosition = containerOffsetTop + targetHeader.offsetTop - topOffset;
        container.scrollTo({
          top: offsetPosition,
        });
      }
      if (isFunction(this.options.onItemClick)) {
        this.options.onItemClick(id);
      }
    });
    return item;
  }

  async hide() {
    if (await this.options.onBeforeHide()) return;
    this.options.container.classList.add(this.options.hideClass);
    this.isHidden = true;
    this.activeToolbarControl();
  }

  async show() {
    if (await this.options.onBeforeShow()) return;
    this.options.container.classList.remove(this.options.hideClass);
    this.isHidden = false;
    this.activeToolbarControl();
  }

  activeToolbarControl() {
    const toolbarModule = this.quill.getModule('toolbar') as TypeToolbar;
    if (!toolbarModule) return;

    const control = toolbarModule.controls.find(([n]) => n === HeaderList.toolName);
    if (!control) return;
    if (this.isHidden) {
      control[1].classList.remove('ql-active');
    }
    else {
      control[1].classList.add('ql-active');
    }
  }

  toggleDisplay() {
    return this.isHidden ? this.show() : this.hide();
  }

  update(addHeaders: { el: HTMLElement; index: number }[], removeHeaders: HTMLElement[], modifiedHeaders: HTMLElement[]) {
    if (!this.root || !this.intersectionObserver) return;
    for (const header of removeHeaders) {
      const item = this.root.querySelector(`[data-id="${header.id}"]`);
      if (item) {
        item.remove();
        this.intersectionObserver.unobserve(header);
      }
    }

    for (const { index, el } of addHeaders) {
      this.root.insertBefore(this.createListItem(el.id, el.textContent || '', Number(el.tagName.slice(1))), this.root.children[index]);
      this.intersectionObserver.observe(el);
    }

    for (const header of modifiedHeaders) {
      const listItem = this.root.querySelector(`[data-id="${header.id}"]`);
      if (listItem) {
        listItem.textContent = header.textContent;
      }
    }
  }

  setHighlight(item: Element) {
    if (this.highlightedItem) {
      this.highlightedItem.classList.remove(this.bem.is('highlight'));
    }
    item.classList.add(this.bem.is('highlight'));
    this.highlightedItem = item;
  }

  handleIntersection(entries: IntersectionObserverEntry[]) {
    if (!this.root) return;
    const headers: IntersectionObserverEntry[] = [];
    // find the headers in the scrllContainer viewport
    for (const entry of entries) {
      if (isElementInViewport(entry.target, this.options.scrollContainer)) {
        headers.push(entry);
      }
    }

    // find the header at the top
    const entry = headers.reduce((entry, current) => {
      if (!entry || entry.boundingClientRect.y > current.boundingClientRect.y) {
        return current;
      }
      return entry;
    }, null as null | IntersectionObserverEntry);

    let header: Element | null = null;
    if (!entry || entry.isIntersecting === false) {
      // if header doesn't found or header doesn't in the viewport intersection
      // find the bottommost header above the viewport intersection and topmose header below viewport
      let offsetTop = 0;
      let offsetBottom = Infinity;
      for (const { el } of this.editorHeaders) {
        const elOffset = el.offsetTop;
        const { isInViewport, onTop, onBottom } = isElementInViewport(el, this.options.scrollContainer);
        if (!isInViewport) {
          if (onTop && offsetTop < elOffset) {
            header = el;
            offsetTop = elOffset;
          }
          else if (onBottom && offsetBottom > elOffset) {
            header = el;
            offsetBottom = elOffset;
          }
        }
        else {
          if (!header) {
            header = el;
          }
          break;
        }
      }
    }
    else {
      header = entry.target;
    }

    if (!header || !header.id) return;
    const headerId = header.id;
    const listItem = this.root.querySelector(`:scope > [data-id="${headerId}"]`);
    if (listItem) {
      this.setHighlight(listItem);
    }
  }
}

function isElementInViewport(child: Element, box?: Element) {
  const boxRect = box
    ? box.getBoundingClientRect()
    : {
        top: 0,
        left: 0,
        bottom: window.innerHeight,
        right: window.innerWidth,
      };
  const childRect = child.getBoundingClientRect();
  return {
    isInViewport: !(
      childRect.bottom < boxRect.top
      || childRect.top > boxRect.bottom
      || childRect.right < boxRect.left
      || childRect.left > boxRect.right
    ),
    onTop: childRect.top < boxRect.top,
    onBottom: childRect.bottom > boxRect.bottom,
  };
}

export * from './formats';
export default HeaderList;
