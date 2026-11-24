import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Map,
  Filter,
  Activity,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Layers,
  Sparkles,
} from 'lucide-react';
import HealthMap from '../components/HealthMap';
import api from '../services/api';

export default function CommunityMapPage() {
  const { t } = useTranslation();
  const [filterRisk, setFilterRisk] = useState('all');
  const [stats, setStats] = useState(null);
  const [taluks, setTaluks] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/api/dashboard/stats').catch(() => ({ data: null })),
      api.get('/api/reports/risk-summary').catch(() => ({ data: [] })),
    ]).then(([statsRes, taluksRes]) => {
      setStats(statsRes.data);
      setTaluks(taluksRes.data || []);
    });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div
        className="saas-card"
        style={{
          padding: '1.75rem 2rem',
          background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.18) 0%, rgba(20, 184, 166, 0.08) 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <Map size={22} color="#0284c7" />
            <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>
              {t('map.gisEngine')}
            </span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.2 }}>
            {t('map.title')}
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            {t('map.subtitle')}
          </p>
        </div>

        {/* Legend Pills */}
        <div style={{ display: 'flex', gap: '0.6rem', background: 'rgba(10, 18, 38, 0.7)', padding: '0.5rem 0.8rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#34d399', fontWeight: 600 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} /> {t('risk.low')}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#fbbf24', fontWeight: 600 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 8px #f59e0b' }} /> {t('risk.medium')}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#f87171', fontWeight: 600 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 8px #ef4444' }} /> {t('risk.high')}
          </span>
        </div>
      </div>

      {/* Filter and Quick Stats Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[
            { id: 'all', label: t('map.allMarkers') },
            { id: 'high', label: t('map.highRiskOnly') },
            { id: 'medium', label: t('map.mediumRiskOnly') },
            { id: 'low', label: t('map.lowRiskOnly') },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilterRisk(item.id)}
              className={filterRisk === item.id ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '0.42rem 0.9rem', fontSize: '0.82rem' }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
          {t('map.activeSurveillanceNode')}: <strong>Karnataka, India</strong> (OpenStreetMap GIS)
        </div>
      </div>

      {/* Interactive Map */}
      <HealthMap height="600px" filterRisk={filterRisk} />
    </div>
  );
}
