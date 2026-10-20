import React from "react";

const CATEGORIES = ["Study", "Personal", "Work", "Projects"];
const FILTERS = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
  { label: "Due today", value: "dueToday" },
  { label: "Overdue", value: "overdue" },
];

export default function TaskToolbar({
  search, setSearch, filter, setFilter, categoryFilter, setCategoryFilter,
  sortBy, setSortBy, showFilters, setShowFilters, dueTodayCount, overdueCount,
}) {
  return (
    <div className="task-toolbar">
      <div className="task-search-controls">
        <label className="dashboard-search">
          <span aria-hidden="true">⌕</span>
          <input type="search" placeholder="Search your tasks..." value={search}
            onChange={(event) => setSearch(event.target.value)} aria-label="Search tasks" />
        </label>
      </div>
      <div className="task-filters" aria-label="Filter tasks">
        {FILTERS.map(({ label, value }) => (
          <button type="button" key={value} className={`filter-button ${filter === value ? "active" : ""}`}
            onClick={() => setFilter(value)} aria-pressed={filter === value}>
            {label}{value === "dueToday" && dueTodayCount > 0 ? ` (${dueTodayCount})` : ""}
            {value === "overdue" && overdueCount > 0 ? ` (${overdueCount})` : ""}
          </button>
        ))}
      </div>
      <div className="toolbar-popover filters-popover">
        <button type="button" className="btn btn-secondary filters-toggle"
          onClick={() => setShowFilters((visible) => !visible)} aria-expanded={showFilters}>
          <svg className="filter-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 4h14l-5.5 6.2v4.3l-3 1.5v-5.8L3 4Z" /></svg>
          Filters <span className={`dropdown-chevron ${showFilters ? "open" : ""}`} aria-hidden="true" />
        </button>
        {showFilters && (
          <div className="toolbar-popover-panel filters-popover-panel">
            <label htmlFor="task-category-filter">Filter by category</label>
            <select id="task-category-filter" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="all">All Categories</option>
              {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
            </select>
            <label htmlFor="task-sort">Sort tasks</label>
            <select id="task-sort" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="default">Default order</option>
              <option value="priority">Priority: High to Low</option>
              <option value="deadline">Deadline: Earliest First</option>
              <option value="overdue">Overdue First</option>
            </select>
            <button type="button" className="filters-close-button" onClick={() => setShowFilters(false)}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}
