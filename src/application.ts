import { AuthToken, Context, ContextData } from './data';
import EntityDefinitionFactory from './factory/entity-definition.factory';
import { InfoApi } from './api';
import { GrantType } from './grant';
import { AdminAuth } from './auth';
import { EntitySchema } from './data/entity-definition.data';

export type initOptions = {
  shopUrl: string;
  apiPath?: string;
  autoCallRefresh?: boolean;
};

export class Application {
  public static init({
    shopUrl,
    apiPath = '/api',
    autoCallRefresh = true,
  }: initOptions): void {
    Context.setApiEndPoint(shopUrl, apiPath);
    Context.setApiResourcePath(shopUrl, apiPath);
    Context.setAutoCallRefresh(autoCallRefresh);
  }

  public static async setAuthToken(authToken: AuthToken | null): Promise<void> {
    Context.setAuthToken(authToken);
    if (authToken) {
      await Application.loadEntitySchema();
    }
  }

  public static async authenticate(grantType: GrantType): Promise<AuthToken> {
    const adminAuth: AdminAuth = new AdminAuth(grantType);
    const authToken: AuthToken = await adminAuth.fetchAccessToken();

    await Application.setAuthToken(authToken);

    return authToken;
  }

  public static getConText(): ContextData {
    return Context;
  }

  /**
   * Load new entity scheme from shopware application
   */
  public static async loadEntitySchema(): Promise<void> {
    const definitionRegistry = EntityDefinitionFactory.getDefinitionRegistry();

    if (definitionRegistry.size === 0) {
      const infoApi: InfoApi = new InfoApi();

      // Load schema entity from server
      const schemas: Record<string, EntitySchema> =
        await infoApi.getEntitySchema();

      Object.keys(schemas).forEach((entityName) => {
        EntityDefinitionFactory.add(entityName, schemas[entityName]);
      });
    }
  }
}
