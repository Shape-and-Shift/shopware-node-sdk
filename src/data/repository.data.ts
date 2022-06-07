import { AxiosInstance, AxiosRequestHeaders, AxiosResponse } from 'axios';
import { Criteria } from './criteria.data';
import EntityDefinition from './entity-definition.data';
import createHTTPClient from '../service/http.service';
import { ContextData } from './context.data';
import { hasOwnProperty } from '../service/utils/object.utils';
import { EntityHydrator } from './entity-hydrator.data';
import { ChangesetGenerator } from './changeset-generator.data';
import { Entity } from './entity.data';
import { EntityCollection } from './entity-collection.data';
import { EntityFactory } from './entity-factory.data';

export type RepositoryOptions = {
  version?: string;
  useSync?: boolean;
  keepApiErrors?: boolean;
  compatibility?: boolean;
};

type RepositoryOperation = {
  key?: string;
  action: string;
  entity: string;
  payload: any[];
};

export class Repository {
  protected route: string;
  protected httpClient: AxiosInstance;
  protected entityDefinition: EntityDefinition;
  protected options: RepositoryOptions;
  protected hydrator: EntityHydrator;
  protected changesetGenerator: ChangesetGenerator;
  protected entityName = '';
  protected entityFactory: EntityFactory;

  constructor(
    route: string,
    entityDefinition: EntityDefinition,
    hydrator: EntityHydrator,
    changesetGenerator: ChangesetGenerator,
    entityFactory: EntityFactory,
    options: RepositoryOptions,
    context: ContextData,
  ) {
    this.route = route;
    this.httpClient = createHTTPClient(context);
    this.entityDefinition = entityDefinition;
    this.entityName = entityDefinition.entity;
    this.hydrator = hydrator;
    this.changesetGenerator = changesetGenerator;
    this.entityFactory = entityFactory;
    this.options = options;
  }

  /**
   * Sends a search request to the server to find entity ids for the provided criteria.
   * @param {Criteria} criteria
   * @param {Object} context
   * @returns {Promise}
   */
  searchIds(criteria: Criteria, context: ContextData): Promise<any> {
    const headers = this.buildHeaders(context);

    const url = `/search-ids${this.route}`;

    return this.httpClient
      .post(url, criteria.parse(), {
        headers,
        version: this.options.version,
      })
      .then((response) => {
        return response.data;
      });
  }

  /**
   * Sends a search request for the repository entity.
   * @param {Criteria} criteria
   * @param {Object} context
   * @returns {Promise}
   */
  search(criteria: Criteria, context: ContextData): Promise<EntityCollection> {
    const headers = this.buildHeaders(context);

    const url = `/search${this.route}`;

    return this.httpClient
      .post(url, criteria.parse(), {
        headers,
        version: this.options.version,
      })
      .then((response) => {
        return this.hydrator.hydrateSearchResult(
          this.route,
          this.entityDefinition.entity,
          response,
          context,
          criteria,
        );
      });
  }

  /**
   * Shorthand to fetch a single entity from the server
   * @param {String} id
   * @param {Object} context
   * @param {Criteria} criteria
   * @returns {Promise}
   */
  get(
    id: string,
    context: ContextData,
    criteria: Criteria,
  ): Promise<Entity | null> {
    criteria = criteria || new Criteria();
    criteria.setIds([id]);

    return this.search(criteria, context).then((result) => result.get(id));
  }

  /**
   * Detects all entity changes and send the changes to the server.
   * If the entity is marked as new, the repository will send a POST create. Updates will be sent as PATCH request.
   * Deleted associations will be sent as additional request
   *
   * @param {Entity} entity
   * @param {Object} context
   * @returns {Promise<any>}
   */
  save(
    entity: Entity,
    context: ContextData,
  ): Promise<void | AxiosResponse<any, any>> {
    if (this.options.useSync === true) {
      return this.saveWithSync(entity, context);
    }

    return this.saveWithRest(entity, context);
  }

  /**
   * @private
   * @param {Entity} entity
   * @param {Object} context
   * @returns {Promise<Promise>}
   */
  async saveWithRest(
    entity: Entity,
    context: ContextData,
  ): Promise<void | AxiosResponse<any, any>> {
    const { changes, deletionQueue } = this.changesetGenerator.generate(entity);

    await this.sendDeletions(deletionQueue, context);
    return this.sendChanges(entity, changes, context);
  }

