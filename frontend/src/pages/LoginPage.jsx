import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import {
  Activity,
  Eye,
  EyeOff,
  AlertCircle,
  LogIn,
  User,
  Lock,
  ChevronRight,
  Shield,
  Heart,
  Zap,
  X,
  CheckCircle2,
  Users,
  HeartHandshake,
  Stethoscope,
  ShieldCheck,
  Check,
} from 'lucide-react';

const LOGIN_ROLES = [
  {
    id: 'community_member',
    label: 'Community Member',
    description: 'Citizen access & reporting',
    icon: Users,
    color: '#0284c7',
  },
  {
    id: 'health_worker',
    label: 'ASHA Worker',
    description: 'Field analytics & monitoring',
    icon: HeartHandshake,
    color: '#14b8a6',
  },
  {
    id: 'healthcare_professional',
    label: 'Doctor',
    description: 'Clinical alert verification',
    icon: Stethoscope,
    color: '#8b5cf6',
  },
  {
    id: 'administrator',
    label: 'Administrator',
    description: 'Full governance & user mgmt',
    icon: ShieldCheck,
    color: '#f59e0b',
  },
];

export default function LoginPage() {
  const { login } = useContext(AuthContext);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const demoAccounts = [
    {
      label: 'Community Member',
      role: 'community_member',
      identifier: 'citizen_rahul',
      password: 'Password@123',
    },
    {
      label: 'ASHA Worker',
      role: 'health_worker',
      identifier: 'asha_sunita',
      password: 'Password@123',
    },
    {
      label: 'Doctor',
      role: 'healthcare_professional',
      identifier: 'dr_rajesh',
      password: 'Password@123',
    },
    {
      label: 'Administrator',
      role: 'administrator',
      identifier: 'Sahan',
      password: 'Sahan@123',
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedRole) {
      setError('Please select your role before logging in.');
      return;
    }
    if (!identifier.trim()) {
      setError('Please enter your username or email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const user = await login(identifier.trim(), password, selectedRole);

      // Role-based redirect
      if (user.role === 'administrator') {
        navigate('/dashboard');
      } else if (user.role === 'healthcare_professional') {
        navigate('/alerts');
      } else if (user.role === 'health_worker') {
        navigate('/analytics');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.detail;
      setError(msg || err.message || 'Login failed. Please check your credentials and selected role.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demo) => {
    setSelectedRole(demo.role);
    setIdentifier(demo.identifier);
    setPassword(demo.password);
    setError('');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #050a14 0%, #091224 50%, #060e1d 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative ambient glowing spheres */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          right: '-10%',
          width: '550px',
          height: '550px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(2, 132, 199, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-15%',
          left: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(20, 184, 166, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        className="saas-card"
        style={{
          width: '100%',
          maxWidth: '1020px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          zIndex: 1,
        }}
      >
        {/* Left: Brand Showcase Panel */}
        <div
          style={{
            background: 'linear-gradient(155deg, #09172e 0%, #0c2344 50%, #092c4c 100%)',
            padding: '3rem 2.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '2.5rem' }}>
              <div
                style={{
                  background: 'linear-gradient(135deg, #0284c7, #14b8a6)',
                  padding: '0.65rem',
                  borderRadius: '12px',
                  display: 'flex',
                  boxShadow: '0 4px 15px rgba(2, 132, 199, 0.4)',
                }}
              >
                <Activity size={28} color="#ffffff" />
              </div>
              <div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                  HealthGuard <span style={{ color: '#38bdf8' }}>AI</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#38bdf8', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
                  Smart Surveillance SaaS
                </div>
              </div>
            </div>

            <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.25, marginBottom: '0.85rem' }}>
              Intelligent Disease Early Warning Platform
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '2.2rem' }}>
              Automated disease risk scoring, rolling 24-hour outbreak clustering, healthcare verification, and real-time alert dispatch.
            </p>

            {/* Feature points */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(2, 132, 199, 0.2)', padding: '0.45rem', borderRadius: '10px' }}>
                  <Zap size={17} color="#38bdf8" />
                </div>
                <span style={{ fontSize: '0.88rem', color: '#cbd5e1' }}>Random Forest ML Risk Assessment</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(20, 184, 166, 0.2)', padding: '0.45rem', borderRadius: '10px' }}>
                  <Shield size={17} color="#2dd4bf" />
                </div>
                <span style={{ fontSize: '0.88rem', color: '#cbd5e1' }}>Automated High Risk SMTP & FCM Alerts</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(168, 85, 247, 0.2)', padding: '0.45rem', borderRadius: '10px' }}>
                  <Heart size={17} color="#c084fc" />
                </div>
                <span style={{ fontSize: '0.88rem', color: '#cbd5e1' }}>Multilingual Voice & AI Health Assistant</span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.2rem' }}>
            <p style={{ fontSize: '0.76rem', color: '#64748b' }}>
              MCA Major Project • Smart Community Health Monitoring & Early Warning System © 2026
            </p>
          </div>
        </div>

        {/* Right: Modern Sign In Form */}
        <div
          style={{
            background: 'rgba(10, 17, 36, 0.95)',
            backdropFilter: 'blur(20px)',
            padding: '2.5rem 2.2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            overflowY: 'auto',
            maxHeight: '90vh',
          }}
        >
          <div style={{ marginBottom: '1.4rem' }}>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.3rem' }}>
              {t('auth.signInTitle')}
            </h1>
            <p style={{ fontSize: '0.86rem', color: '#94a3b8' }}>
              {t('auth.signInSubtitle')}
            </p>
          </div>

          {error && (
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
                marginBottom: '1.3rem',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Role Selection (4 clickable cards, responsive grid, NO dropdown) */}
            <div style={{ marginBottom: '1.2rem' }}>
              <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Select Your Role *</span>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Required before sign in</span>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.55rem' }}>
                {LOGIN_ROLES.map((r) => {
                  const Icon = r.icon;
                  const isSelected = selectedRole === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        setSelectedRole(r.id);
                        setError('');
                      }}
                      style={{
                        padding: '0.75rem 0.65rem',
                        borderRadius: '12px',
                        background: isSelected
                          ? 'linear-gradient(145deg, rgba(2, 132, 199, 0.22) 0%, rgba(20, 184, 166, 0.18) 100%)'
                          : 'rgba(255, 255, 255, 0.03)',
                        border: isSelected
                          ? '2px solid #38bdf8'
                          : '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: isSelected ? '0 0 14px rgba(56, 189, 248, 0.25)' : 'none',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: isSelected ? r.color : 'rgba(255, 255, 255, 0.06)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          flexShrink: 0,
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <Icon size={17} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: isSelected ? 700 : 600,
                            color: isSelected ? '#ffffff' : '#cbd5e1',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {r.label}
                        </div>
                        <div
                          style={{
                            fontSize: '0.66rem',
                            color: isSelected ? '#38bdf8' : '#64748b',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {r.description}
                        </div>
                      </div>
                      {isSelected && (
                        <Check size={14} color="#38bdf8" style={{ flexShrink: 0 }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Username / Email */}
            <div style={{ marginBottom: '1rem' }}>
              <label className="input-label">{t('auth.emailAddress')} / {t('auth.username')} *</label>
              <div style={{ position: 'relative' }}>
                <User
                  size={18}
                  color="#64748b"
                  style={{ position: 'absolute', left: '0.95rem', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. sahan or user@example.com"
                  className="input-control"
                  style={{ paddingLeft: '2.8rem' }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                <label className="input-label" style={{ marginBottom: 0 }}>{t('auth.password')} *</label>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(true)}
                  style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 500 }}
                >
                  {t('auth.forgotPassword')}
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={18}
                  color="#64748b"
                  style={{ position: 'absolute', left: '0.95rem', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="input-control"
                  style={{ paddingLeft: '2.8rem', paddingRight: '2.8rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((p) => !p)}
                  style={{
                    position: 'absolute',
                    right: '0.95rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748b',
                    display: 'flex',
                  }}
                  title={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '0.85rem',
                fontSize: '0.98rem',
                marginTop: '0.8rem',
                borderRadius: '12px',
              }}
            >
              {loading ? (
                <>
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      border: '2px solid #ffffff',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                  <span>{t('auth.authenticating')}</span>
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>{t('auth.signInButton')}</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', margin: '1.4rem 0 0.8rem' }} />
          <div
            style={{
              fontSize: '0.72rem',
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 700,
              marginBottom: '0.5rem',
            }}
          >
            {t('auth.quickDemo')} (Auto-selects Role)
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.45rem', marginBottom: '0.6rem' }}>
            {demoAccounts.map((d) => (
              <button
                key={d.role}
                type="button"
                onClick={() => fillDemo(d)}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  color: '#94a3b8',
                  fontSize: '0.76rem',
                  padding: '0.45rem 0.6rem',
                  transition: 'all 0.15s ease',
                  textAlign: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(2, 132, 199, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
                  e.currentTarget.style.color = '#f8fafc';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.color = '#94a3b8';
                }}
              >
                {d.label}
              </button>
            ))}
          </div>

          <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8', marginTop: '1rem' }}>
            {t('auth.noAccount')}{' '}
            <Link to="/register" style={{ color: '#38bdf8', fontWeight: 600 }}>
              {t('auth.registerNow')} <ChevronRight size={13} style={{ display: 'inline', verticalAlign: 'middle' }} />
            </Link>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 10, 20, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            className="saas-card animate-slide-down"
            style={{
              maxWidth: '440px',
              width: '100%',
              padding: '2rem',
              background: '#0d1527',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>{t('auth.forgotModalTitle')}</h3>
              <button
                type="button"
                onClick={() => {
                  setForgotModalOpen(false);
                  setForgotSuccess(false);
                }}
                style={{ color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            {forgotSuccess ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <CheckCircle2 size={44} color="#10b981" style={{ margin: '0 auto 1rem' }} />
                <h4 style={{ color: '#f8fafc', fontSize: '1rem', marginBottom: '0.4rem' }}>{t('auth.resetSuccessTitle')}</h4>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>
                  {t('auth.resetSuccessDesc')}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setForgotModalOpen(false);
                    setForgotSuccess(false);
                  }}
                  className="btn-primary"
                  style={{ marginTop: '1.5rem', width: '100%' }}
                >
                  {t('auth.signInButton')}
                </button>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '1.2rem' }}>
                  {t('auth.forgotModalDesc')}
                </p>
                <input
                  type="text"
                  placeholder={t('auth.emailPlaceholder')}
                  className="input-control"
                  style={{ marginBottom: '1.2rem' }}
                />
                <button
                  type="button"
                  onClick={() => setForgotSuccess(true)}
                  className="btn-primary"
                  style={{ width: '100%' }}
                >
                  {t('auth.sendResetLink')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
