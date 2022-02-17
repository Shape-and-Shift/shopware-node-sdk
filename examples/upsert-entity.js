const { Context, RepositoryFactory } = require("../lib");
const { getDemoToken } = require("./helper");

class UpsertEntity {
  async execute() {
    // Auto add token to global Context
    await getDemoToken();

    const repository = RepositoryFactory.create("product_manufacturer");
    const entity = repository.create(Context);
    entity.name = "Test create manufacturer";

    repository
      .save(entity, Context)
      .then((result) => {
        console.log(result, "Success");
      })
      .catch((err) => {
        console.log(err, "err");
      });
  }
}

const run = async () => {
  const example = new UpsertEntity();
  await example.execute();
};

run();
