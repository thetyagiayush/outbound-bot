const crypto = require('crypto');

const ALGO = 'aes-256-gcm';
const PREFIX = 'v1';
let ephemeralKey = null;
let warned = false;

function loadKey() {
  const raw = process.env.ENCRYPTION_KEY || '';
  if (raw) {
    if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, 'hex');
    const b = Buffer.from(raw, 'base64');
    if (b.length === 32) return b;
    throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex chars or base64).');
  }
  if (!warned) {
    console.warn('ENCRYPTION_KEY not set, using temporary key');
    warned = true;
  }
  if (!ephemeralKey) ephemeralKey = crypto.randomBytes(32);
  return ephemeralKey;
}

function encryptJson(value) {
  const key = loadKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}:${Buffer.concat([iv, tag, ct]).toString('base64')}`;
}

function decryptJson(payload) {
  if (!payload || typeof payload !== 'string') return null;
  const [prefix, b64] = payload.split(':');
  if (prefix !== PREFIX || !b64) throw new Error('Bad ciphertext format');
  const buf = Buffer.from(b64, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ct = buf.subarray(28);
  const decipher = crypto.createDecipheriv(ALGO, loadKey(), iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
  return JSON.parse(pt);
}

module.exports = { encryptJson, decryptJson };
