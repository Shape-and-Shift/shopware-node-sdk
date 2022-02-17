import { GrantParamsType, GRANT_SCOPE, GrantType } from './grant-type';

export class ClientCredentialsGrant extends GrantType {
  protected clientSecret: string;

  constructor(
    clientId: string,
    clientSecret: string,
    scope: GRANT_SCOPE[] | GRANT_SCOPE = GRANT_SCOPE.WRITE
  ) {
    super(ClientCredentialsGrant.CLIENT_CREDENTIALS, clientId, scope);
    this.clientSecret = clientSecret;
  }

  getParams(): GrantParamsType {
    return {
      ...super.getParams(),
      client_secret: this.clientSecret,
    };
  }
}
