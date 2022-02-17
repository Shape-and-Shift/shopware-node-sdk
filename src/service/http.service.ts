import Axios, { AxiosError, AxiosInstance } from 'axios';
import { AuthToken, Context } from '../data';
import { types } from './util.service';
import { Exception } from '../exception';
import { RefreshTokenHelper } from '../helper/refresh-token.helper';

/**
 * Initializes the HTTP client with the provided context.
 */
export default function createHTTPClient(): AxiosInstance {
  return createClient();
}

/**
 * Creates the HTTP client with the provided context.
 *
 * @returns {AxiosInstance}
 */
const createClient = (): AxiosInstance => {
  const apiEndPoint = Context.getApiEndPoint();
  if (types.isEmpty(apiEndPoint)) {
    throw new Exception('Please provide shop-url to context');
  }

  const CancelToken = Axios.CancelToken;
  const source = CancelToken.source();

  const client = Axios.create({
    baseURL: apiEndPoint,
    cancelToken: source.token,
  });

  if (Context.isAutoCalRefresh()) {
    refreshTokenInterceptor(client);
  }

  return client;
};

/**
 * Sets up an interceptor to refresh the token, cache the requests and retry them after the token got refreshed.
 *
 * @param {AxiosInstance} client
 * @returns {AxiosInstance}
 */
function refreshTokenInterceptor(client: AxiosInstance): AxiosInstance {
  const tokenHandler = new RefreshTokenHelper();

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
