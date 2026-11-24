import React, { useEffect, useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Clock,
  Info,
  PhoneCall,
  Activity,
  HeartPulse,
  Filter,
  Check,
  X,
  Stethoscope,
  HelpCircle,
} from 'lucide-react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// Preventive knowledge base by disease
const PREVENTIVE_MEASURES = {
  'Viral Fever': {
    title: 'Viral Fever & Seasonal Influenza',
    symptoms: 'High fever, chills, persistent body ache, headache, mild dry cough.',
    dos: [
      'Drink plenty of warm boiled water and oral rehydration solutions (ORS).',
      'Ensure adequate bed rest and avoid strenuous physical labor.',
      'Wear a 3-ply mask in crowded places to prevent airborne aerosol spread.',
      'Isolate at home during the initial 48-72 hours of fever.',
    ],
    donts: [
      'Do not self-prescribe antibiotics without clinical consultation.',
      'Do not consume cold or unpasteurized drinks from street vendors.',
      'Do not delay hospital visit if fever exceeds 102°F or persists over 3 days.',
    ],
    whenToSeekDoctor: 'Chest pain, shortness of breath, continuous vomiting, or unresponsiveness.',
  },
  'Dengue Fever': {
    title: 'Dengue Viral Infection',
    symptoms: 'Sudden high fever, retro-orbital eye pain, severe joint & bone aches (breakbone fever), red skin rash.',
    dos: [
      'Empty and scrub coolants, flower pots, tires, and overhead tanks every 5 days to prevent mosquito larvae.',
      'Use DEET-based mosquito repellents and sleep under insecticide-treated bed nets.',
      'Monitor platelet counts daily under medical supervision.',
      'Stay extensively hydrated with coconut water, ORS, and fresh soups.',
    ],
    donts: [
      'Do NOT take Aspirin, Ibuprofen, or NSAIDs as they increase hemorrhagic bleeding risk.',
      'Do not leave standing freshwater exposed anywhere in or around your home.',
    ],
    whenToSeekDoctor: 'Severe abdominal pain, persistent vomiting, mucosal bleeding from gums or nose, or sudden drop in blood pressure.',
  },
  'Malaria': {
    title: 'Malaria (Plasmodium Vivax / Falciparum)',
    symptoms: 'Periodic shivering chills followed by high burning fever and profuse sweating.',
    dos: [
      'Undergo a rapid blood smear/antigen test at your nearest primary health centre (PHC).',
      'Install fine wire mesh screens on doors and windows.',
      'Complete the full multi-day course of prescribed antimalarial medication.',
    ],
    donts: [
      'Do not halt medication early even if fever subsides.',
      'Do not allow stagnant puddles or drains around residential buildings.',
    ],
    whenToSeekDoctor: 'Extreme fatigue, jaundice (yellowish eyes), dark brown urine, or confusion.',
  },
  'Cholera': {
    title: 'Cholera & Waterborne Acute Gastroenteritis',
    symptoms: 'Painless profuse watery diarrhea ("rice-water stools"), severe dehydration, muscle cramps.',
    dos: [
      'Consume ONLY vigorously boiled (at least 1 minute) or chlorinated drinking water.',
      'Wash hands thoroughly with soap and clean running water before preparing food and eating.',
      'Begin immediate rehydration with ORS packets mixed in safe water.',
    ],
    donts: [
      'Do not consume raw vegetables, unpeeled fruits, or raw seafood during outbreak periods.',
      'Do not drink untreated borewell or open well water.',
    ],
    whenToSeekDoctor: 'Sunken eyes, lethargy, skin that doesn\'t bounce back when pinched, or absence of urination for 6 hours.',
  },
  'Typhoid': {
    title: 'Typhoid (Enteric Fever)',
    symptoms: 'Gradual step-ladder fever, extreme weakness, abdominal tenderness, constipation or pea-soup diarrhea.',
    dos: [
      'Maintain strict hand hygiene after using toilets.',
      'Eat freshly cooked, piping-hot home meals.',
      'Get vaccinated with Typhoid conjugate vaccine (TCV) if advised by health workers.',
    ],
    donts: [
      'Do not buy cut fruits or juices exposed to flies and dust.',
      'Do not prepare food for others while actively experiencing symptoms.',
    ],
    whenToSeekDoctor: 'High continuous fever, severe abdominal distension, delirium, or severe dehydration.',
  },
  'Default': {
    title: 'General Community Outbreak Guidelines',
    symptoms: 'Unusual clustering of fever, rash, gastrointestinal distress, or respiratory symptoms.',
    dos: [
      'Practice regular hand hygiene with soap and running water.',
      'Keep your premises clean and free of stagnant water reservoirs.',
      'Report any family or neighborhood cluster of illnesses via HealthGuard AI.',
      'Drink boiled water and maintain good ventilation.',
    ],
    donts: [
      'Avoid sharing personal towels, utensils, or bedding with symptomatic individuals.',
      'Avoid unverified rumors; follow official public health bulletins.',
    ],
    whenToSeekDoctor: 'Difficulty breathing, bluish lips, high persistent fever, or altered mental consciousness.',
  },
};

