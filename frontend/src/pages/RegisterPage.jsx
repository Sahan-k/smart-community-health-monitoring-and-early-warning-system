import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  User,
  Lock,
  Eye,
  EyeOff,
  Mail,
  Phone,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Shield,
  Zap,
  Check,
  Users,
  HeartHandshake,
  Stethoscope,
} from 'lucide-react';
import api from '../services/api';

const PUBLIC_ROLES = [
  {
    id: 'community_member',
    label: 'Community Member',
    description: 'Citizens reporting symptomatic events & viewing local alerts',
    icon: Users,
    color: '#0284c7',
  },
  {
    id: 'health_worker',
    label: 'ASHA Worker',
    description: 'Community health monitoring, field surveys & village tracking',
    icon: HeartHandshake,
    color: '#14b8a6',
  },
  {
    id: 'healthcare_professional',
    label: 'Doctor',
    description: 'Clinical disease verification, alert reviews & diagnostics',
    icon: Stethoscope,
    color: '#8b5cf6',
  },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [form, setForm] = useState({
    username: '',
    email: '',
    phone: '',
    role: '',
    password: '',
    confirmPassword: '',
  });

  const [showPwd, setShowPwd] = useState(false);
  const [showConfPwd, setShowConfPwd] = useState(false);
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Field updates
  const setField = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));
  const touchField = (key) => setTouched((prev) => ({ ...prev, [key]: true }));

  // Validation rules
  const validateUsername = /^[a-zA-Z0-9_]{3,30}$/.test(form.username.trim());
  const validateEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim());
  const cleanPhone = form.phone.replace(/\D/g, '');
  const validatePhone = /^[6-9]\d{9}$/.test(cleanPhone);
  const roleSelected = Boolean(form.role);

  // Password individual requirements (NOT checkbox checklist)
  const pwd = form.password;
  const pwdErrors = [];
  if (pwd.length < 8) {
    pwdErrors.push('Password must be at least 8 characters long.');
  }
  if (!/[A-Z]/.test(pwd)) {
    pwdErrors.push('Password must contain at least one uppercase letter.');
  }
  if (!/[a-z]/.test(pwd)) {
    pwdErrors.push('Password must contain at least one lowercase letter.');
  }
  if (!/\d/.test(pwd)) {
    pwdErrors.push('Password must contain at least one digit.');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
    pwdErrors.push('Password must contain at least one special character.');
  }

  const isPasswordValid = pwdErrors.length === 0;
  const passwordsMatch = Boolean(form.password) && form.password === form.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      username: true,
      email: true,
      phone: true,
      role: true,
      password: true,
      confirmPassword: true,
    });
    setError('');

    if (!validateUsername) {
      setError('Username must be 3 to 30 characters (letters, numbers, or underscores only).');
      return;
    }
    if (!validateEmail) {
      setError('Please provide a valid email address.');
      return;
    }
    if (!validatePhone) {
      setError('Mobile number must be a 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      return;
    }
    if (!roleSelected) {
      setError('Please select your role (Community Member, ASHA Worker, or Doctor).');
      return;
    }
    if (!isPasswordValid) {
      setError(pwdErrors[0] || 'Please fulfill all password complexity requirements.');
      return;
    }
    if (!passwordsMatch) {
      setError('Confirm password must match the password.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/auth/register', {
        username: form.username.trim(),
        full_name: form.username.trim(),
        email: form.email.trim().toLowerCase(),
        phone_number: cleanPhone,
        password: form.password,
        role: form.role,
        preferred_language: 'en',
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #050a14 0%, #091224 50%, #060e1d 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative ambient background glows */}
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
        {/* Left: Brand Presentation */}
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
              Join the Public Health Early Warning Network
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '2rem' }}>
              Register your citizen, field worker, or clinical account to submit health observations, receive verified disease alerts, and track community outbreaks.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.45rem', borderRadius: '10px' }}>
                  <Check size={16} color="#34d399" />
                </div>
                <span style={{ fontSize: '0.88rem', color: '#cbd5e1' }}>Direct Registration & Role Security</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(2, 132, 199, 0.15)', padding: '0.45rem', borderRadius: '10px' }}>
                  <Check size={16} color="#38bdf8" />
                </div>
                <span style={{ fontSize: '0.88rem', color: '#cbd5e1' }}>GPS-based Village and Taluk Detection</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(20, 184, 166, 0.15)', padding: '0.45rem', borderRadius: '10px' }}>
                  <Check size={16} color="#2dd4bf" />
                </div>
                <span style={{ fontSize: '0.88rem', color: '#cbd5e1' }}>Automated High Risk Outbreak Alerts</span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.2rem' }}>
            <p style={{ fontSize: '0.76rem', color: '#64748b' }}>
              MCA Major Project • Community Health Monitoring & Early Warning System © 2026
            </p>
          </div>
        </div>

        {/* Right: Registration Form */}
        <div
          style={{
            background: 'rgba(10, 17, 36, 0.95)',
            backdropFilter: 'blur(20px)',
            padding: '2.5rem 2.2rem',
            overflowY: 'auto',
            maxHeight: '90vh',
          }}
        >
          <div style={{ marginBottom: '1.4rem' }}>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.3rem' }}>
              {t('auth.registerTitle')}
            </h1>
            <p style={{ fontSize: '0.86rem', color: '#94a3b8' }}>
              {t('auth.registerSubtitle')}
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

          {success && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#34d399',
                padding: '0.9rem 1rem',
                borderRadius: '10px',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                marginBottom: '1.3rem',
              }}
            >
              <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
              <div style={{ color: '#34d399' }}>Account created successfully! Redirecting to login...</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* 1. Username */}
            <div style={{ marginBottom: '1rem' }}>
              <label className="input-label">{t('auth.username')} *</label>
              <div style={{ position: 'relative' }}>
                <User
                  size={17}
                  color="#64748b"
                  style={{ position: 'absolute', left: '0.95rem', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={form.username}
                  onChange={(e) => setField('username', e.target.value)}
                  onBlur={() => touchField('username')}
                  placeholder="e.g. sahan_kumar"
                  className="input-control"
                  style={{
                    paddingLeft: '2.8rem',
                    borderColor: touched.username && !validateUsername ? '#ef4444' : undefined,
                  }}
                />
              </div>
              {touched.username && !validateUsername && (
                <div style={{ color: '#f87171', fontSize: '0.76rem', marginTop: '0.3rem' }}>
                  Username must be 3-30 letters, numbers, or underscores.
                </div>
              )}
            </div>

            {/* 2. Email Address */}
            <div style={{ marginBottom: '1rem' }}>
              <label className="input-label">{t('auth.emailAddress')} *</label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={17}
                  color="#64748b"
                  style={{ position: 'absolute', left: '0.95rem', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  onBlur={() => touchField('email')}
                  placeholder="name@example.com"
                  className="input-control"
                  style={{
                    paddingLeft: '2.8rem',
                    borderColor: touched.email && !validateEmail ? '#ef4444' : undefined,
                  }}
                />
              </div>
              {touched.email && !validateEmail && (
                <div style={{ color: '#f87171', fontSize: '0.76rem', marginTop: '0.3rem' }}>
                  Please enter a valid email address.
                </div>
              )}
            </div>

            {/* 3. Mobile Number */}
            <div style={{ marginBottom: '1rem' }}>
              <label className="input-label">{t('auth.mobileNumber')} *</label>
              <div style={{ position: 'relative' }}>
                <Phone
                  size={17}
                  color="#64748b"
                  style={{ position: 'absolute', left: '0.95rem', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="tel"
                  required
                  inputMode="numeric"
                  maxLength={10}
                  value={form.phone}
                  onChange={(e) => setField('phone', e.target.value.replace(/\D/g, ''))}
                  onBlur={() => touchField('phone')}
                  placeholder="98765 43210 (10 digits)"
                  className="input-control"
                  style={{
                    paddingLeft: '2.8rem',
                    borderColor: touched.phone && !validatePhone ? '#ef4444' : undefined,
                  }}
                />
              </div>
              {touched.phone && !validatePhone && (
                <div style={{ color: '#f87171', fontSize: '0.76rem', marginTop: '0.3rem' }}>
                  Must be a 10-digit Indian mobile number starting with 6, 7, 8, or 9.
                </div>
              )}
            </div>

            {/* 4. Role Selection (3 clickable cards, NO dropdown, NO administrator) */}
            <div style={{ marginBottom: '1.2rem' }}>
              <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Role Selection *</span>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Select your account role</span>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.55rem' }}>
                {PUBLIC_ROLES.map((r) => {
                  const Icon = r.icon;
                  const isSelected = form.role === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        setField('role', r.id);
                        touchField('role');
                        setError('');
                      }}
                      style={{
                        padding: '0.75rem 0.6rem',
                        borderRadius: '12px',
                        background: isSelected
                          ? 'linear-gradient(145deg, rgba(2, 132, 199, 0.22) 0%, rgba(20, 184, 166, 0.18) 100%)'
                          : 'rgba(255, 255, 255, 0.03)',
                        border: isSelected
                          ? '2px solid #38bdf8'
                          : '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: isSelected ? '0 0 14px rgba(56, 189, 248, 0.25)' : 'none',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.35rem',
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
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <Icon size={17} />
                      </div>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: isSelected ? 700 : 600,
                          color: isSelected ? '#ffffff' : '#cbd5e1',
                          lineHeight: 1.2,
                        }}
                      >
                        {r.label}
                      </div>
                      {isSelected && (
                        <div
                          style={{
                            fontSize: '0.62rem',
                            color: '#38bdf8',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
                          }}
                        >
                          <Check size={11} /> Selected
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {touched.role && !roleSelected && (
                <div style={{ color: '#f87171', fontSize: '0.76rem', marginTop: '0.35rem' }}>
                  Please select one of the 3 roles above.
                </div>
              )}
            </div>

            {/* 5. Password */}
            <div style={{ marginBottom: '1rem' }}>
              <label className="input-label">{t('auth.password')} *</label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={17}
                  color="#64748b"
                  style={{ position: 'absolute', left: '0.95rem', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => setField('password', e.target.value)}
                  onBlur={() => touchField('password')}
                  placeholder="Min 8 chars (upper, lower, digit, special)"
                  className="input-control"
                  style={{
                    paddingLeft: '2.8rem',
                    paddingRight: '2.8rem',
                    borderColor: touched.password && !isPasswordValid ? '#ef4444' : undefined,
                  }}
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
                  {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              {/* Password Requirement Messages (NO checkboxes - dynamic error list disappearing as met) */}
              {touched.password && pwdErrors.length > 0 && (
                <div
                  style={{
                    marginTop: '0.45rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem',
                  }}
                >
                  {pwdErrors.map((errMsg, idx) => (
                    <div
                      key={idx}
                      style={{
                        color: '#f87171',
                        fontSize: '0.76rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <span style={{ fontSize: '0.65rem' }}>•</span>
                      <span>{errMsg}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 6. Confirm Password */}
            <div style={{ marginBottom: '1.4rem' }}>
              <label className="input-label">{t('auth.confirmPassword')} *</label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={17}
                  color="#64748b"
                  style={{ position: 'absolute', left: '0.95rem', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type={showConfPwd ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(e) => setField('confirmPassword', e.target.value)}
                  onBlur={() => touchField('confirmPassword')}
                  placeholder="Re-enter password"
                  className="input-control"
                  style={{
                    paddingLeft: '2.8rem',
                    paddingRight: '2.8rem',
                    borderColor: touched.confirmPassword && !passwordsMatch ? '#ef4444' : undefined,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfPwd((p) => !p)}
                  style={{
                    position: 'absolute',
                    right: '0.95rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748b',
                    display: 'flex',
                  }}
                  title={showConfPwd ? 'Hide password' : 'Show password'}
                >
                  {showConfPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {touched.confirmPassword && !passwordsMatch && (
                <div style={{ color: '#f87171', fontSize: '0.76rem', marginTop: '0.3rem' }}>
                  Passwords do not match.
                </div>
              )}
            </div>

            {/* Register button */}
            <button
              type="submit"
              disabled={loading || success}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '0.85rem',
                fontSize: '0.98rem',
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
                  <span>{t('auth.creatingAccount')}</span>
                </>
              ) : (
                t('auth.registerButton')
              )}
            </button>
          </form>

          <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8', marginTop: '1.4rem' }}>
            {t('auth.alreadyHaveAccount')}{' '}
            <Link to="/login" style={{ color: '#38bdf8', fontWeight: 600 }}>
              {t('auth.loginNow')} <ChevronRight size={13} style={{ display: 'inline', verticalAlign: 'middle' }} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
