export const isFunction = (val: any): val is Function => typeof val === 'function';
export const isString = (val: any): val is string => typeof val === 'string';
export const isUndefined = (val: any): val is undefined => val === undefined;
export const isNumber = (val: any): val is number => typeof val === 'number';
