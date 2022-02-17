const { UserApi } = require("../lib");
const { getDemoToken } = require("./helper");

class UserApiExample {
  async execute() {
    // Auto add token to global Context
    await getDemoToken();
    const userService = new UserApi();

    const user = await userService.me();

    await userService.updateMe({
      firstName: "New First Name",
    });

    console.log(user, "User Info");
  }
}

const run = async () => {
  const example = new UserApiExample();
  await example.execute();
};

run();
