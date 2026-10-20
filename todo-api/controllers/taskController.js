
const mongoose = require("mongoose");
const Task = require("../models/task");
const { logSecurityEvent } = require("../utils/securityLog");

const ALLOWED_PRIORITIES = ["Low", "Medium", "High"];
const ALLOWED_CATEGORIES = [
  "Study",
  "Personal",
  "Work",
  "Projects",
];

// Validate an optional deadline.
const isValidDueDate = (value) => {
  if (value === null || value === "") {
    return true;
  }

  return (
    typeof value === "string" &&
    !Number.isNaN(Date.parse(value))
  );
};

// Validate task priority.
const isValidPriority = (value) => {
  return ALLOWED_PRIORITIES.includes(value);
};

// Validate task category.
const isValidCategory = (value) => {
  return ALLOWED_CATEGORIES.includes(value);
};

// Allowed task fields.
const getTaskUpdates = (body) => {
  const updates = {};

  if (Object.prototype.hasOwnProperty.call(body, "title")) {
    updates.title = body.title;
  }

  if (Object.prototype.hasOwnProperty.call(body, "description")) {
    updates.description = body.description;
  }

  if (Object.prototype.hasOwnProperty.call(body, "completed")) {
    updates.completed = body.completed;
  }

  if (Object.prototype.hasOwnProperty.call(body, "dueDate")) {
    updates.dueDate = body.dueDate;
  }

  if (Object.prototype.hasOwnProperty.call(body, "priority")) {
    updates.priority = body.priority;
  }

  if (Object.prototype.hasOwnProperty.call(body, "category")) {
    updates.category = body.category;
  }

  return updates;
};

// Create task.
exports.createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      completed,
      dueDate,
      priority,
      category,
    } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      title.trim().length > 200
    ) {
      return res.status(400).json({
        message:
          "Task title is required and must be at most 200 characters",
      });
    }

    if (
      description !== undefined &&
      typeof description !== "string"
    ) {
      return res.status(400).json({
        message: "Description must be a string",
      });
    }

    if (
      completed !== undefined &&
      typeof completed !== "boolean"
    ) {
      return res.status(400).json({
        message: "Completed must be a boolean",
      });
    }

    if (
      dueDate !== undefined &&
      !isValidDueDate(dueDate)
    ) {
      return res.status(400).json({
        message: "Please provide a valid deadline",
      });
    }

    if (
      priority !== undefined &&
      !isValidPriority(priority)
    ) {
      return res.status(400).json({
        message: "Priority must be Low, Medium, or High",
      });
    }

    if (
      category !== undefined &&
      !isValidCategory(category)
    ) {
      return res.status(400).json({
        message:
          "Category must be Study, Personal, Work, or Projects",
      });
    }

    const task = new Task({
      title: title.trim(),
      description: description === undefined ? "" : description,
      completed: completed === undefined ? false : completed,
      dueDate:
        dueDate === undefined || dueDate === ""
          ? null
          : dueDate,
      priority: priority === undefined ? "Medium" : priority,
      category: category === undefined ? "Personal" : category,
      userId: req.user.id,
    });

    await task.save();

    return res.status(201).json(task);
  } catch (err) {
    if (
      err.name === "ValidationError" ||
      err.name === "CastError"
    ) {
      return res.status(400).json({
        message: "Invalid task data",
      });
    }

    logSecurityEvent("task.create.error", req, { errorType: err.name, userId: req.user.id });

    return res.status(500).json({
      message: "Server error while creating task",
    });
  }
};

// Get tasks belonging to the authenticated user.
exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      userId: req.user.id,
    }).sort({ createdAt: -1 });

    return res.json(tasks);
  } catch (err) {
    logSecurityEvent("task.list.error", req, { errorType: err.name, userId: req.user.id });

    return res.status(500).json({
      message: "Server error while retrieving tasks",
    });
  }
};

// Update a task belonging to the authenticated user.
exports.updateTask = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid task ID",
      });
    }

    const updates = getTaskUpdates(req.body);

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "No valid task fields provided",
      });
    }

    if (
      Object.prototype.hasOwnProperty.call(updates, "title") &&
      (
        typeof updates.title !== "string" ||
        !updates.title.trim() ||
        updates.title.trim().length > 200
      )
    ) {
      return res.status(400).json({
        message: "Task title must be between 1 and 200 characters",
      });
    }

    if (typeof updates.title === "string") {
      updates.title = updates.title.trim();
    }

    if (
      Object.prototype.hasOwnProperty.call(updates, "description") &&
      typeof updates.description !== "string"
    ) {
      return res.status(400).json({
        message: "Description must be a string",
      });
    }

    if (
      Object.prototype.hasOwnProperty.call(updates, "completed") &&
      typeof updates.completed !== "boolean"
    ) {
      return res.status(400).json({
        message: "Completed must be a boolean",
      });
    }

    if (
      Object.prototype.hasOwnProperty.call(updates, "priority") &&
      !isValidPriority(updates.priority)
    ) {
      return res.status(400).json({
        message: "Priority must be Low, Medium, or High",
      });
    }

    if (
      Object.prototype.hasOwnProperty.call(updates, "category") &&
      !isValidCategory(updates.category)
    ) {
      return res.status(400).json({
        message:
          "Category must be Study, Personal, Work, or Projects",
      });
    }

    if (
      Object.prototype.hasOwnProperty.call(updates, "dueDate")
    ) {
      if (!isValidDueDate(updates.dueDate)) {
        return res.status(400).json({
          message: "Please provide a valid deadline",
        });
      }

      if (
        updates.dueDate === null ||
        updates.dueDate === ""
      ) {
        updates.dueDate = null;
      } else {
        updates.dueDate = new Date(updates.dueDate);
      }
    }

    const task = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.id,
      },
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    return res.json(task);
  } catch (err) {
    if (
      err.name === "ValidationError" ||
      err.name === "CastError"
    ) {
      return res.status(400).json({
        message: "Invalid task data",
      });
    }

    logSecurityEvent("task.update.error", req, { errorType: err.name, userId: req.user.id });

    return res.status(500).json({
      message: "Server error while updating task",
    });
  }
};

// Delete a task belonging to the authenticated user.
exports.deleteTask = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid task ID",
      });
    }

    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    return res.json({
      message: "Task deleted",
    });
  } catch (err) {
    logSecurityEvent("task.delete.error", req, { errorType: err.name, userId: req.user.id });

    return res.status(500).json({
      message: "Server error while deleting task",
    });
  }
};
