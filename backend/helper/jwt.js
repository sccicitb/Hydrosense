const jwt = require("jsonwebtoken");

const getSecret = () => {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV !== "production") return "local-development-secret";
  throw { name: "JsonWebTokenError", message: "JWT_SECRET is not configured" };
};

const createToken = (payload) => {
  let token = jwt.sign(payload, getSecret());
  return token;
};

const verifyToken = (token) => {
  let payload = jwt.verify(token, getSecret());
  return payload;
};

module.exports = { createToken, verifyToken };
