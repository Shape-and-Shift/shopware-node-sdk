import { AdminApi } from './admin.api';

export class InfoApi extends AdminApi {
  getEntitySchema(): Promise<any> {
    return this.get('/_info/entity-schema.json');
  }

  getOpenApi(): Promise<any> {
    return this.get('/_info/openapi3.json');
  }

  getOpenApiSchema(): Promise<any> {
    return this.get('/_info/open-api-schema.json');
  }

  getEvents(): Promise<any> {
    return this.get('/_info/events.json');
  }

  getConfig(): Promise<any> {
    return this.get('/_info/config');
  }

  getShopwareVersion(): Promise<any> {
    return this.get('/_info/version');
  }
}
