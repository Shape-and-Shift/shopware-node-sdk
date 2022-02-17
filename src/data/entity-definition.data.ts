const scalarTypes = [
  'uuid',
  'int',
  'text',
  'password',
  'float',
  'string',
  'blob',
  'boolean',
  'date',
];
const jsonTypes = ['json_list', 'json_object'];

export function getScalarTypes(): string[] {
  return scalarTypes;
}

export function getJsonTypes(): string[] {
  return jsonTypes;
}

export interface EntitySchemaProperty {
  type: string;
  relation?: string;
  primary?: string;
  format: string;
  local?: string;
  reference?: string;
  mapping?: string;
  entity?: string;
  localField?: string;
  referenceField?: string;
  readOnly: boolean;
  properties: {
    [key: string]: EntitySchemaProperty;
  };
  flags: {
    read_protected?: any[];
    write_protected?: any[];
    required?: boolean;
    computed?: boolean;
    cascade_delete?: boolean;
    translatable?: boolean;
    since?: string;
    primary_key?: boolean;
    extension: any;
  };
}

export interface EntitySchema {
  type: string;
  format: string;
  entity: string;
  properties: {
    [key: string]: EntitySchemaProperty;
  };
}

export default class EntityDefinition {
  public entity: EntitySchema['entity'];
  public properties: EntitySchema['properties'];

  constructor({ entity, properties }: EntitySchema) {
    this.entity = entity;
    this.properties = properties;
  }

  getEntity(): EntitySchema['entity'] {
    return this.entity;
  }

  /**
   * Returns an Object containing all primary key fields of the definition
   * @returns {Object}
   */
  getPrimaryKeyFields(): Record<string, EntitySchemaProperty> {
    return this.filterProperties((property) => {
      return property.flags.primary_key === true;
    });
  }

  /**
   * Returns an Object containing all associations fields of this definition
   * @returns {Object}
   */
  getAssociationFields(): Record<string, EntitySchemaProperty> {
    return this.filterProperties((property) => {
      return property.type === 'association';
    });
  }

  /**
   * Returns all toMany associationFields
   * @returns {Object}
   */
  getToManyAssociations(): Record<string, EntitySchemaProperty> {
    return this.filterProperties((property) => {
      if (property.type !== 'association') {
        return false;
      }

      return ['one_to_many', 'many_to_many'].includes(property.relation ?? '');
    });
  }

  /**
   * Returns all toMany associationFields
   * @returns {Object}
   */
  getToOneAssociations(): Record<string, EntitySchemaProperty> {
    return this.filterProperties((property) => {
      if (property.type !== 'association') {
        return false;
      }

      return ['one_to_one', 'many_to_one'].includes(property.relation ?? '');
    });
  }

  /**
   * Returns all translatable fields
   * @returns {Object}
   */
  getTranslatableFields(): Record<string, EntitySchemaProperty> {
    return this.filterProperties((property) => {
      return this.isTranslatableField(property);
    });
  }

  /**
   *
   * @returns {Object}
   */
  getRequiredFields(): Record<string, EntitySchemaProperty> {
    return this.filterProperties((property) => {
      return property.flags.required === true;
    });
  }

  /**
   * Filter field definitions by a given predicate
   * @param {Function} filter
   */
  filterProperties(
    filter: (field: EntitySchemaProperty) => boolean,
  ): Record<string, EntitySchemaProperty> {
    if (typeof filter !== 'function') {
      return {};
    }

    const result: Record<string, EntitySchemaProperty> = {};
    Object.keys(this.properties).forEach((propertyName) => {
      if (filter(this.properties[propertyName]) === true) {
        result[propertyName] = this.properties[propertyName];
      }
    });

    return result;
  }

  getField(name: string): EntitySchemaProperty {
    return this.properties[name];
  }

  forEachField(
    callback: (
      field: EntitySchemaProperty,
      fieldName: string,
      properties: EntitySchema['properties'],
    ) => void,
  ): void {
    if (typeof callback !== 'function') {
      return;
    }

    Object.keys(this.properties).forEach((propertyName) => {
      callback(this.properties[propertyName], propertyName, this.properties);
    });
  }

  isScalarField(field: EntitySchemaProperty): boolean {
    return scalarTypes.includes(field.type);
  }

  isJsonField(field: EntitySchemaProperty): boolean {
    return jsonTypes.includes(field.type);
  }

  isJsonObjectField(field: EntitySchemaProperty): boolean {
    return field.type === 'json_object';
  }

  isJsonListField(field: EntitySchemaProperty): boolean {
    return field.type === 'json_list';
  }

  isToManyAssociation(field: EntitySchemaProperty): boolean {
    return (
      field.type === 'association' &&
      ['one_to_many', 'many_to_many'].includes(field.relation ?? '')
    );
  }

  isToOneAssociation(field: EntitySchemaProperty): boolean {
    return (
      field.type === 'association' &&
      ['many_to_one', 'one_to_one'].includes(field.relation ?? '')
    );
  }

  isTranslatableField(field: EntitySchemaProperty): boolean {
    return (
      (field.type === 'string' || field.type === 'text') &&
      field.flags.translatable === true
    );
  }
}
