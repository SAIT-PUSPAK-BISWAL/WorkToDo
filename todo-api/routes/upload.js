
const crypto = require("crypto");
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const { rateLimit } = require("express-rate-limit");

const User = require("../models/user");
const authMiddleware = require("../middleware/authMiddleware");
const { logSecurityEvent } = require("../utils/securityLog");

const router = express.Router();

// Absolute uploads directory.
const uploadDir = path.join(__dirname, "..", "uploads");

fs.mkdirSync(uploadDir, { recursive: true });

// Accept only JPEG, PNG, and WebP images.
const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const extensionMap = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
    };

    const extension = extensionMap[file.mimetype];

    if (!extension) {
      return cb(
        new Error("Only JPEG, PNG, and WebP images are allowed")
      );
    }

    cb(null, `${crypto.randomUUID()}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(
        new Error("Only JPEG, PNG, and WebP images are allowed")
      );
    }

    cb(null, true);
  },
});

const profileUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many profile image uploads. Please try again later." },
  handler: (req, res) => {
    logSecurityEvent("profile.upload.rate_limited", req, { userId: req.user?.id });
    res.status(429).json({ message: "Too many profile image uploads. Please try again later." });
  },
});

const validateUploadOwner = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      message: "Invalid user ID",
    });
  }

  if (req.params.id !== req.user.id) {
    return res.status(403).json({
      message: "You cannot change another user's profile image",
    });
  }

  return next();
};

const hasValidImageSignature = (mimeType, buffer) => {
  if (mimeType === "image/jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (mimeType === "image/png") {
    return buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    );
  }

  if (mimeType === "image/webp") {
    return (
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP"
    );
  }

  return false;
};

const validateImageContent = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      message: "No file uploaded",
    });
  }

  try {
    const image = await fs.promises.readFile(req.file.path);

    if (!hasValidImageSignature(req.file.mimetype, image)) {
      await fs.promises.unlink(req.file.path);
      return res.status(400).json({
        message: "The uploaded file is not a valid JPEG, PNG, or WebP image",
      });
    }

    return next();
  } catch (err) {
    await fs.promises.unlink(req.file.path).catch(() => {});
    logSecurityEvent("profile.image.verify_error", req, { errorType: err.name, userId: req.user.id });
    return res.status(500).json({
      message: "Could not verify the uploaded image",
    });
  }
};

// Upload a profile image for the authenticated user.
router.post(
  "/upload/:id",
  authMiddleware,
  validateUploadOwner,
  profileUploadLimiter,
  (req, res, next) => {
    upload.single("image")(req, res, (err) => {
      if (!err) {
        return next();
      }

      if (
        err instanceof multer.MulterError &&
        err.code === "LIMIT_FILE_SIZE"
      ) {
        return res.status(413).json({
          message: "Image must be 2 MB or smaller",
        });
      }

      return res.status(400).json({
        message: err.message || "Invalid image upload",
      });
    });
  },
  validateImageContent,
  async (req, res) => {
    let uploadedPath;

    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          message: "Invalid user ID",
        });
      }

      if (req.params.id !== req.user.id) {
        return res.status(403).json({
          message: "You cannot change another user's profile image",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          message: "No file uploaded",
        });
      }

      uploadedPath = req.file.path;

      const user = await User.findById(req.user.id);

      if (!user) {
        fs.unlink(uploadedPath, () => {});
        return res.status(404).json({
          message: "User not found",
        });
      }

      // Remember the previous image so it can be removed.
      const previousImage = user.image;

      user.image = `/uploads/${req.file.filename}`;
      await user.save();

      // Remove the previous uploaded file, if there was one.
      if (
        previousImage &&
        previousImage.startsWith("/uploads/") &&
        path.basename(previousImage) === previousImage.slice(9)
      ) {
        const previousPath = path.join(
          uploadDir,
          path.basename(previousImage)
        );

        fs.unlink(previousPath, (err) => {
          if (err && err.code !== "ENOENT") {
            logSecurityEvent("profile.image.cleanup_error", req, { errorType: err.name, userId: req.user.id });
          }
        });
      }

      return res.json({
        message: "Image uploaded successfully",
        imageUrl: user.image,
      });
    } catch (err) {
      if (uploadedPath) {
        fs.unlink(uploadedPath, () => {});
      }

      logSecurityEvent("profile.upload.error", req, { errorType: err.name, userId: req.user.id });

      return res.status(500).json({
        message: "Server error while uploading image",
      });
    }
  }
);

// Remove the authenticated user's profile image.
router.delete("/upload/:id", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    if (req.params.id !== req.user.id) {
      return res.status(403).json({
        message: "You cannot change another user's profile image",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const previousImage = user.image;

    // Clear the image reference in MongoDB.
    user.image = null;
    await user.save();

    // Delete only files inside the uploads directory.
    if (
      previousImage &&
      previousImage.startsWith("/uploads/") &&
      path.basename(previousImage) === previousImage.slice(9)
    ) {
      const imagePath = path.join(
        uploadDir,
        path.basename(previousImage)
      );

      fs.unlink(imagePath, (err) => {
        if (err && err.code !== "ENOENT") {
          logSecurityEvent("profile.image.cleanup_error", req, { errorType: err.name, userId: req.user.id });
        }
      });
    }

    return res.json({
      message: "Profile image removed successfully",
      image: null,
    });
  } catch (err) {
    logSecurityEvent("profile.image.remove_error", req, { errorType: err.name, userId: req.user.id });

    return res.status(500).json({
      message: "Server error while removing profile image",
    });
  }
});

module.exports = router;
