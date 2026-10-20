
const jwt = require("jsonwebtoken");
const { SESSION_COOKIE } = require("../auth/session");
const Session = require("../models/session");
const { logSecurityEvent } = require("../utils/securityLog");

if (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET, "utf8") < 32) {
  throw new Error("JWT_SECRET must be set to a random value of at least 32 bytes");
}

const SECRET = process.env.JWT_SECRET;

const authMiddleware = async (req, res, next) => {
  const token = req.cookies?.[SESSION_COOKIE];

  if (!token) {
    return res.status(401).json({
      message: "No token provided"
    });
  }

  try {
    const decoded = jwt.verify(token, SECRET, { algorithms: ["HS256"] });

    if (!decoded || typeof decoded.id !== "string" || typeof decoded.jti !== "string") {
      logSecurityEvent("auth.session.invalid", req);
      return res.status(401).json({
        message: "Invalid token"
      });
    }

    const session = await Session.findOne({
      userId: decoded.id,
      jti: decoded.jti,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    }).select("_id");

    if (!session) {
      logSecurityEvent("auth.session.revoked_or_expired", req, { userId: decoded.id });
      return res.status(401).json({ message: "Session expired. Please sign in again." });
    }

    req.user = { id: decoded.id, sessionId: decoded.jti };

    return next();
  } catch (err) {
    if (!["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(err.name)) {
      logSecurityEvent("auth.session.lookup_failed", req, { errorType: err.name });
      return res.status(503).json({ message: "Session verification is temporarily unavailable" });
    }
    logSecurityEvent("auth.session.invalid", req);
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
};

module.exports = authMiddleware;
