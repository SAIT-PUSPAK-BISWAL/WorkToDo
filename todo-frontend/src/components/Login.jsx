import React, { useState, useEffect } from "react";
import API from "../services/api";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/tasks", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const { data } = await API.post("/auth/login", {
        email: email.trim(),
        password,
      });

      if (!data.token || !data.username || !data.userId) {
        setError("Invalid response from server. Please try again.");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.username);
      localStorage.setItem("userId", data.userId);

      navigate("/tasks", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your credentials and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <header className="login-header">
        <Link to="/" className="login-brand">
          <span className="login-brand-icon">✓</span>
          <span>worktodo</span>
        </Link>

        <Link to="/" className="login-home-link">
          ← Home
        </Link>
      </header>

      <div className="login-decoration login-note-left">
        <span>Small steps</span>
        <span>make big progress.</span>
        <span className="login-note-smile">☺</span>
      </div>

      <div className="login-decoration login-checklist">
        <strong>Today's plan:</strong>
        <span>☐ Plan</span>
        <span>☐ Do</span>
        <span>☐ Achieve</span>
        <span>☐ Repeat</span>
      </div>

      <section className="login-card">
        <div className="login-highlight">WELCOME BACK</div>

        <h1 className="login-heading">Let's get things done.</h1>

        <p className="login-subtitle">
          Sign in to pick up where you left off.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              disabled={loading}
            />
          </div>

          <div className="login-field">
            <label htmlFor="login-password">Password</label>

            <div className="login-password-wrap">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                disabled={loading}
              />

              <button
                type="button"
                className="login-show-password"
                onClick={() => setShowPassword((previous) => !previous)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={loading}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="login-submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in →"}
          </button>
        </form>

        <div className="login-divider" />

        <p className="login-switch">
          New here? <Link to="/register">Create an account</Link>
        </p>

        <Link to="/" className="login-back-link">
          ← Back to home
        </Link>
      </section>

      <div className="login-decoration login-note-right">
        <span>Better tasks.</span>
        <span>Bigger dreams.</span>
        <span>♡</span>
      </div>

      <footer className="login-footer">
        A little progress every day.
      </footer>
    </main>
  );
}
