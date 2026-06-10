# Frontend

React + Vite dashboard. Login page, contact upload, start calling, responses table.

## Local

```
cp .env.example .env
npm install
npm run dev
```

Set `VITE_API_BASE_URL` to the backend URL.

## Vercel

Root Directory = `frontend`. Add `VITE_API_BASE_URL` pointing to the backend. Vite is
auto-detected, `vercel.json` handles the SPA routing.

## Login

No password is kept in the frontend. The form sends what the user types to the backend,
which checks it against DASHBOARD_USERNAME / DASHBOARD_PASSWORD and returns a token.
