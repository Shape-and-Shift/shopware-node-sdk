/**
 * Refresh token helper which manages a cache of requests to retry them after the token got refreshed.
 * @class RefreshTokenHelper
 */
import { AuthToken, Context } from '../data';
import { RefreshTokenGrant } from '../grant';
import { AdminAuth } from '../auth';

export class RefreshTokenHelper {
  private _whitelists = ['/oauth/token'];

  /**
   * Fires the refresh token request and renews the bearer authentication
   *
   * @param originError
   * @returns {Promise<String>}
   */
  async fireRefreshTokenRequest(originError: any): Promise<AuthToken> {
    try {
      let authToken = Context.getAuthToken();
      if (authToken) {
        const grantType = new RefreshTokenGrant(authToken.refreshToken);
        const adminClient = new AdminAuth(grantType);

        authToken = await adminClient.fetchAccessToken();
        Context.setAuthToken(authToken);

        return authToken;
      } else {
        return Promise.reject(originError);
      }
    } catch (e) {
      return Promise.reject(e);
    }
  }

  get whitelists(): string[] {
    return this._whitelists;
  }

  set whitelists(urls: string[]) {
    this._whitelists = urls;
  }
}
