const express = require('express');
const db = require('../lib/supabase');
const { placeCall } = require('../lib/twilio');
const config = require('../config');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

router.post('/start', requireAuth, async (req, res) => {
  if (!config.publicBaseUrl) {
    return res.status(400).json({ error: 'PUBLIC_BASE_URL is not set' });
  }

  const pending = await db.getPendingContacts();
  if (!pending.length) return res.json({ started: 0, message: 'No pending contacts' });

  res.json({ started: pending.length, message: `Dialing ${pending.length} contacts` });

  (async () => {
    for (const contact of pending) {
      try {
        await db.updateContactStatus(contact.id, 'dialing');
        await placeCall({ to: contact.phone, contactId: contact.id });
      } catch (err) {
        console.error(`Failed to call ${contact.phone}:`, err.message);
        await db.updateContactStatus(contact.id, 'failed').catch(() => {});
      }
      await sleep(config.twilio.callGapSeconds * 1000);
    }
  })();
});

module.exports = router;
