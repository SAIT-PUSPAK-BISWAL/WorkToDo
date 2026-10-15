
import React, { useState } from "react";
import API from "../services/api";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const username = form.username.trim();
    const email = form.email.trim();

    if (!username || !email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);

      await API.post("/auth/register", {
        username,
        email,
        password: form.password,
      });

      navigate("/login", {
        replace: true,
        state: {
          message: "Registration successful! Please log in.",
        },
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Registration failed. Please try again."
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
          <span>Work To Do</span>
        </Link>

        <Link to="/" className="login-home-link">
          Home
        </Link>
      </header>

      <div className="login-decoration login-note-left">
        <span>One step</span>
        <span>at a time!</span>
        <span className="login-note-smile">☺</span>
      </div>

      <div className="login-decoration login-checklist">
        <strong>My little goals</strong>
        <span>✓ Start fresh</span>
        <span>✓ Stay focused</span>
        <span>□ Make progress</span>
      </div>

      <div className="login-decoration login-note-right">
        Small steps
        <br />
        count too!
      </div>

      <section className="login-card">
        <span className="login-highlight">A FRESH START</span>

        <h1 className="login-heading">
          Create your account.
        </h1>

        <p className="login-subtitle">
          Make space for your next great idea.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="register-username">
              Username
            </label>

            <input
              id="register-username"
              name="username"
              type="text"
              placeholder="Choose a username"
              value={form.username}
              onChange={handleChange}
              autoComplete="username"
              maxLength={50}
              required
              disabled={loading}
            />
          </div>

          <div className="login-field">
            <label htmlFor="register-email">
              Email address
            </label>

            <input
              id="register-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              required
              disabled={loading}
            />
          </div>

          <div className="login-field">
            <label htmlFor="register-password">
              Password
            </label>

            <div className="login-password-wrap">
              <input
                id="register-password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
                minLength={8}
                maxLength={72}
                required
                disabled={loading}
              />

              <button
                type="button"
                className="login-show-password"
                onClick={() =>
                  setShowPassword((current) => !current)
                }
                disabled={loading}
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
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
            {loading
              ? "Creating account..."
              : "Create account →"}
          </button>
        </form>

        <div className="login-divider" />

        <p className="login-switch">
          Already have an account?{" "}
          <Link to="/login">Sign in</Link>
        </p>

        <Link to="/" className="login-back-link">
          ← Back to home
        </Link>
      </section>

      <footer className="login-footer">
        Made for your next little win.
      </footer>
    </main>
  );
}
