import React, { useEffect, useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  CheckCircle2,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Check,
  CheckCheck,
  Filter,
  Inbox,
  AlertCircle,
  MapPin,
  HeartPulse,
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';

export default function NotificationsPage() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, high, medium

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/notifications');
      setNotifications(res.data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      showToast('Failed to load notifications.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      showToast('Notification marked as read.', 'success', 2500);
    } catch (err) {
      console.error(err);
      showToast('Failed to mark notification as read.', 'error');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/api/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      showToast('All notifications marked as read.', 'success');
    } catch (err) {
      // Fallback: mark each unread one by one
      const unreadList = notifications.filter((n) => !n.is_read);
      await Promise.all(unreadList.map((n) => api.put(`/api/notifications/${n.id}/read`).catch(() => {})));
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      showToast('All notifications marked as read.', 'success');
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filteredNotifications = notifications.filter((n) => {
    const titleLower = (n.title || '').toLowerCase();
    const msgLower = (n.message || '').toLowerCase();

    if (filter === 'unread') return !n.is_read;
    if (filter === 'high') return titleLower.includes('high') || msgLower.includes('high risk');
    if (filter === 'medium') return titleLower.includes('medium') || msgLower.includes('medium risk');
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div
        className="saas-card"
        style={{
          padding: '1.75rem 2rem',
          background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.15) 0%, rgba(15, 26, 54, 0.8) 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #0284c7, #0d9488)',
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(2, 132, 199, 0.4)',
            }}
          >
            <Bell size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.2 }}>
                {t('notifications.title')}
              </h1>
              {unreadCount > 0 && (
                <span
                  style={{
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '9999px',
                  }}
                >
                  {unreadCount} {t('notifications.unread')}
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.2rem' }}>
              {t('notifications.subtitle')}
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="btn-secondary"
            style={{ padding: '0.55rem 1rem', fontSize: '0.82rem' }}
          >
            <CheckCheck size={16} color="#34d399" />
            <span>{t('notifications.markAllRead')}</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: `${t('common.all')} (${notifications.length})` },
          { id: 'unread', label: `${t('notifications.unread')} (${unreadCount})` },
          { id: 'high', label: t('risk.highRisk') },
          { id: 'medium', label: t('risk.mediumRisk') },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={filter === item.id ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '0.45rem 0.95rem', fontSize: '0.82rem' }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="saas-card" style={{ padding: '3.5rem', textAlign: 'center', color: '#94a3b8' }}>
          Loading notification logs...
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="saas-card" style={{ padding: '3.5rem', textAlign: 'center' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}
          >
            <Inbox size={32} color="#10b981" />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>
            {t('notifications.empty')}
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.35rem', maxWidth: '420px', margin: '0.35rem auto 0' }}>
            {filter === 'unread'
              ? t('notifications.allCaughtUp')
              : t('notifications.noMatchingCategory')}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredNotifications.map((notif) => {
            const isHigh =
              (notif.title || '').toLowerCase().includes('high') ||
              (notif.message || '').toLowerCase().includes('high risk');
            const isMed =
              (notif.title || '').toLowerCase().includes('medium') ||
              (notif.message || '').toLowerCase().includes('medium risk');

            const borderColor = isHigh ? '#ef4444' : isMed ? '#f59e0b' : notif.is_read ? '#1e293b' : '#0284c7';

            return (
              <div
                key={notif.id}
                className="saas-card"
                style={{
                  padding: '1.5rem',
                  borderLeft: `4px solid ${borderColor}`,
                  background: notif.is_read ? 'rgba(12, 20, 38, 0.6)' : 'rgba(16, 28, 56, 0.85)',
                  boxShadow: !notif.is_read ? '0 8px 24px rgba(0, 0, 0, 0.45)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    {isHigh ? (
                      <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '0.45rem', borderRadius: '8px' }}>
                        <ShieldAlert size={20} color="#ef4444" />
                      </div>
                    ) : isMed ? (
                      <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '0.45rem', borderRadius: '8px' }}>
                        <AlertTriangle size={20} color="#f59e0b" />
                      </div>
                    ) : (
                      <div style={{ background: 'rgba(2, 132, 199, 0.2)', padding: '0.45rem', borderRadius: '8px' }}>
                        <Bell size={20} color="#38bdf8" />
                      </div>
                    )}

                    <div>
                      <h3
                        style={{
                          fontSize: '1.05rem',
                          fontWeight: 700,
                          color: notif.is_read ? '#cbd5e1' : '#f8fafc',
                        }}
                      >
                        {notif.title}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.74rem', color: '#64748b', marginTop: '0.15rem' }}>
                        <Clock size={13} />
                        {new Date(notif.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    {isHigh && <span className="badge badge-high" style={{ fontSize: '0.68rem' }}>{t('risk.highRisk')}</span>}
                    {isMed && <span className="badge badge-medium" style={{ fontSize: '0.68rem' }}>{t('risk.mediumRisk')}</span>}
                    
                    {!notif.is_read ? (
                      <button
                        type="button"
                        onClick={() => markAsRead(notif.id)}
                        className="btn-secondary"
                        style={{ padding: '0.3rem 0.75rem', fontSize: '0.76rem' }}
                      >
                        <Check size={14} />
                        {t('notifications.markRead')}
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.74rem', color: '#64748b' }}>{t('common.status')}</span>
                    )}
                  </div>
                </div>

                {/* Message Body */}
                <p
                  style={{
                    fontSize: '0.88rem',
                    color: '#cbd5e1',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-line',
                    marginBottom: isHigh ? '0.85rem' : '0.2rem',
                    padding: '0.4rem 0.2rem',
                  }}
                >
                  {notif.message}
                </p>

                {/* Recommended Prevention Box for High Risk */}
                {isHigh && (
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      borderRadius: '8px',
                      padding: '0.65rem 0.85rem',
                      fontSize: '0.78rem',
                      color: '#fca5a5',
                    }}
                  >
                    <strong>Medical Directive:</strong> Immediately consult your nearest health worker or clinic if fever, cough, or gastrointestinal distress occurs. Maintain strict water and vector sanitation.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
