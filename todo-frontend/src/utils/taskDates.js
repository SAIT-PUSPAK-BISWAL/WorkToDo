export const toLocalDateKey = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

export const getTodayKey = () => toLocalDateKey(new Date());

export const shiftDate = (dateKey, amount) => {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return toLocalDateKey(date);
};

export const hasDeadline = (task) =>
  Boolean(task.dueDate && !Number.isNaN(new Date(task.dueDate).getTime()));

export const isOverdue = (task, now) =>
  !task.completed && hasDeadline(task) && new Date(task.dueDate).getTime() < now.getTime();

export const isDueToday = (task, now) =>
  !task.completed && hasDeadline(task) && toLocalDateKey(task.dueDate) === toLocalDateKey(now);

export const getTimeGroup = (task) => {
  if (!hasDeadline(task)) return "unscheduled";
  const hour = new Date(task.dueDate).getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
};

export const getSavedPlannerDay = () => {
  try {
    const saved = localStorage.getItem("todoAppSelectedDay");
    if (saved && /^\d{4}-\d{2}-\d{2}$/.test(saved) && toLocalDateKey(new Date(`${saved}T12:00:00`)) === saved) {
      return saved;
    }
  } catch {
    // Use today's date when browser storage is unavailable.
  }

  return getTodayKey();
};
