import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { Activity, ShieldAlert, MapPin, Layers, Filter } from 'lucide-react';

// Custom pulsing Leaflet Markers for Risk Levels
const createMarkerIcon = (color, pulseColor) => {
  return L.divIcon({
    className: 'custom-pulse-marker',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        <div style="
          position: absolute;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: ${pulseColor};
          animation: pulseGlow 2s infinite ease-in-out;
        "></div>
        <div style="
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: ${color};
          border: 3px solid #ffffff;
          box-shadow: 0 0 14px ${color};
          position: relative;
          z-index: 2;
        "></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const iconLow = createMarkerIcon('#10b981', 'rgba(16, 185, 129, 0.3)');
const iconMedium = createMarkerIcon('#f59e0b', 'rgba(245, 158, 11, 0.35)');
const iconHigh = createMarkerIcon('#ef4444', 'rgba(239, 68, 68, 0.45)');

export default function HealthMap({ height = '500px', filterRisk = 'all' }) {
  const { t } = useTranslation();
  const [mapPoints, setMapPoints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/dashboard/map')
      .then((res) => {
        setMapPoints(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching map points:', err);
        setLoading(false);
      });
  }, []);

  const getMarkerIcon = (riskLevel) => {
    if (riskLevel === 'High') return iconHigh;
    if (riskLevel === 'Medium') return iconMedium;
    return iconLow;
  };

  const filteredPoints = mapPoints.filter((pt) => {
    if (filterRisk === 'all') return true;
    return (pt.risk_level || '').toLowerCase() === filterRisk.toLowerCase();
  });

  // Center around Karnataka default
  const defaultCenter = [13.0, 76.5];

  return (
    <div
      style={{
        height: height,
        width: '100%',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
        position: 'relative',
      }}
    >
      {loading ? (
        <div
          style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#090e1d',
            color: '#94a3b8',
            fontSize: '0.9rem',
          }}
        >
          {t('common.loading')} GIS...
        </div>
      ) : (        <MapContainer center={defaultCenter} zoom={7} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {filteredPoints.map((point) => (
            <Marker
              key={point.id}
              position={[point.latitude, point.longitude]}
              icon={getMarkerIcon(point.risk_level)}
            >
              <Popup>
                <div style={{ padding: '0.4rem', minWidth: '220px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>
                      {point.location_name}
                    </span>
                    <span className={`badge badge-${point.risk_level.toLowerCase()}`} style={{ fontSize: '0.62rem' }}>
                      {point.risk_level}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: '#38bdf8', fontWeight: 600, marginBottom: '0.3rem' }}>
                    {point.disease || 'General Observation'}
                  </div>

                  <div style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.4, marginBottom: '0.5rem', background: '#0b1426', padding: '0.5rem', borderRadius: '6px' }}>
                    <strong>{t('common.symptoms')}:</strong> {point.symptoms}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: '#94a3b8' }}>
                    <span>{t('common.cases')}: <strong style={{ color: '#f8fafc' }}>{point.cases_count}</strong></span>
                    <span>{new Date(point.report_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </div>
  );
}
