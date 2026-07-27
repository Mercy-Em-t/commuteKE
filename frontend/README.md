# Frontend Deployment (Vercel)

Use `/home/runner/work/commuteKE/commuteKE/frontend` as the Vercel project root for the React app.

## Required Vercel Settings

- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

## Routing

SPA routing is handled by `/home/runner/work/commuteKE/commuteKE/frontend/vercel.json`:
- all routes rewrite to `index.html` so direct visits (for example `/login`, `/routes`, `/track/...`) load correctly.

## Backend Note

This frontend project no longer contains API build/routes wiring in its `vercel.json`.
If backend deployment is needed, deploy `/home/runner/work/commuteKE/commuteKE/api` as a separate Vercel project (or define a dedicated monorepo root config where both frontend and backend paths are valid).
