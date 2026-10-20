import React from "react";

const STATS = [
  { key: "total", label: "Total tasks", icon: "✓", doodle: "✧" },
  { key: "progress", label: "In progress", icon: "◔", doodle: "♧" },
  { key: "completed", label: "Completed", icon: "✓", doodle: "☆" },
  { key: "due", label: "Due today", icon: "▦", doodle: "☼" },
  { key: "overdue", label: "Overdue", icon: "!", doodle: "!" },
];

export default function TaskStats({ total, active, completed, dueToday, overdue }) {
  const counts = { total, progress: active, completed, due: dueToday, overdue };

  return (
    <section className="dashboard-stats" aria-label="Task statistics">
      {STATS.map(({ key, label, icon, doodle }) => (
        <div className={`stat-card stat-${key}`} key={key}>
          <span className="stat-icon" aria-hidden="true">{icon}</span>
          <div><p className="stat-label">{label}</p><strong className="stat-value">{counts[key]}</strong></div>
          <span className="stat-doodle" aria-hidden="true">{doodle}</span>
        </div>
      ))}
    </section>
  );
}
