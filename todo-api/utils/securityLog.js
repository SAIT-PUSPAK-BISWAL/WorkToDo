const crypto = require("crypto");

const logSecurityEvent = (event, req, details = {}) => {
  const record = {
    timestamp: new Date().toISOString(),
    level: /failure|invalid|rejected|rate_limited|error|revoked|lookup_failed/i.test(event) ? "warn" : "info",
    event,
    requestId: req?.requestId,
    method: req?.method,
    path: req?.originalUrl || req?.path,
    ...details,
  };

  console.info(JSON.stringify(record));
};

const addRequestId = (req, res, next) => {
  req.requestId = crypto.randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
  next();
};

module.exports = { addRequestId, logSecurityEvent };
