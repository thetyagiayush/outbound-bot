# Outbound Calling Tool

Two separate apps:

- `backend` - Node + Express + Twilio, deploy on Vercel
- `frontend` - React + Vite dashboard, deploy on Vercel

It dials a contact list, plays a fixed script, takes keypad input (1 = interested,
2 = not), collects the details, stores them encrypted, and pings Slack on a new lead.
The team logs into the dashboard to see the data.

## Run locally

backend:
```
cd backend
cp .env.example .env
npm install
npm run dev
```

frontend:
```
cd frontend
cp .env.example .env
npm install
npm run dev
```

Backend works without a DATABASE_URL too (keeps data in memory) so you can test the
call flow first. Add the Neon DATABASE_URL for real storage.

## Generate the secrets

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"   // ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"   // JWT_SECRET
```

Keep ENCRYPTION_KEY the same forever, otherwise old rows won't decrypt.

## Deploy on Vercel (two projects, same repo)

backend project -> Root Directory = `backend`
frontend project -> Root Directory = `frontend`

Deploy backend first. Once it has a URL, put that URL in `PUBLIC_BASE_URL` (backend)
and `VITE_API_BASE_URL` (frontend), then redeploy.

## Data security

Card number and expiry are encrypted (AES-256-GCM) before going into the DB and only
decrypted when the logged-in team opens the dashboard. Slack only gets name + phone,
never the card. Login is required to see anything.
