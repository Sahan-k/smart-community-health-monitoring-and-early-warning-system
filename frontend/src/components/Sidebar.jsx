import React, { useContext } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import {
  LayoutDashboard,
  BarChart3,
  FilePlus2,
  FileText,
  Map,
  ShieldAlert,
  Bell,
  Bot,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Activity,
  ShieldCheck,
  HeartPulse,
} from 'lucide-react';

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen, unreadCount = 0 }) {
  const { user, logout } = useContext(AuthContext);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      to: '/dashboard',
      icon: LayoutDashboard,
      label: t('nav.dashboard') || 'Dashboard',
    },
    ...((user?.role === 'health_worker' || user?.role === 'healthcare_professional' || user?.role === 'administrator')
      ? [
          {
            to: '/analytics',
            icon: BarChart3,
            label: t('nav.clusterAnalytics') || 'Health Analytics',
          },
        ]
      : []),
    {
      to: '/submit-report',
      icon: FilePlus2,
      label: t('nav.submitReport') || 'Submit Report',
      badge: 'ML',
    },
    {
      to: '/my-reports',
      icon: FileText,
      label: t('nav.myReports') || 'My Reports',
    },
    {
      to: '/map',
      icon: Map,
      label: t('nav.map') || 'Community Health Map',
    },
    {
      to: '/alerts',
      icon: ShieldAlert,
      label: t('nav.alerts') || 'Disease Alerts',
      badgeColor: '#ef4444',
    },
    {
      to: '/notifications',
      icon: Bell,
      label: t('nav.notifications') || 'Notifications',
      count: unreadCount,
    },
    {
      to: '/assistant',
      icon: Bot,
      label: t('nav.assistant') || 'AI Health Assistant',
    },
    ...(user?.role === 'administrator'
      ? [
          {
            to: '/admin/users',
            icon: ShieldCheck,
            label: 'User Management',
            badge: 'Admin',
          },
        ]
      : []),
  ];

  const accountItems = [
    {
      to: '/profile',
      icon: User,
      label: t('nav.profile') || 'Profile',
    },
    {
      to: '/profile?tab=settings',
      icon: Settings,
      label: t('profile.tabSettings') || 'Settings',
    },
  ];

  const roleLabel = user?.role
    ? t(`roles.${user.role}`) || user.role
    : t('roles.community_member');

  const isRoleSpecialist = user?.role === 'healthcare_professional' || user?.role === 'administrator';

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 10, 20, 0.75)',
            backdropFilter: 'blur(6px)',
            zIndex: 1040,
          }}
        />
      )}

      {/* Sidebar Container */}
      <aside
        style={{
          width: collapsed ? '78px' : '260px',
          background: 'linear-gradient(180deg, #070c18 0%, #0a1226 100%)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          height: '100vh',
          position: 'sticky',
          top: 0,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1050,
          transition: 'width 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
          flexShrink: 0,
          // Mobile responsive placement
          ...(window.innerWidth <= 768
            ? {
                position: 'fixed',
                left: mobileOpen ? '0' : '-280px',
                width: '260px',
                transition: 'left 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
              }
            : {}),
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: collapsed ? '1.2rem 0.8rem' : '1.25rem 1.4rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            minHeight: '72px',
          }}
        >
          <div
            onClick={() => navigate('/dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'pointer',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
              }}
            >
              <Activity size={22} color="#ffffff" />
            </div>

            {!collapsed && (
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
                <div
                  style={{
                    fontSize: '1.08rem',
                    fontWeight: 800,
                    color: '#f8fafc',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2,
                  }}
                >
                  HealthGuard <span style={{ color: '#38bdf8' }}>AI</span>
                </div>
                <div
                  style={{
                    fontSize: '0.68rem',
                    color: '#94a3b8',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                  }}
                >
                  Surveillance SaaS
                </div>
              </div>
            )}
          </div>

          {/* Desktop Toggle Button */}
          {!collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="btn-ghost hide-on-mobile"
              style={{
                padding: '5px',
                borderRadius: '8px',
                color: '#64748b',
              }}
              title="Collapse sidebar"
            >
              <ChevronLeft size={18} />
            </button>
          )}
        </div>

        {/* Collapsed Expand Button */}
        {collapsed && (
          <div style={{ padding: '0.5rem', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="btn-ghost"
              style={{
                padding: '6px',
                borderRadius: '8px',
                color: '#94a3b8',
                margin: '0 auto',
              }}
              title="Expand sidebar"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Navigation Links Scrollable Area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: collapsed ? '1rem 0.5rem' : '1.2rem 0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
          }}
        >
          {/* Main Navigation Section Header */}
          {!collapsed && (
            <div
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding: '0.4rem 0.6rem',
                marginTop: '0.2rem',
                marginBottom: '0.2rem',
              }}
            >
              Main Navigation
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to || 
              (item.to === '/dashboard' && (location.pathname === '/community' || location.pathname === '/health-worker' || location.pathname === '/professional' || location.pathname === '/admin'));

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.8rem',
                  padding: collapsed ? '0.75rem 0' : '0.65rem 0.85rem',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  borderRadius: '10px',
                  color: isActive ? '#38bdf8' : '#94a3b8',
                  background: isActive
                    ? 'linear-gradient(90deg, rgba(2, 132, 199, 0.18) 0%, rgba(20, 184, 166, 0.08) 100%)'
                    : 'transparent',
                  border: isActive ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.88rem',
                  transition: 'all 0.18s ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.color = '#f8fafc';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#94a3b8';
                  }
                }}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      left: collapsed ? '2px' : '-8px',
                      top: '20%',
                      bottom: '20%',
                      width: '3px',
                      borderRadius: '4px',
                      background: '#38bdf8',
                      boxShadow: '0 0 8px #38bdf8',
                    }}
                  />
                )}

                <Icon size={19} style={{ flexShrink: 0 }} />

                {!collapsed && (
                  <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.label}
                  </span>
                )}

                {/* Badge / Count */}
                {!collapsed && item.count !== undefined && item.count > 0 && (
                  <span
                    style={{
                      background: '#ef4444',
                      color: '#ffffff',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '0.12rem 0.45rem',
                      borderRadius: '9999px',
                      boxShadow: '0 0 10px rgba(239,68,68,0.5)',
                    }}
                  >
                    {item.count}
                  </span>
                )}

                {!collapsed && item.badge && (
                  <span
                    style={{
                      background: 'rgba(2, 132, 199, 0.2)',
                      color: '#38bdf8',
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      border: '1px solid rgba(2, 132, 199, 0.35)',
                    }}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Collapsed dot for unread */}
                {collapsed && item.count !== undefined && item.count > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '14px',
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: '#ef4444',
                      boxShadow: '0 0 6px #ef4444',
                    }}
                  />
                )}
              </NavLink>
            );
          })}

          {/* Account Section */}
          {!collapsed && (
            <div
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding: '0.8rem 0.6rem 0.3rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                marginTop: '0.8rem',
              }}
            >
              Account
            </div>
          )}

          {accountItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname + location.search === item.to;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.8rem',
                  padding: collapsed ? '0.75rem 0' : '0.65rem 0.85rem',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  borderRadius: '10px',
                  color: isActive ? '#38bdf8' : '#94a3b8',
                  background: isActive ? 'rgba(2, 132, 199, 0.15)' : 'transparent',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.88rem',
                  transition: 'all 0.18s ease',
                }}
              >
                <Icon size={19} style={{ flexShrink: 0 }} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </div>

        {/* User Profile Mini Footer */}
        <div
          style={{
            padding: collapsed ? '0.8rem 0.5rem' : '0.9rem 1.1rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            background: 'rgba(0, 0, 0, 0.25)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'space-between',
              gap: '0.65rem',
            }}
          >
            <div
              onClick={() => navigate('/profile')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.7rem',
                cursor: 'pointer',
                minWidth: 0,
              }}
            >
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0d9488, #0284c7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  flexShrink: 0,
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
              </div>

              {!collapsed && (
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <div
                    style={{
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      color: '#f8fafc',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {user?.full_name || 'User'}
                  </div>
                  <div
                    style={{
                      fontSize: '0.68rem',
                      color: '#34d399',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <span
                      style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        background: '#10b981',
                        boxShadow: '0 0 6px #10b981',
                      }}
                    />
                    {roleLabel}
                  </div>
                </div>
              )}
            </div>

            {!collapsed && (
              <button
                type="button"
                onClick={handleLogout}
                className="btn-ghost"
                style={{
                  padding: '6px',
                  borderRadius: '8px',
                  color: '#ef4444',
                }}
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
