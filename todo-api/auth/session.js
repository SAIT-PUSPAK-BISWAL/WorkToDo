const SESSION_COOKIE = "todo_session";

const getSessionCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite:
    process.env.SESSION_COOKIE_SAME_SITE ||
    "lax",
  path: "/",
  // Prefer the cookie over lower-priority cookies with the same name.
  priority: "high",
  maxAge: 60 * 60 * 1000,
});

module.exports = { SESSION_COOKIE, getSessionCookieOptions };
