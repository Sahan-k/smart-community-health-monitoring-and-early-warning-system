import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import { 
  Activity, Bell, Globe, LogOut, User, 
  ShieldAlert, Stethoscope, LayoutDashboard, FileText, Map, MessageSquare 
} from 'lucide-react';
import api from '../services/api';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      api.get('/api/notifications')
        .then(res => {
          const unread = res.data.filter(n => !n.is_read).length;
          setUnreadCount(unread);
        })
        .catch(() => {});
    }
  }, [user]);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getRoleDashboardLink = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'community_member': return '/community';
      case 'health_worker': return '/health-worker';
      case 'healthcare_professional': return '/professional';
      case 'administrator': return '/admin';
      default: return '/community';
    }
  };

  return (
    <nav className="glass-card" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, position: 'sticky', top: 0, zIndex: 1000, padding: '0.8rem 2rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Brand / Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #0284c7, #14b8a6)', padding: '0.5rem', borderRadius: '10px', display: 'flex' }}>
            <Activity size={24} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', lineHeight: 1.2 }}>
              {t('appName')}
            </h1>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              {t('systemSubtitle')}
            </p>
          </div>
        </Link>

        {/* Navigation Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {user ? (
            <>
              <Link to={getRoleDashboardLink()} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                <LayoutDashboard size={16} />
                {t('nav.dashboard')}
              </Link>

              {user.role === 'community_member' && (
                <>
                  <Link to="/community/submit-report" style={{ color: '#cbd5e1', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <FileText size={16} /> {t('nav.submitReport')}
                  </Link>
                  <Link to="/community/chat" style={{ color: '#cbd5e1', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <MessageSquare size={16} /> {t('nav.assistant')}
                  </Link>
                </>
              )}

              {user.role === 'healthcare_professional' && (
                <Link to="/professional/verify-alerts" style={{ color: '#fbbf24', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShieldAlert size={16} /> {t('nav.verification')}
                </Link>
              )}

              {user.role === 'administrator' && (
                <Link to="/admin/users" style={{ color: '#cbd5e1', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <User size={16} /> {t('nav.userManagement')}
                </Link>
              )}

              {/* Notifications Link */}
              <Link to="/notifications" style={{ position: 'relative', color: '#cbd5e1', display: 'flex', alignItems: 'center' }}>
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: '-6px', right: '-8px', background: '#ef4444', color: 'white', borderRadius: '50%', padding: '0.1rem 0.35rem', fontSize: '0.65rem', fontWeight: 'bold' }}>
                    {unreadCount}
                  </span>
                )}
              </Link>
            </>
          ) : (
            <Link to="/" style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
              {t('nav.home')}
            </Link>
          )}

          {/* Language Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#1e293b', padding: '0.3rem 0.6rem', borderRadius: '8px', border: '1px solid #334155' }}>
            <Globe size={16} color="#94a3b8" />
            <select
              value={i18n.language}
              onChange={(e) => changeLanguage(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#f8fafc', fontSize: '0.85rem', cursor: 'pointer', outline: 'none' }}
            >
              <option value="en" style={{ background: '#1e293b' }}>English</option>
              <option value="kn" style={{ background: '#1e293b' }}>ಕನ್ನಡ (Kannada)</option>
              <option value="hi" style={{ background: '#1e293b' }}>हिंदी (Hindi)</option>
            </select>
          </div>

          {/* User Profile / Auth buttons */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>{user.full_name}</div>
                <span className="badge badge-low" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                  {t(`roles.${user.role}`)}
                </span>
              </div>
              <button onClick={handleLogout} className="btn-secondary" style={{ padding: '0.4rem 0.7rem' }} title="Logout">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <Link to="/login" className="btn-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
                {t('nav.login')}
              </Link>
              <Link to="/register" className="btn-primary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
                {t('nav.register')}
              </Link>
            </div>
          )}

        </div>
      </div>
    </nav>
  );
}
