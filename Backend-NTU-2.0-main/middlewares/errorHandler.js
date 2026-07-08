function errorHandler(err, req, res, next) {
  let status = err.status;
  let message = err.message;
  switch (err.name) {
    case "Invalid Input":
      status = 400;
      message = "Email/ passwword cannot be empty";
      break;
    case "Invalid User":
      status = 401;
      message = "Error email user not found / password not matched";
      break;
    case "NotFound":
      status = 404;
      message = "Error not found";
      break;
    case "Unauthorized":
      status = 401;
      message = "Error Authentication";
      break;
    case "JsonWebTokenError":
      status = 401;
      message = "Error Authentication";
      break;
    case "Forbidden":
      status = 403;
      message = "Forbidden error authorization";
      break;
    case "SequelizeValidationError":
      status = 400;
      message = err.errors.map((err) => err.message);
      break;
    case "ValidationErrorItem":
      status = 400;
      message = err.errors.map((err) => err.message);
      break;
    case "SequelizeUniqueConstraintError":
      status = 400;
      message = err.errors.map((err) => err.message);
      break;
    case "FileRequired":
      status = 400;
      message = "File is required";
      break;
    default:
      status = 500;
      message = "Internal Server Error";
      break;
  }
  console.log(err.name);
  res.status(status).json({ message });
}

module.exports = errorHandler;
