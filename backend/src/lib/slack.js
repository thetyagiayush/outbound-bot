const config = require('../config');

async function notifyNewLead(response) {
  if (!config.slack.webhookUrl) return;

  const lines = [
    ':telephone_receiver: *New interested lead*',
    `*Name:* ${response.name || 'N/A'}`,
    `*Phone:* ${response.phone || 'N/A'}`,
    `*When:* ${response.created_at || new Date().toISOString()}`,
    'Open the dashboard to view the submitted details.',
  ];

  try {
    const res = await fetch(config.slack.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: lines.join('\n') }),
    });
    if (!res.ok) console.error('Slack webhook failed', res.status);
  } catch (err) {
    console.error('Slack notify error', err.message);
  }
}

module.exports = { notifyNewLead };
