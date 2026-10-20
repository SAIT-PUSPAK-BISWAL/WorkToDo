# Work To Do — Personal Task Planner

A full-stack task planner for organizing personal work, tracking deadlines, and building a steady daily routine. Work To Do combines a pastel dashboard, task management, and a daily planner in a responsive web app.

[**🌐 Open the live demo**](https://worktodo-2026.vercel.app/)

Create your own account from the demo's registration page. The app is designed for desktop, tablet, and mobile screens.

---

## ✨ Key Features

1. **Personal task management**
   - Create, edit, complete, and delete tasks from your own account.
   - Add a title and optional description. Titles are limited to 200 characters.
   - Each task is stored with its owner, so one account cannot read or modify another user's tasks.

2. **Flexible deadlines and times**
   - New tasks start with today's date, while the time field stays blank until you choose a time.
   - Tasks can have a date-only deadline or a date and time.
   - Tasks without deadlines are kept in the unscheduled group.
   - Due-today and overdue labels update from the task deadline and completion state.

3. **Categories and priorities**
   - Organize tasks into **Study**, **Personal**, **Work**, and **Projects** categories.
   - Set **Low**, **Medium**, or **High** priority. New tasks default to **Personal** and **Medium**.
   - Category and priority labels use color accents to make task cards easier to scan.

4. **Daily planner**
   - Browse the planner by day, jump to today, or pick a date directly.
   - See deadline tasks grouped into morning, afternoon, and evening time slots.
   - Switch between the selected day and the full task list.
   - View how many tasks are scheduled and how many remain unscheduled.

5. **Dashboard statistics**
   - Track total tasks, in-progress tasks, completed tasks, tasks due today, and overdue tasks.
   - The counts update as you add, complete, and delete tasks.

6. **Search, filters, and sorting**
   - Search task titles and descriptions.
   - Filter by all, active, completed, due-today, or overdue status.
   - Narrow the list by category and sort by priority, deadline, or overdue status.

7. **Personal appearance settings**
   - Switch between light and dark themes.
   - Adjust text size, choose a font, and pick a task marker.
   - Preferences are saved in the browser for the next visit.

8. **Responsive interface**
   - Navigation, task forms, planner, statistics, and task cards adapt to smaller screens.
   - The mobile layout stacks content and controls for narrow phone displays.

9. **Account security**
   - Passwords are hashed with bcrypt before storage.
   - Login uses a signed JWT in an HTTP-only session cookie and a server-side MongoDB session record.
   - Authentication and task routes are rate limited, request bodies are size limited, and API responses include security headers.

---

## 🛠️ Technology Stack

- **Frontend:** React 19, React Router, Vite, Axios
- **Backend:** Node.js, Express 5
- **Database:** MongoDB Atlas or MongoDB server, accessed through Mongoose
- **Authentication:** bcryptjs, JSON Web Tokens, HTTP-only cookies, MongoDB-backed sessions
- **Deployment:** Vercel for the frontend and API; MongoDB Atlas for persistent data
- **Testing:** Node.js built-in test runner and Supertest

---

## 📂 Project Structure

```text
todo/
├── README.md
├── todo-api/
│   ├── app.js                 Express application and middleware
│   ├── index.js               Local API server entry point
│   ├── auth/                  Session cookie configuration
│   ├── config/                MongoDB connection and reuse
│   ├── controllers/           Authentication and task logic
│   ├── middleware/            Session authentication and request checks
│   ├── models/                User, task, and session schemas
│   ├── routes/                Authentication, task, and profile upload routes
│   ├── test/                  API security tests
│   └── utils/                 Request IDs and security event logging
└── todo-frontend/
    ├── index.html             Vite HTML entry point
    ├── vercel.json            API rewrites and client-side routing
    └── src/
        ├── components/        Landing, login, registration, and dashboard UI
        ├── hooks/             Dashboard data and preference state
        ├── pages/             Route-level pages
        ├── services/          Axios API client
        ├── styles/            Global, dashboard, theme, and responsive styles
        └── utils/             Planner and deadline date helpers
```

---

## ⚙️ Environment Variables

The API reads local configuration from `todo-api/.env`. Start with the included example:

```powershell
Copy-Item todo-api/.env.example todo-api/.env
```

Configure these values in `todo-api/.env`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://DB_USER:DB_PASSWORD@YOUR_CLUSTER.mongodb.net/worktodo?retryWrites=true&w=majority
JWT_SECRET=replace_with_a_random_secret_at_least_32_bytes_long
FRONTEND_URL=http://localhost:5173
TRUST_PROXY_HOPS=0
```

Replace the example database username, password, cluster, and secret with your own values. The database user must have permission to read and write the database named in the URI. If the password contains reserved URL characters, URL-encode it. Never commit `.env` or share a completed connection string.

For Vercel, configure the API variables in the API project's **Settings → Environment Variables**. Production additionally uses `NODE_ENV=production` and `SESSION_COOKIE_SAME_SITE=lax`. Configure `VITE_ENABLE_PROFILE_UPLOAD=false` in the frontend project to disable disk-based profile uploads in the hosted demo. Never put secrets in `VITE_` variables; frontend variables are visible to users.

---

## 🏃 Getting Started

### Requirements

- Node.js 20 or newer
- npm
- A MongoDB connection, either a local database or MongoDB Atlas

### 1. Install dependencies

Run these commands from the repository root:

```powershell
cd todo-api
npm install
cd ..\todo-frontend
npm install
cd ..
```

### 2. Configure MongoDB and the API

Copy `todo-api/.env.example` to `todo-api/.env` and fill in the values described above. For an Atlas database, add the API host's required network access rule in Atlas.

### 3. Start the backend

In a terminal at the repository root:

```powershell
cd todo-api
node index.js
```

The API starts at `http://localhost:5000`.

### 4. Start the frontend

In a second terminal at the repository root:

```powershell
cd todo-frontend
npm start
```

Open [http://localhost:5173](http://localhost:5173). Vite forwards local `/auth` and `/tasks` requests to the API on port 5000.

---

## 🔌 API Routes

Authentication endpoints use the `/auth` prefix. Task endpoints use `/tasks`.

| Method | Path | Description | Session required |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Create an account | No |
| `POST` | `/auth/login` | Sign in and create a session | No |
| `GET` | `/auth/me` | Return the current user's session profile | Yes |
| `POST` | `/auth/logout` | Revoke the current session | Yes |
| `GET` | `/auth/:id` | Return the signed-in user's profile | Yes |
| `GET` | `/tasks` | List the signed-in user's tasks | Yes |
| `POST` | `/tasks` | Create a task | Yes |
| `PUT` | `/tasks/:id` | Update an owned task | Yes |
| `DELETE` | `/tasks/:id` | Delete an owned task | Yes |

Task priority values are `Low`, `Medium`, and `High`. Category values are `Study`, `Personal`, `Work`, and `Projects`.

---

## 🧪 Running Tests

Run the API security test suite from `todo-api`:

```powershell
npm test
```

The tests cover authentication and session behavior, user and task ownership checks, request validation, and rate limiting.

---

## 📦 Production Build

Create the frontend's production bundle from `todo-frontend`:

```powershell
npm run build
```

Vite writes the generated site to `todo-frontend/dist/`.

---

## 🚀 Deploying the Demo

The live demo uses two Vercel projects from this repository: one for the Express API and one for the React frontend. MongoDB Atlas stores accounts, sessions, and tasks.

### MongoDB Atlas

1. Create an Atlas project and an **M0 Free** cluster.
2. In **Database Access**, create a database user with `readWrite` access to the app database.
3. In **Network Access**, add the network access entry needed for Vercel.
4. Copy the Atlas connection string, replace its password placeholder, and include the app database name after `.net/`.

Vercel Hobby may not provide a fixed outbound IP for Atlas allowlisting. If you use `0.0.0.0/0` for a personal demo, choose a unique strong database password, limit the database user to the app database, and do not store sensitive information in the demo. Remove the broad access rule when you stop sharing the app.

### Vercel API project

1. Import the GitHub repository into Vercel and set **Root Directory** to `todo-api`.
2. Add the following variables for **Production** in **Settings → Environment Variables**:

   | Name | Value |
   | --- | --- |
   | `NODE_ENV` | `production` |
   | `MONGODB_URI` | Complete Atlas connection string, including database name |
   | `JWT_SECRET` | Private random secret of at least 32 bytes |
   | `FRONTEND_URL` | `https://worktodo-2026.vercel.app` |
   | `TRUST_PROXY_HOPS` | `1` |
   | `SESSION_COOKIE_SAME_SITE` | `lax` |

3. Deploy or redeploy the API after setting the variables.

### Vercel frontend project

1. Import the same GitHub repository as a second Vercel project and set **Root Directory** to `todo-frontend`.
2. The current `todo-frontend/vercel.json` rewrites `/auth` and `/tasks` to `https://worktodo2026.vercel.app`. If your API project has a different domain, update this hostname and push the change to GitHub.
3. Set the Production environment variable `VITE_ENABLE_PROFILE_UPLOAD=false`.
4. Deploy or redeploy the frontend.

Vercel's function filesystem is temporary, so profile photo uploads are disabled in the hosted demo. They remain available during local development. After deployment, check registration, login, task creation and editing, completion, deletion, logout, and direct refresh of `/tasks`.

Vercel Hobby is intended for personal, non-commercial projects. Vercel and Atlas free tiers have usage and storage limits; review their current terms before relying on the demo for production or commercial use.

---

## 🧰 Troubleshooting

- **`404` with `DEPLOYMENT_NOT_FOUND` on `/auth/register`:** Confirm the API hostname in `todo-frontend/vercel.json` matches the deployed API domain, then redeploy the frontend.
- **`500` on registration:** Check the API project's Production `MONGODB_URI` and `JWT_SECRET`. Confirm the Atlas database user has `readWrite` access to the database named in the URI and that Atlas network access is active. Redeploy the API after changing variables.
- **`403` request-origin error:** Set the API's `FRONTEND_URL` to the exact frontend URL, including `https://` and without a trailing slash.
- **`429` during registration or login:** The API limits repeated attempts. Wait for the rate limit window to reset before retrying.
- **Environment variable changes have no effect:** Redeploy the Vercel project after saving the changed variable.

---

## 🔐 Security Notes

- Keep `.env`, database credentials, and `JWT_SECRET` out of GitHub and public messages.
- Use a dedicated Atlas database user with access only to this app's database.
- The API stores session tokens in HTTP-only cookies and checks task ownership on protected routes.
- Use demo accounts and sample tasks only; do not add sensitive personal information.
