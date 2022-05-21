import { AxiosInstance, AxiosRequestConfig } from 'axios';
import createHTTPClient from '../service/http.service';
import { Context, ContextData } from '../data';

export abstract class ApiService {
  protected readonly context: ContextData;
  protected httpClient: AxiosInstance;
  public contentType: string;

  constructor(context?: ContextData | string, contentType?: string) {
    if (typeof context === 'string') {
      contentType = context;
      context = Context;
    }

    this.context = context ?? Context;
    this.httpClient = createHTTPClient(this.context);
    this.contentType = contentType ?? 'application/vnd.api+json';
  }

  protected serializeUrl(
    dataUrl: Record<string, string | number | boolean | null>,
  ): string {
    const str = [];
    for (const p in dataUrl) {
      if (dataUrl.hasOwnProperty(p)) {
        const dataStr = dataUrl[p];
        if (dataStr) {
          str.push(encodeURIComponent(p) + '=' + encodeURIComponent(dataStr));
        }
      }
    }
    return str.join('&');
  }

  protected getBasicHeaders(
    additionalHeaders?: object,
  ): Record<string, string> {
    const basicHeaders: Record<string, string> = {
      Accept: this.contentType,
      'Content-Type': 'application/json',
    };

    return { ...basicHeaders, ...additionalHeaders };
  }

  public get<T = any, D = any>(
    url: string,
    config?: AxiosRequestConfig<D>,
  ): Promise<T> {
    return this.httpClient
      .get(url, {
        headers: this.getBasicHeaders(),
        ...config,
      })
      .then((resp) => resp.data);
  }

  public post<T = any, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>,
  ): Promise<T> {
    return this.httpClient
      .post(url, data, {
        headers: this.getBasicHeaders(),
        ...config,
      })
      .then((resp) => resp.data);
  }

  public patch<T = any, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>,
  ): Promise<T> {
    return this.httpClient
      .patch(url, data, {
        headers: this.getBasicHeaders(),
        ...config,
      })
      .then((resp) => resp.data);
  }

  public delete<T = any, D = any>(
    url: string,
    config?: AxiosRequestConfig<D>,
  ): Promise<T> {
    return this.httpClient
      .delete(url, {
        headers: this.getBasicHeaders(),
        ...config,
      })
      .then((resp) => resp.data);
  }
}
