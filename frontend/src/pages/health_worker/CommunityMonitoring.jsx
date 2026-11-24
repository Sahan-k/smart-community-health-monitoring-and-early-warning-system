import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Activity,
  Layers,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  BarChart3,
} from 'lucide-react';
import api from '../../services/api';
import AnimatedCounter from '../../components/AnimatedCounter';

const CHART_COLORS = ['#0284c7', '#0d9488', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4', '#10b981'];

export default function CommunityMonitoring() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [taluks, setTaluks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/dashboard/stats'),
      api.get('/api/reports/risk-summary').catch(() => ({ data: [] })),
    ])
      .then(([statsRes, taluksRes]) => {
        setStats(statsRes.data);
        setTaluks(taluksRes.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading || !stats) {
    return (
      <div className="saas-card" style={{ padding: '3.5rem', textAlign: 'center', color: '#94a3b8' }}>
        {t('common.loading')}
      </div>
    );
  }

  const diseaseData = Object.keys(stats.disease_counts || {}).map((disease) => ({
    name: disease.length > 14 ? disease.substring(0, 12) + '…' : disease,
    fullName: disease,
    count: stats.disease_counts[disease],
  }));

  const locationData = Object.keys(stats.location_counts || {}).slice(0, 6).map((loc) => ({
    name: loc.length > 14 ? loc.substring(0, 12) + '…' : loc,
    fullName: loc,
    count: stats.location_counts[loc],
  }));

  const riskData = [
    { name: t('risk.lowRisk'), value: stats.low_risk_count, color: '#10b981' },
    { name: t('risk.mediumRisk'), value: stats.medium_risk_count, color: '#f59e0b' },
    { name: t('risk.highRisk'), value: stats.high_risk_count, color: '#ef4444' },
  ].filter((item) => item.value > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div
        className="saas-card"
        style={{
          padding: '2rem',
          background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.15) 0%, rgba(2, 132, 199, 0.1) 100%)',
          display: 'flex',
          alignItems: 'center',
          gap: '1.2rem',
          borderLeft: '4px solid #14b8a6',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #0d9488, #0284c7)',
            padding: '0.8rem',
            borderRadius: '14px',
            boxShadow: '0 4px 15px rgba(20, 184, 166, 0.4)',
          }}
        >
          <TrendingUp size={28} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.2 }}>
              {t('analytics.title')}
            </h1>
            <span className="badge badge-low" style={{ fontSize: '0.68rem' }}>
              {t('analytics.realtimeBadge')}
            </span>
          </div>
          <p style={{ fontSize: '0.88rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            {t('analytics.subtitle')}
          </p>
        </div>
      </div>

      {/* Metrics Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="saas-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.76rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>{t('analytics.totalReports')}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.3rem' }}>
            <AnimatedCounter value={stats.total_reports} />
          </div>
        </div>

        <div className="saas-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.76rem', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 600 }}>{t('dashboard.activeReports24h')}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.3rem' }}>
            <AnimatedCounter value={stats.active_reports_count || (stats.low_risk_count + stats.medium_risk_count + stats.high_risk_count)} />
          </div>
        </div>

        <div className="saas-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.76rem', color: '#f87171', textTransform: 'uppercase', fontWeight: 600 }}>{t('dashboard.highRisk')}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f87171', marginTop: '0.3rem' }}>
            <AnimatedCounter value={stats.high_risk_count} />
          </div>
        </div>

        <div className="saas-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.76rem', color: '#34d399', textTransform: 'uppercase', fontWeight: 600 }}>ML Model Version</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399', marginTop: '0.6rem' }}>
            RandomForest_v1.0
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '1.5rem' }} className="grid-2col">
        {/* Disease Distribution Bar Chart */}
        <div className="saas-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
                {t('analytics.diseaseIncidence')}
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                {t('analytics.diseaseIncidenceSubtitle')}
              </p>
            </div>
            <span className="badge badge-cyan" style={{ fontSize: '0.66rem' }}>
              Condition Breakdown
            </span>
          </div>

          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={diseaseData} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} angle={-20} textAnchor="end" />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: '#0d1527',
                    border: '1px solid #1e293b',
                    borderRadius: '10px',
                    color: '#f8fafc',
                    fontSize: '0.85rem',
                  }}
                  formatter={(val, name, item) => [`${val} Reports`, item.payload.fullName]}
                />
                <Bar dataKey="count" fill="#0284c7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Donut */}
        <div className="saas-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
                {t('analytics.riskStratification')}
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                {t('analytics.riskStratificationSubtitle')}
              </p>
            </div>
            <span className="badge badge-low" style={{ fontSize: '0.66rem' }}>
              ML Output
            </span>
          </div>

          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={riskData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={105}
                  paddingAngle={5}
                >
                  {riskData.map((entry, index) => (
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
                    <span style={{ color: '#cbd5e1', fontSize: '0.82rem', marginRight: '1rem' }}>
                      {val}: <strong>{entry.payload.value}</strong>
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Regional Taluk Cluster Breakdown */}
      <div className="saas-card" style={{ padding: '1.75rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.4rem' }}>
          {t('analytics.talukClusters')}
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1.2rem' }}>
          {t('analytics.talukClustersSubtitle')}
        </p>

        {taluks.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.88rem' }}>
            {t('analytics.noTalukClusters')}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>{t('common.taluk')}</th>
                  <th>{t('common.district')}</th>
                  <th>{t('common.state')}</th>
                  <th>{t('analytics.activeCases24h')}</th>
                  <th>{t('common.riskLevel')}</th>
                </tr>
              </thead>
              <tbody>
                {taluks.map((t, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 700, color: '#f8fafc' }}>{t.taluk}</td>
                    <td>{t.district}</td>
                    <td>{t.state}</td>
                    <td style={{ fontWeight: 700, color: '#38bdf8' }}>{t.report_count_active}</td>
                    <td>
                      <span
                        className={`badge ${
                          t.risk_level === 'High Risk Signal'
                            ? 'badge-high'
                            : t.risk_level === 'Medium Risk'
                            ? 'badge-medium'
                            : 'badge-low'
                        }`}
                      >
                        {t.risk_level}
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
  );
}