  /**
   * @private
   * @param {Entity} entity
   * @param {Object} context
   * @returns {Promise<void>|Promise<T>}
   */
  async saveWithSync(
    entity: Entity,
    context: ContextData,
  ): Promise<void | AxiosResponse<any, any>> {
    const { changes, deletionQueue } = this.changesetGenerator.generate(entity);

    if (entity.isNew()) {
      Object.assign(changes || {}, { id: entity.id });
    }

    const operations: RepositoryOperation[] = [];

    if (deletionQueue.length > 0) {
      operations.push(...this.buildDeleteOperations(deletionQueue));
    }

    if (changes !== null) {
      operations.push({
        key: 'write',
        action: 'upsert',
        entity: entity.getEntityName(),
        payload: [changes],
      });
    }

    const headers = this.buildHeaders(context);
    headers['single-operation'] = 'true';

    if (operations.length <= 0) {
      return Promise.resolve();
    }

    return this.httpClient.post('_action/sync', operations, {
      headers,
      version: this.options.version,
    });
  }

  /**
   * Clones an existing entity
   *
   * @param {String} entityId
   * @param {Object} context
   * @param {Object} behavior
   * @returns {Promise}
   */
  clone(
    entityId: string,
    context: ContextData,
    behavior: object,
  ): Promise<any> {
    if (!entityId) {
      return Promise.reject(new Error('Missing required argument: id'));
    }

    return this.httpClient
      .post(`/_action/clone${this.route}/${entityId}`, behavior, {
        headers: this.buildHeaders(context),
        version: this.options.version,
      })
      .then((response) => {
        return response.data;
      });
  }

  /**
   * Detects if the entity or the relations has remaining changes which are not synchronized with the server
   * @param {Entity} entity
   * @returns {boolean}
   */
  hasChanges(entity: Entity): boolean {
    const { changes, deletionQueue } = this.changesetGenerator.generate(entity);

    return changes !== null || deletionQueue.length > 0;
  }

  /**
   * Detects changes of all provided entities and send the changes to the server
   *
   * @param {Array} entities
   * @param {Object} context
   * @returns {Promise<any[]>}
   */
  saveAll(entities: EntityCollection, context: ContextData): Promise<any[]> {
    const promises: Array<Promise<any>> = [];

    entities.forEach((entity: Entity) => {
      promises.push(this.save(entity, context));
    });

    return Promise.all(promises);
  }

  /**
   * Detects changes of all provided entities and send the changes to the server
   *
   * @param {Array} entities
   * @param {Object} context
   * @param {Boolean} failOnError
   * @returns {Promise<any[]>}
   */
  async sync(
    entities: EntityCollection,
    context: ContextData,
    failOnError = true,
  ): Promise<void> {
    const { changeset, deletions } = this.getSyncChangeset(entities);

    await this.sendDeletions(deletions, context);
    return this.sendUpserts(changeset, failOnError, context);
  }

  /**
   * Detects changes of the provided entity and resets its first-level attributes to its origin state
   *
   * @param {Object} entity
   */
  discard(entity: Entity): void {
    if (!entity) {
      return;
    }

    const { changes } = this.changesetGenerator.generate(entity);

    if (!changes) {
      return;
    }

    const origin = entity.getOrigin();

    Object.keys(changes).forEach((changedField) => {
      entity[changedField] = origin[changedField];
    });
  }

  /**
   * @private
   * @param changeset
   * @param failOnError
   * @param context
   * @returns {*}
   */
  sendUpserts(
    changeset: any[],
    failOnError: any,
    context: ContextData,
  ): Promise<void> {
    if (changeset.length <= 0) {
      return Promise.resolve();
    }

    // @ts-ignore
    const payload = changeset.map(({ changes }) => changes);
    const headers = this.buildHeaders(context);
    headers['fail-on-error'] = failOnError;

    return this.httpClient
      .post(
        '_action/sync',
        {
          [this.entityName]: {
            entity: this.entityName,
            action: 'upsert',
            payload,
          },
        },
        { headers, version: this.options.version },
      )
      .then(({ data }) => {
        if (data.success === false) {
          throw data;
        }
        return Promise.resolve();
      })
      .catch((errorResponse) => {
        throw errorResponse;
      });
  }

