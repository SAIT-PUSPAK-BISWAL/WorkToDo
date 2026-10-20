process.env.JWT_SECRET = "test-only-secret-with-enough-entropy-123456";
process.env.FRONTEND_URL = "http://localhost:5173";
process.env.NODE_ENV = "test";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const request = require("supertest");

const app = require("../app");
const User = require("../models/user");
const Task = require("../models/task");
const Session = require("../models/session");
const authController = require("../controllers/authController");

const USER_ID = "64b000000000000000000001";
const OTHER_USER_ID = "64b000000000000000000002";
const tokenFor = (id = USER_ID) =>
  jwt.sign({ id, jti: `test-session-${id}` }, process.env.JWT_SECRET, { expiresIn: "1h" });
const cookieFor = (id = USER_ID) => `todo_session=${tokenFor(id)}`;
const uploadsPath = path.join(__dirname, "..", "uploads");

Session.findOne = () => ({ select: async () => ({ _id: "active-session" }) });

test("login creates an HttpOnly cookie and never returns the token in JSON", async (t) => {
  const originalFindOne = User.findOne;
  const originalCompare = bcrypt.compare;
  const originalCreate = Session.create;
  t.after(() => {
    User.findOne = originalFindOne;
    bcrypt.compare = originalCompare;
    Session.create = originalCreate;
  });

  User.findOne = async () => ({
    _id: USER_ID,
    username: "Test User",
    password: "stored-hash",
  });
  bcrypt.compare = async () => true;
  Session.create = async () => ({});

  let cookie;
  let cookieOptions;
  let payload;
  const response = {
    cookie(name, value, options) {
      cookie = { name, value };
      cookieOptions = options;
      return this;
    },
    json(body) {
      payload = body;
      return this;
    },
  };

  await authController.login(
    { body: { email: "test@example.com", password: "password" } },
    response
  );

  assert.equal(cookie.name, "todo_session");
  assert.equal(jwt.verify(cookie.value, process.env.JWT_SECRET).id, USER_ID);
  assert.equal(cookieOptions.httpOnly, true);
  assert.equal(cookieOptions.sameSite, "lax");
  assert.equal(payload.userId, USER_ID);
  assert.equal("token" in payload, false);
});

test("task endpoints accept the HttpOnly session cookie and scope reads to its user", async (t) => {
  const originalFind = Task.find;
  const originalSessionFindOne = Session.findOne;
  let query;
  Task.find = (filter) => {
    query = filter;
    return { sort: async () => [] };
  };
  Session.findOne = () => ({ select: async () => ({ _id: "active-session" }) });
  t.after(() => {
    Task.find = originalFind;
    Session.findOne = originalSessionFindOne;
  });

  await request(app).get("/tasks").expect(401);
  await request(app)
    .get("/tasks")
    .set("Cookie", cookieFor())
    .expect(200, []);

  assert.deepEqual(query, { userId: USER_ID });
});

test("mutating requests reject a different browser origin", async () => {
  await request(app)
    .post("/auth/logout")
    .set("Origin", "https://untrusted.example")
    .expect(403);
});

test("logout clears the browser session cookie", async (t) => {
  const originalSessionFindOne = Session.findOne;
  const originalUpdateOne = Session.updateOne;
  t.after(() => {
    Session.findOne = originalSessionFindOne;
    Session.updateOne = originalUpdateOne;
  });
  let active = true;
  Session.findOne = () => ({ select: async () => active ? ({ _id: "active-session" }) : null });
  Session.updateOne = async () => { active = false; return { modifiedCount: 1 }; };
  const response = await request(app)
    .post("/auth/logout")
    .set("Cookie", cookieFor())
    .set("Origin", process.env.FRONTEND_URL)
    .expect(200);
  assert.match(response.headers["set-cookie"][0], /todo_session=/);
  assert.match(response.headers["set-cookie"][0], /HttpOnly/i);
  assert.match(response.headers["set-cookie"][0], /Expires=Thu, 01 Jan 1970/i);
  await request(app).get("/tasks").set("Cookie", cookieFor()).expect(401);
});

test("API responses include security headers and request IDs", async () => {
  const response = await request(app).get("/not-a-route").expect(404);
  assert.equal(response.headers["x-content-type-options"], "nosniff");
  assert.equal(response.headers["x-frame-options"], "DENY");
  assert.ok(response.headers["x-request-id"]);
  assert.equal(response.body.requestId, response.headers["x-request-id"]);
});

test("revoked sessions cannot access protected routes", async (t) => {
  const originalFindOne = Session.findOne;
  Session.findOne = () => ({ select: async () => null });
  t.after(() => { Session.findOne = originalFindOne; });

  await request(app)
    .get("/tasks")
    .set("Cookie", cookieFor())
    .expect(401);
});

test("profile upload ownership is checked before a file can be written", async () => {
  const filesBefore = await fs.promises.readdir(uploadsPath);

  await request(app)
    .post(`/upload/${OTHER_USER_ID}`)
    .set("Cookie", cookieFor())
    .attach("image", Buffer.from("not an image"), {
      filename: "spoof.png",
      contentType: "image/png",
    })
    .expect(403);

  assert.deepEqual(await fs.promises.readdir(uploadsPath), filesBefore);
});

test("profile uploads reject false image MIME types and remove the rejected file", async () => {
  const filesBefore = await fs.promises.readdir(uploadsPath);

  await request(app)
    .post(`/upload/${USER_ID}`)
    .set("Cookie", cookieFor())
    .attach("image", Buffer.from("not a PNG image"), {
      filename: "spoof.png",
      contentType: "image/png",
    })
    .expect(400);

  assert.deepEqual(await fs.promises.readdir(uploadsPath), filesBefore);
});

test("login attempts are rate limited", async () => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    await request(app).post("/auth/login").send({}).expect(400);
  }

  await request(app).post("/auth/login").send({}).expect(429);
});

test("registration attempts are rate limited", async () => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await request(app).post("/auth/register").send({}).expect(400);
  }

  await request(app).post("/auth/register").send({}).expect(429);
});
