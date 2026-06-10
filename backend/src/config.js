require('dotenv').config();

module.exports = {
  port: process.env.PORT || 4000,
  publicBaseUrl: process.env.PUBLIC_BASE_URL || '',
  corsOrigins: (process.env.CORS_ORIGINS || '*').split(',').map((s) => s.trim()).filter(Boolean),

  auth: {
    username: process.env.DASHBOARD_USERNAME || 'admin',
    password: process.env.DASHBOARD_PASSWORD || 'change-me',
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
    tokenTtl: process.env.JWT_TTL || '12h',
  },

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    fromNumber: process.env.TWILIO_FROM_NUMBER || '',
    callGapSeconds: Number(process.env.CALL_GAP_SECONDS || 1),
    validateSignature: String(process.env.TWILIO_VALIDATE_SIGNATURE || 'true') === 'true',
  },

  script: {
    intro: process.env.CALL_INTRO || 'Hello, thank you for taking our call. Press 1 if interested. Press 2 if not interested.',
    notInterested: process.env.CALL_NOT_INTERESTED || 'Thank you for your time. Goodbye.',
    collectPrompt: process.env.CALL_COLLECT_PROMPT || 'Great. Using your phone keypad, please enter the requested information, then press pound.',
    thankYou: process.env.CALL_THANK_YOU || 'Thank you. Your response has been recorded. Goodbye.',
    voice: process.env.TTS_VOICE || 'Polly.Joanna',
    language: process.env.TTS_LANGUAGE || 'en-US',
  },

  databaseUrl: process.env.DATABASE_URL || process.env.POSTGRES_URL || '',

  slack: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
  },
};
