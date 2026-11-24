import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  ShieldAlert,
  Cpu,
  Users,
  Stethoscope,
  MapPin,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  MessageSquare,
  Sparkles,
  Zap,
  ShieldCheck,
  HeartPulse,
  Mail,
  Navigation,
  Globe,
} from 'lucide-react';
import HealthMap from '../components/HealthMap';
import api from '../services/api';
import AnimatedCounter from '../components/AnimatedCounter';

export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState(null);

  const currentLang = i18n.language || 'en';

  const handleLanguageChange = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
  };

  useEffect(() => {
    api.get('/api/dashboard/stats')
      .then((res) => setStats(res.data))
      .catch(() => { });
  }, []);

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '2.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* ── Top Navigation Bar with Language Selection ── */}
      <nav
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.1rem 1.75rem',
          background: 'rgba(10, 18, 38, 0.75)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '18px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        {/* Brand */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', textDecoration: 'none' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7 0%, #14b8a6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(2, 132, 199, 0.35)',
            }}
          >
            <HeartPulse size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                HealthGuard AI
              </span>
              <span className="badge badge-low" style={{ fontSize: '0.62rem', padding: '0.15rem 0.45rem' }}>
                v1.0
              </span>
            </div>
            <p style={{ fontSize: '0.74rem', color: '#94a3b8', margin: 0 }}>
              Smart Community Health Surveillance
            </p>
          </div>
        </Link>

        {/* Right Controls: Language Selector & Navigation Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          {/* Language Selector Dropdown */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'rgba(15, 26, 54, 0.85)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              padding: '0.35rem 0.75rem',
              borderRadius: '12px',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.25)',
            }}
          >
            <Globe size={16} color="#38bdf8" />
            <select
              value={currentLang}
              onChange={(e) => handleLanguageChange(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f8fafc',
                fontSize: '0.84rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
              aria-label="Select System Language"
            >
              <option value="en" style={{ background: '#0f1a36', color: '#f8fafc' }}>English (Official Default)</option>
              <option value="kn" style={{ background: '#0f1a36', color: '#f8fafc' }}>ಕನ್ನಡ (Kannada)</option>
              <option value="hi" style={{ background: '#0f1a36', color: '#f8fafc' }}>हिंदी (Hindi)</option>
            </select>
          </div>

          <Link
            to="/login"
            className="btn-secondary"
            style={{ padding: '0.5rem 1.15rem', fontSize: '0.86rem', borderRadius: '10px' }}
          >
            <span>{t('landing.signInBtn') || 'Sign In to Portal'}</span>
          </Link>

          <Link
            to="/register"
            className="btn-primary"
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.86rem', borderRadius: '10px' }}
          >
            <span>{t('landing.getStartedBtn') || 'Create Account'}</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <div
        className="saas-card"
        style={{
          padding: '4rem 3rem',
          background: 'linear-gradient(145deg, rgba(10, 22, 48, 0.95) 0%, rgba(13, 35, 68, 0.85) 50%, rgba(7, 16, 36, 0.95) 100%)',
          borderRadius: '28px',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '450px',
            height: '450px',
            background: 'radial-gradient(circle, rgba(2, 132, 199, 0.25) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: '820px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.2rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                className="badge badge-low"
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.78rem',
                  background: 'rgba(2, 132, 199, 0.15)',
                  color: '#38bdf8',
                  borderColor: 'rgba(56, 189, 248, 0.35)',
                }}
              >
                <Cpu size={14} /> {t('landing.heroBadge')}
              </span>
            </div>

            {/* Language Quick Selector Pills in Hero */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'rgba(10, 18, 38, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: '0.25rem 0.45rem',
              }}
            >
              <Globe size={14} color="#38bdf8" style={{ marginLeft: '0.2rem' }} />
              <span style={{ fontSize: '0.74rem', color: '#94a3b8', marginRight: '0.2rem', fontWeight: 600 }}>
                {t('common.language') || 'Language'}:
              </span>
              {[
                { code: 'en', label: 'English' },
                { code: 'kn', label: 'ಕನ್ನಡ' },
                { code: 'hi', label: 'हिंदी' },
              ].map((lang) => {
                const isActive = currentLang === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleLanguageChange(lang.code)}
                    style={{
                      background: isActive ? 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)' : 'transparent',
                      color: isActive ? '#ffffff' : '#cbd5e1',
                      border: isActive ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent',
                      borderRadius: '6px',
                      padding: '0.2rem 0.65rem',
                      fontSize: '0.76rem',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      boxShadow: isActive ? '0 2px 8px rgba(2, 132, 199, 0.4)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {lang.label}
                  </button>
                );
              })}
            </div>
          </div>

          <h1
            style={{
              fontSize: '3.2rem',
              fontWeight: 900,
              lineHeight: 1.15,
              color: '#ffffff',
              letterSpacing: '-0.03em',
              marginBottom: '1.4rem',
            }}
          >
            {t('landing.heroTitle1')}{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #38bdf8 0%, #2dd4bf 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {t('landing.heroTitle2')}
            </span>
          </h1>

          <p style={{ fontSize: '1.12rem', color: '#cbd5e1', lineHeight: 1.65, marginBottom: '2.5rem' }}>
            {t('landing.heroSubtitle')}
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn-primary" style={{ padding: '0.85rem 2rem', fontSize: '1rem', borderRadius: '12px' }}>
              <span>{t('landing.getStartedBtn')}</span>
              <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn-secondary" style={{ padding: '0.85rem 2rem', fontSize: '1rem', borderRadius: '12px' }}>
              <span>{t('landing.signInBtn')}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Live System Statistics Bar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem' }}>
        <div className="saas-card saas-card-interactive" style={{ padding: '1.6rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.82rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>{t('landing.statTotalReports')}</span>
            <div style={{ background: 'rgba(2, 132, 199, 0.15)', padding: '0.45rem', borderRadius: '10px' }}>
              <Activity color="#0284c7" size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#f8fafc' }}>
            <AnimatedCounter value={stats ? stats.total_reports : 0} />
          </div>
          <p style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.3rem' }}>{t('landing.liveDb')}</p>
        </div>

        <div className="saas-card saas-card-interactive" style={{ padding: '1.6rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.82rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>{t('landing.statActiveReports')}</span>
            <div style={{ background: 'rgba(20, 184, 166, 0.15)', padding: '0.45rem', borderRadius: '10px' }}>
              <HeartPulse color="#14b8a6" size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#38bdf8' }}>
            <AnimatedCounter value={stats?.active_reports_count || (stats ? stats.low_risk_count + stats.medium_risk_count + stats.high_risk_count : 0)} />
          </div>
          <p style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.3rem' }}>{t('landing.rollingWindow')}</p>
        </div>

        <div className="saas-card saas-card-interactive" style={{ padding: '1.6rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.82rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>{t('landing.statHighRisk')}</span>
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '0.45rem', borderRadius: '10px' }}>
              <ShieldAlert color="#ef4444" size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#f87171' }}>
            <AnimatedCounter value={stats ? stats.high_risk_count : 0} />
          </div>
          <p style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.3rem' }}>{t('landing.smtpDispatched')}</p>
        </div>

        <div className="saas-card saas-card-interactive" style={{ padding: '1.6rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.82rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>{t('landing.statVerified')}</span>
            <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '0.45rem', borderRadius: '10px' }}>
              <Stethoscope color="#3b82f6" size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#60a5fa' }}>
            <AnimatedCounter value={stats ? stats.verified_alerts : 0} />
          </div>
          <p style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.3rem' }}>{t('landing.verifiedByDoctors')}</p>
        </div>
      </div>

      {/* ── Feature Grid ── */}
      <div>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
            {t('landing.architectureTitle')}
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#94a3b8', maxWidth: '650px', margin: '0.5rem auto 0' }}>
            {t('landing.architectureSubtitle')}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <div className="saas-card saas-card-interactive" style={{ padding: '2rem' }}>
            <div style={{ background: 'rgba(2, 132, 199, 0.2)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.2rem' }}>
              <Cpu size={24} color="#38bdf8" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>
              {t('landing.feature2Title')}
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.6 }}>
              {t('landing.feature2Desc')}
            </p>
          </div>

          <div className="saas-card saas-card-interactive" style={{ padding: '2rem' }}>
            <div style={{ background: 'rgba(20, 184, 166, 0.2)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.2rem' }}>
              <Mail size={24} color="#2dd4bf" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>
              {t('landing.feature3Title')}
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.6 }}>
              {t('landing.feature3Desc')}
            </p>
          </div>

          <div className="saas-card saas-card-interactive" style={{ padding: '2rem' }}>
            <div style={{ background: 'rgba(168, 85, 247, 0.2)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.2rem' }}>
              <MapPin size={24} color="#c084fc" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>
              {t('landing.featureRollingTitle')}
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.6 }}>
              {t('landing.featureRollingDesc')}
            </p>
          </div>
        </div>
      </div>

      {/* ── Geographic Map Section ── */}
      <div className="saas-card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>
              {t('landing.mapTitle')}
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              {t('landing.mapSubtitle')}
            </p>
          </div>
          <Link to="/register" className="btn-primary" style={{ padding: '0.55rem 1.2rem', fontSize: '0.85rem' }}>
            {t('landing.joinNetworkBtn')} <ArrowRight size={15} />
          </Link>
        </div>

        <HealthMap height="460px" />
      </div>
    </div>
  );
}
