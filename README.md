# Work To Do

A task planner built with React, Vite, Express, and MongoDB.

## Project layout


todo-api/
  auth/          Session cookie settings
  config/        Database connection
  controllers/   Request and task logic
  middleware/   Authentication and request checks
  models/        MongoDB models
  routes/        HTTP endpoints
  test/          API security tests
  utils/         Shared API logging utilities

todo-frontend/src/
  components/    Shared UI and dashboard sections
  hooks/         Dashboard state and data loading
  pages/         Route-level pages
  services/      API client
  styles/        Global styles grouped by interface area
  utils/         Shared date helpers


## Run locally

1. Run `npm install` in both `todo-api` and `todo-frontend`.
2. Copy `todo-api/.env.example` to `todo-api/.env`, then set `MONGODB_URI` and a random `JWT_SECRET` of at least 32 bytes.
3. Start the API with `node index.js` from `todo-api`.
4. Start the frontend with `npm start` from `todo-frontend`.

The frontend runs at `http://localhost:5173` and calls the API at `http://localhost:5000` by default. Run API tests with `npm test` from `todo-api`, or create a production frontend build with `npm run build` from `todo-frontend`.

## Free Vercel + MongoDB Atlas demo

Deploy this monorepo as two Vercel projects so the React site and Express API can scale independently while staying on Vercel's free personal tier:

1. Create an Atlas **M0 Free** cluster and a database user with `readWrite` access to one app database. Add the network access entry needed by Vercel (see the security note below) and copy the `mongodb+srv://...` connection string.
2. Import this Git repository into Vercel twice. For the API project, set **Root Directory** to `todo-api`; for the web project, set it to `todo-frontend`. Deploy the API first.
3. In `todo-frontend/vercel.json`, replace every `YOUR-API-PROJECT` with the API project's stable `.vercel.app` hostname (without `https://`). Commit and push that change, then deploy the web project.
4. Add these API environment variables in Vercel for **Production**:
   - `NODE_ENV=production`
   - `MONGODB_URI` = the Atlas connection string
   - `JWT_SECRET` = a newly generated random secret of at least 32 bytes
   - `FRONTEND_URL` = the web project's exact `https://....vercel.app` origin
   - `TRUST_PROXY_HOPS=1`
   - `SESSION_COOKIE_SAME_SITE=lax`
5. Add this web environment variable in Vercel for **Production**: `VITE_ENABLE_PROFILE_UPLOAD=false`. No API URL is needed because Vercel rewrites `/auth` and `/tasks` through the web origin. Redeploy after changing environment variables.
6. Open the web URL and check registration, login, task add/edit/complete/delete, logout, and refreshing `/tasks`.

Vercel's function filesystem is temporary, so profile photo uploads are disabled on this deployment; they remain available in local development. Don't store secrets in `VITE_` variables.

**Atlas network access:** Vercel Hobby does not provide a fixed outbound IP for Atlas allowlisting. For a small demo, Atlas may require `0.0.0.0/0`; this allows connection attempts from any IP, so use a unique strong database password, restrict the database user's role to `readWrite` on the app database, put no sensitive data in the demo, and remove the broad access rule when the demo is no longer public. Atlas access-list changes can take a few minutes to apply.

Vercel Hobby is intended for personal, non-commercial projects and has usage limits. Check the current Vercel and Atlas free-tier limits before sharing the demo widely.
