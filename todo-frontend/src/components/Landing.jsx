import React from "react";
import { useNavigate } from "react-router-dom";
import "./Landing.css";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="landing-brand">
          <span className="brand-icon">✓</span>
          <span>work<span className="brand-highlight">todo</span></span>
        </div>

        <div className="landing-nav-actions">
          <button
            className="nav-login"
            onClick={() => navigate("/login")}
          >
            Log in
          </button>
          <button
            className="nav-signup"
            onClick={() => navigate("/register")}
          >
            Get started <span>↗</span>
          </button>
        </div>
      </nav>

      <main>
        <section className="landing-hero">
          <div className="hero-content">
            <div className="hero-label">
              <span className="label-dot"></span>
              YOUR DAY, A LITTLE MORE ORGANIZED
            </div>

            <h1>
              Big plans?
              <br />
              <span>One task</span> at a time.
            </h1>

            <p className="hero-description">
              Clear your head, organize your day, and get things done.
              Your personal space for turning little tasks into big wins.
            </p>

            <div className="hero-buttons">
              <button
                className="hero-primary"
                onClick={() => navigate("/register")}
              >
                Start organizing <span>→</span>
              </button>

              <button
                className="hero-secondary"
                onClick={() => navigate("/login")}
              >
                I have an account
              </button>
            </div>

            <div className="hero-note">
              <span className="hero-note-icon">✳</span>
              <span>Less chaos. More done.</span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-glow"></div>

            <div className="floating-tag tag-top">
              <span>✦</span> Make it happen
            </div>

            <div className="task-board">
              <div className="board-top">
                <div>
                  <span className="board-eyebrow">YOUR WORKSPACE</span>
                  <h2>Today's plan<span>.</span></h2>
                </div>
                <div className="board-menu">•••</div>
              </div>

              <div className="board-date">
                <span className="date-dot"></span>
                A fresh start, every day
              </div>

              <div className="task-progress">
                <div className="progress-heading">
                  <span>Daily progress</span>
                  <strong>2 of 4</strong>
                </div>
                <div className="progress-track">
                  <div className="progress-fill"></div>
                </div>
              </div>

              <div className="preview-task completed-task">
                <span className="task-check checked">✓</span>
                <div className="task-copy">
                  <strong>Plan the week</strong>
                  <span>Get things in order</span>
                </div>
                <span className="task-status">DONE</span>
              </div>

              <div className="preview-task">
                <span className="task-check"> </span>
                <div className="task-copy">
                  <strong>Finish that project</strong>
                  <span>One step at a time</span>
                </div>
                <span className="task-priority priority-high">HIGH</span>
              </div>

              <div className="preview-task">
                <span className="task-check checked">✓</span>
                <div className="task-copy">
                  <strong>Take a little break</strong>
                  <span>You deserve it</span>
                </div>
              </div>

              <div className="preview-task">
                <span className="task-check"></span>
                <div className="task-copy">
                  <strong>Read for 20 minutes</strong>
                  <span>A little progress counts</span>
                </div>
                <span className="task-priority priority-low">EASY</span>
              </div>

              <div className="board-footer">
                <span className="footer-sparkle">✳</span>
                Every little win counts.
              </div>
            </div>

            <div className="floating-note note-yellow">
              <span className="note-pin"></span>
              <span className="note-small">REMEMBER</span>
              <strong>You've got<br />this!</strong>
              <span className="note-doodle">↗</span>
            </div>

            <div className="floating-note note-pink">
              <span className="pink-sparkle">✳</span>
              <strong>Progress,<br />not perfection.</strong>
            </div>

            <div className="visual-decoration decoration-one">✳</div>
            <div className="visual-decoration decoration-two">✦</div>
          </div>
        </section>

        <section className="landing-features">
          <div className="features-heading">
            <span>THE LITTLE THINGS THAT HELP</span>
            <h2>A calmer way to get things done.</h2>
          </div>

          <div className="feature-grid">
            <article className="feature-card">
              <div className="feature-icon icon-yellow">✎</div>
              <h3>Get it out of your head</h3>
              <p>
                Capture your tasks in one place instead of trying to remember
                everything.
              </p>
            </article>

            <article className="feature-card">
              <div className="feature-icon icon-green">✓</div>
              <h3>Make progress visible</h3>
              <p>
                Check things off, celebrate small wins, and see how far
                you've come.
              </p>
            </article>

            <article className="feature-card">
              <div className="feature-icon icon-pink">✳</div>
              <h3>Keep it simple</h3>
              <p>
                Focus on what matters today, without making productivity
                complicated.
              </p>
            </article>
          </div>
        </section>

        <section className="landing-cta">
          <div>
            <span className="cta-eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>
            <h2>Ready to make room<br />for what matters?</h2>
          </div>
          <button
            className="cta-button"
            onClick={() => navigate("/register")}
          >
            Let's get things done <span>→</span>
          </button>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-brand footer-brand">
          <span className="brand-icon">✓</span>
          <span>work<span className="brand-highlight">todo</span></span>
        </div>
        <p>A little more organized. A little less overwhelmed.</p>
        <span className="footer-made">MADE FOR YOUR EVERYDAY ✳</span>
      </footer>
    </div>
  );
}