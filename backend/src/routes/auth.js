const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config');

const router = express.Router();

function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const ok = safeEqual(username || '', config.auth.username) && safeEqual(password || '', config.auth.password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ sub: config.auth.username, role: 'admin' }, config.auth.jwtSecret, {
    expiresIn: config.auth.tokenTtl,
  });
  return res.json({ token, expiresIn: config.auth.tokenTtl });
});

module.exports = router;
