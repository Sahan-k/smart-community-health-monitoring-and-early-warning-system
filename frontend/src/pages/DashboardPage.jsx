import React, { useEffect, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { translateRisk, translateDisease } from '../i18n';
import {
  Users,
  FileText,
  Activity,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Map,
  ArrowRight,
  HeartPulse,
  RefreshCw,
  ExternalLink,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import AnimatedCounter from '../components/AnimatedCounter';
import Skeleton from '../components/Skeleton';
import HealthMap from '../components/HealthMap';
import { detectLocationViaGps } from '../services/geolocationService';

export default function DashboardPage() {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [talukRisks, setTalukRisks] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchData = async () => {
    try {
      const [statsRes, riskRes, alertsRes] = await Promise.all([
        api.get('/api/dashboard/stats'),
        api.get('/api/reports/risk-summary').catch(() => ({ data: [] })),
        api.get('/api/alerts').catch(() => ({ data: [] })),
      ]);

      setStats(statsRes.data);
      setTalukRisks(riskRes.data || []);
      setAlerts(alertsRes.data || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 45000); // 45s refresh
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleReportNavigation = async (mode = 'text') => {
    setIsLocating(true);
    const targetUrl = mode === 'voice' ? '/submit-report?mode=voice' : '/submit-report';
    try {
      const detectedLocation = await detectLocationViaGps();
      setIsLocating(false);
      navigate(targetUrl, { state: { gpsLocation: detectedLocation } });
    } catch (err) {
      setIsLocating(false);
      navigate(targetUrl, {
        state: {
          gpsDenied: true,
          gpsError: err.message || 'Location permission was denied or GPS is unavailable.',
        },
      });
    }
  };

  // Determine overall community risk level
  const highRiskCount = stats?.high_risk_count || 0;
  const medRiskCount = stats?.medium_risk_count || 0;
  const lowRiskCount = stats?.low_risk_count || 0;
  const activeReportsInWindow = stats?.active_reports_count ?? (highRiskCount + medRiskCount + lowRiskCount);

  let overallRisk = 'Low';
  let overallRiskColor = '#10b981';
  let overallRiskBg = 'rgba(16, 185, 129, 0.15)';
  let overallTrend = t('risk.stableBaseline');

  if (highRiskCount > 0) {
    overallRisk = 'High';
    overallRiskColor = '#ef4444';
    overallRiskBg = 'rgba(239, 68, 68, 0.15)';
    overallTrend = t('risk.elevatedSignal');
  } else if (medRiskCount > 0) {
    overallRisk = 'Medium';
    overallRiskColor = '#f59e0b';
    overallRiskBg = 'rgba(245, 158, 11, 0.15)';
    overallTrend = t('risk.moderateIncrease');
  }

  // Disease chart data
  const diseaseChartData = Object.entries(stats?.disease_counts || {}).map(([name, count]) => {
    const translatedName = translateDisease(t, name);
    return {
      name: translatedName.length > 14 ? translatedName.substring(0, 12) + '…' : translatedName,
      fullName: translatedName,
      count,
    };
  });

  // Risk distribution data for donut
  const riskDonutData = [
    { name: t('risk.lowRisk'), value: lowRiskCount, color: '#10b981' },
    { name: t('risk.mediumRisk'), value: medRiskCount, color: '#f59e0b' },
    { name: t('risk.highRisk'), value: highRiskCount, color: '#ef4444' },
  ].filter((item) => item.value > 0);

  // Fallback placeholder if no data yet
  if (riskDonutData.length === 0) {
    riskDonutData.push({ name: t('risk.lowRisk'), value: 1, color: '#10b981' });
  }

  // High risk areas list
  const affectedAreas = talukRisks.filter((t) => t.risk_level === 'High Risk Signal' || t.risk_level === 'Medium Risk');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* ── Top Welcome & Overview Bar ── */}
      <div
        className="saas-card"
        style={{
          padding: '1.75rem 2rem',
          background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.18) 0%, rgba(20, 184, 166, 0.08) 50%, rgba(15, 26, 54, 0.7) 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.2rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <span className="badge badge-low" style={{ fontSize: '0.7rem' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
              {t('dashboard.intelligenceHub')}
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>•</span>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              {t('dashboard.welcomeBack')}, <strong style={{ color: '#f8fafc' }}>{user?.full_name || t('roles.healthcare_professional')}</strong>
            </span>
          </div>

          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            {t('dashboard.overviewTitle')}
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            {t('dashboard.overviewSubtitle')}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary"
            style={{ padding: '0.55rem 0.9rem', fontSize: '0.82rem' }}
            title={t('common.refresh')}
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? t('common.updating') : t('common.refresh')}</span>
          </button>

          <button
            type="button"
            onClick={() => handleReportNavigation('text')}
            disabled={isLocating}
            className="btn-primary"
            style={{ padding: '0.55rem 1.2rem', fontSize: '0.85rem' }}
          >
            <FileText size={16} />
            <span>{isLocating ? t('dashboard.detectingGps') : t('dashboard.submitReportBtn')}</span>
          </button>
        </div>
      </div>

      {/* ── 1. Statistics Cards (6 Key Metrics with Animated Counters) ── */}
      <div
        className="stat-card-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1.1rem',
        }}
      >
        {/* Total Users */}
        <div className="saas-card saas-card-interactive" style={{ padding: '1.3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
              {t('dashboard.registeredUsers')}
            </span>
            <div style={{ background: 'rgba(2, 132, 199, 0.15)', padding: '0.4rem', borderRadius: '8px' }}>
              <Users size={17} color="#38bdf8" />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.5rem' }}>
            {loading ? <Skeleton width="70px" height="32px" /> : <AnimatedCounter value={stats?.total_users || 0} />}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            {t('dashboard.registeredUsersDesc')}
          </div>
        </div>

        {/* Total Health Reports */}
        <div className="saas-card saas-card-interactive" style={{ padding: '1.3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
              {t('dashboard.totalReports')}
            </span>
            <div style={{ background: 'rgba(20, 184, 166, 0.15)', padding: '0.4rem', borderRadius: '8px' }}>
              <FileText size={17} color="#2dd4bf" />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.5rem' }}>
            {loading ? <Skeleton width="70px" height="32px" /> : <AnimatedCounter value={stats?.total_reports || 0} />}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            {t('dashboard.totalReportsDesc')}
          </div>
        </div>

        {/* Active Reports in 24h Window */}
        <div className="saas-card saas-card-interactive card-glow-teal" style={{ padding: '1.3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#38bdf8', textTransform: 'uppercase' }}>
              {t('dashboard.activeReports24h')}
            </span>
            <div style={{ background: 'rgba(56, 189, 248, 0.18)', padding: '0.4rem', borderRadius: '8px' }}>
              <Activity size={17} color="#38bdf8" />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.5rem' }}>
            {loading ? <Skeleton width="70px" height="32px" /> : <AnimatedCounter value={activeReportsInWindow} />}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem' }}>
            {t('dashboard.activeReports24hDesc')}
          </div>
        </div>

        {/* Low Risk Cases */}
        <div className="saas-card saas-card-interactive" style={{ padding: '1.3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#34d399', textTransform: 'uppercase' }}>
              {t('dashboard.lowRisk')}
            </span>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.4rem', borderRadius: '8px' }}>
              <CheckCircle2 size={17} color="#10b981" />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#34d399', marginTop: '0.5rem' }}>
            {loading ? <Skeleton width="70px" height="32px" /> : <AnimatedCounter value={lowRiskCount} />}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            {t('dashboard.lowRiskDesc')}
          </div>
        </div>

        {/* Medium Risk Cases */}
        <div className="saas-card saas-card-interactive" style={{ padding: '1.3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#fbbf24', textTransform: 'uppercase' }}>
              {t('dashboard.mediumRisk')}
            </span>
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '0.4rem', borderRadius: '8px' }}>
              <AlertTriangle size={17} color="#f59e0b" />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#fbbf24', marginTop: '0.5rem' }}>
            {loading ? <Skeleton width="70px" height="32px" /> : <AnimatedCounter value={medRiskCount} />}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            {t('dashboard.mediumRiskDesc')}
          </div>
        </div>

        {/* High Risk Cases */}
        <div className="saas-card saas-card-interactive card-glow-danger" style={{ padding: '1.3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#f87171', textTransform: 'uppercase' }}>
              {t('dashboard.highRisk')}
            </span>
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '0.4rem', borderRadius: '8px' }}>
              <ShieldAlert size={17} color="#ef4444" />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f87171', marginTop: '0.5rem' }}>
            {loading ? <Skeleton width="70px" height="32px" /> : <AnimatedCounter value={highRiskCount} />}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            {t('dashboard.highRiskDesc')}
          </div>
        </div>
      </div>

      {/* ── 2. Surveillance Status & Active Disease Alerts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 1fr)', gap: '1.5rem' }} className="grid-2col">
        {/* Prominent Community Risk Card */}
        <div
          className="saas-card"
          style={{
            padding: '1.75rem',
            background: 'linear-gradient(135deg, rgba(16, 28, 56, 0.9) 0%, rgba(11, 20, 42, 0.95) 100%)',
            border: `1px solid ${overallRisk === 'High' ? 'rgba(239, 68, 68, 0.4)' : overallRisk === 'Medium' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.35)'}`,
            boxShadow: `0 10px 30px ${overallRisk === 'High' ? 'rgba(239,68,68,0.2)' : overallRisk === 'Medium' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)'}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HeartPulse size={20} color={overallRiskColor} />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
                  {t('dashboard.communityStatusTitle')}
                </h2>
              </div>
              <span
                style={{
                  background: overallRiskBg,
                  color: overallRiskColor,
                  border: `1px solid ${overallRiskColor}66`,
                  padding: '0.35rem 0.85rem',
                  borderRadius: '9999px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  textTransform: 'uppercase',
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: overallRiskColor,
                    boxShadow: `0 0 10px ${overallRiskColor}`,
                    animation: 'pulseDot 1.8s infinite',
                  }}
                />
                {translateRisk(t, overallRisk)}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>{t('dashboard.activeReports24h')}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.3rem' }}>
                  {activeReportsInWindow}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#38bdf8' }}>{t('dashboard.surveillanceSummary')}</div>
              </div>

              <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>{t('common.status')}</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: overallRiskColor, marginTop: '0.3rem' }}>
                  {overallRisk === 'High' ? t('risk.highRiskSignal') : overallRisk === 'Medium' ? t('risk.mediumRiskSignal') : t('risk.lowRiskSignal')}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{t('dashboard.talukMatrixTitle')}</div>
              </div>

              <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>{t('common.time')}</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginTop: '0.3rem' }}>
                  {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#64748b' }}>45s {t('common.refresh')}</div>
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5 }}>
              <strong>{t('common.info')}:</strong> {overallTrend}. {t('dashboard.overviewSubtitle')}
            </p>
          </div>

          <div style={{ marginTop: '1.2rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              RandomForest_v1.0 + Rolling 24h Window
            </span>
            <Link to="/alerts" style={{ fontSize: '0.84rem', color: '#38bdf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              {t('dashboard.viewAlertsAction')} <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Active Disease Alerts & Preventive Advisories */}
        <div
          className="saas-card"
          style={{
            padding: '1.75rem',
            background: 'linear-gradient(135deg, rgba(16, 26, 52, 0.9) 0%, rgba(10, 18, 38, 0.95) 100%)',
            border: alerts.some((a) => a.title?.toLowerCase().includes('high'))
              ? '1px solid rgba(239, 68, 68, 0.4)'
              : alerts.length > 0
              ? '1px solid rgba(245, 158, 11, 0.35)'
              : '1px solid rgba(20, 184, 166, 0.25)',
            boxShadow: alerts.some((a) => a.title?.toLowerCase().includes('high'))
              ? '0 10px 30px rgba(239, 68, 68, 0.15)'
              : '0 10px 30px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={20} color={alerts.some((a) => a.title?.toLowerCase().includes('high')) ? '#ef4444' : '#f59e0b'} />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
                  {t('dashboard.recentAlertsTitle')}
                </h2>
              </div>
              <span
                style={{
                  background: alerts.length > 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  color: alerts.length > 0 ? '#f59e0b' : '#10b981',
                  border: `1px solid ${alerts.length > 0 ? '#f59e0b44' : '#10b98144'}`,
                  padding: '0.25rem 0.65rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: alerts.length > 0 ? '#f59e0b' : '#10b981',
                  }}
                />
                {alerts.length} {t('dashboard.activeAlertsTile')}
              </span>
            </div>

            {alerts.length === 0 ? (
              <div
                style={{
                  padding: '1.75rem 1.25rem',
                  textAlign: 'center',
                  background: 'rgba(0, 0, 0, 0.25)',
                  borderRadius: '12px',
                  border: '1px dashed rgba(255, 255, 255, 0.1)',
                  margin: '0.5rem 0',
                }}
              >
                <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 0.5rem' }} />
                <div style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.95rem' }}>
                  {t('dashboard.noRecentAlerts')}
                </div>
                <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.25rem', lineHeight: 1.4 }}>
                  {t('dashboard.noAffectedAreas')}
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  maxHeight: '270px',
                  overflowY: 'auto',
                  paddingRight: '0.25rem',
                }}
              >
                {alerts.slice(0, 2).map((alert) => {
                  const isHigh = alert.title?.toLowerCase().includes('high');
                  return (
                    <div
                      key={alert.id}
                      style={{
                        background: 'rgba(10, 17, 34, 0.8)',
                        border: isHigh ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: '12px',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc' }}>
                          {alert.title}
                        </div>
                        <span
                          className={`badge ${
                            isHigh ? 'badge-high' : alert.status === 'verified' ? 'badge-verified' : 'badge-medium'
                          }`}
                          style={{ fontSize: '0.62rem' }}
                        >
                          {alert.status ? t(`alerts.status${alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}`, alert.status) : t('common.active')}
                        </span>
                      </div>

                      <p style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.4, margin: 0 }}>
                        {alert.message?.length > 120 ? alert.message.substring(0, 118) + '…' : alert.message}
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem', fontSize: '0.74rem' }}>
                        <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <MapPin size={13} color="#0284c7" />
                          {alert.location_name || 'Karnataka'}
                        </span>
                        <span style={{ color: '#38bdf8', fontWeight: 500 }}>
                          {alert.reported_count ? `${alert.reported_count} ${t('common.cases')}` : translateRisk(t, isHigh ? 'High' : 'Medium')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div
            style={{
              marginTop: '1.2rem',
              paddingTop: '1rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              ICMR & State Clinical Protocols
            </span>
            <Link
              to="/alerts"
              style={{
                fontSize: '0.84rem',
                color: '#38bdf8',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              {t('dashboard.viewAlertsAction')} <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── 3. Disease Trends & Risk Analytics Charts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '1.5rem' }} className="grid-2col">
        {/* Disease Trends Bar Chart */}
        <div className="saas-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
                {t('dashboard.diseaseDistributionTitle')}
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                {t('dashboard.diseaseDistributionSubtitle')}
              </p>
            </div>
            <span className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>
              {t('common.all')}
            </span>
          </div>

          <div style={{ width: '100%', height: '280px' }}>
            {diseaseChartData.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                {t('dashboard.noRecentReports')}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={diseaseChartData} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} angle={-20} textAnchor="end" />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: '#0d1527',
                      border: '1px solid #1e293b',
                      borderRadius: '10px',
                      color: '#f8fafc',
                      fontSize: '0.85rem',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    }}
                    formatter={(val, name, item) => [`${val} ${t('common.cases')}`, item.payload.fullName]}
                  />
                  <Bar dataKey="count" fill="url(#colorCyanGradient)" radius={[6, 6, 0, 0]} />
                  <defs>
                    <linearGradient id="colorCyanGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Risk Level Distribution Donut Chart */}
        <div className="saas-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
                {t('common.riskLevel')}
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                {t('dashboard.overviewSubtitle')}
              </p>
            </div>
            <span className="badge badge-low" style={{ fontSize: '0.68rem' }}>
              ML Output
            </span>
          </div>

          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDonutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riskDonutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#0d1527',
                    border: '1px solid #1e293b',
                    borderRadius: '10px',
                    color: '#f8fafc',
                    fontSize: '0.85rem',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(val, entry) => (
                    <span style={{ color: '#cbd5e1', fontSize: '0.8rem', marginRight: '1rem' }}>
                      {val}: <strong>{entry.payload.value}</strong>
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── 4. High Risk Areas & Recent Reports ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)', gap: '1.5rem' }} className="grid-2col">
        {/* Affected Surveillance Areas */}
        <div className="saas-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={18} color="#ef4444" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
                {t('dashboard.talukMatrixTitle')}
              </h2>
            </div>
            <Link to="/map" style={{ fontSize: '0.8rem', color: '#38bdf8' }}>
              {t('nav.map')} →
            </Link>
          </div>

          {affectedAreas.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', color: '#94a3b8', fontSize: '0.86rem' }}>
              <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 0.5rem' }} />
              <div>{t('dashboard.noAffectedAreas')}</div>
              <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.2rem' }}>
                {t('risk.stableBaseline')}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {affectedAreas.map((area, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(10, 17, 34, 0.7)',
                    border: area.risk_level === 'High Risk Signal' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '10px',
                    padding: '0.9rem 1.1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#f8fafc' }}>
                      {area.taluk}, {area.district}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                      {t('dashboard.activeReports24h')}: <strong>{area.report_count_active}</strong> ({area.window_hours || 24}h)
                    </div>
                  </div>
                  <span className={`badge ${area.risk_level === 'High Risk Signal' ? 'badge-high' : 'badge-medium'}`}>
                    {area.risk_level === 'High Risk Signal' ? t('risk.highRisk') : t('risk.mediumRisk')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Community Reports Table */}
        <div className="saas-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
              {t('dashboard.recentReportsTitle')}
            </h2>
            <Link to="/my-reports" style={{ fontSize: '0.8rem', color: '#38bdf8' }}>
              {t('common.viewAll')} →
            </Link>
          </div>

          {stats?.recent_reports?.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.86rem' }}>
              {t('dashboard.noRecentReports')}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th>{t('common.disease')}</th>
                    <th>{t('common.symptoms')}</th>
                    <th>{t('common.location')}</th>
                    <th>{t('common.date')}</th>
                    <th>{t('common.riskLevel')}</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats?.recent_reports || []).slice(0, 5).map((rep) => (
                    <tr key={rep.id}>
                      <td style={{ fontWeight: 600, color: '#f8fafc' }}>
                        {translateDisease(t, rep.disease || 'General Fever')}
                      </td>
                      <td style={{ maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {rep.symptoms}
                      </td>
                      <td>{rep.taluk ? `${rep.taluk}, ${rep.district || ''}` : rep.location_name || 'Karnataka'}</td>
                      <td style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        {new Date(rep.report_date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td>
                        <span className={`badge badge-${(rep.risk_assessment?.risk_level || 'low').toLowerCase()}`}>
                          {translateRisk(t, rep.risk_assessment?.risk_level || 'Low')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── 5. Interactive Community Health Map Preview ── */}
      <div className="saas-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.8rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Map size={20} color="#0284c7" /> {t('map.title')}
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '0.2rem' }}>
              {t('map.subtitle')}
            </p>
          </div>

          <Link to="/map" className="btn-secondary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}>
            {t('map.title')} <ExternalLink size={14} />
          </Link>
        </div>

        <HealthMap height="420px" />
      </div>
    </div>
  );
}
