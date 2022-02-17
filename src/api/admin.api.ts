import { Context } from '../data';
import { ApiService } from '../service';

export class AdminApi extends ApiService {
  protected getBasicHeaders(
    additionalHeaders?: object,
  ): Record<string, string> {
    let basicHeaders = super.getBasicHeaders(additionalHeaders);
    const authToken = Context.getAuthToken();
    if (authToken) {
      basicHeaders = {
        ...basicHeaders,
        Authorization: `Bearer ${authToken.accessToken}`,
      };
    }

    return basicHeaders;
  }
}
