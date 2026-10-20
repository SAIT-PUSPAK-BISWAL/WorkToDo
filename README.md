# Work To Do

A pastel-style personal task planner built with React, Vite, Express, and MongoDB. Create an account, organize tasks by category and priority, and plan deadlines from a responsive dashboard.

## Live demo

[Open Work To Do](https://worktodo-2026.vercel.app/)

The app is designed to work on desktop and mobile. Create your own account from the demo's registration page.

## Features

- Account registration and login with secure, HTTP-only session cookies
- Personal tasks with categories, priorities, due dates, and optional due times
- Search, status filters, category filters, and task sorting
- Daily planner with morning, afternoon, and evening groupings
- Task statistics for total, in progress, completed, due today, and overdue tasks
- Light and dark themes, adjustable text size, font choices, and task markers
- Responsive desktop, tablet, and mobile layouts
- Profile photo upload during local development

## Technology

| Area | Tools |
| --- | --- |
| Frontend | React, React Router, Vite, Axios |
| Backend | Node.js, Express 5 |
| Database | MongoDB with Mongoose |
| Authentication | bcryptjs, JWT in an HTTP-only cookie, MongoDB-backed sessions |
| Hosting | Vercel frontend and API projects; MongoDB Atlas database |

## Project structure

```text
todo/
├── README.md
├── todo-api/
│   ├── app.js                 Express application and middleware
│   ├── index.js               Local API server entry point
│   ├── auth/                  Session cookie configuration
│   ├── config/                MongoDB connection
│   ├── controllers/           Authentication and task handlers
│   ├── middleware/            Authentication and request checks
│   ├── models/                User, task, and session schemas
│   ├── routes/                Authentication, task, and upload routes
│   ├── test/                  API security tests
│   └── utils/                 Security event logging
└── todo-frontend/
    ├── index.html
    ├── vercel.json            API rewrites and SPA routing
    └── src/
        ├── components/        Pages and shared interface components
        ├── hooks/             Dashboard data and state
        ├── pages/             Route-level pages
        ├── services/          API client
        ├── styles/            Interface styles, including responsive rules
        └── utils/             Date helpers
```

## Run locally

### Requirements

- Node.js 20 or newer
- npm
- A MongoDB connection: a local MongoDB instance or a MongoDB Atlas cluster

### 1. Install dependencies

From the repository root, run:

```powershell
cd todo-api
npm install
cd ..\todo-frontend
npm install
cd ..
```

### 2. Configure the API

Copy the example environment file and edit `todo-api/.env`:

```powershell
Copy-Item todo-api/.env.example todo-api/.env
```

Set these values in `todo-api/.env`:

| Variable | Local value |
| --- | --- |
| `PORT` | `5000` |
| `MONGODB_URI` | Your MongoDB connection string, including a database name |
| `JWT_SECRET` | A random secret of at least 32 bytes |
| `FRONTEND_URL` | `http://localhost:5173` |
| `TRUST_PROXY_HOPS` | `0` |

Example MongoDB URI format:

```text
mongodb+srv://DB_USER:DB_PASSWORD@your-cluster.mongodb.net/worktodo?retryWrites=true&w=majority
```

Replace the example values with your own. If the password contains reserved URL characters, URL-encode it. Keep `.env` private; it is excluded from Git.

### 3. Start the API

Open a terminal in the repository root and run:

```powershell
cd todo-api
node index.js
```

The API listens at `http://localhost:5000`.

### 4. Start the frontend

Open a second terminal in the repository root and run:

```powershell
cd todo-frontend
npm start
```

Open `http://localhost:5173`. During local development, Vite forwards `/auth` and `/tasks` requests to the API on port 5000.

## API overview

Authentication routes are under `/auth`; task routes are under `/tasks`.

| Method | Path | Purpose | Login required |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Create an account | No |
| `POST` | `/auth/login` | Sign in | No |
| `GET` | `/auth/me` | Check the current session | Yes |
| `POST` | `/auth/logout` | End the current session | Yes |
| `GET` | `/auth/:id` | Read the signed-in user's profile | Yes |
| `GET` | `/tasks` | List the signed-in user's tasks | Yes |
| `POST` | `/tasks` | Create a task | Yes |
| `PUT` | `/tasks/:id` | Update a task | Yes |
| `DELETE` | `/tasks/:id` | Delete a task | Yes |

## Tests and production build

Run the API security tests:

```powershell
cd todo-api
npm test
```

Create a production frontend build:

```powershell
cd todo-frontend
npm run build
```

## Deploy the demo

The live demo uses two Vercel projects from this repository: one for the Express API and one for the React frontend. MongoDB Atlas stores account and task data.

### MongoDB Atlas

1. Create an Atlas project and an **M0 Free** cluster.
2. In **Database Access**, create a database user with `readWrite` access to the app database.
3. In **Network Access**, add the network access entry needed by Vercel.
4. Copy the Atlas connection string and replace the password placeholder. Include the database name after `.net/`, for example `/worktodo?retryWrites=true&w=majority`.

On Vercel's free Hobby plan, a fixed outbound IP may not be available for Atlas allowlisting. If you use `0.0.0.0/0` for a personal demo, use a unique strong database password, restrict the database role to the app database, and keep sensitive information out of the demo database. Remove the broad access entry when the demo is no longer needed.

### Vercel API project

1. Import the GitHub repository into Vercel and set **Root Directory** to `todo-api`.
2. Add these environment variables for **Production** in **Settings → Environment Variables**:

   | Name | Value |
   | --- | --- |
   | `NODE_ENV` | `production` |
   | `MONGODB_URI` | Your complete Atlas connection string |
   | `JWT_SECRET` | A private random secret of at least 32 bytes |
   | `FRONTEND_URL` | `https://worktodo-2026.vercel.app` |
   | `TRUST_PROXY_HOPS` | `1` |
   | `SESSION_COOKIE_SAME_SITE` | `lax` |

3. Deploy or redeploy the API after setting the environment variables.

### Vercel frontend project

1. Import the same GitHub repository as a second Vercel project and set **Root Directory** to `todo-frontend`.
2. The current `todo-frontend/vercel.json` forwards `/auth` and `/tasks` to `https://worktodo2026.vercel.app`. If the API project uses a different domain, replace that hostname in the file and push the change to GitHub.
3. Add the Production environment variable `VITE_ENABLE_PROFILE_UPLOAD=false`.
4. Deploy or redeploy the frontend.

Vercel's function filesystem is temporary, so profile photo uploads are disabled in the hosted demo. They remain available in local development. Do not put secrets in frontend variables prefixed with `VITE_`; those values are included in the browser bundle.

After deployment, check account registration, login, task creation and editing, task completion, deletion, logout, and a direct refresh of `/tasks`.

## Troubleshooting

- **`404` with `DEPLOYMENT_NOT_FOUND` on `/auth/register`:** check that the API hostname in `todo-frontend/vercel.json` matches the API project's deployed Vercel domain, then redeploy the frontend.
- **`500` on registration:** check the API project's Production `MONGODB_URI` and `JWT_SECRET`. Confirm the Atlas database user has `readWrite` access to the database named in the URI and that the Atlas network access entry is active. Redeploy the API after changing variables.
- **`403` request-origin error:** make sure the API's `FRONTEND_URL` exactly matches the frontend URL, including `https://` and without a trailing slash.
- **`429` while registering or logging in:** the API rate-limits repeated attempts. Wait for the limit window to reset before trying again.
- **Environment variable changes don't seem to apply:** redeploy the affected Vercel project after saving the variable.

## Security notes

- Never commit `.env` files, database passwords, or `JWT_SECRET` values.
- Use a separate database user for this demo with access only to the app database.
- The backend stores session tokens in HTTP-only cookies and validates task ownership on API requests.
- The hosted demo is intended for portfolio/interview review. Avoid using real personal or sensitive data.

## Free-tier notes

Vercel Hobby and Atlas M0 have usage, storage, and feature limits that can change. Review the providers' current plans and acceptable-use terms before relying on the demo for production or commercial use.
