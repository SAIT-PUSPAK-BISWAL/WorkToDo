
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Register from "./components/Register";
import Login from "./components/Login";
import TaskList from "./components/TaskList";
import TaskForm from "./components/TaskForm";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./components/Landing";
import ProfileImageUpload from "./components/ProfileImageUpload";
import API from "./services/api";
import "./App.css";

const CATEGORIES = ["Study", "Personal", "Work", "Projects"];

const toLocalDateKey = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

const getTodayKey = () => toLocalDateKey(new Date());

const shiftDate = (dateKey, amount) => {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return toLocalDateKey(date);
};

const getSavedPlannerDay = () => {
  try {
    const saved = localStorage.getItem("todoAppSelectedDay");

    if (
      saved &&
      /^\d{4}-\d{2}-\d{2}$/.test(saved) &&
      toLocalDateKey(new Date(`${saved}T12:00:00`)) === saved
    ) {
      return saved;
    }
  } catch {
    // Fall back to today when local storage is unavailable.
  }

  return getTodayKey();
};

const hasDeadline = (task) =>
  Boolean(
    task.dueDate &&
      !Number.isNaN(new Date(task.dueDate).getTime())
  );

const isOverdue = (task, now) =>
  !task.completed &&
  hasDeadline(task) &&
  new Date(task.dueDate).getTime() < now.getTime();

const isDueToday = (task, now) =>
  !task.completed &&
  hasDeadline(task) &&
  toLocalDateKey(task.dueDate) === toLocalDateKey(now);

