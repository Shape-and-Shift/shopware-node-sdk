const {
  SyncApi,
  SyncPayload,
  SYNC_OPERATOR,
  RepositoryFactory,
  Criteria,
  Context,
} = require("../lib");
const { getDemoToken } = require("./helper");

class SyncApiExample {
  async execute() {
    // Auto add token to global Context
    await getDemoToken();
    const syncApi = new SyncApi();
    const payload = new SyncPayload();

    const productRepository = RepositoryFactory.create("product");
    const productId = await productRepository
      .searchIds(new Criteria(), Context)
      .then((resp) => resp.data);

    const firstProductId = productId[0];
    const secondProductId = productId[1];

    payload.setOperator("product", SYNC_OPERATOR.UPSERT, [
      {
        id: firstProductId,
        name: "First update",
        stock: 3,
      },
    ]);

    payload.setOperator("product", SYNC_OPERATOR.UPSERT, [
      {
        id: secondProductId,
        name: "Second update",
        stock: 5,
      },
    ]);

    const data = await syncApi.sync(payload);
    console.log(data, "Sync success");
  }
}

const run = async () => {
  const example = new SyncApiExample();
  await example.execute();
};

run();
