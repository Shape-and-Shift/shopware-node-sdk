import { Exception } from './exception';

export class AuthorizationException extends Exception {
  public data: any;
  constructor(message?: string, data?: any) {
    super(message);
    this.data = data;
  }
}
