import {
  ChangesetGenerator,
  EntityFactory,
  Repository,
  RepositoryOptions,
} from '../data';
import EntityDefinitionFactory from './entity-definition.factory';
import { EntityHydrator } from '../data/entity-hydrator.data';

export class RepositoryFactory {
  public static create(
    entityName: string,
    route = '',
    options: RepositoryOptions = {}
  ): Repository {
    if (!route) {
      route = `/${entityName.replace(/_/g, '-')}`;
    }

    return new Repository(
      route,
      EntityDefinitionFactory.get(entityName),
      new EntityHydrator(),
      new ChangesetGenerator(),
      new EntityFactory(),
      options
    );
  }
}
