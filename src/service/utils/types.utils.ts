import isObject from 'lodash/isObject';
import isPlainObject from 'lodash/isPlainObject';
import isEmpty from 'lodash/isEmpty';
import isRegExp from 'lodash/isRegExp';
import isArray from 'lodash/isArray';
import isFunction from 'lodash/isFunction';
import isDate from 'lodash/isDate';
import isString from 'lodash/isString';
import isBoolean from 'lodash/isBoolean';
import isEqual from 'lodash/isEqual';
import isNumber from 'lodash/isNumber';

/**
 * @module service/utils/types
 */
export default {
  isObject,
  isPlainObject,
  isEmpty,
  isRegExp,
  isArray,
  isFunction,
  isDate,
  isString,
  isBoolean,
  isEqual,
  isNumber,
  isUndefined,
};

/**
 * Checks if a value is undefined
 */
export function isUndefined(value: unknown): boolean {
  return typeof value === 'undefined';
}
