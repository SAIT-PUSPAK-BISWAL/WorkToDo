import React from "react";
import { getTimeGroup } from "../../utils/taskDates";

const GROUPS = [
  { key: "morning", label: "Morning", icon: "☼" },
  { key: "afternoon", label: "Afternoon", icon: "☀" },
  { key: "evening", label: "Evening", icon: "☾" },
];

export default function DailyPlanner({
  dailyTasks, unscheduledCount, selectedDay, selectedDateLabel, isTodaySelected,
  plannerView, setPlannerView, changeDay, goToToday, setSelectedDay, scrollTo,
}) {
  return (
    <aside id="daily-planner" className="daily-planner-panel">
      <div className="planner-heading">
        <div><span className="planner-paperclip" aria-hidden="true">♧</span><h2>Daily Planner <span aria-hidden="true">✿</span></h2></div>
        <div className="planner-view-toggle">
          <button type="button" className={plannerView === "day" ? "selected" : ""} onClick={() => setPlannerView("day")}>Day</button>
          <button type="button" className={plannerView === "all" ? "selected" : ""} onClick={() => setPlannerView("all")}>All</button>
        </div>
      </div>
      <div className="planner-date-buttons">
        <button type="button" onClick={() => changeDay(-1)}>← Previous</button>
        <button type="button" className="today-button" onClick={goToToday}>Today</button>
        <button type="button" onClick={() => changeDay(1)}>Next →</button>
      </div>
      <div className="planner-date-label">
        <span aria-hidden="true">▦</span>
        <strong>{isTodaySelected
          ? `Today, ${new Date().toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}`
          : selectedDateLabel}</strong>
      </div>
      <label className="planner-date-input">
        <span>Choose date</span>
        <input type="date" value={selectedDay} onChange={(event) => {
          if (event.target.value) { setSelectedDay(event.target.value); setPlannerView("day"); }
        }} aria-label="Choose planner date" />
      </label>
      <div className="planner-time-groups">
        {GROUPS.map(({ key, label, icon }) => {
          const count = dailyTasks.filter((task) => getTimeGroup(task) === key).length;
          return (
            <button type="button" className={`planner-time-card ${count ? "has-tasks" : ""}`} key={key}
              onClick={() => { setPlannerView("day"); scrollTo("task-board"); }}>
              <span className="planner-time-icon" aria-hidden="true">{icon}</span>
              <span className="planner-time-copy"><strong>{label}</strong><small>{count} {count === 1 ? "task" : "tasks"}</small></span>
              <span className="planner-time-arrow" aria-hidden="true">›</span>
            </button>
          );
        })}
      </div>
      <div className="planner-encouragement">
        <span aria-hidden="true">♧</span><p>Small steps<br />make big progress!</p><span aria-hidden="true">♧</span>
      </div>
      <div className="planner-unscheduled-count"><span>Unscheduled</span><strong>{unscheduledCount}</strong></div>
    </aside>
  );
}
