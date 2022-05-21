import { ApiService } from '../service';

export class AdminApi extends ApiService {
  protected getBasicHeaders(
    additionalHeaders?: object,
  ): Record<string, string> {
    let basicHeaders = super.getBasicHeaders(additionalHeaders);
    const authToken = this.context.getAuthToken();
    if (authToken) {
      basicHeaders = {
        ...basicHeaders,
        Authorization: `Bearer ${authToken.accessToken}`,
      };
    }

    return basicHeaders;
  }
}
