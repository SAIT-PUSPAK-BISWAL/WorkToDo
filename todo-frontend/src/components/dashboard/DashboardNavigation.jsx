import React, { useState } from "react";

const FONTS = [
  { label: "Clean", value: "Arial" },
  { label: "Classic", value: "Georgia" },
  { label: "Typewriter", value: "Courier New" },
  { label: "Modern", value: "Trebuchet MS" },
  { label: "Rounded", value: "Verdana" },
  { label: "Handwritten", value: "Comic Sans MS" },
];
const MARKERS = ["•", "→", "✓", "★", "♥", "✿", "✦", "—"];

export default function DashboardNavigation({
  username, profileImage, theme, setTheme, textSize, setTextSize, font, setFont,
  bullet, setBullet, onLogout, onShowUpload, scrollTo,
}) {
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const profileUploadsEnabled = import.meta.env.VITE_ENABLE_PROFILE_UPLOAD !== "false";
  const openUpload = () => {
    onShowUpload();
    setAppearanceOpen(false);
    scrollTo("profile-settings");
  };

  return (
    <nav className="app-nav" aria-label="Main navigation">
      <button className="brand-note" type="button" onClick={() => scrollTo("workspace-top")} aria-label="Work To Do home">
        <span className="brand-spark">✦</span>Work To Do
      </button>
      <div className="nav-links">
        <button className="nav-link active" onClick={() => scrollTo("workspace-top")}><span aria-hidden="true">⌂</span> My Workspace</button>
        <button className="nav-link" onClick={() => scrollTo("task-board")}><span aria-hidden="true">☷</span> Tasks</button>
        <button className="nav-link" onClick={() => scrollTo("daily-planner")}><span aria-hidden="true">▦</span> Planner</button>
      </div>
      <div className="nav-tools">
        <div className="text-size-control" aria-label="Text size">
          <span>Text size</span>
          {["small", "normal", "large"].map((size, index) => (
            <button type="button" key={size} className={textSize === size ? "selected" : ""}
              onClick={() => setTextSize(size)} aria-label={`${["Small", "Normal", "Large"][index]} text`}>A</button>
          ))}
        </div>
        <button type="button" className="theme-toggle" onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          aria-pressed={theme === "dark"} title={theme === "dark" ? "Light mode" : "Dark mode"}>
          <span aria-hidden="true">{theme === "dark" ? "☾" : "☀"}</span>
        </button>
        <div className="nav-profile">
          {profileImage ? <img src={profileImage} alt="Profile" className="profile-avatar" /> :
            <div className="profile-avatar" aria-label="Profile">{username.charAt(0).toUpperCase()}</div>}
          <button type="button" className="profile-menu-trigger" onClick={() => setAppearanceOpen((open) => !open)}
            aria-label="Open profile and appearance options" aria-expanded={appearanceOpen}>
            <span aria-hidden="true" />
          </button>
          {appearanceOpen && (
            <div className="profile-menu">
              <strong>{username}</strong>
              {profileUploadsEnabled && <button type="button" onClick={openUpload}>Update profile photo</button>}
              <span className="menu-caption">Font style</span>
              {FONTS.map(({ label, value }) => (
                <button type="button" key={value} style={{ fontFamily: value }} onClick={() => setFont(value)}>
                  {font === value ? "✓ " : ""}{label}
                </button>
              ))}
              <span className="menu-caption">Task marker</span>
              <div className="marker-options">
                {MARKERS.map((marker) => (
                  <button type="button" key={marker} title={marker} className={bullet === marker ? "selected" : ""}
                    onClick={() => setBullet(marker)}>{marker}</button>
                ))}
              </div>
              <button type="button" className="logout-menu-button" onClick={onLogout}>Log out</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
