require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const { addRequestId, logSecurityEvent } = require("./utils/securityLog");

const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const connectDB = require("./config/db");
// Vercel's function filesystem is temporary, so disk-backed uploads are local-only.
const uploadRoutes = process.env.VERCEL ? null : require("./routes/upload");

const app = express();
app.disable("x-powered-by");
const frontendOrigin = new URL(
  process.env.FRONTEND_URL || "http://localhost:5173"
).origin;
const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS || 0);

if (!Number.isInteger(trustProxyHops) || trustProxyHops < 0) {
  throw new Error("TRUST_PROXY_HOPS must be a non-negative integer");
}

app.set("trust proxy", trustProxyHops);
app.use(addRequestId);
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});
app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

// SameSite cookies reduce cross-site requests; this also blocks requests from
// other local or same-site origins when browsers include an Origin header.
app.use((req, res, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    const origin = req.get("origin");
    if (origin && origin !== frontendOrigin) {
      logSecurityEvent("http.origin.rejected", req);
      return res.status(403).json({ message: "Request origin is not allowed" });
    }
  }

  return next();
});

if (!process.env.VERCEL) {
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));
}
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});
app.use("/auth", authRoutes);
app.use("/tasks", taskRoutes);
if (uploadRoutes) app.use("/", uploadRoutes);

app.use((req, res) => res.status(404).json({ message: "Route not found", requestId: req.requestId }));

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.status === 413 ? 413 : err.status === 400 ? 400 : 500;
  logSecurityEvent("http.request.error", req, { status, errorType: err.name || "Error" });
  return res.status(status).json({
    message: status === 413 ? "Request is too large" : status === 400 ? "Invalid request" : "Internal server error",
    requestId: req.requestId,
  });
});

module.exports = app;