const getTimeGroup = (task) => {
  if (!hasDeadline(task)) return "unscheduled";

  const hour = new Date(task.dueDate).getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
};

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("default");

  const [showFilters, setShowFilters] = useState(false);
  const [showAppearance, setShowAppearance] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const [theme, setTheme] = useState(
    () => localStorage.getItem("todoAppTheme") || "light"
  );
  const [font, setFont] = useState(
    () => localStorage.getItem("todoAppFont") || "Arial"
  );
  const [bullet, setBullet] = useState(
    () => localStorage.getItem("todoAppBullet") || "•"
  );
  const [textSize, setTextSize] = useState(
    () => localStorage.getItem("todoAppTextSize") || "normal"
  );

  const [profileImage, setProfileImage] = useState(null);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [now, setNow] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(getSavedPlannerDay);
  const [plannerView, setPlannerView] = useState(
    () => localStorage.getItem("todoAppPlannerView") === "all" ? "all" : "day"
  );

  const username = localStorage.getItem("username") || "there";
  const userId = localStorage.getItem("userId");
  const isTasksPage = location.pathname === "/tasks";

  useEffect(() => {
    localStorage.setItem("todoAppTheme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("todoAppFont", font);
  }, [font]);

  useEffect(() => {
    localStorage.setItem("todoAppBullet", bullet);
  }, [bullet]);

  useEffect(() => {
    localStorage.setItem("todoAppSelectedDay", selectedDay);
  }, [selectedDay]);

  useEffect(() => {
    localStorage.setItem("todoAppPlannerView", plannerView);
  }, [plannerView]);

  useEffect(() => {
    localStorage.setItem("todoAppTextSize", textSize);
  }, [textSize]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("token") || !isTasksPage) return;

    let cancelled = false;

    const loadTasks = async () => {
      setLoadingTasks(true);
      setLoadError("");

      try {
        const { data } = await API.get("/tasks");
        if (!cancelled) setTasks(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load tasks:", err.message);
          setLoadError("Could not load your tasks. Please try again.");
        }
      } finally {
        if (!cancelled) setLoadingTasks(false);
      }
    };

    const loadProfile = async () => {
      if (!userId) {
        setProfileImage(null);
        return;
      }

      try {
        const { data } = await API.get(`/auth/${userId}`);

        if (!cancelled) {
          const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
          setProfileImage(data.image ? `${apiUrl}${data.image}` : null);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load profile image:", err.message);
        }
      }
    };

    loadTasks();
    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [userId, isTasksPage]);

  const completedCount = tasks.filter((task) => task.completed).length;
  const activeCount = tasks.length - completedCount;
  const dueTodayCount = tasks.filter((task) => isDueToday(task, now)).length;
  const overdueCount = tasks.filter((task) => isOverdue(task, now)).length;

  const filteredTasks = tasks.filter((task) => {
    const searchText = search.toLowerCase().trim();

    const matchesSearch =
      (task.title || "").toLowerCase().includes(searchText) ||
      (task.description || "").toLowerCase().includes(searchText);

    let matchesStatus = true;

    if (filter === "active") matchesStatus = !task.completed;
    if (filter === "completed") matchesStatus = Boolean(task.completed);
    if (filter === "dueToday") matchesStatus = isDueToday(task, now);
    if (filter === "overdue") matchesStatus = isOverdue(task, now);

    const category = CATEGORIES.includes(task.category)
      ? task.category
      : "Personal";
    const matchesCategory =
      categoryFilter === "all" || category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const dailyTasks = filteredTasks.filter(
    (task) => hasDeadline(task) && toLocalDateKey(task.dueDate) === selectedDay
  );

  const unscheduledTasks = filteredTasks.filter((task) => !hasDeadline(task));

  const displayedTasks = plannerView === "all" ? filteredTasks : dailyTasks;

  const selectedDateLabel = new Date(`${selectedDay}T12:00:00`).toLocaleDateString(
    undefined,
    { weekday: "short", month: "short", day: "numeric", year: "numeric" }
  );

  const isTodaySelected = selectedDay === getTodayKey();

  const changeDay = (amount) => {
    setSelectedDay((current) => shiftDate(current, amount));
    setPlannerView("day");
  };

  const goToToday = () => {
    setSelectedDay(getTodayKey());
    setPlannerView("day");
  };

  const addTask = (newTask) => {
    setTasks((current) => [...current, newTask]);

    if (hasDeadline(newTask)) {
      setSelectedDay(toLocalDateKey(newTask.dueDate));
      setPlannerView("day");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("userId");
    navigate("/login", { replace: true });
  };

  const filterOptions = [
    { label: "All", value: "all" },
    { label: "Active", value: "active" },
    { label: "Completed", value: "completed" },
    { label: "Due today", value: "dueToday" },
    { label: "Overdue", value: "overdue" },
  ];

  const fontOptions = [
    { label: "Clean", value: "Arial" },
    { label: "Classic", value: "Georgia" },
    { label: "Typewriter", value: "Courier New" },
    { label: "Modern", value: "Trebuchet MS" },
    { label: "Rounded", value: "Verdana" },
    { label: "Handwritten", value: "Comic Sans MS" },
  ];

  const markerOptions = [
    { label: "Dot", value: "•" },
    { label: "Arrow", value: "→" },
    { label: "Check", value: "✓" },
    { label: "Star", value: "★" },
    { label: "Heart", value: "♥" },
    { label: "Flower", value: "✿" },
    { label: "Sparkle", value: "✦" },
    { label: "Dash", value: "—" },
  ];

  const taskListProps = {
    setTasks,
    font,
    bullet,
    now,
    categoryFilter: "all",
    sortBy,
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const renderPlannerGroup = (group, label, icon) => {
    const groupTasks = dailyTasks.filter((task) => getTimeGroup(task) === group);

    return (
      <button
        type="button"
        className={`planner-time-card ${groupTasks.length ? "has-tasks" : ""}`}
        key={group}
        onClick={() => {
          setPlannerView("day");
          scrollTo("task-board");
        }}
      >
        <span className="planner-time-icon" aria-hidden="true">{icon}</span>
        <span className="planner-time-copy">
          <strong>{label}</strong>
          <small>{groupTasks.length} {groupTasks.length === 1 ? "task" : "tasks"}</small>
        </span>
        <span className="planner-time-arrow" aria-hidden="true">›</span>
      </button>
    );
  };

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/tasks"
        element={
          <ProtectedRoute>
            <main
              className={`dashboard ${theme === "dark" ? "theme-dark" : ""} text-${textSize}`}
              style={{ fontFamily: font }}
            >
              <nav className="app-nav" aria-label="Main navigation">
                <button
                  className="brand-note"
                  type="button"
                  onClick={() => scrollTo("workspace-top")}
                  aria-label="Work To Do home"
                >
                  <span className="brand-spark">✦</span>
                  Work To Do
                </button>

                <div className="nav-links">
                  <button className="nav-link active" onClick={() => scrollTo("workspace-top")}>
                    <span aria-hidden="true">⌂</span> My Workspace
                  </button>
                  <button className="nav-link" onClick={() => scrollTo("task-board")}>
                    <span aria-hidden="true">☷</span> Tasks
                  </button>
                  <button className="nav-link" onClick={() => scrollTo("daily-planner")}>
                    <span aria-hidden="true">▦</span> Planner
                  </button>
                </div>

                <div className="nav-tools">
                  <div className="text-size-control" aria-label="Text size">
                    <span>Text size</span>
                    <button
                      type="button"
                      className={textSize === "small" ? "selected" : ""}
                      onClick={() => setTextSize("small")}
                      aria-label="Small text"
                    >A</button>
                    <button
                      type="button"
                      className={textSize === "normal" ? "selected" : ""}
                      onClick={() => setTextSize("normal")}
                      aria-label="Normal text"
                    >A</button>
                    <button
                      type="button"
                      className={textSize === "large" ? "selected" : ""}
                      onClick={() => setTextSize("large")}
                      aria-label="Large text"
                    >A</button>
                  </div>

                  <button
                    type="button"
                    className="theme-toggle"
                    onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")}
                    aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                    aria-pressed={theme === "dark"}
                    title={theme === "dark" ? "Light mode" : "Dark mode"}
                  >
                    <span aria-hidden="true">☀</span>
                    <span className={`theme-switch ${theme === "dark" ? "on" : ""}`}>
                      {theme === "dark" ? "☾" : "●"}
                    </span>
                  </button>

                  <div className="nav-profile">
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" className="profile-avatar" />
                    ) : (
                      <div className="profile-avatar" aria-label="Profile">
                        {username.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <button
                      type="button"
                      className="profile-menu-trigger"
                      onClick={() => setShowAppearance((visible) => !visible)}
                      aria-label="Open profile and appearance options"
                      aria-expanded={showAppearance}
                    >⌄</button>

                    {showAppearance && (
                      <div className="profile-menu">
                        <strong>{username}</strong>
                        <button type="button" onClick={() => { setShowUpload(true); setShowAppearance(false); scrollTo("profile-settings"); }}>
                          Update profile photo
                        </button>
                        <span className="menu-caption">Font style</span>
                        {fontOptions.map((item) => (
                          <button
                            type="button"
                            key={item.value}
                            style={{ fontFamily: item.value }}
                            onClick={() => setFont(item.value)}
                          >
                            {font === item.value ? "✓ " : ""}{item.label}
                          </button>
                        ))}
                        <span className="menu-caption">Task marker</span>
                        <div className="marker-options">
                          {markerOptions.map((item) => (
                            <button
                              type="button"
                              key={item.value}
                              title={item.label}
                              className={bullet === item.value ? "selected" : ""}
                              onClick={() => setBullet(item.value)}
                            >{item.value}</button>
                          ))}
                        </div>
                        <button type="button" className="logout-menu-button" onClick={logout}>
                          Log out
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </nav>

              <div id="workspace-top" className="workspace-content">
                <header className="welcome-row">
                  <div>
                    <p className="dashboard-eyebrow">YOUR PERSONAL WORKSPACE</p>
                    <h1 className="dashboard-title">
                      Hello, {username}! <span className="title-spark">✳</span>
                    </h1>
                    <p className="dashboard-subtitle">A little progress every day adds up.</p>
                  </div>

                  <div className="welcome-actions">
                    <p className="handwritten-note">Stay focused,<br />You got this! <span>↘</span></p>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => scrollTo("task-board")}
                    >♧ &nbsp; My workspace</button>
                    <button
                      type="button"
                      className="btn add-task-jump"
                      onClick={() => {
                        scrollTo("task-composer");
                        document.querySelector(".task-title-input")?.focus({ preventScroll: true });
                      }}
                    ><span aria-hidden="true">＋</span> Add Task</button>
                  </div>
                </header>

                <section className="dashboard-stats" aria-label="Task statistics">
                  <div className="stat-card stat-total">
                    <span className="stat-icon" aria-hidden="true">✓</span>
                    <div><p className="stat-label">Total tasks</p><strong className="stat-value">{tasks.length}</strong></div>
                    <span className="stat-doodle" aria-hidden="true">✧</span>
                  </div>
                  <div className="stat-card stat-progress">
                    <span className="stat-icon" aria-hidden="true">◔</span>
                    <div><p className="stat-label">In progress</p><strong className="stat-value">{activeCount}</strong></div>
                    <span className="stat-doodle" aria-hidden="true">♧</span>
                  </div>
                  <div className="stat-card stat-completed">
                    <span className="stat-icon" aria-hidden="true">✓</span>
                    <div><p className="stat-label">Completed</p><strong className="stat-value">{completedCount}</strong></div>
                    <span className="stat-doodle" aria-hidden="true">☆</span>
                  </div>
                  <div className="stat-card stat-due">
                    <span className="stat-icon" aria-hidden="true">▦</span>
                    <div><p className="stat-label">Due today</p><strong className="stat-value">{dueTodayCount}</strong></div>
                    <span className="stat-doodle" aria-hidden="true">☼</span>
                  </div>
                  <div className="stat-card stat-overdue">
                    <span className="stat-icon" aria-hidden="true">!</span>
                    <div><p className="stat-label">Overdue</p><strong className="stat-value">{overdueCount}</strong></div>
                    <span className="stat-doodle" aria-hidden="true">!</span>
                  </div>
                </section>

                <div className="task-toolbar">
                  <div className="task-search-controls">
                    <label className="dashboard-search">
                      <span aria-hidden="true">⌕</span>
                      <input
                        type="search"
                        placeholder="Search your tasks..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        aria-label="Search tasks"
                      />
                    </label>
                  </div>

                  <div className="task-filters" aria-label="Filter tasks">
                    {filterOptions.map((item) => (
                      <button
                        type="button"
                        key={item.value}
                        className={`filter-button ${filter === item.value ? "active" : ""}`}
                        onClick={() => setFilter(item.value)}
                        aria-pressed={filter === item.value}
                      >
                        {item.label}
                        {item.value === "dueToday" && dueTodayCount > 0 ? ` (${dueTodayCount})` : ""}
                        {item.value === "overdue" && overdueCount > 0 ? ` (${overdueCount})` : ""}
                      </button>
                    ))}
                  </div>

                  <div className="toolbar-popover filters-popover">
                    <button
                      type="button"
                      className="btn btn-secondary filters-toggle"
                      onClick={() => setShowFilters((visible) => !visible)}
                      aria-expanded={showFilters}
                    >▽ Filters <span aria-hidden="true">{showFilters ? "⌃" : "⌄"}</span></button>

                    {showFilters && (
                      <div className="toolbar-popover-panel filters-popover-panel">
                        <label htmlFor="task-category-filter">Filter by category</label>
                        <select
                          id="task-category-filter"
                          value={categoryFilter}
                          onChange={(event) => setCategoryFilter(event.target.value)}
                        >
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

                        <button type="button" className="filters-close-button" onClick={() => setShowFilters(false)}>
                          Done
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="workspace-layout">
                  <aside id="daily-planner" className="daily-planner-panel">
                    <div className="planner-heading">
                      <div>
                        <span className="planner-paperclip" aria-hidden="true">♧</span>
                        <h2>Daily Planner <span aria-hidden="true">✿</span></h2>
                      </div>
                      <div className="planner-view-toggle">
                        <button
                          type="button"
                          className={plannerView === "day" ? "selected" : ""}
                          onClick={() => setPlannerView("day")}
                        >Day</button>
                        <button
                          type="button"
                          className={plannerView === "all" ? "selected" : ""}
                          onClick={() => setPlannerView("all")}
                        >All</button>
                      </div>
                    </div>

                    <div className="planner-date-buttons">
                      <button type="button" onClick={() => changeDay(-1)}>← Previous</button>
                      <button type="button" className="today-button" onClick={goToToday}>Today</button>
                      <button type="button" onClick={() => changeDay(1)}>Next →</button>
                    </div>

                    <div className="planner-date-label">
                      <span aria-hidden="true">▦</span>
                      <strong>
                        {isTodaySelected
                          ? `Today, ${new Date().toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}`
                          : selectedDateLabel}
                      </strong>
                    </div>

                    <label className="planner-date-input">
                      <span>Choose date</span>
                      <input
                        type="date"
                        value={selectedDay}
                        onChange={(event) => {
                          if (event.target.value) {
                            setSelectedDay(event.target.value);
                            setPlannerView("day");
                          }
                        }}
                        aria-label="Choose planner date"
                      />
                    </label>

                    <div className="planner-time-groups">
                      {renderPlannerGroup("morning", "Morning", "☼")}
                      {renderPlannerGroup("afternoon", "Afternoon", "☀")}
                      {renderPlannerGroup("evening", "Evening", "☾")}
                    </div>

                    <div className="planner-encouragement">
                      <span aria-hidden="true">♧</span>
                      <p>Small steps<br />make big progress!</p>
                      <span aria-hidden="true">♧</span>
                    </div>

                    <div className="planner-unscheduled-count">
                      <span>Unscheduled</span>
                      <strong>{unscheduledTasks.length}</strong>
                    </div>
                  </aside>

                  <section id="task-board" className="task-workspace">
                    <div id="task-composer" className="composer-wrap">
                      <div className="composer-decoration" aria-hidden="true">✧</div>
                      <TaskForm onAdd={addTask} />
                    </div>

                    <div className="task-board-heading">
                      <div>
                        <h2>{plannerView === "all" ? "All your tasks" : "Your notes"}</h2>
                        <p className="dashboard-subtitle">
                          {plannerView === "all"
                            ? `${displayedTasks.length} tasks in your workspace`
                            : isTodaySelected
                              ? "A little progress goes a long way."
                              : `Tasks for ${selectedDateLabel}`}
                        </p>
                      </div>
                      <span className="task-count-pill">{displayedTasks.length} {displayedTasks.length === 1 ? "task" : "tasks"}</span>
                    </div>

                    {loadingTasks ? (
                      <div className="empty-state">
                        <h3>Gathering your notes...</h3>
                        <p>Your tasks will appear here shortly.</p>
                      </div>
                    ) : loadError ? (
                      <div className="empty-state">
                        <h3>Something went wrong</h3>
                        <p>{loadError}</p>
                        <button type="button" className="btn" onClick={() => window.location.reload()}>Try again</button>
                      </div>
                    ) : (
                      <>
                        {displayedTasks.length > 0 ? (
                          <TaskList {...taskListProps} tasks={displayedTasks} />
                        ) : (
                          <div className="empty-state">
                            <span className="empty-state-doodle" aria-hidden="true">✿</span>
                            <h3>
                              {search ? "No matching notes" : plannerView === "all" ? "Your board is ready" : "Nothing scheduled for this day"}
                            </h3>
                            <p>
                              {search
                                ? "Try another search term or filter."
                                : plannerView === "all"
                                  ? "Add your first task above and make it happen."
                                  : "Choose another date, or add a task with a deadline for this day."}
                            </p>
                            {plannerView === "day" && (
                              <button type="button" className="btn btn-secondary" onClick={() => setPlannerView("all")}>
                                Show all tasks
                              </button>
                            )}
                          </div>
                        )}

                        {plannerView === "day" && unscheduledTasks.length > 0 && (
                          <div className="unscheduled-section">
                            <div className="section-heading">
                              <h3>Unscheduled tasks</h3>
                              <span className="task-count-pill">{unscheduledTasks.length}</span>
                            </div>
                            <TaskList {...taskListProps} tasks={unscheduledTasks} />
                          </div>
                        )}
                      </>
                    )}
                  </section>
                </div>

                <section id="profile-settings" className={`upload-panel ${showUpload ? "visible" : ""}`}>
                  <div className="section-heading">
                    <h2>Profile photo</h2>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowUpload(false)}>Close</button>
                  </div>
                  {showUpload && (
                    <ProfileImageUpload
                      userId={userId}
                      onUploadSuccess={(newUrl) => setProfileImage(newUrl)}
                    />
                  )}
                </section>

                <footer className="dashboard-footer">
                  Made with little steps and big dreams <span aria-hidden="true">✦</span>
                </footer>
              </div>
            </main>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function RootApp() {
  return (
    <Router>
      <App />
    </Router>
  );
}
