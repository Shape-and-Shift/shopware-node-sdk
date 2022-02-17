const { Application, PasswordGrant } = require("../lib");
const authConfig = require("./auth-config.json");

const getConfigs = () => {
  return authConfig;
};

const config = getConfigs();

const getDemoToken = async () => {
  Application.init({ shopUrl: config.shop_url });
  const grantType = new PasswordGrant(
    config.username,
    config.password,
    config.scope
  );
  return Application.authenticate(grantType);
};

module.exports = {
  getConfigs,
  getDemoToken,
};
