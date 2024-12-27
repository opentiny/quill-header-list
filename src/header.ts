import type TypeHeader from 'quill/formats/header';
import { randomID } from './utils';

export function generateHeaderWithId(Header: typeof TypeHeader): typeof TypeHeader {
  return class extends Header {
    static create(value: any) {
      const node = super.create(value);
      node.id = randomID();
      return node;
    }
  };
}
