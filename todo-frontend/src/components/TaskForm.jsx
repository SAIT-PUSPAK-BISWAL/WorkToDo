import React, { useState } from "react";
import API from "../services/api";

export default function TaskForm({ onAdd }) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [category, setCategory] = useState("Personal");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError("Please enter a task title.");
      return;
    }

    if (trimmedTitle.length > 200) {
      setError("Task title must be 200 characters or fewer.");
      return;
    }

    let deadline = null;

    if (dueDate) {
      const localDeadline = new Date(
        `${dueDate}T${dueTime || "23:59:59"}`
      );

      if (Number.isNaN(localDeadline.getTime())) {
        setError("Please select a valid deadline.");
        return;
      }

      deadline = localDeadline.toISOString();
    } else if (dueTime) {
      setError("Select a due date before choosing a time.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { data } = await API.post("/tasks", {
        title: trimmedTitle,
        dueDate: deadline,
        priority,
        category,
      });

      onAdd(data);

      setTitle("");
      setDueDate("");
      setDueTime("");
      setPriority("Medium");
      setCategory("Personal");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to create task. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="task-composer" onSubmit={handleSubmit}>
      <input
        type="text"
        className="task-title-input"
        value={title}
        onChange={(event) => {
          setTitle(event.target.value);
          setError("");
        }}
        placeholder="What's on your mind? Add a task..."
        maxLength={200}
        disabled={loading}
        aria-label="New task title"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "task-form-error" : undefined}
      />

      <div className="task-deadline-fields">
        <label className="task-deadline-field">
          <span>Due date</span>
          <input
            type="date"
            value={dueDate}
            onChange={(event) => {
              setDueDate(event.target.value);
              setError("");
            }}
            disabled={loading}
            aria-label="Task due date"
          />
        </label>

        <label className="task-deadline-field">
          <span>Due time (optional)</span>
          <input
            type="time"
            value={dueTime}
            onChange={(event) => {
              setDueTime(event.target.value);
              setError("");
            }}
            disabled={loading}
            aria-label="Task due time"
          />
        </label>
      </div>

      <div className="task-category-priority-fields">
        <label className="task-deadline-field task-priority-field">
          <span>Priority</span>
          <select
            value={priority}
            onChange={(event) => {
              setPriority(event.target.value);
              setError("");
            }}
            disabled={loading}
            aria-label="Task priority"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </label>

        <label className="task-deadline-field task-category-field">
          <span>Category</span>
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setError("");
            }}
            disabled={loading}
            aria-label="Task category"
          >
            <option value="Study">Study</option>
            <option value="Personal">Personal</option>
            <option value="Work">Work</option>
            <option value="Projects">Projects</option>
          </select>
        </label>
      </div>

      <button type="submit" className="btn" disabled={loading}>
        {loading ? "Adding..." : "+ Add task"}
      </button>

      {error && (
        <p id="task-form-error" role="alert" className="task-form-error">
          {error}
        </p>
      )}
    </form>
  );
}