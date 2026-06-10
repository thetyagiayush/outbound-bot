const express = require('express');
const multer = require('multer');
const Papa = require('papaparse');
const db = require('../lib/db');
const { decryptJson } = require('../lib/crypto');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

function pick(row, keys) {
  const norm = {};
  for (const k of Object.keys(row)) norm[k.toLowerCase().replace(/[^a-z0-9]/g, '')] = row[k];
  for (const k of keys) {
    const v = norm[k];
    if (v != null && String(v).trim() !== '') return String(v).trim();
  }
  return '';
}

router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const text = req.file.buffer.toString('utf8');
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
  if (parsed.errors && parsed.errors.length) {
    return res.status(400).json({ error: 'CSV parse error', details: parsed.errors.slice(0, 3) });
  }

  const rows = parsed.data
    .map((r) => ({
      name: pick(r, ['name', 'fullname', 'firstname', 'contactname']),
      phone: pick(r, ['phone', 'phonenumber', 'mobile', 'number', 'cell']),
      raw: r,
    }))
    .filter((r) => r.phone);

  if (!rows.length) return res.status(400).json({ error: 'No valid phone numbers found' });

  const inserted = await db.insertContacts(rows.map(({ name, phone, raw }) => ({ name, phone, raw })));
  return res.json({ inserted: inserted.length, contacts: inserted });
});

router.get('/responses', requireAuth, async (req, res) => {
  const rows = await db.listResponses();
  const responses = rows.map((r) => {
    let collected = {};
    try {
      collected = r.collected_enc ? decryptJson(r.collected_enc) : {};
    } catch (err) {
      collected = { _error: 'Could not decrypt' };
    }
    const { collected_enc, ...rest } = r;
    return { ...rest, collected };
  });
  res.json({ responses });
});

module.exports = router;
