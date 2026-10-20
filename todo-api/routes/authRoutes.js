
const express = require("express");
const router = express.Router();
const { rateLimit } = require("express-rate-limit");

const authController = require("../controllers/authController");
const User = require("../models/user");
const authMiddleware = require("../middleware/authMiddleware");
const { SESSION_COOKIE, getSessionCookieOptions } = require("../auth/session");
const Session = require("../models/session");
const { logSecurityEvent } = require("../utils/securityLog");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again later." },
  handler: (req, res) => {
    logSecurityEvent("auth.login.rate_limited", req);
    res.status(429).json({ message: "Too many login attempts. Please try again later." });
  },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many registration attempts. Please try again later." },
  handler: (req, res) => {
    logSecurityEvent("auth.register.rate_limited", req);
    res.status(429).json({ message: "Too many registration attempts. Please try again later." });
  },
});

// Register
router.post("/register", registerLimiter, authController.register);

// Login
router.post("/login", loginLimiter, authController.login);

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("_id username image");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (err) {
    logSecurityEvent("auth.session.retrieve_error", req, { errorType: err.name, userId: req.user.id });
    return res.status(500).json({ message: "Could not verify your session" });
  }
});

router.post("/logout", authMiddleware, async (req, res) => {
  await Session.updateOne(
    { jti: req.user.sessionId, userId: req.user.id, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
  const cookieOptions = { ...getSessionCookieOptions() };
  delete cookieOptions.maxAge;
  res.clearCookie(SESSION_COOKIE, cookieOptions);
  logSecurityEvent("auth.logout.success", req, { userId: req.user.id });
  return res.json({ message: "Signed out" });
});

// Get authenticated user's profile
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    // Users can access only their own profile
    if (req.params.id !== req.user.id) {
      return res.status(403).json({
        message: "You are not authorized to view this profile"
      });
    }

    // Return only fields needed by the frontend
    const user = await User.findById(req.user.id)
      .select("_id username email image");

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    return res.json(user);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({
        message: "Invalid user ID"
      });
    }

    logSecurityEvent("auth.profile.retrieve_error", req, { errorType: err.name, userId: req.user.id });

    return res.status(500).json({
      message: "Server error while retrieving profile"
    });
  }
});

module.exports = router;
