import React from "react";

export default function WelcomeHeader({ username, scrollTo }) {
  return (
    <header className="welcome-row">
      <div>
        <p className="dashboard-eyebrow">YOUR PERSONAL WORKSPACE</p>
        <h1 className="dashboard-title">Hello, {username}! <span className="title-spark">✳</span></h1>
        <p className="dashboard-subtitle">A little progress every day adds up.</p>
      </div>
      <div className="welcome-actions">
        <p className="handwritten-note">Stay focused,<br />You got this! <span>↘</span></p>
        <button type="button" className="btn btn-secondary" onClick={() => scrollTo("task-board")}>♧ &nbsp; My workspace</button>
        <button type="button" className="btn add-task-jump" onClick={() => {
          scrollTo("task-composer");
          document.querySelector(".task-title-input")?.focus({ preventScroll: true });
        }}><span aria-hidden="true">＋</span> Add Task</button>
      </div>
    </header>
  );
}
