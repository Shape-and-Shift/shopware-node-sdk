// You can import two ways
const {
  Application,
  AdminAuth,
  PasswordGrant,
  ClientCredentialsGrant,
  RefreshTokenGrant,
} = require("../lib");
const { getConfigs } = require("./helper");

const config = getConfigs();

// Init
Application.init({ shopUrl: config.shop_url });

class AuthenticateExample {
  async exampleUsingPasswordGrantType() {
    const grantType = new PasswordGrant(config.username, config.password);
    const authToken = await Application.authenticate(grantType);

    console.log("exampleUsingPasswordGrantType", authToken);
  }

  async exampleUsingClientCredentials() {
    const grantType = new ClientCredentialsGrant(
      config.client_id,
      config.client_secret
    );
    const authToken = await Application.authenticate(grantType);

    console.log("exampleUsingClientCredentials", authToken);
  }

  async exampleUsingRefreshToken() {
    let grantType = new PasswordGrant(config.username, config.password);
    let authToken = await Application.authenticate(grantType);

    // Or you can use this way to get only AuthToken
    grantType = new RefreshTokenGrant(authToken.refreshToken);
    const adminClient = new AdminAuth(grantType);
    authToken = await adminClient.fetchAccessToken();

    // You have to set AuthToken to `Application` to make `Context` work
    await Application.setAuthToken(authToken);

    console.log("exampleUsingRefreshToken", authToken);
  }

  async execute() {
    await this.exampleUsingPasswordGrantType();
    await this.exampleUsingClientCredentials();
    await this.exampleUsingRefreshToken();
  }
}

const run = async () => {
  const example = new AuthenticateExample();
  await example.execute();
};

run();
