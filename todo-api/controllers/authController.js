
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { SESSION_COOKIE, getSessionCookieOptions } = require("../auth/session");
const crypto = require("crypto");
const Session = require("../models/session");
const { logSecurityEvent } = require("../utils/securityLog");

if (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET, "utf8") < 32) {
  throw new Error("JWT_SECRET must be set to a random value of at least 32 bytes");
}

const SECRET = process.env.JWT_SECRET;

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (
      !username ||
      !email ||
      !password ||
      typeof username !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        message: "Valid username, email, and password are required"
      });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanUsername || !cleanEmail) {
      return res.status(400).json({
        message: "Username and email cannot be empty"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long"
      });
    }

    if (Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({
        message: "Password must not exceed 72 bytes"
      });
    }

    const existingUser = await User.findOne({ email: cleanEmail });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username: cleanUsername,
      email: cleanEmail,
      password: hashedPassword
    });

    await user.save();
    logSecurityEvent("auth.register.success", req);

    return res.status(201).json({
      message: "User registered successfully"
    });
  } catch (err) {
    if (err.code === 11000) {
      logSecurityEvent("auth.register.duplicate", req);
      return res.status(409).json({
        message: "User already exists"
      });
    }

    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: "Invalid registration details"
      });
    }

    logSecurityEvent("auth.register.error", req, { errorType: err.name });

    return res.status(500).json({
      message: "Server error during registration"
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Valid email and password are required"
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      logSecurityEvent("auth.login.failure", req);
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      logSecurityEvent("auth.login.failure", req, { userId: user._id.toString() });
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    const jti = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await Session.create({ userId: user._id, jti, expiresAt });
    const token = jwt.sign(
      { id: user._id.toString(), jti },
      SECRET,
      { expiresIn: "1h", algorithm: "HS256" }
    );

    res.cookie(SESSION_COOKIE, token, getSessionCookieOptions());
    logSecurityEvent("auth.login.success", req, { userId: user._id.toString() });

    return res.json({
      userId: user._id,
      username: user.username
    });
  } catch (err) {
    logSecurityEvent("auth.login.error", req, { errorType: err.name });
    logSecurityEvent("auth.login.error", req, { errorType: err.name });

    return res.status(500).json({
      message: "Server error during login"
    });
  }
};