export default function DiseaseAlertsPage() {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRisk, setFilterRisk] = useState('all'); // all, high, medium, verified
  const [selectedDisease, setSelectedDisease] = useState('Viral Fever');
  
  // Verification modal for doctors & health workers
  const [reviewAlert, setReviewAlert] = useState(null);
  const [reviewDecision, setReviewDecision] = useState('verified');
  const [reviewComments, setReviewComments] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/alerts');
      setAlerts(res.data || []);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewAlert) return;
    setReviewLoading(true);

    try {
      await api.post(`/api/alerts/${reviewAlert.id}/review`, {
        decision: reviewDecision,
        comments: reviewComments,
      });

      showToast(`Alert #${reviewAlert.id} marked as ${reviewDecision.toUpperCase()}`, 'success');
      setReviewAlert(null);
      setReviewComments('');
      fetchAlerts();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to submit review.', 'error');
    } finally {
      setReviewLoading(false);
    }
  };

  const isMedicalStaff = user?.role === 'healthcare_professional' || user?.role === 'health_worker' || user?.role === 'administrator';

  const filteredAlerts = alerts.filter((a) => {
    if (filterRisk === 'high') return a.title?.toLowerCase().includes('high');
    if (filterRisk === 'medium') return a.title?.toLowerCase().includes('medium');
    if (filterRisk === 'verified') return a.status === 'verified';
    if (filterRisk === 'pending') return a.status === 'pending';
    return true;
  });

  const activePrevention = PREVENTIVE_MEASURES[selectedDisease] || PREVENTIVE_MEASURES['Default'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Banner */}
      <div
        className="saas-card"
        style={{
          padding: '2rem',
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(245, 158, 11, 0.08) 50%, rgba(15, 26, 54, 0.7) 100%)',
          borderLeft: '4px solid #ef4444',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <ShieldAlert size={22} color="#ef4444" />
            <span className="badge badge-high" style={{ fontSize: '0.72rem' }}>
              {t('alerts.publicAdvisoryBadge')}
            </span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.2 }}>
            {t('alerts.pageTitle')}
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#cbd5e1', marginTop: '0.3rem', maxWidth: '750px' }}>
            {t('alerts.pageSubtitle')}
          </p>
        </div>

        {/* Emergency Helpline Box */}
        <div
          style={{
            background: 'rgba(10, 18, 38, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '1rem 1.3rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
          }}
        >
          <div style={{ background: '#ef4444', padding: '0.55rem', borderRadius: '10px' }}>
            <PhoneCall size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
              {t('alerts.nationalHelpline')}
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
              104 / 1075 (Toll-Free)
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 1: Active Disease Alerts ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.8rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
              {t('alerts.currentAlertsTitle', { count: filteredAlerts.length })}
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              {t('alerts.currentAlertsSubtitle')}
            </p>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: t('alerts.filterAll') },
              { id: 'high', label: t('alerts.filterHigh') },
              { id: 'medium', label: t('alerts.filterMedium') },
              { id: 'verified', label: t('alerts.filterVerified') },
              { id: 'pending', label: t('alerts.filterPending') },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterRisk(f.id)}
                className={filterRisk === f.id ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="saas-card" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            Loading active health alerts...
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="saas-card" style={{ padding: '3rem', textAlign: 'center' }}>
            <CheckCircle2 size={44} color="#10b981" style={{ margin: '0 auto 0.8rem' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>{t('alerts.noAlertsTitle')}</h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.3rem' }}>
              {t('alerts.noAlertsSubtitle')}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.2rem' }}>
            {filteredAlerts.map((alert) => {
              const isHigh = alert.title?.toLowerCase().includes('high');
              const isMed = alert.title?.toLowerCase().includes('medium');
              const riskColor = isHigh ? '#ef4444' : isMed ? '#f59e0b' : '#10b981';

              return (
                <div
                  key={alert.id}
                  className="saas-card"
                  style={{
                    padding: '1.5rem',
                    borderLeft: `4px solid ${riskColor}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.6rem' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                        {alert.title}
                      </h3>
                      <span
                        className={`badge ${isHigh ? 'badge-high' : isMed ? 'badge-medium' : 'badge-low'}`}
                        style={{ fontSize: '0.68rem', flexShrink: 0 }}
                      >
                        {isHigh ? t('risk.high') : isMed ? t('risk.medium') : t('risk.low')}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.86rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '0.85rem' }}>
                      {alert.message}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.78rem', color: '#94a3b8' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <MapPin size={14} color="#0284c7" />
                        <span><strong>{t('common.location')}:</strong> {alert.location_name || 'Community Area'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Clock size={14} color="#64748b" />
                        <span><strong>{t('alerts.generated')}:</strong> {new Date(alert.created_at).toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <ShieldCheck size={14} color={alert.status === 'verified' ? '#10b981' : '#f59e0b'} />
                        <span><strong>{t('alerts.verificationStatus')}:</strong> <span style={{ textTransform: 'capitalize', color: '#f8fafc' }}>{alert.status}</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for Doctor / Health Worker */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.85rem' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedDisease(alert.title?.includes('Dengue') ? 'Dengue Fever' : alert.title?.includes('Malaria') ? 'Malaria' : alert.title?.includes('Cholera') ? 'Cholera' : 'Viral Fever')}
                      style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 600, cursor: 'pointer' }}
                    >
                      {t('alerts.viewPreventiveMeasures')} ↓
                    </button>

                    {isMedicalStaff && alert.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => setReviewAlert(alert)}
                        className="btn-primary"
                        style={{ padding: '0.35rem 0.8rem', fontSize: '0.76rem' }}
                      >
                        <Stethoscope size={14} /> {t('alerts.verifyAlertBtn')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Section 2: Interactive Disease Preventive Protocols ── */}
      <div className="saas-card" style={{ padding: '2rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
            <HeartPulse size={20} color="#14b8a6" />
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc' }}>
              {t('alerts.preventionProtocolsTitle')}
            </h2>
          </div>
          <p style={{ fontSize: '0.88rem', color: '#94a3b8' }}>
            {t('alerts.preventionProtocolsSubtitle')}
          </p>
        </div>

        {/* Disease Tabs */}
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.8rem' }}>
          {['Viral Fever', 'Dengue Fever', 'Malaria', 'Cholera', 'Typhoid'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setSelectedDisease(d)}
              style={{
                padding: '0.6rem 1.1rem',
                borderRadius: '10px',
                fontSize: '0.88rem',
                fontWeight: 600,
                background: selectedDisease === d ? 'linear-gradient(135deg, #0284c7, #0d9488)' : 'rgba(255, 255, 255, 0.05)',
                color: selectedDisease === d ? '#ffffff' : '#cbd5e1',
                border: selectedDisease === d ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: selectedDisease === d ? '0 4px 15px rgba(2, 132, 199, 0.35)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Active Protocol Details Card */}
        <div
          style={{
            background: 'rgba(10, 17, 36, 0.75)',
            border: '1px solid rgba(20, 184, 166, 0.3)',
            borderRadius: '16px',
            padding: '1.75rem',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
            gap: '1.8rem',
          }}
          className="grid-2col"
        >
          {/* Left: Dos & Symptoms */}
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.4rem' }}>
              {activePrevention.title}
            </h3>
            <div style={{ fontSize: '0.84rem', color: '#38bdf8', marginBottom: '1.2rem' }}>
              <strong>{t('alerts.keySymptoms')}:</strong> {activePrevention.symptoms}
            </div>

            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
              <Check size={16} /> {t('alerts.recommendedDos')}
            </h4>
            <ul style={{ paddingLeft: '1.2rem', color: '#cbd5e1', fontSize: '0.86rem', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {activePrevention.dos.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>

            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '1.2rem', marginBottom: '0.6rem' }}>
              <X size={16} /> {t('alerts.dangerousDonts')}
            </h4>
            <ul style={{ paddingLeft: '1.2rem', color: '#cbd5e1', fontSize: '0.86rem', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {activePrevention.donts.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Right: Hospital Escalation & Clinical Referral */}
          <div
            style={{
              background: 'rgba(15, 26, 54, 0.85)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '12px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
                <AlertTriangle size={20} color="#f87171" />
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
                  {t('alerts.whenToSeekHelp')}
                </h4>
              </div>
              <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '1.2rem' }}>
                {t('alerts.seekHelpDesc')}
              </p>
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '10px',
                  padding: '1rem',
                  fontSize: '0.85rem',
                  color: '#fca5a5',
                  fontWeight: 600,
                  lineHeight: 1.5,
                }}
              >
                {activePrevention.whenToSeekDoctor}
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '0.78rem', color: '#94a3b8' }}>
              <strong>{t('alerts.clinicalDisclaimer')}:</strong> {t('alerts.clinicalDisclaimerText')}
            </div>
          </div>
        </div>
      </div>

      {/* Verification Review Modal for Doctors / Health Workers */}
      {reviewAlert && (
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
              maxWidth: '520px',
              width: '100%',
              padding: '2rem',
              background: '#0d1527',
              border: '1px solid rgba(255, 255, 255, 0.14)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Stethoscope size={20} color="#38bdf8" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                  {t('alerts.reviewModalTitle')}
                </h3>
              </div>
              <button type="button" onClick={() => setReviewAlert(null)} style={{ color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.9rem', borderRadius: '10px', marginBottom: '1.2rem' }}>
              <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>{reviewAlert.title}</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>{reviewAlert.message}</div>
            </div>

            <form onSubmit={handleReviewSubmit}>
              <div style={{ marginBottom: '1.2rem' }}>
                <label className="input-label">{t('alerts.decisionLabel')}</label>
                <select
                  value={reviewDecision}
                  onChange={(e) => setReviewDecision(e.target.value)}
                  className="input-control"
                >
                  <option value="verified">{t('alerts.decisionVerified')}</option>
                  <option value="rejected">{t('alerts.decisionRejected')}</option>
                  <option value="investigate">{t('alerts.decisionInvestigate')}</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="input-label">{t('alerts.commentsLabel')}</label>
                <textarea
                  rows="3"
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  placeholder={t('alerts.commentsPlaceholder')}
                  className="input-control"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setReviewAlert(null)} className="btn-secondary">
                  {t('common.cancel')}
                </button>
                <button type="submit" disabled={reviewLoading} className="btn-primary">
                  {reviewLoading ? t('alerts.submittingDecision') : t('alerts.confirmBroadcastBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
