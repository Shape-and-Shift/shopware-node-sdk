import {
  deepCopyObject,
  hasOwnProperty,
  getObjectDiff,
  getArrayChanges,
  cloneDeep,
  merge,
  mergeWith,
  deepMergeObject,
  get,
  set,
  pick,
} from './utils/object.utils';
import typesUtils, { isUndefined } from './utils/types.utils';
import { v4 as uuidv4 } from 'uuid';

export const object = {
  deepCopyObject: deepCopyObject,
  hasOwnProperty: hasOwnProperty,
  getObjectDiff: getObjectDiff,
  getArrayChanges: getArrayChanges,
  cloneDeep: cloneDeep,
  merge: merge,
  mergeWith: mergeWith,
  deepMergeObject: deepMergeObject,
  get: get,
  set: set,
  pick: pick,
};

export const types = {
  isObject: typesUtils.isObject,
  isPlainObject: typesUtils.isPlainObject,
  isEmpty: typesUtils.isEmpty,
  isRegExp: typesUtils.isRegExp,
  isArray: typesUtils.isArray,
  isFunction: typesUtils.isFunction,
  isDate: typesUtils.isDate,
  isString: typesUtils.isString,
  isBoolean: typesUtils.isBoolean,
  isEqual: typesUtils.isEqual,
  isNumber: typesUtils.isNumber,
  isUndefined: isUndefined,
  createId: createId,
};

/**
 * Returns a uuid string in hex format.
 *
 * @returns {String}
 */
export function createId(): string {
  return uuidv4().replace(/-/g, '');
}
