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

const defaultOptions = {
  apiPath: '/api',
  autoCallRefresh: true,
};

export class ApplicationInstance {
  readonly #context: ContextData;

  constructor(options: initOptions | ContextData) {
    if (options instanceof ContextData) {
      this.#context = options;
    } else {
      const { shopUrl } = options;
      let { apiPath, autoCallRefresh} = options;
      this.#context = new ContextData();

      apiPath ||= defaultOptions.apiPath;
      autoCallRefresh ||= defaultOptions.autoCallRefresh;

      this.#context.setApiEndPoint(options.shopUrl, apiPath);
      this.#context.setApiResourcePath(shopUrl, apiPath);
      this.#context.setAutoCallRefresh(autoCallRefresh ?? defaultOptions.autoCallRefresh);
    }
  }

  getContext(): ContextData {
    return this.#context;
  }

  /**
   * Load new entity scheme from shopware application
   */
  async loadEntitySchema(): Promise<void> {
    const definitionRegistry = EntityDefinitionFactory.getDefinitionRegistry();

    if (definitionRegistry.size === 0) {
      const infoApi: InfoApi = new InfoApi(this.#context);

      // Load schema entity from server
      const schemas: Record<string, EntitySchema> =
        await infoApi.getEntitySchema();

      Object.keys(schemas).forEach((entityName) => {
        EntityDefinitionFactory.add(entityName, schemas[entityName]);
      });
    }
  }

  async authenticate(grantType: GrantType): Promise<AuthToken> {
    const adminAuth: AdminAuth = new AdminAuth(grantType, this.#context);
    const authToken: AuthToken = await adminAuth.fetchAccessToken();

    await this.setAuthToken(authToken);

    return authToken;
  }

  async setAuthToken(authToken: AuthToken | null): Promise<void> {
    this.#context.setAuthToken(authToken);
    if (authToken) {
      await this.loadEntitySchema();
    }
  }
}

export class Application {
  static #instance = new ApplicationInstance(Context);

  /**
   * @deprecated Use ApplicationInstance instead
   */
  public static init({
    shopUrl,
    apiPath = defaultOptions.apiPath,
    autoCallRefresh = defaultOptions.autoCallRefresh,
  }: initOptions): void {
    Context.setApiEndPoint(shopUrl, apiPath);
    Context.setApiResourcePath(shopUrl, apiPath);
    Context.setAutoCallRefresh(autoCallRefresh);
  }

  public static async setAuthToken(authToken: AuthToken | null): Promise<void> {
    return this.#instance.setAuthToken(authToken);
  }

  public static async authenticate(grantType: GrantType): Promise<AuthToken> {
    return this.#instance.authenticate(grantType);
  }

  /**
   * @deprecated Use `getContext()` instead
   */
  public static getConText(): ContextData {
    return this.getContext();
  }

  public static getContext(): ContextData {
    return this.#instance.getContext();
  }

  /**
   * Load new entity scheme from shopware application
   */
  public static async loadEntitySchema(): Promise<void> {
    return this.#instance.loadEntitySchema();
  }
}
