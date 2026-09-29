const adminAuth = async (req, res, next) => {
  try {
    if (req.user.role == "admin") {
      next();
    } else {
      throw { name: "Forbidden" };
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = adminAuth;
