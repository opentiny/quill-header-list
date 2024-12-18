import type TypeHeader from 'quill/formats/header';
import Quill from 'quill';
import { randomID } from '../utils';

const Header = Quill.import('formats/header') as typeof TypeHeader;

export class HeaderWithID extends Header {
  static create(value: any) {
    const node = super.create(value);
    node.id = randomID();
    return node;
  }
}
