const express = require("express");
const UserController = require("../Controllers/UserController");
const authentication = require("../middlewares/authenticate");
const adminAuth = require("../middlewares/authorization");

const router = express.Router();

router.get("/", (req, res) => {
  res.send("Hello World");
});

router.post("/register", authentication, adminAuth, UserController.register);
router.post("/login", UserController.login);

router.use("/data", require("./data"));
router.use("/health", require("./health"));
router.use("/insights", require("./insights"));

module.exports = router;
