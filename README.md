Shopware Node SDK is a simple SDK implementation of Shopware 6 APIs. It helps to access the API in an object-oriented way.

If you're familiar with Shopware 6 DAL syntax and how to retrieve it you might see this example is predictable and straightforward

![carbon](https://user-images.githubusercontent.com/8193345/154450648-7e7a4a53-788b-432b-afc6-b38897c976d4.png)

### Installation:

```sh
npm install shopware-node-sdk --save
```

### Import:

```js
import { Application } from "shopware-node-sdk";
const options = {
  shopUrl: `YOUR_SHOP_URL`, // https://shop-url.dev
};
Application.init(options); // Init application
```

#### Initial options

| name                  | Type    | Default    | Description                                                |
|-----------------------|---------|------------|------------------------------------------------------------|
| **`shopUrl`**         | String  | (required) | Your shop url                                              |
| **`apiPath`**         | String  | /api       | Shop API path                                              |
| **`autoCallRefresh`** | Boolean | true       | Automatic call refresh token and retry the current request |

## Authentication

#### Supported 3 grant types:

```js
import {
  PasswordGrant,
  ClientCredentialsGrant,
  RefreshTokenGrant,
  GRANT_SCOPE,
} from "shopware-node-sdk";

// Scope parameter is optional, Default: GRANT_SCOPE.WRITE ('write')
const grantType = new PasswordGrant(username, password, [
  GRANT_SCOPE.WRITE,
  GRANT_SCOPE.USER_VERIFIED,
]); // Using username & password

const grantType = new ClientCredentialsGrant(
  clientId,
  clientSecret,
  GRANT_SCOPE.WRITE
); // Using client_id & client_secret

const grantType = new RefreshTokenGrant(refreshToken); // Using refresh_token
```

#### Now, you can do authenticate for the application

```js
import { Application } from "shopware-node-sdk";

const authToken = await Application.authenticate(grantType);
```

#### Or you can do this way to only fetch `AuthToken` object

```js
import { AdminAuth } from "shopware-node-sdk";

const adminClient = new AdminAuth(grantType);
const authToken = await adminClient.fetchAccessToken();

await Application.setAuthToken(authToken); // you have to set `AuthToken` object to `Application`
```

#### Store the authentication token object into the database then you can set it to the `Context` through the `Application`

```js
await Application.setAuthToken(authToken);
```

#### **Notice:** `adminClient.fetchAccessToken()` automatically call `Application.setAuthToken` so you don't need to call it again.

## Working with Criteria and Repositories

```js
import { RepositoryFactory, Criteria } from "shopware-node-sdk";
const repository = RepositoryFactory.create("product");

const criteria = new Criteria();
criteria.addAssociation("options.group");

const products = await repository.search(criteria, Context);
```

## Working with Admin API Apis
- Current supported apis:
    - [InfoApi](/src/api/info.api.ts)
    - [UserApi](/src/api/user.api.ts)
    - [StateMachineApi](/src/api/state-machine.api.ts)
    - [SyncApi](/src/api/sync.api.ts)
    - For other services that does not have a concrete class, use: [AdminApi](/src/api/admin.api.ts)

Check [examples/sync-api.js](/examples/sync-api.js) or [examples/user-api.js](/examples/user-api.js) for some references.

## Examples:

Follow those steps to run the example:

1. Run `npm install shopware-node-sdk --save`
2. Update file `/examples/auth-config.json` match with your environment
3. Run examples `node ./examples/authenticate.js`...

You can also check out the examples without any installation on [/examples](./examples)
