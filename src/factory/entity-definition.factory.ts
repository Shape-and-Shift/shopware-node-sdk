import EntityDefinition, {
  EntitySchema,
  EntitySchemaProperty,
} from '../data/entity-definition.data';
import { NotFoundException } from '../exception/not-found.exception';

const entityDefinitionRegistry: Map<string, EntityDefinition> = new Map();

function getDefinitionRegistry(): Map<string, EntityDefinition> {
  return entityDefinitionRegistry;
}

/**
 * Checks the EntityDefinition object for a given entity
 * @param entityName
 * @returns {Boolean}
 */
function has(entityName: string): boolean {
  return entityDefinitionRegistry.has(entityName);
}

/**
 * Returns the EntityDefinition object for a given entity
 * @param entityName
 * @returns {EntityDefinition}
 */
function get(entityName: string): EntityDefinition {
  const definition = entityDefinitionRegistry.get(entityName);

  if (typeof definition === 'undefined') {
    throw new NotFoundException(`Entity '${entityName}' not found`);
  }

  return definition;
}

/**
 * Takes a plain schema object and converts it to a shopware EntityDefinition
 * @param entityName
 * @param schema
 */
function add(entityName: string, schema: EntitySchema): void {
  entityDefinitionRegistry.set(entityName, new EntityDefinition(schema));
}

/**
 * Removes an entity definition from the registry
 * @param entityName
 * @returns {boolean}
 */
function remove(entityName: string): boolean {
  return entityDefinitionRegistry.delete(entityName);
}

function getTranslatedFields(
  entityName: string,
): Record<string, EntitySchemaProperty> {
  return get(entityName).getTranslatableFields();
}

function getAssociationFields(
  entityName: string,
): Record<string, EntitySchemaProperty> {
  return get(entityName).getAssociationFields();
}

function getRequiredFields(
  entityName: string,
): Record<string, EntitySchemaProperty> {
  return get(entityName).getRequiredFields();
}

export default {
  getDefinitionRegistry,
  has,
  get,
  add,
  remove,
  getTranslatedFields,
  getAssociationFields,
  getRequiredFields,
};
