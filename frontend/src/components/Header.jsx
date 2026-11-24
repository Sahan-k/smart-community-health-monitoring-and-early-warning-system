import React, { useContext, useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import {
  Menu,
  Bell,
  Globe,
  User,
  Settings,
  LogOut,
  Shield,
  Activity,
  HeartPulse,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

export default function Header({ onMobileMenuToggle, unreadCount = 0 }) {
  const { user, logout } = useContext(AuthContext);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      style={{
        height: '70px',
        background: 'rgba(8, 14, 28, 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
      }}
    >
      {/* Left: Mobile Menu Toggle & System Status Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          type="button"
          onClick={onMobileMenuToggle}
          className="btn-ghost hide-on-desktop"
          style={{
            padding: '8px',
            color: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
          }}
          aria-label="Toggle navigation menu"
        >
          <Menu size={22} />
        </button>

        {/* Live Surveillance Status Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            padding: '0.35rem 0.8rem',
            borderRadius: '9999px',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: '#34d399',
          }}
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 8px #10b981',
              animation: 'pulseDot 2s infinite ease-in-out',
            }}
          />
          <span style={{ color: '#f8fafc' }}>{t('dashboard.activeSurveillance') || 'Active Surveillance'}</span>
          <span style={{ color: '#64748b' }}>•</span>
          <span style={{ color: '#38bdf8' }}>{t('dashboard.rollingWindow') || 'Rolling 24h Window'}</span>
        </div>
      </div>

      {/* Right Controls: Language, Notification Bell, User Menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Language Switcher */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(16, 26, 48, 0.7)',
            padding: '0.35rem 0.65rem',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <Globe size={15} color="#38bdf8" />
          <select
            value={i18n.language || 'en'}
            onChange={(e) => changeLanguage(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#f8fafc',
              fontSize: '0.82rem',
              fontWeight: 500,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="en" style={{ background: '#0f1a36', color: '#f8fafc' }}>EN (English)</option>
            <option value="kn" style={{ background: '#0f1a36', color: '#f8fafc' }}>ಕನ್ನಡ (Kannada)</option>
            <option value="hi" style={{ background: '#0f1a36', color: '#f8fafc' }}>हिंदी (Hindi)</option>
          </select>
        </div>

        {/* Notification Bell */}
        <Link
          to="/notifications"
          title="Notification Center"
          style={{
            position: 'relative',
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'rgba(16, 26, 48, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: unreadCount > 0 ? '#38bdf8' : '#94a3b8',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.35)';
            e.currentTarget.style.color = '#f8fafc';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.color = unreadCount > 0 ? '#38bdf8' : '#94a3b8';
          }}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#ef4444',
                color: '#ffffff',
                borderRadius: '9999px',
                padding: '0.12rem 0.42rem',
                fontSize: '0.66rem',
                fontWeight: 800,
                boxShadow: '0 0 10px rgba(239, 68, 68, 0.7)',
              }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* User Profile Dropdown */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((prev) => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.35rem 0.6rem',
              background: profileOpen ? 'rgba(255, 255, 255, 0.08)' : 'rgba(16, 26, 48, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0284c7, #0d9488)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div style={{ textAlign: 'left', display: 'none' }} className="hide-on-mobile">
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc', lineHeight: 1.2 }}>
                {user?.full_name || 'My Account'}
              </div>
            </div>
            <ChevronDown size={14} color="#94a3b8" />
          </button>

          {/* Profile Dropdown Menu */}
          {profileOpen && (
            <div
              className="saas-card animate-slide-down"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '230px',
                background: '#0d1527',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '14px',
                boxShadow: '0 16px 36px rgba(0,0,0,0.6)',
                padding: '0.6rem',
                zIndex: 2000,
              }}
            >
              {/* User info header */}
              <div
                style={{
                  padding: '0.6rem 0.7rem 0.8rem',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  marginBottom: '0.4rem',
                }}
              >
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc' }}>
                  {user?.full_name || 'User'}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '0.1rem' }}>
                  {user?.email || user?.username}
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  <span className="badge badge-low" style={{ fontSize: '0.64rem' }}>
                    {t(`roles.${user?.role || 'community_member'}`)}
                  </span>
                </div>
              </div>

              {/* Links */}
              <Link
                to="/profile"
                onClick={() => setProfileOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.6rem 0.7rem',
                  borderRadius: '8px',
                  fontSize: '0.84rem',
                  color: '#cbd5e1',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <User size={16} color="#38bdf8" />
                {t('nav.profile')}
              </Link>

              <Link
                to="/notifications"
                onClick={() => setProfileOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.6rem 0.7rem',
                  borderRadius: '8px',
                  fontSize: '0.84rem',
                  color: '#cbd5e1',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Bell size={16} color="#14b8a6" />
                {t('nav.notifications')}
              </Link>

              {user?.role === 'administrator' && (
                <Link
                  to="/admin/users"
                  onClick={() => setProfileOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.6rem 0.7rem',
                    borderRadius: '8px',
                    fontSize: '0.84rem',
                    color: '#c084fc',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Shield size={16} />
                  {t('nav.userManagement')}
                </Link>
              )}

              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', margin: '0.4rem 0' }} />

              <button
                type="button"
                onClick={handleLogout}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.6rem 0.7rem',
                  borderRadius: '8px',
                  fontSize: '0.84rem',
                  color: '#f87171',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <LogOut size={16} />
                {t('nav.logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
