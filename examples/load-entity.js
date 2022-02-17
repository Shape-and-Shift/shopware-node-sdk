const { Context, RepositoryFactory, Criteria } = require("../lib");
const { getDemoToken } = require("./helper");

class LoadEntityExample {
  productCriteria() {
    const criteria = new Criteria();
    criteria.addAssociation("options.group");

    return criteria;
  }
  async execute() {
    // Auto add token to global Context
    await getDemoToken();

    const repository = RepositoryFactory.create("product");
    const criteria = this.productCriteria();

    const products = await repository.search(criteria, Context);

    console.log("List", products);
    if (products.length > 0) {
      const productId = products.first().id;
      const product = await repository.get(productId, Context, criteria);
      console.log("Detail", product);
    }
  }
}

const run = async () => {
  const example = new LoadEntityExample();
  await example.execute();
};

run();
