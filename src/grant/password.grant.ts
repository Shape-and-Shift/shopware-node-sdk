import { GrantParamsType, GRANT_SCOPE, GrantType } from './grant-type';

export class PasswordGrant extends GrantType {
  protected username: string;
  protected password: string;

  constructor(
    username: string,
    password: string,
    scope: GRANT_SCOPE[] | GRANT_SCOPE = GRANT_SCOPE.WRITE
  ) {
    super(
      PasswordGrant.PASSWORD,
      PasswordGrant.ADMINISTRATION_CLIENT_ID,
      scope
    );
    this.username = username;
    this.password = password;
  }

  getParams(): GrantParamsType {
    return {
      ...super.getParams(),
      password: this.password,
      username: this.username,
    };
  }
}
