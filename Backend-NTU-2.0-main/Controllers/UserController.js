const { comparePassword } = require("../helper/bycript");
const { createToken } = require("../helper/jwt");
const { User } = require("../models");
const fs = require("fs");
const path = require("path");

const getLocalAdmin = (email, password) => {
  if (process.env.NODE_ENV === "production") return null;

  const adminPath = path.join(__dirname, "..", "data", "admin.json");
  const admins = JSON.parse(fs.readFileSync(adminPath, "utf-8"));

  return admins.find((admin) => admin.email === email && admin.password === password) || null;
};

const createLoginResponse = (user, id = user.id) => {
  return {
    access_token: createToken({
      id,
      email: user.email,
      role: user.role,
      name: user.name,
      username: user.username,
    }),
  };
};

class UsersController {
  static async register(req, res, next) {
    try {
      const { name, username, email, password } = req.body;
      const user = await User.create({ name, username, email, password });
      let data = await User.findOne({ where: { email }, attributes: { exclude: ["password"] } });
      res.status(201).json(data);
    } catch (err) {
      next(err);
    }
  }
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw { name: "Invalid Input" };
      }

      const user = await User.findOne({ where: { email } });
      if (!user) {
        throw { name: "Invalid User" };
      }

      const isValidPassword = comparePassword(password, user.password);
      if (!isValidPassword) {
        throw { name: "Invalid User" };
      }

      res.status(200).json(createLoginResponse(user));
    } catch (err) {
      const { email, password } = req.body || {};
      const localAdmin = email && password ? getLocalAdmin(email, password) : null;

      if (localAdmin) {
        return res.status(200).json(createLoginResponse(localAdmin, "local-admin"));
      }

      next(err);
    }
  }
}

module.exports = UsersController;
