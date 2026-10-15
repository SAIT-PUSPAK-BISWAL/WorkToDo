
const crypto = require("crypto");
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

const User = require("../models/user");
const authMiddleware = require("../middleware/authMiddleware");

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

// Upload a profile image for the authenticated user.
router.post(
  "/upload/:id",
  authMiddleware,
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
            console.error(
              "Could not remove previous profile image:",
              err.message
            );
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

      console.error("Upload error:", err.message);

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
          console.error(
            "Could not delete profile image file:",
            err.message
          );
        }
      });
    }

    return res.json({
      message: "Profile image removed successfully",
      image: null,
    });
  } catch (err) {
    console.error("Profile image removal error:", err.message);

    return res.status(500).json({
      message: "Server error while removing profile image",
    });
  }
});

module.exports = router;
