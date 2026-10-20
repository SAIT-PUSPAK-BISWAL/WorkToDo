import { useCallback, useEffect, useMemo, useState } from "react";
import API from "../services/api";
import { getSavedPlannerDay, getTodayKey, hasDeadline, isDueToday, isOverdue, shiftDate, toLocalDateKey } from "../utils/taskDates";

const CATEGORIES = ["Study", "Personal", "Work", "Projects"];
const readPreference = (key, fallback) => localStorage.getItem(key) || fallback;

export default function useDashboard() {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  const [theme, setTheme] = useState(() => readPreference("todoAppTheme", "light"));
  const [font, setFont] = useState(() => readPreference("todoAppFont", "Arial"));
  const [bullet, setBullet] = useState(() => readPreference("todoAppBullet", "•"));
  const [textSize, setTextSize] = useState(() => readPreference("todoAppTextSize", "normal"));
  const [profileImage, setProfileImage] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [now, setNow] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(getSavedPlannerDay);
  const [plannerView, setPlannerView] = useState(() => readPreference("todoAppPlannerView", "all") === "day" ? "day" : "all");
  const [username, setUsername] = useState(() => readPreference("username", "there"));
  const [userId, setUserId] = useState(() => readPreference("userId", ""));

  const acceptAuthenticatedUser = useCallback((user) => {
    setIsAuthenticated(true);
    setTasks([]);
    setProfileImage(null);
    setLoadError("");
    if (user.username) {
      localStorage.setItem("username", user.username);
      setUsername(user.username);
    }
    if (user._id) {
      localStorage.setItem("userId", user._id);
      setUserId(user._id);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("todoAppTheme", theme);
    localStorage.setItem("todoAppFont", font);
    localStorage.setItem("todoAppBullet", bullet);
    localStorage.setItem("todoAppTextSize", textSize);
    localStorage.setItem("todoAppSelectedDay", selectedDay);
    localStorage.setItem("todoAppPlannerView", plannerView);
  }, [theme, font, bullet, textSize, selectedDay, plannerView]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!isAuthenticated) return () => { cancelled = true; };

    const loadDashboard = async () => {
      setLoadingTasks(true);
      setLoadError("");

      try {
        const { data } = await API.get("/tasks");
        if (!cancelled) setTasks(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load tasks:", error.message);
          setLoadError("Could not load your tasks. Please try again.");
        }
      } finally {
        if (!cancelled) setLoadingTasks(false);
      }
    };

    loadDashboard();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  useEffect(() => {
    let cancelled = false;
    if (!isAuthenticated || !userId) {
      setProfileImage(null);
      return () => { cancelled = true; };
    }

    API.get(`/auth/${userId}`)
      .then(({ data }) => {
        if (!cancelled) {
          const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000" : "");
          setProfileImage(data.image ? `${apiUrl}${data.image}` : null);
        }
      })
      .catch((error) => {
        if (!cancelled) console.error("Failed to load profile image:", error.message);
      });

    return () => { cancelled = true; };
  }, [isAuthenticated, userId]);

  const taskSummary = useMemo(() => {
    const completedCount = tasks.filter((task) => task.completed).length;
    const dueTodayCount = tasks.filter((task) => isDueToday(task, now)).length;
    const overdueCount = tasks.filter((task) => isOverdue(task, now)).length;

    const filteredTasks = tasks.filter((task) => {
      const searchText = search.toLowerCase().trim();
      const matchesSearch = (task.title || "").toLowerCase().includes(searchText) ||
        (task.description || "").toLowerCase().includes(searchText);
      const matchesStatus = filter === "all" ||
        (filter === "active" && !task.completed) ||
        (filter === "completed" && Boolean(task.completed)) ||
        (filter === "dueToday" && isDueToday(task, now)) ||
        (filter === "overdue" && isOverdue(task, now));
      const category = CATEGORIES.includes(task.category) ? task.category : "Personal";
      return matchesSearch && matchesStatus && (categoryFilter === "all" || category === categoryFilter);
    });

    const dailyTasks = filteredTasks.filter((task) => hasDeadline(task) && toLocalDateKey(task.dueDate) === selectedDay);
    const unscheduledTasks = filteredTasks.filter((task) => !hasDeadline(task));

    return {
      completedCount,
      activeCount: tasks.length - completedCount,
      dueTodayCount,
      overdueCount,
      filteredTasks,
      dailyTasks,
      unscheduledTasks,
      displayedTasks: plannerView === "all" ? filteredTasks : dailyTasks,
    };
  }, [tasks, now, search, filter, categoryFilter, selectedDay, plannerView]);

  const selectedDateLabel = new Date(`${selectedDay}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });

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
  const logout = async () => {
    try { await API.post("/auth/logout"); } catch {}
    ["token", "username", "userId"].forEach((key) => localStorage.removeItem(key));
    setIsAuthenticated(false);
    setTasks([]);
    setLoadError("");
    setLoadingTasks(false);
    setUsername("there");
    setUserId("");
    setProfileImage(null);
  };

  return {
    tasks, setTasks, search, setSearch, filter, setFilter, categoryFilter, setCategoryFilter,
    sortBy, setSortBy, theme, setTheme, font, setFont, bullet, setBullet, textSize, setTextSize,
    profileImage, setProfileImage, loadingTasks, loadError, now, selectedDay, setSelectedDay,
    plannerView, setPlannerView, username, userId, acceptAuthenticatedUser, taskSummary,
    selectedDateLabel, isTodaySelected: selectedDay === getTodayKey(), changeDay, goToToday,
    addTask, logout, acceptAuthenticatedUser,
  };
}
