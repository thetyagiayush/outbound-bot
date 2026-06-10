const { createClient } = require('@supabase/supabase-js');
const config = require('../config');

let client = null;
if (config.supabase.url && config.supabase.serviceKey) {
  client = createClient(config.supabase.url, config.supabase.serviceKey, {
    auth: { persistSession: false },
  });
}

const isConfigured = () => Boolean(client);

const mem = { contacts: [], responses: [] };
let memId = 1;

async function insertContacts(rows) {
  if (client) {
    const { data, error } = await client.from('contacts').insert(rows).select();
    if (error) throw error;
    return data;
  }
  const inserted = rows.map((r) => ({ id: memId++, status: 'pending', ...r }));
  mem.contacts.push(...inserted);
  return inserted;
}

async function getPendingContacts() {
  if (client) {
    const { data, error } = await client.from('contacts').select('*').eq('status', 'pending');
    if (error) throw error;
    return data;
  }
  return mem.contacts.filter((c) => c.status === 'pending');
}

async function getContact(id) {
  if (client) {
    const { data, error } = await client.from('contacts').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  }
  return mem.contacts.find((c) => String(c.id) === String(id)) || null;
}

async function updateContactStatus(id, status) {
  if (client) {
    const { error } = await client.from('contacts').update({ status }).eq('id', id);
    if (error) throw error;
    return;
  }
  const c = mem.contacts.find((x) => String(x.id) === String(id));
  if (c) c.status = status;
}

async function saveResponse(row) {
  if (client) {
    const { data, error } = await client.from('responses').insert(row).select().single();
    if (error) throw error;
    return data;
  }
  const inserted = { id: memId++, created_at: new Date().toISOString(), ...row };
  mem.responses.push(inserted);
  return inserted;
}

async function listResponses() {
  if (client) {
    const { data, error } = await client.from('responses').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }
  return [...mem.responses].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

module.exports = {
  isConfigured,
  insertContacts,
  getPendingContacts,
  getContact,
  updateContactStatus,
  saveResponse,
  listResponses,
};
