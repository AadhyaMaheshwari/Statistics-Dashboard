import { useEffect, useState } from 'react';
import { useLabels } from '../hooks/useLabels';
import './LabelManager.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const LABEL_META = {
  promotions: { emoji: '🏷️', canDelete: true,  permanent: false, protected: false, desc: 'Sales, offers, newsletters, marketing' },
  social:     { emoji: '💬', canDelete: true,  permanent: false, protected: false, desc: 'Facebook, Instagram, Twitter, Reddit' },
  google:     { emoji: '🔵', canDelete: true, permanent: false, protected: false, desc: 'Google services and alerts' },
  bank:       { emoji: '🏦', canDelete: false, permanent: false, protected: true,  desc: 'Bank alerts, statements, payments' },
  otp:        { emoji: '🔑', canDelete: true,  permanent: true,  protected: false, desc: 'One-time passwords and codes' },
  jobs:       { emoji: '💼', canDelete: true,  permanent: false, protected: false, desc: 'Job boards, LinkedIn, recruiters' },
  education:  { emoji: '🎓', canDelete: false, permanent: false, protected: false, desc: 'Courses, Education domains, certifications' },
};

const LABEL_NAMES = {
  promotions: 'Promotions',
  social:     'Social',
  google:     'Google',
  bank:       'Bank & Finance',
  otp:        'OTP & Alerts',
  jobs:       'Jobs & Career',
  education:  'Education',
};

export default function LabelManager() {
  const { labels, scanResults, loading, error, setup, scan, apply, deleteLabel, fetchLabels } = useLabels();
  const [setupDone,     setSetupDone]     = useState(false);
  const [scanMax,       setScanMax]       = useState(500);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [statusMsg,     setStatusMsg]     = useState('');
  const [statusType,    setStatusType]    = useState('info'); 

  useEffect(() => { fetchLabels(); }, []);

  function showStatus(msg, type = 'info') {
    setStatusMsg(msg);
    setStatusType(type);
  }

  async function handleSetup() {
    showStatus('Creating labels in your Gmail…', 'info');
    const result = await setup();
    if (result?.success) {
      setSetupDone(true);
      showStatus('✓ All 7 labels created in your Gmail', 'success');
      await fetchLabels();
    }
  }

  async function handleScan() {
    showStatus(`Scanning your last ${scanMax.toLocaleString()} emails…`, 'info');
    const result = await scan(scanMax);
    if (result?.success) {
      const total = Object.values(result.summary).reduce((s, v) => s + v.count, 0);
      showStatus(`Found ${total} emails to label across ${scanMax.toLocaleString()} scanned`, 'success');
    }
  }

  async function handleApply() {
    if (!scanResults) return;
    showStatus('Applying labels…', 'info');
    const result = await apply(scanResults);
    if (result?.success) {
      const total = Object.values(result.applied).reduce((s, v) => s + v, 0);
      showStatus(`✓ Labels applied to ${total} emails`, 'success');
    }
  }
  
const confirmAndDelete = async (labelKey) => {
  console.log("DELETE CLICKED:", labelKey);
  const token = localStorage.getItem('token');

  try {
    const res = await fetch(`${API}/api/labels/trash`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ labelKey }),
    });

    const text = await res.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch (parseErr) {
      console.error("Non-JSON response:", text);
      throw new Error('Unexpected response from server');
    }

    if (!res.ok) {
      throw new Error(data.error || data.message || 'Failed to trash emails');
    }

    console.log("Deleted:", data);
    showStatus(`✓ Trashed emails in ${labelKey}`, 'success');
    await fetchLabels();
  } catch (err) {
    console.error("❌ Delete failed:", err);
    showStatus(err.message || 'Failed to trash emails', 'error');
  }
};
  return (
    <div className="lm-wrap">
      {/* Header */}
      <div className="lm-header">
        <h3 className="lm-title">Label Manager</h3>
        <button
          className={`lm-btn lm-btn-setup ${setupDone ? 'lm-btn-done' : ''}`}
          onClick={handleSetup}
          disabled={loading || setupDone}
        >
          {setupDone ? 'Labels ready' : 'Set up labels in Gmail'}
        </button>
      </div>

      {/* Status */}
      {statusMsg && (
        <div className={`lm-status lm-status-${statusType}`}>{statusMsg}</div>
      )}
      {error && (
        <div className="lm-status lm-status-error">{error}</div>
      )}

      {/* Scan bar */}
      <div className="lm-scanbar">
        <span className="lm-scanbar-label">Scan last</span>
        <select
          className="lm-select"
          value={scanMax}
          onChange={e => setScanMax(Number(e.target.value))}
        >
          <option value={500}>500 emails</option>
          <option value={1000}>1,000 emails</option>
          <option value={2000}>2,000 emails</option>
          <option value={5000}>5,000 emails</option>
          <option value={10000}>10,000 emails</option>
        </select>
        <button
          className="lm-btn lm-btn-scan"
          onClick={handleScan}
          disabled={loading}
        >
          {loading ? 'Working…' : 'Scan inbox'}
        </button>
        {scanResults && (
          <button
            className="lm-btn lm-btn-apply"
            onClick={handleApply}
            disabled={loading}
          >
            Apply labels
          </button>
        )}
      </div>

      {/* Label rows */}
      <div className="lm-label-list">
        {Object.entries(LABEL_META).map(([key, meta]) => {
          const gmailLabel = labels.find(l => l.name === LABEL_NAMES[key]);
          const scanCount  = scanResults?.[key]?.count ?? null;

          return (
            <div key={key} className="lm-label-row">
              <span className="lm-label-emoji">{meta.emoji}</span>
              <div className="lm-label-info">
                <div className="lm-label-name">
                  {LABEL_NAMES[key]}
                  {meta.protected && (
                    <span className="lm-badge-protected">Protected</span>
                  )}
                </div>
                <div className="lm-label-sub">
                  {gmailLabel
                    ? `${(gmailLabel.messagesTotal ?? 0).toLocaleString()} emails in Gmail`
                    : 'Not set up yet'}
                  {scanCount !== null && (
                    <span className="lm-scan-count"> · {scanCount} to label</span>
                  )}
                </div>
              </div>

              {meta.canDelete && !meta.protected && (
  <button
    className={`lm-btn lm-btn-delete ${meta.permanent ? 'lm-btn-perm' : ''}`}
    onClick={() => setConfirmDelete(key)}
    disabled={loading}
    title=""
  >
                  {meta.permanent ? 'Delete all' : 'Trash all'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Confirm modal */}
      {confirmDelete && (
        <div className="lm-modal-overlay">
          <div className="lm-modal">
            <div className="lm-modal-title">
              {LABEL_META[confirmDelete]?.permanent ? 'Permanently delete' : 'Trash'} all{' '}
              {LABEL_NAMES[confirmDelete]} emails?
            </div>
            <div className="lm-modal-body">
              {LABEL_META[confirmDelete]?.permanent
                ? 'This cannot be undone. Emails will be permanently deleted
                : 'Emails move to Trash and are auto-deleted by Gmail after 30 days.'}
            </div>
            <div className="lm-modal-actions">
              <button className="lm-btn" onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
             <button onClick={() => { confirmAndDelete(confirmDelete); setConfirmDelete(null); }}>
  {LABEL_META[confirmDelete]?.permanent ? 'Delete all' : 'Trash'}
</button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}