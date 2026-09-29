const { hashSync, compareSync } = require("bcryptjs");

module.exports = {
  hashPassword: (password) => hashSync(password),
  comparePassword: (inputPassword, passwordDB) => compareSync(inputPassword, passwordDB),
};
