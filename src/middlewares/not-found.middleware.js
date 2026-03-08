const { AppError } = require("../utils/errors");

const apiNotFoundMiddleware = (req, res, next) => {
  return next(
    new AppError(
      404,
      "ENDPOINT_NOT_FOUND",
      `No existe ${req.method} ${req.originalUrl}`
    )
  );
};

module.exports = {
  apiNotFoundMiddleware,
};
