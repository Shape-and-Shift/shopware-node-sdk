import { ApiService } from '../service';
import { AuthorizationException } from '../exception';
import { GrantParamsType, GrantType } from '../grant';
import { AuthToken } from '../data';

export class AdminAuth extends ApiService {
  public static OAUTH_TOKEN_ENDPOINT = '/oauth/token';

  private grantType: GrantType;

  constructor(grantType: GrantType) {
    super();
    this.grantType = grantType;
  }

  async fetchAccessToken(): Promise<AuthToken> {
    try {
      const data = await this.post<any>(
        AdminAuth.OAUTH_TOKEN_ENDPOINT,
        this.buildParams(),
      );

      return {
        accessToken: data['access_token'],
        expiresIn: data['expires_in'] ?? 600,
        tokenType: data['token_type'] ?? null,
        refreshToken: data['refresh_token'] ?? null,
      };
    } catch (error: any) {
      throw new AuthorizationException(
        'Fetch access token error',
        error?.response?.data,
      );
    }
  }

  buildParams(): GrantParamsType {
    return this.grantType.getParams();
  }
}
