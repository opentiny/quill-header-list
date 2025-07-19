import type TypeToolbar from 'quill/modules/toolbar';
import Quill from 'quill';
import { HeaderWithID } from './formats';
import headerListSvg from './svg/header-list.svg';
import { createBEM, isFunction, isNumber, isString, throttleAndDebounce } from './utils';

export interface HeaderListOptions {
  container: HTMLElement;
  scrollContainer: HTMLElement | undefined;
  hideClass: string;
  topOffset: () => number | Promise<number>;
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

  scrollContainerListener = throttleAndDebounce(this.handleScroll.bind(this), 100);
  editorHeaders: { el: HTMLElement; text: string }[] = [];
  isHidden: boolean = false;
  bem = createBEM('header-list');
  root?: HTMLElement;
  options: HeaderListOptions;
  highlightedItem?: Element;
  #lastTopOffset: number = 0;
  constructor(public quill: Quill, options: InputHeaderListOptions) {
    this.options = this.resolveOptions({ ...options });
    if (this.options.container) {
      this.hide();
      this.root = this.buildList();
      this.options.container.appendChild(this.root);

      this.quill.on(Quill.events.TEXT_CHANGE, throttleAndDebounce(() => this.updateHeaders(), 500));
      this.quill.on(Quill.events.EDITOR_CHANGE, () => {
        const [range] = this.quill.selection.getRange();
        if (range === null) {
          this.activeToolbarControl();
        }
      });
    }
    else {
      console.warn('header-list: options.container is required');
    }
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

    let resultTopOffset: () => Promise<number> | number;
    const inputTopOffset = options.topOffset;
    if (isFunction(inputTopOffset)) {
      resultTopOffset = inputTopOffset;
    }
    else if (isNumber(inputTopOffset)) {
      resultTopOffset = () => inputTopOffset;
    }
    else {
      resultTopOffset = () => 0;
    }

    return Object.assign({
      hideClass: this.bem.is('hidden'),
      headerHeight: 36,
      onBeforeShow: () => false,
      onBeforeHide: () => false,
      onItemClick: () => {},
      container,
    }, { ...options }, {
      scrollContainer,
      topOffset: async () => {
        let offset = await resultTopOffset();
        offset = Number.isNaN(Number(offset)) ? 0 : offset;
        if (this.#lastTopOffset !== offset) {
          this.#lastTopOffset = offset;
        }
        return offset;
      },
    });
  }

  updateHeaders() {
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
  }

  bindScrollListener() {
    let container: HTMLElement | Window = window;
    if (this.options.scrollContainer) {
      container = this.options.scrollContainer;
    }
    container.addEventListener('scroll', this.scrollContainerListener);
  }

  removeScrollListener() {
    let container: HTMLElement | Window = window;
    if (this.options.scrollContainer) {
      container = this.options.scrollContainer;
    }
    container.removeEventListener('scroll', this.scrollContainerListener);
  }

  async handleScroll() {
    if (!this.root) return;
    let header: HTMLElement | null = this.editorHeaders[0]?.el || null;
    const container = this.options.scrollContainer || document.documentElement;
    const topOffset = await this.options.topOffset();
    const scrollTop = container.scrollTop;
    const offsetParent = this.options.scrollContainer?.offsetParent || document.body;

    const headers = this.editorHeaders
      .map(({ el }) => ({ el, top: getAbsoluteTop(el, offsetParent as HTMLElement) }))
      .filter(({ top }) => !Number.isNaN(top))
      .sort((a, b) => a.top - b.top);
    for (const { el, top } of headers) {
      if (top > scrollTop + topOffset + this.options.headerHeight) {
        break;
      }
      header = el;
    }

    if (!header) return;
    this.setHighlight(header.id);
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
    return item;
  }

  async hide() {
    if (await this.options.onBeforeHide()) return;
    this.options.container.classList.add(this.options.hideClass);
    this.isHidden = true;
    this.activeToolbarControl();
    this.removeScrollListener();
  }

  async show() {
    if (await this.options.onBeforeShow()) return;
    this.options.container.classList.remove(this.options.hideClass);
    this.isHidden = false;
    this.activeToolbarControl();
    this.handleScroll();
    this.bindScrollListener();
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
    if (!this.root) return;
    for (const header of removeHeaders) {
      const item = this.root.querySelector(`[data-id="${header.id}"]`);
      if (item) {
        item.remove();
      }
    }

    for (const { index, el } of addHeaders) {
      this.root.insertBefore(this.createListItem(el.id, el.textContent || '', Number(el.tagName.slice(1))), this.root.children[index]);
    }
    this.root.addEventListener('click', async (e) => {
      const target = e.target as HTMLElement;
      if (!target || !target.classList.contains(this.bem.be('item'))) return;
      const id = target.dataset.id;
      if (!id) return;
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
        const topOffset = await this.options.topOffset();
        const offsetPosition = containerOffsetTop + targetHeader.offsetTop - topOffset;
        container.scrollTo({
          top: offsetPosition,
        });
      }
      if (isFunction(this.options.onItemClick)) {
        this.options.onItemClick(id);
      }
    });

    for (const header of modifiedHeaders) {
      const listItem = this.root.querySelector(`[data-id="${header.id}"]`);
      if (listItem) {
        listItem.textContent = header.textContent;
      }
    }
  }

  setHighlight(id: string) {
    if (!this.root) return;
    const item = this.root.querySelector(`:scope > [data-id="${id}"]`);
    if (item) {
      if (this.highlightedItem) {
        this.highlightedItem.classList.remove(this.bem.is('highlight'));
      }
      item.classList.add(this.bem.is('highlight'));
      this.highlightedItem = item;
    }
  }
}

function getAbsoluteTop(element: HTMLElement, container: HTMLElement = document.body): number {
  let offsetTop = 0;
  while (element !== container) {
    if (element === null) {
      // child element is:
      // - not attached to the DOM (display: none)
      // - set to fixed position (not scrollable)
      // - body or html element (null offsetParent)
      return Number.NaN;
    }
    offsetTop += element.offsetTop;
    element = element.offsetParent as HTMLElement;
  }
  return offsetTop;
}

export * from './formats';
export default HeaderList;
