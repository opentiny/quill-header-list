export const isFunction = (val: unknown): val is (...args: any[]) => any => typeof val === 'function';
export const isString = (val: unknown): val is string => typeof val === 'string';
export const isUndefined = (val: unknown): val is undefined => val === undefined;
export const isNumber = (val: unknown): val is number => typeof val === 'number';
export const isArray = Array.isArray;
export const ensureArray = <T>(val: T | T[]): T[] => isArray(val) ? val : [val];
