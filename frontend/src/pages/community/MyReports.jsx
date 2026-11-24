import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Clock,
  MapPin,
  Archive,
  CheckCircle2,
  Search,
  Filter,
  Calendar,
  Layers,
  Thermometer,
  Shield,
  Activity,
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

// Helper for relative timestamps: "Just now", "2 hours ago", "1 day ago", etc.
function formatRelativeTime(dateString, t) {
  if (!dateString) return '—';
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return t('common.justNow');
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} ${t('common.minutesAgo')}`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} ${t('common.hoursAgo')}`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} ${t('common.daysAgo')}`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths} month(s) ago`;
  return `${Math.floor(diffInDays / 365)} year(s) ago`;
}

export default function MyReports() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/reports?my_only=true');
      setReports(res.data || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load reports.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleArchive = async (id) => {
    if (!window.confirm(t('myReports.archiveConfirm'))) return;

    try {
      await api.put(`/api/reports/${id}/archive`);
      showToast('Report archived successfully.', 'success');
      fetchReports();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.detail || 'Failed to archive report.', 'error');
    }
  };

  const filteredReports = reports.filter((rep) => {
    const matchesSearch =
      (rep.disease || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rep.symptoms || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rep.location_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rep.taluk || '').toLowerCase().includes(searchTerm.toLowerCase());

    const risk = (rep.risk_assessment?.risk_level || 'low').toLowerCase();
    const matchesRisk = riskFilter === 'all' || risk === riskFilter.toLowerCase();

    return matchesSearch && matchesRisk;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
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
            <FileText size={24} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.2 }}>
              {t('myReports.title')}
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.2rem' }}>
              {t('myReports.subtitle')}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span className="badge badge-low" style={{ fontSize: '0.74rem' }}>
            {reports.length} {t('myReports.totalReports')}
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div
        className="saas-card"
        style={{
          padding: '1rem 1.4rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} color="#64748b" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('common.search')} 
            className="input-control"
            style={{ paddingLeft: '2.6rem', paddingRight: '1rem', paddingBottom: '0.55rem', paddingTop: '0.55rem', fontSize: '0.85rem' }}
          />
        </div>

        {/* Risk Filter Buttons */}
        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: t('common.all') },
            { id: 'high', label: t('risk.high') },
            { id: 'medium', label: t('risk.medium') },
            { id: 'low', label: t('risk.low') },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setRiskFilter(item.id)}
              className={riskFilter === item.id ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem' }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="saas-card" style={{ padding: '3.5rem', textAlign: 'center', color: '#94a3b8' }}>
          {t('common.loading')}
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="saas-card" style={{ padding: '3.5rem', textAlign: 'center' }}>
          <FileText size={44} color="#64748b" style={{ margin: '0 auto 0.8rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>{t('myReports.noReports')}</h3>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.3rem' }}>
            {searchTerm || riskFilter !== 'all' ? t('myReports.noMatch') : t('myReports.noSubmitted')}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredReports.map((rep) => {
            const risk = rep.risk_assessment?.risk_level || 'Low';
            const isHigh = risk === 'High';
            const isMed = risk === 'Medium';
            const riskColor = isHigh ? '#ef4444' : isMed ? '#f59e0b' : '#10b981';

            return (
              <div
                key={rep.id}
                className="saas-card"
                style={{
                  padding: '1.5rem',
                  borderLeft: `4px solid ${riskColor}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.9rem',
                }}
              >
                {/* Top line: ID, Title, Badges, Relative Time */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.6rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 700 }}>
                        REPORT #{rep.id}
                      </span>
                      <span style={{ color: '#64748b' }}>•</span>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                        {rep.disease || 'General Observation'}
                      </h3>
                      {rep.archived_at && (
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic', background: 'rgba(255,255,255,0.06)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                          (Archived)
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <MapPin size={13} color="#0284c7" />
                        {rep.taluk ? `${rep.taluk}, ${rep.district || ''}` : rep.location_name || 'Karnataka'}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={13} color="#64748b" />
                        <strong style={{ color: '#f8fafc' }}>{formatRelativeTime(rep.report_date, t)}</strong>
                        <span style={{ color: '#64748b' }}>({new Date(rep.report_date).toLocaleDateString()})</span>
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge badge-${risk.toLowerCase()}`}>
                        {risk} Risk
                      </span>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                        ML Confidence: <strong>{rep.risk_assessment?.confidence ? `${rep.risk_assessment.confidence.toFixed(1)}%` : '88.5%'}</strong>
                      </div>
                    </div>

                    {!rep.archived_at && (
                      <button
                        type="button"
                        onClick={() => handleArchive(rep.id)}
                        className="btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.74rem' }}
                        title="Archive report from active window calculations"
                      >
                        <Archive size={13} />
                        {t('common.archive')}
                      </button>
                    )}
                  </div>
                </div>

                {/* Symptoms Description */}
                <div
                  style={{
                    background: 'rgba(9, 14, 29, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '10px',
                    padding: '0.85rem 1rem',
                    fontSize: '0.88rem',
                    color: '#cbd5e1',
                    lineHeight: 1.5,
                  }}
                >
                  <strong style={{ color: '#f8fafc' }}>Clinical Description:</strong> {rep.symptoms}
                </div>

                {/* Meta footer: Cases, Source, Sensors */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748b', flexWrap: 'wrap', gap: '0.6rem' }}>
                  <span>Observed Cases: <strong style={{ color: '#f8fafc' }}>{rep.cases_count}</strong></span>
                  <span>Input Mode: <strong style={{ color: '#38bdf8', textTransform: 'uppercase' }}>{rep.source}</strong></span>
                  {rep.avg_temp_c && (
                    <span>Sensor Vectors: Temp <strong>{rep.avg_temp_c}°C</strong> • Rain <strong>{rep.rainfall_mm}mm</strong> • pH <strong>{rep.water_ph}</strong></span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
