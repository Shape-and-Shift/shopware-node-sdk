export type GrantParamsType = {
  grant_type: string,
  client_id: string,
  scope: GRANT_SCOPE[] | GRANT_SCOPE,
  client_secret?: string,
  username?: string,
  password?: string,
  refresh_token?: string,
};

export enum GRANT_SCOPE {
  USER_VERIFIED = 'user-verified',
  ADMIN = 'admin',
  WRITE = 'write',
}

export abstract class GrantType {
  protected static ADMINISTRATION_CLIENT_ID = 'administration';

  public static CLIENT_CREDENTIALS = 'client_credentials';

  public static PASSWORD = 'password';

  public static REFRESH_TOKEN = 'refresh_token';

  private static ALLOWED_GRANTS: string[] = [
    'refresh_token',
    'password',
    'client_credentials',
  ];

  protected grantType: string;

  protected clientId: string;

  protected scope: GRANT_SCOPE[] | GRANT_SCOPE;

  protected constructor(
    grantType: string,
    clientId: string,
    scope: GRANT_SCOPE[] | GRANT_SCOPE
  ) {
    if (!GrantType.ALLOWED_GRANTS.includes(grantType)) {
      throw new Error(`Grant type ${grantType} is not supported`);
    }

    this.grantType = grantType;
    this.clientId = clientId;
    this.scope = scope;
  }

  getParams(): GrantParamsType {
    return {
      grant_type: this.grantType,
      client_id: this.clientId,
      scope: this.scope,
    };
  }
}
