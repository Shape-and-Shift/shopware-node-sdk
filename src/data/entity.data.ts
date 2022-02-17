import { cloneDeep } from 'lodash';

export class Entity {
  public id: string;

  private _origin;

  private _entityName: string;

  private _draft: any;

  private _isDirty: boolean;

  private _isNew: boolean;

  [key: string]: any;

  constructor(id: string, entityName: string, data: any) {
    this.id = id;
    this._origin = cloneDeep(data);
    this._entityName = entityName;
    this._draft = data;
    this._isDirty = false;
    this._isNew = false;

    return new Proxy(this._draft, {
      get: (target, property): any => {
        if (property in this._draft) {
          return this._draft[property];
        }

        // @ts-ignore
        return this[property];
      },

      set: (target, property, value): boolean => {
        this._draft[property] = value;
        this._isDirty = true;

        return true;
      },
    });
  }

  /**
   * Marks the entity as new. New entities will be provided as create request to the server
   */
  markAsNew(): void {
    this._isNew = true;
  }

  /**
   * Allows to check if the entity is a new entity and should be provided as create request
   * to the server
   *
   * @returns {boolean}
   */
  isNew(): boolean {
    return this._isNew;
  }

  /**
   * Allows to check if the entity changed
   * @returns {boolean}
   */
  getIsDirty(): boolean {
    return this._isDirty;
  }

  /**
   * Allows access the origin entity value. The origin value contains the server values
   * @returns {Object}
   */
  getOrigin(): any {
    return this._origin;
  }

  /**
   * Allows to access the draft value. The draft value contains all local changes of the entity
   * @returns {Object}
   */
  getDraft(): any {
    return this._draft;
  }

  /**
   * Allows to access the entity name. The entity name is used as unique identifier `product`, `media`, ...
   * @returns {string}
   */
  getEntityName(): string {
    return this._entityName;
  }
}
