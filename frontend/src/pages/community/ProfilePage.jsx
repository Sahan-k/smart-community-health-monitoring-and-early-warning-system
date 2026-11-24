import React, { useContext, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  User,
  Shield,
  Mail,
  Phone,
  Globe,
  Lock,
  Bell,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Save,
  KeyRound,
  Sliders,
  Check,
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

export default function ProfilePage() {
  const { user, logout } = useContext(AuthContext);
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get('tab') === 'settings' ? 'settings' : 'profile';

  // Profile Form State
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [preferredLang, setPreferredLang] = useState(user?.preferred_language || i18n.language || 'en');
  const [profileSaving, setProfileSaving] = useState(false);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdError, setPwdError] = useState('');

  // Notification Preferences State (local state simulation)
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      await api.put('/api/auth/profile', {
        full_name: fullName.trim(),
        preferred_language: preferredLang,
      });

      // Update active i18n language
      i18n.changeLanguage(preferredLang);
      localStorage.setItem('i18nextLng', preferredLang);

      // Update sessionStorage
      const saved = sessionStorage.getItem('user');
      if (saved) {
        const u = JSON.parse(saved);
        u.full_name = fullName.trim();
        u.preferred_language = preferredLang;
        sessionStorage.setItem('user', JSON.stringify(u));
      }

      showToast('Profile information successfully updated.', 'success');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to update profile.', 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwdError('');

    if (newPassword.length < 6) {
      setPwdError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('New passwords do not match.');
      return;
    }

    setPwdSaving(true);
    try {
      await api.put('/api/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });

      showToast('Password changed successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to change password.';
      setPwdError(msg);
      showToast(msg, 'error');
    } finally {
      setPwdSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Banner */}
      <div
        className="saas-card"
        style={{
          padding: '2rem',
          background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.15) 0%, rgba(20, 184, 166, 0.08) 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '1.75rem',
              fontWeight: 800,
              boxShadow: '0 8px 24px rgba(2, 132, 199, 0.4)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.2 }}>
                {user?.full_name || 'My Account'}
              </h1>
              <span className="badge badge-low" style={{ fontSize: '0.72rem' }}>
                {user?.role?.replace(/_/g, ' ') || 'Citizen'}
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.25rem' }}>
              @{user?.username || 'user'} • Registered Community Health Surveillance Node
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="btn-danger"
          style={{ padding: '0.55rem 1.1rem', fontSize: '0.84rem' }}
        >
          <LogOut size={16} /> {t('nav.logout')}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
          type="button"
          onClick={() => setSearchParams({ tab: 'profile' })}
          className={activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '0.55rem 1.25rem', fontSize: '0.88rem' }}
        >
          <User size={16} /> {t('profile.tabProfile')}
        </button>
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'settings' })}
          className={activeTab === 'settings' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '0.55rem 1.25rem', fontSize: '0.88rem' }}
        >
          <Sliders size={16} /> {t('profile.tabSettings')}
        </button>
      </div>

      {/* ── Tab 1: Profile Details ── */}
      {activeTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Read-Only Account Identity Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div className="saas-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 600 }}>
                <Mail size={15} color="#0284c7" /> {t('profile.email')}
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginTop: '0.4rem', wordBreak: 'break-all' }}>
                {user?.email || 'Not provided'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#34d399', marginTop: '0.2rem' }}>
                ✓ Primary High Risk SMTP Recipient
              </div>
            </div>

            <div className="saas-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 600 }}>
                <Phone size={15} color="#14b8a6" /> {t('profile.phone')}
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginTop: '0.4rem' }}>
                {user?.phone_number ? `+91 ${user.phone_number}` : 'Not provided'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
                Verified Indian Mobile Node
              </div>
            </div>

            <div className="saas-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 600 }}>
                <Shield size={15} color="#a855f7" /> {t('profile.role')}
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginTop: '0.4rem', textTransform: 'capitalize' }}>
                {user?.role?.replace(/_/g, ' ') || 'Citizen'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
                Role-Based Access Control
              </div>
            </div>
          </div>

          {/* Edit Profile Form */}
          <div className="saas-card" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.4rem' }}>
              {t('profile.editProfileTitle')}
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
              {t('profile.editProfileSubtitle')}
            </p>

            <form onSubmit={handleProfileSave}>
              <div style={{ marginBottom: '1.2rem' }}>
                <label className="input-label">{t('profile.fullName')}</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-control"
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="input-label">{t('profile.preferredLanguage')}</label>
                <select
                  value={preferredLang}
                  onChange={(e) => setPreferredLang(e.target.value)}
                  className="input-control"
                >
                  <option value="en">{t('profile.langEn')}</option>
                  <option value="kn">{t('profile.langKn')}</option>
                  <option value="hi">{t('profile.langHi')}</option>
                </select>
              </div>

              <button type="submit" disabled={profileSaving} className="btn-primary" style={{ padding: '0.75rem 1.4rem' }}>
                <Save size={16} />
                <span>{profileSaving ? t('common.updating') : t('profile.saveProfileBtn')}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Tab 2: Security & Preferences ── */}
      {activeTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Change Password Form */}
          <div className="saas-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <KeyRound size={20} color="#38bdf8" />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                {t('profile.changePasswordTitle')}
              </h2>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
              {t('profile.changePasswordSubtitle')}
            </p>

            {pwdError && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#f87171',
                  padding: '0.8rem 1rem',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  marginBottom: '1.2rem',
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <div>{pwdError}</div>
              </div>
            )}

            <form onSubmit={handlePasswordChange}>
              <div style={{ marginBottom: '1.1rem' }}>
                <label className="input-label">{t('profile.currentPassword')} *</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="input-control"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }} className="grid-2col">
                <div>
                  <label className="input-label">{t('profile.newPassword')} *</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('profile.min6Chars')}
                    className="input-control"
                  />
                </div>
                <div>
                  <label className="input-label">{t('profile.confirmNewPassword')} *</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('profile.reenterNewPassword')}
                    className="input-control"
                  />
                </div>
              </div>

              <button type="submit" disabled={pwdSaving} className="btn-primary" style={{ padding: '0.75rem 1.4rem' }}>
                <Lock size={16} />
                <span>{pwdSaving ? t('common.updating') : t('profile.updatePasswordBtn')}</span>
              </button>
            </form>
          </div>

          {/* Notification Preferences */}
          <div className="saas-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <Bell size={20} color="#14b8a6" />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                {t('profile.notificationPrefsTitle')}
              </h2>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
              {t('profile.notificationPrefsSubtitle')}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  background: 'rgba(10, 18, 38, 0.7)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#f8fafc' }}>
                    {t('profile.emailAlertsLabel')}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    {t('profile.emailAlertsDesc')}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => {
                    setEmailAlerts(e.target.checked);
                    showToast(e.target.checked ? 'Email alerts enabled.' : 'Email alerts muted.', 'info');
                  }}
                  style={{ width: '18px', height: '18px', accentColor: '#0284c7', cursor: 'pointer' }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  background: 'rgba(10, 18, 38, 0.7)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#f8fafc' }}>
                    {t('profile.pushAlertsLabel')}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    {t('profile.pushAlertsDesc')}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={pushAlerts}
                  onChange={(e) => {
                    setPushAlerts(e.target.checked);
                    showToast(e.target.checked ? 'Push alerts enabled.' : 'Push alerts disabled.', 'info');
                  }}
                  style={{ width: '18px', height: '18px', accentColor: '#14b8a6', cursor: 'pointer' }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  background: 'rgba(10, 18, 38, 0.7)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#f8fafc' }}>
                    {t('profile.digestLabel')}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    {t('profile.digestDesc')}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={weeklyDigest}
                  onChange={(e) => {
                    setWeeklyDigest(e.target.checked);
                    showToast(e.target.checked ? 'Weekly digest subscribed.' : 'Weekly digest unsubscribed.', 'info');
                  }}
                  style={{ width: '18px', height: '18px', accentColor: '#38bdf8', cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
