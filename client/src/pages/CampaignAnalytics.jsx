import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function CampaignAnalytics() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [id]);

  const fetchAnalytics = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API}/api/campaigns/${id}/analytics`, {
  headers: {
    Authorization: `Bearer ${token}`,
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  },
  params: {
    _t: Date.now(),
  },
});
        setAnalytics(res.data);
    } catch (err) {
        setError(err?.response?.data?.message || 'Unable to load analytics.');
    } finally {
        setLoading(false);
        setRefreshing(false);
    }
};

  if (loading) {
    return (
      <>
        <header className="topbar">
          <div>
            <h1 className="greeting">Campaign Analytics</h1>
            <p className="greeting-sub">Loading analytics for your campaign.</p>
          </div>
        </header>
        <div className="gmail-banner" style={{ justifyContent: 'center' }}>Loading analytics...</div>
      </>
    );
  }

  if (error || !analytics) {
    return (
      <>
        <header className="topbar">
          <div>
            <h1 className="greeting">Campaign Analytics</h1>
            <p className="greeting-sub">Unable to load analytics for this campaign.</p>
          </div>
        </header>
        <div className="gmail-banner" style={{ justifyContent: 'center' }}>{error || 'No analytics available.'}</div>
      </>
    );
  }

  const { campaign, stats, rates } = analytics;
  const metrics = [
    { label: 'Total Recipients', value: stats.totalRecipients },
    { label: 'Sent', value: stats.sent },
    { label: 'Bounced', value: stats.bounced },
    { label: 'Opened', value: stats.opened },
    { label: 'Clicked', value: stats.clicked ?? 0 },
    { label: 'Replied', value: stats.replied },
  ];

  return (
    <>
      <header className="topbar" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="greeting">Campaign Analytics</h1>
          <p className="greeting-sub">{campaign?.name || 'Campaign performance overview'}</p>
        </div>
        <button onClick={() => navigate(`/campaigns/${id}`)} style={{ minWidth: '140px', padding: '10px 16px', borderRadius: '8px', border: '1px solid #2d2d2d', background: '#2d2d2d', color: '#fff', cursor: 'pointer' }}>
          Back to Details
        </button>
        <button
  onClick={() => fetchAnalytics(true)}
  disabled={refreshing}
  style={{ minWidth: '140px', padding: '10px 16px', borderRadius: '8px', border: '1px solid #2d2d2d', background: '#fff', color: '#2d2d2d', cursor: 'pointer' }}
>
  {refreshing ? 'Refreshing...' : 'Refresh Stats'}
</button>
      </header>
      {analytics.syncWarning ? (
  <div className="gmail-banner" style={{ marginBottom: '1rem', background: '#fff8e6', color: '#8a6100' }}>
    {analytics.syncWarning}
  </div>
) : null}
      <section className="stats-grid">
        {metrics.map((item) => (
          <div key={item.label} className="stat-card">
            <div className="stat-value">{item.value}</div>
            <div className="stat-label">{item.label}</div>
          </div>
        ))}
      </section>

      <section style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
      
        <div className="stat-card">
          <div className="stat-value">{rates.openRate}%</div>
          <div className="stat-label">Open Rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{rates.clickRate}%</div>
          <div className="stat-label">Click Rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{rates.replyRate}%</div>
          <div className="stat-label">Reply Rate</div>
        </div>
      </section>

      <section style={{ background: '#fff', border: '1px solid #e4e2db', borderRadius: '12px', padding: '1.25rem' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '0.75rem' }}>Campaign Overview</h2>
        <div style={{ display: 'grid', gap: '8px' }}>
          <div><strong>Subject:</strong> {campaign?.subject || '—'}</div>
          <div><strong>Status:</strong> {campaign?.status || '—'}</div>
          <div><strong>Created:</strong> {campaign?.createdAt ? new Date(campaign.createdAt).toLocaleDateString() : '—'}</div>
        </div>
      </section>
    </>
  );
}