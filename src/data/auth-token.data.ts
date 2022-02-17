export interface AuthToken {
  accessToken: string,
  expiresIn: number,
  tokenType: string,
  refreshToken: string,
}
export const AuthToken: AuthToken = {
  accessToken: '',
  refreshToken: '',
  expiresIn: 600,
  tokenType: 'Bearer',
};
