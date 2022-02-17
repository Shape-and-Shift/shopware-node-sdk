import { types } from '../service/util.service';
import { Entity } from './entity.data';
import { Aggregations, Criteria } from './criteria.data';
import { EntityCollection } from './entity-collection.data';
import { ContextData } from './context.data';
import EntityDefinitionFactory from '../factory/entity-definition.factory';
import EntityDefinition from './entity-definition.data';

interface SearchResultMeta {
  total: number;
  totalCountMode: number;
}

interface RelationshipData {
  id: string;
  type: string;
}

interface EntityRowHydrator {
  id: string;
  relationships: {
    [key: string]: { data: RelationshipData };
  };
  attributes: {
    [key: string]: any;
  };
}

interface EntitySearchResult<T> {
  meta: SearchResultMeta;
  criteria: Criteria;
  context: ContextData;
  data: Array<T>;
  entityName: string;
  entities: EntityCollection;
  aggregations: Aggregations | null;
}

export class EntityHydrator {
  public cache: any;

  /**
   * Hydrates the repository response to a SearchResult class with all entities and aggregations
   * @param {String} route
   * @param {String} entityName
   * @param {Object} response
   * @param {Object} context
   * @param {Criteria} criteria
   * @returns {EntityCollection}
   */
  hydrateSearchResult(
    route: string,
    entityName: string,
    response: {
      data: EntitySearchResult<EntityRowHydrator>;
    },
    context: ContextData,
    criteria: Criteria,
  ): EntityCollection {
    this.cache = {};
    const entities: Array<Entity> = [];

    response.data.data.forEach((item) => {
      entities.push(
        this.hydrateEntity(entityName, item, response.data, context, criteria)!,
      );
    });

    return new EntityCollection(
      route,
      entityName,
      context,
      criteria,
      entities,
      response.data.aggregations,
      response.data.meta?.total,
    );
  }

  /**
   * Hydrates a collection of entities. Nested association will be hydrated into collections or entity classes.
   *
   * @param {String} route
   * @param {String} entityName
   * @param {Object} data
   * @param {Object} context
   * @param {Criteria} criteria
   * @returns {EntityCollection}
   */
  hydrate(
    route: string,
    entityName: string,
    data: {
      data: EntityRowHydrator[];
    },
    context: ContextData,
    criteria: Criteria,
  ): EntityCollection {
    this.cache = {};

    const collection = new EntityCollection(
      route,
      entityName,
      context,
      criteria,
    );

    data.data.forEach((row) => {
      collection.add(
        this.hydrateEntity(entityName, row, data, context, criteria)!,
      );
    });

    return collection;
  }

  /**
   * @private
   * @param {String} entityName
   * @param {Object} row
   * @param {Object} response
   * @param {Object} context
   * @param {Criteria} criteria
   * @returns {*}
   */
  hydrateEntity(
    entityName: string,
    row: EntityRowHydrator,
    response: Record<string, any>,
    context: ContextData,
    criteria: Criteria,
  ): Entity | null {
    if (!row) {
      return null;
    }

    const id: string = row.id;
    const cacheKey = `${entityName}-${id}`;

    if (this.cache[cacheKey]) {
      return this.cache[cacheKey];
    }

    const schema = EntityDefinitionFactory.get(entityName);
    // Translation can not be hydrated
    if (!schema) {
      return null;
    }

    const data = row.attributes;
    data.id = id;

    /*
     * Hydrate empty json fields
     * @ts-ignore
     */
    Object.entries(data).forEach(([attributeKey, attributeValue]) => {
      const field = schema.getField(attributeKey);

      if (!field) {
        return;
      }

      if (!schema.isJsonField(field)) {
        return;
      }

      if (
        Array.isArray(attributeValue) &&
        attributeValue.length <= 0 &&
        schema.isJsonObjectField(field)
      ) {
        data[attributeKey] = {};
        return;
      }

      const isEmptyObject =
        !Array.isArray(attributeValue) &&
        typeof attributeValue === 'object' &&
        attributeValue !== null &&
        Object.keys(attributeValue as object).length <= 0 &&
        schema.isJsonListField(field);

      if (isEmptyObject) {
        data[attributeKey] = [];
      }
    });

    Object.keys(row.relationships).forEach((property) => {
      const value = row.relationships[property];

      if (property === 'extensions') {
        data[property] = this.hydrateExtensions(
          id,
          value,
          schema,
          response,
          context,
          criteria,
        );
      }

      const field = schema.properties[property];

      if (!field) {
        return true;
      }

      if (schema.isToManyAssociation(field)) {
        data[property] = this.hydrateToMany(
          criteria,
          property,
          value,
          field.entity,
          context,
          response,
        );

        return true;
      }

      if (schema.isToOneAssociation(field) && types.isObject(value.data)) {
        const nestedEntity = this.hydrateToOne(
          criteria,
          property,
          value,
          response,
          context,
        );

        // Currently translation can not be hydrated
        if (nestedEntity) {
          data[property] = nestedEntity;
        }
      }

      return true;
    });

    const entity = new Entity(id, entityName, data);

    this.cache[cacheKey] = entity;

    return entity;
  }

