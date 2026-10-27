'use client';

import { useCallback, useEffect, useState } from 'react';
import { SECTIONS, longDate, reportPath, reportPlainText } from '@/lib/reportFormat';
import styles from '../admin.module.css';

const todayPT = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });

const blank = () => ({
  id: null,
  report_date: todayPT(),
  summary: '',
  water_temp: '',
  ...Object.fromEntries(SECTIONS.map((s) => [s.key, ''])),
  published_at: null,
});

// null → '' so every field is a controlled input.
const toForm = (r) => Object.fromEntries(Object.entries({ ...blank(), ...r }).map(([k, v]) => [k, v ?? '']));

export default function ReportsManager() {
  const [reports, setReports] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/reports');
    const data = await res.json().catch(() => ({}));
    if (res.ok) setReports(data.reports);
    else setError(data.error || 'Could not load reports');
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  function open(report) {
    setError('');
    setNotice('');
    setCopied(false);
    setForm(report ? toForm(report) : blank());
  }

  // Creates the row on first save, then updates it. publish: true, false or undefined (leave as is).
  async function save(publish) {
    setError('');
    setNotice('');
    setBusy(true);
    try {
      const fields = { ...form };
      delete fields.id;
      let id = form.id;
      if (!id) {
        const res = await fetch('/api/admin/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fields),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not save');
        id = data.report.id;
        setForm(toForm(data.report));
      }
      const res = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fields, id, publish }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save');
      setForm(toForm(data.report));
      setNotice(
        publish === true ? 'Published. It is live on /report/ now.'
          : publish === false ? 'Unpublished. It is a draft again and off the site.'
            : data.report.published_at ? 'Saved. The live page is updated.' : 'Draft saved.'
      );
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeDraft() {
    if (!form.id || !window.confirm('Delete this draft? This cannot be undone.')) return;
    setBusy(true);
    const res = await fetch(`/api/admin/reports?id=${form.id}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error || 'Could not delete');
    setForm(null);
    load();
  }

  async function copyText() {
    await navigator.clipboard.writeText(reportPlainText(form));
    setCopied(true);
  }

  const live = Boolean(form?.published_at);

  return (
    <div style={{ display: 'grid', gap: '2rem' }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <button type="button" className="btn btn--primary" onClick={() => open(null)} disabled={busy}>
          New report
        </button>
        <a href="/report/" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem' }}>View /report/</a>
      </div>

      {form && (
        <form className={styles.formCard} style={{ maxWidth: '46rem' }} onSubmit={(e) => { e.preventDefault(); save(); }}>
          <strong style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {form.id ? `Report for ${longDate(form.report_date)}` : 'New report'}{' '}
            <span className={`${styles.badge} ${live ? styles.badgeConfirmed : styles.badgePending}`}>{live ? 'Live' : 'Draft'}</span>
          </strong>
          {error && <div className={styles.error}>{error}</div>}
          {notice && <div className={styles.success}>{notice}</div>}

          <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))' }}>
            <div>
              <label className={styles.label} htmlFor="r-date">Report date (the URL)</label>
              <input id="r-date" className={styles.input} type="date" required value={form.report_date} onChange={set('report_date')} />
            </div>
            <div>
              <label className={styles.label} htmlFor="r-temp">Water temperature</label>
              <input id="r-temp" className={styles.input} placeholder="62°F" maxLength={40} value={form.water_temp} onChange={set('water_temp')} />
            </div>
          </div>

          <div>
            <label className={styles.label} htmlFor="r-summary">Summary (one or two sentences, shown first and in Google)</label>
            <textarea id="r-summary" className={styles.input} rows={3} maxLength={400} required
              placeholder="Humpbacks feeding mid-channel all week, calico bass biting on the kelp, lobster still strong at the islands."
              value={form.summary} onChange={set('summary')} />
          </div>

          {SECTIONS.map((s) => (
            <div key={s.key}>
              <label className={styles.label} htmlFor={`r-${s.key}`}>{s.heading} (optional)</label>
              <textarea id={`r-${s.key}`} className={styles.input} rows={4} maxLength={4000}
                placeholder={s.hint} value={form[s.key]} onChange={set(s.key)} />
            </div>
          ))}
          <p style={{ fontSize: '0.8rem', color: '#6b7686', margin: 0 }}>
            Leave a blank line between paragraphs. Empty sections are left off the page.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button type="submit" className="btn btn--outline-dark" disabled={busy}>
              {busy ? 'Saving…' : live ? 'Save changes' : 'Save draft'}
            </button>
            {!live && (
              <button type="button" className="btn btn--primary" disabled={busy} onClick={() => save(true)}>Publish</button>
            )}
            {live && (
              <>
                <a href={reportPath(form)} target="_blank" rel="noopener noreferrer" className="btn btn--outline-dark">View live</a>
                <button type="button" className={styles.smallBtn} disabled={busy} onClick={() => save(false)}>Unpublish</button>
              </>
            )}
            {form.id && !live && (
              <button type="button" className={styles.smallBtn} disabled={busy} onClick={removeDraft}>Delete draft</button>
            )}
            <button type="button" className={styles.smallBtn} onClick={() => setForm(null)}>Close</button>
          </div>

          <div>
            <label className={styles.label} htmlFor="r-plain">Same report as text, for Google Business Profile, Instagram or email</label>
            <textarea id="r-plain" className={styles.input} rows={8} readOnly value={reportPlainText(form)} />
            <button type="button" className={styles.smallBtn} style={{ marginTop: '0.5rem' }} onClick={copyText}>
              {copied ? 'Copied' : 'Copy text'}
            </button>
          </div>
        </form>
      )}

      {reports === null ? (
        <p className={styles.empty}>Loading…</p>
      ) : reports.length === 0 ? (
        <p className={styles.empty}>No reports yet. Click New report to write the first one.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr><th>Date</th><th>Status</th><th>Summary</th><th></th></tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id}>
                <td style={{ whiteSpace: 'nowrap' }}>{longDate(r.report_date)}</td>
                <td>
                  <span className={`${styles.badge} ${r.published_at ? styles.badgeConfirmed : styles.badgePending}`}>
                    {r.published_at ? 'Live' : 'Draft'}
                  </span>
                </td>
                <td>{r.summary || <em style={{ color: '#6b7686' }}>No summary yet</em>}</td>
                <td><button type="button" className={styles.smallBtn} onClick={() => open(r)}>Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
