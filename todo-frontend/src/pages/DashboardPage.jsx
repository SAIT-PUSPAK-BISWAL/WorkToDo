import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useDashboard from "../hooks/useDashboard";
import DashboardNavigation from "../components/dashboard/DashboardNavigation";
import WelcomeHeader from "../components/dashboard/WelcomeHeader";
import TaskStats from "../components/dashboard/TaskStats";
import TaskToolbar from "../components/dashboard/TaskToolbar";
import DailyPlanner from "../components/dashboard/DailyPlanner";
import TaskBoard from "../components/dashboard/TaskBoard";
import ProfileSettings from "../components/dashboard/ProfileSettings";
import ProtectedRoute from "../components/ProtectedRoute";

export default function DashboardPage() {
  const dashboard = useDashboard();
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const taskListProps = {
    setTasks: dashboard.setTasks,
    font: dashboard.font,
    bullet: dashboard.bullet,
    now: dashboard.now,
    categoryFilter: "all",
    sortBy: dashboard.sortBy,
  };

  return (
    <ProtectedRoute onAuthenticated={dashboard.acceptAuthenticatedUser}>
      <main className={`dashboard ${dashboard.theme === "dark" ? "theme-dark" : ""} text-${dashboard.textSize}`}
        style={{ fontFamily: dashboard.font }}>
        <DashboardNavigation
          username={dashboard.username}
          profileImage={dashboard.profileImage}
          theme={dashboard.theme}
          setTheme={dashboard.setTheme}
          textSize={dashboard.textSize}
          setTextSize={dashboard.setTextSize}
          font={dashboard.font}
          setFont={dashboard.setFont}
          bullet={dashboard.bullet}
          setBullet={dashboard.setBullet}
          onLogout={async () => {
            await dashboard.logout();
            navigate("/login", { replace: true });
          }}
          onShowUpload={() => setShowUpload(true)}
          scrollTo={scrollTo}
        />
  
        <div id="workspace-top" className="workspace-content">
          <WelcomeHeader username={dashboard.username} scrollTo={scrollTo} />
          <TaskStats total={dashboard.tasks.length} active={dashboard.taskSummary.activeCount}
            completed={dashboard.taskSummary.completedCount} dueToday={dashboard.taskSummary.dueTodayCount}
            overdue={dashboard.taskSummary.overdueCount} />
          <TaskToolbar
            search={dashboard.search} setSearch={dashboard.setSearch}
            filter={dashboard.filter} setFilter={dashboard.setFilter}
            categoryFilter={dashboard.categoryFilter} setCategoryFilter={dashboard.setCategoryFilter}
            sortBy={dashboard.sortBy} setSortBy={dashboard.setSortBy}
            showFilters={showFilters} setShowFilters={setShowFilters}
            dueTodayCount={dashboard.taskSummary.dueTodayCount} overdueCount={dashboard.taskSummary.overdueCount}
          />
  
          <div className="workspace-layout">
            <DailyPlanner
              dailyTasks={dashboard.taskSummary.dailyTasks}
              unscheduledCount={dashboard.taskSummary.unscheduledTasks.length}
              selectedDay={dashboard.selectedDay}
              selectedDateLabel={dashboard.selectedDateLabel}
              isTodaySelected={dashboard.isTodaySelected}
              plannerView={dashboard.plannerView}
              setPlannerView={dashboard.setPlannerView}
              changeDay={dashboard.changeDay}
              goToToday={dashboard.goToToday}
              setSelectedDay={dashboard.setSelectedDay}
              scrollTo={scrollTo}
            />
            <TaskBoard
              displayedTasks={dashboard.taskSummary.displayedTasks}
              unscheduledTasks={dashboard.taskSummary.unscheduledTasks}
              loading={dashboard.loadingTasks}
              loadError={dashboard.loadError}
              onAddTask={dashboard.addTask}
              taskListProps={taskListProps}
              plannerView={dashboard.plannerView}
              setPlannerView={dashboard.setPlannerView}
              search={dashboard.search}
              selectedDateLabel={dashboard.selectedDateLabel}
              isTodaySelected={dashboard.isTodaySelected}
            />
          </div>
  
          {import.meta.env.VITE_ENABLE_PROFILE_UPLOAD !== "false" &&
            <ProfileSettings visible={showUpload} setVisible={setShowUpload} userId={dashboard.userId}
              onUploadSuccess={dashboard.setProfileImage} />}
          <footer className="dashboard-footer">Made with little steps and big dreams <span aria-hidden="true">✦</span></footer>
        </div>
      </main>
    </ProtectedRoute>
  );
}