  /**
   * @private
   * @param entities
   * @returns {*}
   */
  getSyncChangeset(entities: EntityCollection): {
    changeset: any[];
    deletions: any[];
  } {
    return entities.reduce(
      (acc: any, entity) => {
        const { changes, deletionQueue } =
          this.changesetGenerator.generate(entity);
        acc.deletions.push(...deletionQueue);

        if (changes === null) {
          return acc;
        }

        const pkData = this.changesetGenerator.getPrimaryKeyData(entity);
        Object.assign(changes, pkData);

        acc.changeset.push({ entity, changes });

        return acc;
      },
      { changeset: [], deletions: [] },
    );
  }

  /**
   * Sends a create request for a many to many relation. This can only be used for many to many repository
   * where the base route contains already the owner key, e.g. /product/{id}/categories
   * The provided id contains the associated entity id.
   *
   * @param {String} id
   * @param {Object} context
   * @returns {Promise}
   */
  assign(id: string, context: ContextData): Promise<AxiosResponse<any, any>> {
    const headers = this.buildHeaders(context);

    return this.httpClient.post(
      `${this.route}`,
      { id },
      { headers, version: this.options.version },
    );
  }

  /**
   * Sends a delete request for the provided id.
   * @param {String} id
   * @param {Object} context
   * @returns {Promise}
   */
  delete(id: string, context: ContextData): Promise<AxiosResponse<any, any>> {
    const headers = this.buildHeaders(context);

    const url = `${this.route}/${id}`;
    return this.httpClient.delete(url, {
      headers,
      version: this.options.version,
    });
  }

  /**
   * Allows to iterate all ids of the provided criteria.
   * @param {Criteria} criteria
   * @param {function} callback
   * @param context
   * @returns {Promise}
   */
  iterateIds(
    criteria: Criteria,
    callback: (ids: string[]) => Promise<void>,
    context: ContextData,
  ): Promise<any> {
    if (criteria.limit === null) {
      criteria.setLimit(50);
    }
    criteria.setTotalCountMode(1);

    return this.searchIds(criteria, context).then((response) => {
      const ids: string[] = response.data;

      if (ids.length <= 0) {
        return Promise.resolve();
      }

      return callback(ids).then(() => {
        if (ids.length < criteria.limit) {
          return Promise.resolve();
        }

        criteria.setPage(criteria.page + 1);

        return this.iterateIds(criteria, callback, context);
      });
    });
  }

  /**
   * Sends a delete request for a set of ids
   * @param {Array} ids
   * @param {Object} context
   * @returns {Promise}
   */
  syncDeleted(ids: Array<any>, context: ContextData): Promise<void> {
    const headers = this.buildHeaders(context);

    headers['fail-on-error'] = 'true';
    const payload = ids.map((id) => {
      return { id };
    });

    return this.httpClient
      .post(
        '_action/sync',
        {
          [this.entityName]: {
            entity: this.entityName,
            action: 'delete',
            payload,
          },
        },
        { headers, version: this.options.version },
      )
      .then(({ data }) => {
        if (data.success === false) {
          throw data;
        }
        return Promise.resolve();
      })
      .catch((errorResponse) => {
        throw errorResponse;
      });
  }

  /**
   * Creates a new entity for the local schema.
   * To Many association are initialed with a collection with the corresponding remote api route
   *
   * @param {Object} context
   * @param {String|null} id
   * @returns {Entity}
   */
  create(context: ContextData, id: string): Entity | null {
    return this.entityFactory.create(this.entityName, id, context);
  }

  /**
   * Creates a new version for the provided entity id. If no version id provided, the server
   * will generate a new version id.
   * If no version name provided, the server names the new version with `draft %date%`.
   *
   * @param {string} entityId
   * @param {Object} context
   * @param {String|null} versionId
   * @param {String|null} versionName
   * @returns {Promise}
   */
  createVersion(
    entityId: string,
    context: ContextData,
    versionId = null,
    versionName = null,
  ): Promise<{ versionId: any }> {
    const headers = this.buildHeaders(context);
    const params: Record<string, string> = {};

    if (versionId) {
      params.versionId = versionId;
    }
    if (versionName) {
      params.versionName = versionName;
    }

    const url = `_action/version/${this.entityDefinition.entity.replace(
      /_/g,
      '-',
    )}/${entityId}`;

    return this.httpClient
      .post(url, params, {
        headers,
        version: this.options.version,
      })
      .then((response) => {
        return { ...context, ...{ versionId: response.data.versionId } };
      });
  }

