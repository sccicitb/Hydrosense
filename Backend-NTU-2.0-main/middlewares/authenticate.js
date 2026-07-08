const { verifyToken } = require("../helper/jwt");
const { User } = require("../models");

const authentication = async (req, res, next) => {
  try {
    let access_token = req.headers.authorization;
    if (!access_token) {
      throw { name: "Unauthorized" };
    }
    let [bearer, token] = access_token.split(" ");
    if (bearer !== "Bearer") {
      throw { name: "Unauthorized" };
    }

    let payload = verifyToken(token);
    let user = await User.findByPk(payload.id);
    if (!user) {
      throw { name: "Unauthorized" };
    }

    req.user = { id: user.id, email: user.email, role: user.role, name: user.name, username: user.username };

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = authentication;
