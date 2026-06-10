const twilio = require('twilio');
const config = require('../config');

let restClient = null;
function client() {
  if (!config.twilio.accountSid || !config.twilio.authToken) {
    throw new Error('Twilio credentials not configured');
  }
  if (!restClient) {
    restClient = twilio(config.twilio.accountSid, config.twilio.authToken);
  }
  return restClient;
}

async function placeCall({ to, contactId }) {
  const base = config.publicBaseUrl.replace(/\/$/, '');
  return client().calls.create({
    to,
    from: config.twilio.fromNumber,
    url: `${base}/twilio/voice?contactId=${encodeURIComponent(contactId)}`,
    method: 'POST',
    statusCallback: `${base}/twilio/status?contactId=${encodeURIComponent(contactId)}`,
    statusCallbackEvent: ['completed'],
    statusCallbackMethod: 'POST',
  });
}

module.exports = { client, placeCall, twilio };
