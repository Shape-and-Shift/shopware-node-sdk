import { AuthToken } from './auth-token.data';
import { Defaults } from '../constants';

export class ContextData {
  constructor(
    private _apiEndPoint: string = '',
    private _apiResourcePath: string = '',
    private _authToken: AuthToken | null = null,
    private _languageId: string = Defaults.systemLanguageId,
    private _currencyId: string = Defaults.currencyId,
    private _versionId: string = Defaults.versionId,
    private _compatibility: boolean = true,
    private _inheritance: boolean = true,
    private _autoCallRefresh: boolean = true,
  ) {}

  getApiEndPoint(): string {
    return this._apiEndPoint;
  }

  setApiEndPoint(value: string, apiPath: string): void {
    this._apiEndPoint = new URL(apiPath, value).href;
  }

  getApiResourcePath(): string {
    return this._apiResourcePath;
  }

  setApiResourcePath(value: string, apiPath: string): void {
    this._apiResourcePath = new URL(apiPath, value).href;
  }

  getAuthToken(): AuthToken | null {
    return this._authToken;
  }

  setAuthToken(value: AuthToken | null): void {
    this._authToken = value;
  }

  getLanguageId(): string {
    return this._languageId;
  }

  setLanguageId(value: string): void {
    this._languageId = value;
  }

  getCurrencyId(): string {
    return this._currencyId;
  }

  setCurrencyId(value: string): void {
    this._currencyId = value;
  }

  getVersionId(): string {
    return this._versionId;
  }

  setVersionId(value: string): void {
    this._versionId = value;
  }

  getCompatibility(): boolean {
    return this._compatibility;
  }

  setCompatibility(value: boolean): void {
    this._compatibility = value;
  }

  getInheritance(): boolean {
    return this._inheritance;
  }

  setInheritance(value: boolean): void {
    this._inheritance = value;
  }

  isAutoCalRefresh(): boolean {
    return this._autoCallRefresh;
  }

  setAutoCallRefresh(value: boolean): void {
    this._autoCallRefresh = value;
  }
}

export const Context = new ContextData();
