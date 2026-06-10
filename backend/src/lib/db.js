const { neon } = require('@neondatabase/serverless');
const config = require('../config');

let sql = null;
if (config.databaseUrl) {
  sql = neon(config.databaseUrl);
}

const isConfigured = () => Boolean(sql);

const mem = { contacts: [], responses: [] };
let memId = 1;

async function insertContacts(rows) {
  if (sql) {
    const inserted = [];
    for (const r of rows) {
      const res = await sql`
        insert into contacts (name, phone, raw)
        values (${r.name}, ${r.phone}, ${JSON.stringify(r.raw || {})}::jsonb)
        returning *`;
      inserted.push(res[0]);
    }
    return inserted;
  }
  const inserted = rows.map((r) => ({ id: memId++, status: 'pending', ...r }));
  mem.contacts.push(...inserted);
  return inserted;
}

async function getPendingContacts() {
  if (sql) {
    return sql`select * from contacts where status = 'pending'`;
  }
  return mem.contacts.filter((c) => c.status === 'pending');
}

async function getContact(id) {
  if (sql) {
    const res = await sql`select * from contacts where id = ${id}`;
    return res[0] || null;
  }
  return mem.contacts.find((c) => String(c.id) === String(id)) || null;
}

async function updateContactStatus(id, status) {
  if (sql) {
    await sql`update contacts set status = ${status} where id = ${id}`;
    return;
  }
  const c = mem.contacts.find((x) => String(x.id) === String(id));
  if (c) c.status = status;
}

async function saveResponse(row) {
  if (sql) {
    const res = await sql`
      insert into responses (contact_id, name, phone, collected_enc)
      values (${row.contact_id}, ${row.name}, ${row.phone}, ${row.collected_enc})
      returning *`;
    return res[0];
  }
  const inserted = { id: memId++, created_at: new Date().toISOString(), ...row };
  mem.responses.push(inserted);
  return inserted;
}

async function listResponses() {
  if (sql) {
    return sql`select * from responses order by created_at desc`;
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
