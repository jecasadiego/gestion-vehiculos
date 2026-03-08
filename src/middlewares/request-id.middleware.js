const { randomUUID } = require("node:crypto");

const requestIdMiddleware = (req, res, next) => {
  const headerValue = req.headers["x-request-id"];
  const requestId =
    typeof headerValue === "string" && headerValue.trim()
      ? headerValue.trim()
      : randomUUID();

  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
};

module.exports = {
  requestIdMiddleware,
};
