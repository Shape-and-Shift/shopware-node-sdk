import { createId } from '../service/util.service';
import { ContextData } from './context.data';
import { EntityDefinitionFactory } from '../factory';
import { Entity } from './entity.data';
import { Criteria } from './criteria.data';
import { EntityCollection } from './entity-collection.data';

export class EntityFactory {
  /**
   * Creates a new entity for the provided entity name.
   * Returns null for unknown entities.
   *
   * @param {String} entityName
   * @param {String} id
   * @param {Object} context
   * @returns {Entity|null}
   */
  create(entityName: string, id: string, context: ContextData): Entity | null {
    id = id || createId();

    const definition = EntityDefinitionFactory.get(entityName);

    if (!definition) {
      console.warn(
        'Entity factory',
        `No schema found for entity ${entityName}`,
      );
      return null;
    }

    const data: {
      [index: string]: any;
      extensions: { [index: string]: EntityCollection };
    } = {
      extensions: {},
    };

    const toManyAssociations = definition.getToManyAssociations();
    Object.keys(toManyAssociations).forEach((property) => {
      const associatedProperty = toManyAssociations[property].entity as string;

      if (toManyAssociations[property].flags.extension) {
        data.extensions[property] = this.createCollection(
          entityName,
          `${id}/extensions`,
          property,
          associatedProperty,
          context,
        );
      } else {
        data[property] = this.createCollection(
          entityName,
          id,
          property,
          associatedProperty,
          context,
        );
      }
    });

    const entity = new Entity(id, entityName, data);
    entity.markAsNew();

    return entity;
  }

  /**
   * @private
   * @param {String} entity
   * @param {String} id
   * @param {String} property
   * @param {String} related
   * @param {Object} context
   * @returns {EntityCollection}
   */
  createCollection(
    entity: string,
    id: string,
    property: string,
    related: string,
    context: ContextData,
  ): EntityCollection {
    const subRoute = property.replace(/_/g, '-');
    const route = entity.replace(/_/g, '-');
    const source = `/${route}/${id}/${subRoute}`;

    const criteria = new Criteria();
    criteria.setLimit(10);
    criteria.setPage(1);

    return new EntityCollection(source, related, context, criteria);
  }
}
