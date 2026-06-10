# Backend

Express API for the outbound calling. Runs on Vercel as a serverless function
(`api/index.js` serves the whole app, `vercel.json` rewrites all paths to it).

## Local

```
cp .env.example .env
npm install
npm run dev
```

Runs on http://localhost:4000. Without Supabase keys it uses an in-memory store.

## Routes

- POST `/auth/login` - login with fixed creds, returns a JWT
- POST `/contacts/upload` - upload CSV (form field `file`), needs token
- GET `/contacts/responses` - list responses (decrypted), needs token
- POST `/calls/start` - dial all pending contacts, needs token
- POST `/twilio/voice` `/twilio/menu` `/twilio/collect` `/twilio/status` - Twilio webhooks

## Vercel env vars

Set everything from `.env.example`. After the first deploy set `PUBLIC_BASE_URL` to
the deployed URL and redeploy (Twilio needs an absolute webhook URL).

## Twilio

Put Account SID, Auth Token and a voice number in the env. No manual webhook setup -
each call is created pointing back to this backend. Keep `TWILIO_VALIDATE_SIGNATURE=true`
in production.

## Encryption

Collected fields go through AES-256-GCM (`src/lib/crypto.js`) before they hit the DB,
so the DB only stores ciphertext. They're decrypted in memory when the dashboard asks
for them. `ENCRYPTION_KEY` is required in prod and must stay the same or old rows can't
be read.
