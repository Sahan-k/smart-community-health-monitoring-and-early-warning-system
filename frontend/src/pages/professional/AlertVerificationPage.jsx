import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, CheckCircle2, Search, MessageSquare, AlertCircle, FileCheck } from 'lucide-react';
import api from '../../services/api';

export default function AlertVerificationPage() {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedAlert, setSelectedAlert] = useState(null);

  const [decision, setDecision] = useState('verified');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchAlerts = () => {
    setLoading(true);
    api.get(`/api/alerts${activeTab ? `?status_filter=${activeTab}` : ''}`)
      .then(res => {
        setAlerts(res.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAlerts();
  }, [activeTab]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAlert) return;
    setSubmitting(true);
    setSuccessMsg('');

    try {
      await api.post(`/api/alerts/${selectedAlert.id}/review`, {
        decision: decision,
        comments: comments
      });

      setSuccessMsg(`Alert #${selectedAlert.id} status updated to '${decision.toUpperCase()}'.`);
      setSelectedAlert(null);
      setComments('');
      fetchAlerts();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to submit alert verification decision.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1rem' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', padding: '0.6rem', borderRadius: '12px' }}>
          <ShieldAlert size={24} color="#ffffff" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f8fafc' }}>
            {t('alerts.title')}
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            {t('alerts.subtitle')}
          </p>
        </div>
      </div>

      {successMsg && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={20} /> {successMsg}
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { key: 'pending', label: t('alerts.tabPending') },
          { key: 'verified', label: t('alerts.tabVerified') },
          { key: 'rejected', label: t('alerts.tabRejected') },
          { key: 'investigate', label: t('alerts.tabInvestigate') }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setSelectedAlert(null); }}
            className={activeTab === tab.key ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedAlert ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
        
        {/* Alerts List */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '1rem' }}>
            {t('alerts.tabAll')} ({alerts.length})
          </h2>

          {loading ? (
            <div style={{ color: '#94a3b8' }}>{t('common.loading')}</div>
          ) : alerts.length === 0 ? (
            <div style={{ color: '#64748b', padding: '1.5rem 0' }}>{t('alerts.noAlertsFound')}</div>
          ) : (
            <div style={{ display: 'grid', gap: '0.8rem' }}>
              {alerts.map(alert => (
                <div
                  key={alert.id}
                  onClick={() => setSelectedAlert(alert)}
                  style={{
                    background: selectedAlert?.id === alert.id ? '#334155' : '#0f172a',
                    border: `1px solid ${selectedAlert?.id === alert.id ? '#0284c7' : '#334155'}`,
                    borderRadius: '8px',
                    padding: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                      {alert.title}
                    </span>
                    <span className={`badge badge-${alert.status}`}>
                      {alert.status}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>
                    {alert.message}
                  </p>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{t('common.location')}: {alert.location_name}</span>
                    <span>{t('common.date')}: {new Date(alert.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Verification Action Panel */}
        {selectedAlert && (
          <div className="glass-card" style={{ padding: '1.5rem', position: 'sticky', top: '90px', height: 'fit-content' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>
              {t('alerts.reviewTitle')} #{selectedAlert.id}
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1.2rem' }}>
              {selectedAlert.title}
            </p>

            <form onSubmit={handleReviewSubmit}>
              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                  {t('alerts.decision')}
                </label>
                <select
                  value={decision}
                  onChange={e => setDecision(e.target.value)}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '0.7rem', color: '#f8fafc', fontSize: '0.85rem', outline: 'none' }}
                >
                  <option value="verified">{t('alerts.decisionVerified')}</option>
                  <option value="rejected">{t('alerts.decisionRejected')}</option>
                  <option value="investigate">{t('alerts.decisionInvestigate')}</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                  {t('alerts.officerComments')}
                </label>
                <textarea
                  rows="4"
                  value={comments}
                  onChange={e => setComments(e.target.value)}
                  placeholder={t('alerts.commentsPlaceholder')}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '0.75rem', color: '#f8fafc', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" disabled={submitting} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  {submitting ? t('common.loading') : t('alerts.confirmDecision')}
                </button>
                <button type="button" onClick={() => setSelectedAlert(null)} className="btn-secondary">
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
