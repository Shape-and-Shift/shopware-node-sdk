import objectMerge from 'lodash/merge';
import objectMergeWith from 'lodash/mergeWith';
import objectCopy from 'lodash/cloneDeep';
import objectGet from 'lodash/get';
import objectSet from 'lodash/set';
import objectPick from 'lodash/pick';
import type from './types.utils';

/**
 * @module service/utils/object
 */
export default {
  deepCopyObject,
  hasOwnProperty,
  getObjectDiff,
  getArrayChanges,
  merge: objectMerge,
  mergeWith: objectMerge,
  cloneDeep: objectCopy,
  get: objectGet,
  set: objectSet,
  pick: objectPick,
};

/**
 * Lodash import for object merges.
 */
export const merge = objectMerge;

export const mergeWith = objectMergeWith;

export const cloneDeep = objectCopy;

export const get = objectGet;

export const set = objectSet;

export const pick = objectPick;

/**
 * Shorthand method for `Object.prototype.hasOwnProperty`
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function hasOwnProperty(scope: any, prop: string): boolean {
  return Object.prototype.hasOwnProperty.call(scope, prop);
}

/**
 * Deep copy an object
 */
export function deepCopyObject<O extends object>(copyObject: O): O {
  return JSON.parse(JSON.stringify(copyObject)) as O;
}

/**
 * Deep merge two objects
 */
export function deepMergeObject<FO extends object, SO extends object>(
  firstObject: FO,
  secondObject: SO,
): FO & SO {
  return mergeWith(firstObject, secondObject, (objValue, srcValue) => {
    if (Array.isArray(objValue)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return objValue.concat(srcValue);
    }
    return undefined;
  });
}

/**
 * Get a simple recursive diff of two objects.
 * Does not consider an entity schema or entity related logic.
 *
 * @param {Object} a
 * @param {Object} b
 * @return {*}
 */
export function getObjectDiff(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
): Record<string, unknown> {
  if (a === b) {
    return {};
  }

  if (!type.isObject(a) || !type.isObject(b)) {
    return b;
  }

  if (type.isDate(a) || type.isDate(b)) {
    if (a.valueOf() === b.valueOf()) {
      return {};
    }

    return b;
  }

  return Object.keys(b).reduce((acc, key) => {
    if (!hasOwnProperty(a, key)) {
      return { ...acc, [key]: b[key] };
    }

    if (type.isArray(b[key])) {
      const changes = getArrayChanges(
        a[key] as Record<string, unknown>[],
        b[key] as Record<string, unknown>[],
      );

      if (Object.keys(changes).length > 0) {
        return { ...acc, [key]: b[key] };
      }

      return acc;
    }

    if (type.isObject(b[key])) {
      const changes = getObjectDiff(
        a[key] as Record<string, unknown>,
        b[key] as Record<string, unknown>,
      );

      if (!type.isObject(changes) || Object.keys(changes).length > 0) {
        return { ...acc, [key]: changes };
      }

      return acc;
    }

    if (a[key] !== b[key]) {
      return { ...acc, [key]: b[key] };
    }

    return acc;
  }, {});
}

/**
 * Check if the compared array has changes.
 * Works a little bit different like the object diff because it does not return a real changeset.
 * In case of a change we will always use the complete compare array,
 * because it always holds the newest state regarding deletions, additions and the order.
 */
export function getArrayChanges(
  a: Record<string, unknown>[],
  b: Record<string, unknown>[],
): Record<string, unknown>[] {
  if (a === b) {
    return [];
  }

  if (!type.isArray(a) || !type.isArray(b)) {
    return b;
  }

  if (a.length <= 0 && b.length <= 0) {
    return [];
  }

  if (a.length !== b.length) {
    return b;
  }

  if (!type.isObject(b[0])) {
    return b.filter((item) => !a.includes(item));
  }

  const changes: Record<string, unknown>[] = [];

  b.forEach((item, index) => {
    const objDiff = getObjectDiff(a[index], b[index]);

    if (Object.keys(objDiff).length > 0) {
      changes.push(b[index]);
    }
  });

  return changes;
}
