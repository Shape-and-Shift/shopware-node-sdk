import Axios, { AxiosError, AxiosInstance } from 'axios';
import { AuthToken, ContextData } from '../data';
import { types } from './util.service';
import { Exception } from '../exception';
import { RefreshTokenHelper } from '../helper/refresh-token.helper';

/**
 * Initializes the HTTP client with the provided context.
 */
export default function createHTTPClient(context: ContextData): AxiosInstance {
  return createClient(context);
}

/**
 * Creates the HTTP client with the provided context.
 *
 * @returns {AxiosInstance}
 */
const createClient = (context: ContextData): AxiosInstance => {
  const apiEndPoint = context.getApiEndPoint();
  if (types.isEmpty(apiEndPoint)) {
    throw new Exception('Please provide shop-url to context');
  }

  const CancelToken = Axios.CancelToken;
  const source = CancelToken.source();

  const client = Axios.create({
    baseURL: apiEndPoint,
    cancelToken: source.token,
  });

  if (context.isAutoCalRefresh()) {
    refreshTokenInterceptor(client, context);
  }

  return client;
};

/**
 * Sets up an interceptor to refresh the token, cache the requests and retry them after the token got refreshed.
 *
 * @param {AxiosInstance} client
 * @param context
 * @returns {AxiosInstance}
 */
function refreshTokenInterceptor(client: AxiosInstance, context: ContextData): AxiosInstance {
  const tokenHandler = new RefreshTokenHelper(context);

  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      const { config, response } = error;
      if (response && config && config.url) {
        const resource = config.url.replace(config.baseURL || '', '');

        if (tokenHandler.whitelists.includes(resource)) {
          return Promise.reject(error);
        }

        if (response.status === 401) {
          return tokenHandler
            .fireRefreshTokenRequest(error)
            .then((authToken: AuthToken) => {
              // Replace the expired token and retry
              if (config.headers) {
                config.headers.Authorization = `Bearer ${authToken.accessToken}`;
              }
              config.url = resource;
              return Axios(config);
            });
        }
      }

      return Promise.reject(error);
    },
  );

  return client;
}
