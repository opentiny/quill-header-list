import type TypeBlock from 'quill/blots/block';
import type { HeaderValue } from '../utils';
import Quill from 'quill';
import { isNumber, randomID } from '../utils';

const Header = Quill.import('formats/header') as typeof TypeBlock;

export class HeaderWithID extends Header {
  static idKey = 'data-block-id';
  static create(value: HeaderValue | number) {
    let id;
    if (isNumber(value)) {
      id = randomID();
    }
    else {
      id = value.id || randomID();
      value = value.value || 0;
    }
    const node = super.create(value);
    node.setAttribute(this.idKey, id);
    return node;
  }

  static formats(domNode: HTMLElement): Record<string, any> {
    const value = this.tagName.indexOf(domNode.tagName) + 1;
    const id = domNode.getAttribute(this.idKey) || randomID();
    return {
      id,
      value,
    };
  }
}
