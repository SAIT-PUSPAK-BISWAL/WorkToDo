import React, { useState } from "react";
import API from "../services/api";

const CATEGORIES = ["Study", "Personal", "Work", "Projects"];
const PRIORITIES = ["Low", "Medium", "High"];

const getCategory = (task) =>
  CATEGORIES.includes(task.category) ? task.category : "Personal";

const getDeadlineDate = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

const getDeadlineTime = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  if (
    date.getHours() === 23 &&
    date.getMinutes() === 59 &&
    date.getSeconds() === 59
  ) {
    return "";
  }

  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
};

const isDateOnlyDeadline = (value) => {
  if (!value) return false;

  const date = new Date(value);

  return (
    !Number.isNaN(date.getTime()) &&
    date.getHours() === 23 &&
    date.getMinutes() === 59 &&
    date.getSeconds() === 59
  );
};

const formatDeadline = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid deadline";

  const dateText = date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (isDateOnlyDeadline(value)) return dateText;

  const timeText = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${dateText} at ${timeText}`;
};

const getDateAfterDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

export default function TaskList({
  tasks,
  setTasks,
  font,
  bullet,
  now,
  categoryFilter = "all",
  sortBy = "default",
}) {
  const [deletingTaskId, setDeletingTaskId] = useState(null);
  const [updatingTaskIds, setUpdatingTaskIds] = useState([]);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editError, setEditError] = useState("");

  const currentTime = now ? new Date(now) : new Date();
  const currentTimestamp = currentTime.getTime();

  const isUpdating = (id) => updatingTaskIds.includes(id);
  const isBusy = (id) => deletingTaskId === id || isUpdating(id);

  const beginUpdate = (id) => {
    setUpdatingTaskIds((ids) =>
      ids.includes(id) ? ids : [...ids, id]
    );
  };

  const finishUpdate = (id) => {
    setUpdatingTaskIds((ids) => ids.filter((item) => item !== id));
  };

  const filteredTasks =
    categoryFilter === "all"
      ? tasks
      : tasks.filter((task) => getCategory(task) === categoryFilter);

  const getDeadlineTimestamp = (task) => {
    if (!task.dueDate) return null;

    const timestamp = new Date(task.dueDate).getTime();
    return Number.isNaN(timestamp) ? null : timestamp;
  };

  const isOverdue = (task) => {
    const deadline = getDeadlineTimestamp(task);

    return (
      !task.completed &&
      deadline !== null &&
      deadline < currentTimestamp
    );
  };

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === "priority") {
      const priorityOrder = { High: 3, Medium: 2, Low: 1 };

      return (
        (priorityOrder[b.priority] || 2) -
        (priorityOrder[a.priority] || 2)
      );
    }

    if (sortBy === "deadline") {
      const deadlineA = getDeadlineTimestamp(a);
      const deadlineB = getDeadlineTimestamp(b);

      if (deadlineA === null && deadlineB === null) return 0;
      if (deadlineA === null) return 1;
      if (deadlineB === null) return -1;

      return deadlineA - deadlineB;
    }

    if (sortBy === "overdue") {
      return Number(isOverdue(b)) - Number(isOverdue(a));
    }

    return 0;
  });

  const updateTask = async (task, updates, errorMessage) => {
    if (isBusy(task._id) || editingTaskId === task._id) return;

    beginUpdate(task._id);

    try {
      const { data } = await API.put(`/tasks/${task._id}`, updates);

      setTasks((currentTasks) =>
        currentTasks.map((item) =>
          item._id === task._id ? data : item
        )
      );

      return true;
    } catch (err) {
      console.error(
        `${errorMessage}:`,
        err.response?.data || err.message
      );

      alert(err.response?.data?.message || errorMessage);
      return false;
    } finally {
      finishUpdate(task._id);
    }
  };

  const toggleTask = async (task) => {
    if (isBusy(task._id) || editingTaskId === task._id) return;

    await updateTask(
      task,
      { completed: !task.completed },
      "Failed to update task. Please try again."
    );
  };

  const changePriority = async (task, priority) => {
    if (
      !PRIORITIES.includes(priority) ||
      priority === (task.priority || "Medium")
    ) {
      return;
    }

    await updateTask(
      task,
      { priority },
      "Failed to update priority. Please try again."
    );
  };

  const changeCategory = async (task, category) => {
    if (
      !CATEGORIES.includes(category) ||
      category === getCategory(task)
    ) {
      return;
    }

    await updateTask(
      task,
      { category },
      "Failed to update category. Please try again."
    );
  };

  const deleteTask = async (id) => {
    if (
      deletingTaskId !== null ||
      isUpdating(id) ||
      editingTaskId === id
    ) {
      return;
    }

    setDeletingTaskId(id);

    try {
      await API.delete(`/tasks/${id}`);

      setTasks((currentTasks) =>
        currentTasks.filter((task) => task._id !== id)
      );
    } catch (err) {
      console.error("Delete failed:", err.response?.data || err.message);

      alert(
        err.response?.data?.message ||
          "Failed to delete task. Please try again."
      );
    } finally {
      setDeletingTaskId(null);
    }
  };

  const startEditingDeadline = (task) => {
    setEditingTaskId(task._id);
    setEditDate(getDeadlineDate(task.dueDate));
    setEditTime(getDeadlineTime(task.dueDate));
    setEditError("");
  };

  const chooseQuickDate = (days) => {
    setEditDate(getDateAfterDays(days));
    setEditTime("");
    setEditError("");
  };

  const saveDeadline = async (task) => {
    if (isBusy(task._id)) return;

    if (!editDate && editTime) {
      setEditError("Choose a due date before choosing a time.");
      return;
    }

    let deadline = null;

    if (editDate) {
      const localDeadline = new Date(
        `${editDate}T${editTime || "23:59:59"}`
      );

      if (Number.isNaN(localDeadline.getTime())) {
        setEditError("Please choose a valid deadline.");
        return;
      }

      deadline = localDeadline.toISOString();
    }

    beginUpdate(task._id);
    setEditError("");

    try {
      const { data } = await API.put(`/tasks/${task._id}`, {
        dueDate: deadline,
      });

      setTasks((currentTasks) =>
        currentTasks.map((item) =>
          item._id === task._id ? data : item
        )
      );

      setEditingTaskId(null);
      setEditDate("");
      setEditTime("");
    } catch (err) {
      setEditError(
        err.response?.data?.message ||
          "Failed to update deadline. Please try again."
      );
    } finally {
      finishUpdate(task._id);
    }
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
    setEditDate("");
    setEditTime("");
    setEditError("");
  };

  if (tasks.length === 0) return null;

  return (
    <>
      {sortedTasks.length === 0 ? (
        <p className="task-empty-category">
          No tasks in this category. Choose another category or add a task.
        </p>
      ) : (
        <div className="task-grid">
          {sortedTasks.map((task) => {
            const category = getCategory(task);
            const priority = PRIORITIES.includes(task.priority)
              ? task.priority
              : "Medium";

            const deleting = deletingTaskId === task._id;
            const updating = isUpdating(task._id);
            const editing = editingTaskId === task._id;
            const busy = deleting || updating;

            const deadline = task.dueDate
              ? new Date(task.dueDate)
              : null;

            const hasValidDeadline =
              deadline && !Number.isNaN(deadline.getTime());

            const overdue =
              !task.completed &&
              hasValidDeadline &&
              deadline.getTime() < currentTimestamp;

            const dueToday =
              !task.completed &&
              hasValidDeadline &&
              deadline.getFullYear() === currentTime.getFullYear() &&
              deadline.getMonth() === currentTime.getMonth() &&
              deadline.getDate() === currentTime.getDate();

            return (
              <article
                key={task._id}
                className={`task-card ${task.completed ? "completed" : ""} ${
                  overdue ? "overdue" : ""
                } ${deleting ? "removing" : ""}`}
                style={{ fontFamily: font }}
              >
                <div className="task-card-main">
                  <input
                    type="checkbox"
                    className="task-checkbox"
                    checked={Boolean(task.completed)}
                    onChange={() => toggleTask(task)}
                    disabled={busy || editing}
                    aria-label={`Mark ${task.title} ${
                      task.completed ? "active" : "completed"
                    }`}
                  />

                  <p className="task-title">
                    <span aria-hidden="true">{bullet} </span>
                    {task.title}
                  </p>
                </div>

                <div className="task-category-priority-row">
                  <div className="task-category-control">
                    <label htmlFor={`category-${task._id}`}>
                      Category
                    </label>

                    <select
                      id={`category-${task._id}`}
                      className={`task-category-select category-${category.toLowerCase()}`}
                      value={category}
                      onChange={(event) =>
                        changeCategory(task, event.target.value)
                      }
                      disabled={busy || editing}
                      aria-label={`Category for ${task.title}`}
                    >
                      {CATEGORIES.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="task-priority-display">
                    <label
                      className="priority-label"
                      htmlFor={`priority-${task._id}`}
                    >
                      Priority
                    </label>

                    <select
                      id={`priority-${task._id}`}
                      className={`priority-select priority-${priority.toLowerCase()}`}
                      value={priority}
                      onChange={(event) =>
                        changePriority(task, event.target.value)
                      }
                      disabled={busy || editing}
                      aria-label={`Priority for ${task.title}`}
                    >
                      {PRIORITIES.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="task-deadline-display">
                  {hasValidDeadline ? (
                    <>
                      <span className="deadline-label">Deadline</span>
                      <span className="deadline-value">
                        {formatDeadline(task.dueDate)}
                      </span>

                      {!task.completed && overdue && (
                        <span className="deadline-status overdue-label">
                          Overdue
                        </span>
                      )}

                      {!task.completed && !overdue && dueToday && (
                        <span className="deadline-status due-today-label">
                          Due today
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="deadline-no-date">
                      No deadline set
                    </span>
                  )}
                </div>

                {editing && (
                  <div className="deadline-editor">
                    <strong>When do you want to finish?</strong>

                    <div className="deadline-quick-options">
                      <button
                        type="button"
                        onClick={() => chooseQuickDate(0)}
                        disabled={busy}
                      >
                        Today
                      </button>

                      <button
                        type="button"
                        onClick={() => chooseQuickDate(1)}
                        disabled={busy}
                      >
                        Next day
                      </button>

                      <button
                        type="button"
                        onClick={() => chooseQuickDate(7)}
                        disabled={busy}
                      >
                        Next week
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditDate("");
                          setEditTime("");
                          setEditError("");
                        }}
                        disabled={busy}
                      >
                        Clear date
                      </button>
                    </div>

                    <label>
                      <span>Custom date</span>
                      <input
                        type="date"
                        value={editDate}
                        onChange={(event) => {
                          setEditDate(event.target.value);
                          setEditError("");
                        }}
                        disabled={busy}
                      />
                    </label>

                    <label>
                      <span>Due time (optional)</span>
                      <input
                        type="time"
                        value={editTime}
                        onChange={(event) => {
                          setEditTime(event.target.value);
                          setEditError("");
                        }}
                        disabled={busy || !editDate}
                      />
                    </label>

                    {editError && (
                      <p className="task-form-error" role="alert">
                        {editError}
                      </p>
                    )}

                    <div className="deadline-edit-actions">
                      <button
                        type="button"
                        onClick={() => saveDeadline(task)}
                        disabled={busy}
                      >
                        {updating ? "Saving..." : "Save deadline"}
                      </button>

                      <button
                        type="button"
                        onClick={cancelEditing}
                        disabled={busy}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="task-card-footer">
                  <span className="task-status">
                    {updating
                      ? "Saving..."
                      : task.completed
                        ? "✓ Completed"
                        : overdue
                          ? "⚠ Overdue"
                          : "○ In progress"}
                  </span>

                  <div className="task-actions">
                    {!editing && (
                      <button
                        type="button"
                        onClick={() => startEditingDeadline(task)}
                        disabled={busy}
                        aria-label={`Edit deadline for ${task.title}`}
                      >
                        Edit deadline
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleTask(task)}
                      disabled={busy || editing}
                      aria-label={`Toggle ${task.title}`}
                    >
                      {task.completed ? "Undo" : "Complete"}
                    </button>

                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => deleteTask(task._id)}
                      disabled={
                        busy || deletingTaskId !== null || editing
                      }
                      aria-label={`Delete ${task.title}`}
                    >
                      {deleting ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}