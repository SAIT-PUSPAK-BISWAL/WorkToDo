import React from "react";
import TaskForm from "../TaskForm";
import TaskList from "../TaskList";

export default function TaskBoard({
  displayedTasks, unscheduledTasks, loading, loadError, onAddTask,
  taskListProps, plannerView, setPlannerView, search, selectedDateLabel, isTodaySelected,
}) {
  return (
    <section id="task-board" className="task-workspace">
      <div id="task-composer" className="composer-wrap">
        <div className="composer-decoration" aria-hidden="true">✧</div>
        <TaskForm onAdd={onAddTask} />
      </div>
      <div className="task-board-heading">
        <div>
          <h2>{plannerView === "all" ? "All your tasks" : "Your notes"}</h2>
          <p className="dashboard-subtitle">
            {plannerView === "all" ? `${displayedTasks.length} tasks in your workspace` :
              isTodaySelected ? "A little progress goes a long way." : `Tasks for ${selectedDateLabel}`}
          </p>
        </div>
        <span className="task-count-pill">{displayedTasks.length} {displayedTasks.length === 1 ? "task" : "tasks"}</span>
      </div>
      {loading ? (
        <div className="empty-state"><h3>Gathering your notes...</h3><p>Your tasks will appear here shortly.</p></div>
      ) : loadError ? (
        <div className="empty-state"><h3>Something went wrong</h3><p>{loadError}</p>
          <button type="button" className="btn" onClick={() => window.location.reload()}>Try again</button>
        </div>
      ) : (
        <>
          {displayedTasks.length > 0 ? <TaskList {...taskListProps} tasks={displayedTasks} /> : (
            <div className="empty-state">
              <span className="empty-state-doodle" aria-hidden="true">✿</span>
              <h3>{search ? "No matching notes" : plannerView === "all" ? "Your board is ready" : "Nothing scheduled for this day"}</h3>
              <p>{search ? "Try another search term or filter." : plannerView === "all"
                ? "Add your first task above and make it happen." : "Choose another date, or add a task with a deadline for this day."}</p>
              {plannerView === "day" && <button type="button" className="btn btn-secondary" onClick={() => setPlannerView("all")}>Show all tasks</button>}
            </div>
          )}
          {plannerView === "day" && unscheduledTasks.length > 0 && (
            <div className="unscheduled-section">
              <div className="section-heading"><h3>Unscheduled tasks</h3><span className="task-count-pill">{unscheduledTasks.length}</span></div>
              <TaskList {...taskListProps} tasks={unscheduledTasks} />
            </div>
          )}
        </>
      )}
    </section>
  );
}