  /**
   * Sends a request to the server to merge all changes of the provided version id.
   * The changes are squashed into a single change and the remaining version will be removed.
   * @param {String} versionId
   * @param {Object} context
   * @returns {Promise}
   */
  mergeVersion(
    versionId: string,
    context: ContextData,
  ): Promise<AxiosResponse<any, any>> {
    const headers = this.buildHeaders(context);

    const url = `_action/version/merge/${this.entityDefinition.entity.replace(
      /_/g,
      '-',
    )}/${versionId}`;

    return this.httpClient.post(
      url,
      {},
      { headers, version: this.options.version },
    );
  }

  /**
   * Deletes the provided version from the server. All changes to this version are reverted
   * @param {String} entityId
   * @param {String} versionId
   * @param {Object} context
   * @returns {Promise}
   */
  deleteVersion(
    entityId: string,
    versionId: string,
    context: ContextData,
  ): Promise<AxiosResponse<any, any>> {
    const headers = this.buildHeaders(context);

    const url = `/_action/version/${versionId}/${this.entityDefinition.entity.replace(
      /_/g,
      '-',
    )}/${entityId}`;

    return this.httpClient.post(
      url,
      {},
      { headers, version: this.options.version },
    );
  }

  /**
   * @private
   * @param {Entity} entity
   * @param {Object} changes
   * @param {Object} context
   * @returns {*}
   */
  sendChanges(
    entity: Entity,
    changes: any,
    context: ContextData,
  ): Promise<AxiosResponse<any, any>> | Promise<void> {
    const headers = this.buildHeaders(context);

    if (entity.isNew()) {
      changes = changes || {};
      Object.assign(changes, { id: entity.id });

      return this.httpClient
        .post(`${this.route}`, changes, {
          headers,
          version: this.options.version,
        })
        .catch((errorResponse) => {
          throw errorResponse;
        });
    }

    if (typeof changes === 'undefined' || changes === null) {
      return Promise.resolve();
    }

    return this.httpClient
      .patch(`${this.route}/${entity.id}`, changes, {
        headers,
        version: this.options.version,
      })
      .catch((errorResponse) => {
        throw errorResponse;
      });
  }

  /**
   * Process the deletion queue
   * @param {Array} queue
   * @param {Object} context
   * @returns {Promise}
   */
  sendDeletions(
    queue: Array<any>,
    context: ContextData,
  ): Promise<AxiosResponse<any, any>[]> {
    const headers = this.buildHeaders(context);
    const requests = queue.map((deletion) => {
      return this.httpClient
        .delete(`${deletion.route as string}/${deletion.key as string}`, {
          headers,
          version: this.options.version,
        })
        .catch((errorResponse) => {
          throw errorResponse;
        });
    });

    return Promise.all(requests);
  }

  /**
   * Builds the request header for read and write operations
   * @param {Object} context
   * @returns {Object}
   */
  buildHeaders(context: ContextData): AxiosRequestHeaders {
    const compatibility = hasOwnProperty(this.options, 'compatibility')
      ? this.options.compatibility
      : true;

    const authToken = context.getAuthToken();
    const languageId = context.getLanguageId();
    const currencyId = context.getCurrencyId();
    const versionId = context.getVersionId();
    const inheritance = context.getInheritance();

    let headers: AxiosRequestHeaders = {
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/json',
      // @ts-ignore
      'sw-api-compatibility': compatibility,
    };

    if (authToken) {
      headers = Object.assign(
        { Authorization: `Bearer ${authToken.accessToken}` },
        headers,
      );
    }

    if (languageId) {
      headers = Object.assign({ 'sw-language-id': languageId }, headers);
    }

    if (currencyId) {
      headers = Object.assign({ 'sw-currency-id': currencyId }, headers);
    }

    if (versionId) {
      headers = Object.assign({ 'sw-version-id': versionId }, headers);
    }

    if (inheritance) {
      headers = Object.assign({ 'sw-inheritance': inheritance }, headers);
    }

    return headers;
  }

  /**
   * @private
   * @param {Array} deletionQueue
   */
  buildDeleteOperations(deletionQueue: Array<any>): RepositoryOperation[] {
    const grouped: Record<string, any[]> = {};

    deletionQueue.forEach((deletion) => {
      const entityName: string = deletion.entity;

      if (!entityName) {
        return;
      }

      if (!grouped.hasOwnProperty(entityName)) {
        grouped[entityName] = [];
      }

      grouped[entityName].push(deletion.primary);
    });

    const operations: RepositoryOperation[] = [];

    Object.keys(grouped).forEach((entity) => {
      const deletions = grouped[entity];

      operations.push({
        action: 'delete',
        payload: deletions,
        entity: entity,
      });
    });

    return operations;
  }
}
