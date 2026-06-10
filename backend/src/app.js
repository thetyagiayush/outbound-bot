const express = require('express');
const cors = require('cors');
const config = require('./config');

const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contacts');
const callRoutes = require('./routes/calls');
const twilioRoutes = require('./routes/twilio');
const db = require('./lib/db');

const app = express();

app.use(
  cors({
    origin: config.corsOrigins.includes('*') ? true : config.corsOrigins,
    credentials: false,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) =>
  res.json({
    ok: true,
    service: 'twiml-outbound-backend',
    db: db.isConfigured() ? 'postgres' : 'memory',
    time: new Date().toISOString(),
  }),
);
app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/auth', authRoutes);
app.use('/contacts', contactRoutes);
app.use('/calls', callRoutes);
app.use('/twilio', twilioRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found', path: req.originalUrl }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

module.exports = app;
