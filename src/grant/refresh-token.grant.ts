import { GrantParamsType, GRANT_SCOPE, GrantType } from './grant-type';

export class RefreshTokenGrant extends GrantType {
  protected refreshToken: string;

  constructor(
    refreshToken: string,
    scope: GRANT_SCOPE[] | GRANT_SCOPE = GRANT_SCOPE.WRITE
  ) {
    super(
      RefreshTokenGrant.REFRESH_TOKEN,
      RefreshTokenGrant.ADMINISTRATION_CLIENT_ID,
      scope
    );
    this.refreshToken = refreshToken;
  }

  getParams(): GrantParamsType {
    return {
      ...super.getParams(),
      refresh_token: this.refreshToken,
    };
  }
}