  /**
   * Hydrates a to one association entity. The entity data is stored in the response included
   *
   * @private
   * @param {Criteria} criteria
   * @param {string} property
   * @param {Object} value
   * @param {Object } response
   * @param {Object} context
   * @returns {*|*}
   */
  hydrateToOne(
    criteria: Criteria,
    property: string,
    value: { data: RelationshipData },
    response: Record<string, any> = {},
    context: ContextData,
  ): any {
    const associationCriteria = this.getAssociationCriteria(criteria, property);

    const nestedRaw: EntityRowHydrator = this.getIncluded(
      value.data.type,
      value.data.id,
      response,
    );

    return this.hydrateEntity(
      value.data.type,
      nestedRaw,
      response,
      context,
      associationCriteria,
    );
  }

  /**
   * @param {Criteria} criteria
   * @param {string} property
   * @returns {Criteria}
   */
  getAssociationCriteria(criteria: Criteria, property: string): Criteria {
    if (criteria.hasAssociation(property)) {
      return criteria.getAssociation(property);
    }
    return new Criteria();
  }

  /**
   * Hydrates a many association (one to many and many to many) collection and hydrates the related entities
   * @private
   * @param {Criteria} criteria
   * @param {string} property
   * @param {Array|null} value
   * @param {string} entity
   * @param {Object} context
   * @param {Object } response
   * @returns {EntityCollection}
   */
  hydrateToMany(
    criteria: Criteria,
    property: string,
    value: any,
    entity = '',
    context: ContextData,
    response: Record<string, any>,
  ): EntityCollection {
    const associationCriteria = this.getAssociationCriteria(criteria, property);
    const apiResourcePath: string = context.getApiResourcePath();

    const url: string = value.links.related.substr(
      (value.links.related.indexOf(apiResourcePath) as number) +
        apiResourcePath.length,
    );

    const collection = new EntityCollection(
      url,
      entity,
      context,
      associationCriteria,
    );

    if (value.data === null) {
      return collection;
    }

    value.data.forEach((link: RelationshipData) => {
      const nestedRaw = this.getIncluded(link.type, link.id, response);
      const nestedEntity = this.hydrateEntity(
        link.type,
        nestedRaw,
        response,
        context,
        associationCriteria,
      );

      if (nestedEntity) {
        collection.add(nestedEntity);
      }
    });
    return collection;
  }

  /**
   * Finds an included entity
   * @private
   * @param {String} entity
   * @param {string} id
   * @param {Object} response
   * @returns {*}
   */
  getIncluded(entity: string, id: string, response: any): EntityRowHydrator {
    return response.included.find((included: any) => {
      return included.id === id && included.type === entity;
    });
  }

  /**
   * @private
   * @param {string} id
   * @param {Object} relationship
   * @param {Object} schema
   * @param {Object} response
   * @param {Object} context
   * @param {Criteria} criteria
   * @returns {*}
   */
  hydrateExtensions(
    id: string,
    relationship: any,
    schema: EntityDefinition,
    response: Record<string, any>,
    context: ContextData,
    criteria: Criteria,
  ): any {
    const extension = this.getIncluded('extension', id, response);

    const data = Object.assign({}, extension.attributes);

    Object.keys(extension.relationships).forEach((property) => {
      const value = extension.relationships[property];

      const field = schema.properties[property];

      if (!field) {
        return true;
      }

      if (schema.isToManyAssociation(field)) {
        data[property] = this.hydrateToMany(
          criteria,
          property,
          value,
          field.entity,
          context,
          response,
        );

        return true;
      }

      if (schema.isToOneAssociation(field) && types.isObject(value.data)) {
        const nestedEntity = this.hydrateToOne(
          criteria,
          property,
          value,
          response,
          context,
        );

        if (nestedEntity) {
          data[property] = nestedEntity;
        }
      }

      return true;
    });

    return data;
  }
}
