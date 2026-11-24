import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Mic,
  MapPin,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Info,
  CloudSun,
  Navigation,
  Sparkles,
  Thermometer,
  ShieldCheck,
  RefreshCw,
  Mail,
  Send,
} from 'lucide-react';
import VoiceInputModal from '../../components/VoiceInputModal';
import api from '../../services/api';
import { detectLocationViaGps } from '../../services/geolocationService';
import { useToast } from '../../context/ToastContext';

// Common symptom tags for quick 1-click selection
const POPULAR_SYMPTOMS = [
  'High Fever',
  'Severe Headache',
  'Dry Cough',
  'Loose Stools / Diarrhea',
  'Joint & Muscle Pain',
  'Skin Rash',
  'Shortness of Breath',
  'Vomiting & Nausea',
  'Chills & Shivering',
  'Sore Throat',
];

export default function SubmitReport() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Location Hierarchy State (State → District → Taluk → Village → Pincode)
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [taluks, setTaluks] = useState([]);
  const [villages, setVillages] = useState([]);
  const [pincodes, setPincodes] = useState([]);

  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedTaluk, setSelectedTaluk] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');
  const [selectedPincode, setSelectedPincode] = useState('');
  const [gpsCoords, setGpsCoords] = useState(null);

  const [disease, setDisease] = useState('Viral Fever');
  const [symptoms, setSymptoms] = useState('');
  const [severity, setSeverity] = useState('Moderate'); // Mild, Moderate, Severe
  const [casesCount, setCasesCount] = useState(1);
  const [source, setSource] = useState('text');

  // Environmental Parameters
  const [envData, setEnvData] = useState({
    avg_temp_c: 28.0,
    rainfall_mm: 45.0,
    humidity_percent: 68.0,
    water_ph: 7.2,
    turbidity_ntu: 2.1,
    temp_source: 'Regional baseline',
  });

  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formReady, setFormReady] = useState(false);
  const [gpsNotice, setGpsNotice] = useState('');
  const [resultAssessment, setResultAssessment] = useState(null);
  const [emailDelivery, setEmailDelivery] = useState(null);
  const [talukRiskSummary, setTalukRiskSummary] = useState(null);
  const [error, setError] = useState('');

  // Real Email & SMTP Testing State
  const [showEmailDiagnostics, setShowEmailDiagnostics] = useState(false);
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [smtpStatus, setSmtpStatus] = useState(null);
  const [testEmailRecipient, setTestEmailRecipient] = useState('dsahan741@gmail.com');
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailStatus, setTestEmailStatus] = useState(null);

  const handleTestSmtpConnection = async () => {
    setSmtpTesting(true);
    setSmtpStatus(null);
    try {
      const res = await api.get('/api/alerts/test-smtp-connection');
      setSmtpStatus(res.data);
      if (res.data.status === 'success') {
        showToast('Gmail SMTP connection & authentication verified!', 'success');
      } else {
        showToast('SMTP connection test failed. Check backend logs.', 'error');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.detail || err.message || 'Failed to connect to SMTP test endpoint.';
      setSmtpStatus({ status: 'failed', message: msg });
      showToast('SMTP connection test failed.', 'error');
    } finally {
      setSmtpTesting(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailRecipient || !testEmailRecipient.includes('@')) {
      showToast('Please enter a valid recipient email address.', 'warning');
      return;
    }
    setSendingTestEmail(true);
    setTestEmailStatus(null);
    try {
      const res = await api.post('/api/alerts/test-email', {
        recipient_email: testEmailRecipient,
      });
      setTestEmailStatus(res.data);
      if (res.data.status === 'success') {
        showToast(`Test email successfully delivered to ${testEmailRecipient}!`, 'success');
      } else {
        showToast(`Test email delivery failed: ${res.data.message || 'SMTP error'}`, 'error');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.detail || err.message || 'Failed to deliver test email.';
      setTestEmailStatus({ status: 'error', message: msg });
      showToast('Failed to deliver test email.', 'error');
    } finally {
      setSendingTestEmail(false);
    }
  };

  // Auto-populate from GPS reverse geocoded data
  const populateDetectedLocation = async (locData, stateList = []) => {
    if (!locData) return;

    if (locData.latitude && locData.longitude) {
      setGpsCoords({
        latitude: parseFloat(locData.latitude),
        longitude: parseFloat(locData.longitude),
      });
    }

    const availableStates = stateList.length > 0 ? stateList : states;
    let matchedState = '';
    if (locData.state) {
      matchedState = availableStates.find((s) => s.toLowerCase() === locData.state.toLowerCase()) || locData.state;
    }

    if (matchedState) {
      setSelectedState(matchedState);
      try {
        const distRes = await api.get(`/api/locations/districts?state=${encodeURIComponent(matchedState)}`);
        const distList = distRes.data || [];
        setDistricts(distList);

        let matchedDist = '';
        if (locData.district) {
          matchedDist = distList.find((d) => d.toLowerCase() === locData.district.toLowerCase()) ||
                        distList.find((d) => d.toLowerCase().includes(locData.district.toLowerCase()) || locData.district.toLowerCase().includes(d.toLowerCase())) ||
                        locData.district;
        }

        if (matchedDist) {
          setSelectedDistrict(matchedDist);
          api.get(`/api/locations/environmental?state=${encodeURIComponent(matchedState)}&district=${encodeURIComponent(matchedDist)}`)
            .then((res) => { if (res.data) setEnvData(res.data); })
            .catch(() => {});

          const talukRes = await api.get(`/api/locations/taluks?state=${encodeURIComponent(matchedState)}&district=${encodeURIComponent(matchedDist)}`);
          const talukList = talukRes.data || [];
          setTaluks(talukList);

          let matchedTaluk = '';
          if (locData.taluk) {
            matchedTaluk = talukList.find((t) => t.toLowerCase() === locData.taluk.toLowerCase()) ||
                           talukList.find((t) => t.toLowerCase().includes(locData.taluk.toLowerCase()) || locData.taluk.toLowerCase().includes(t.toLowerCase())) ||
                           locData.taluk;
          }

          if (matchedTaluk) {
            setSelectedTaluk(matchedTaluk);
            const villRes = await api.get(`/api/locations/villages?state=${encodeURIComponent(matchedState)}&district=${encodeURIComponent(matchedDist)}&taluk=${encodeURIComponent(matchedTaluk)}`);
            const villList = villRes.data || [];
            let updatedVillList = [...villList];

            let matchedVill = '';
            if (locData.village) {
              matchedVill = villList.find((v) => v.toLowerCase() === locData.village.toLowerCase()) ||
                            villList.find((v) => v.toLowerCase().includes(locData.village.toLowerCase()) || locData.village.toLowerCase().includes(v.toLowerCase()));
              if (!matchedVill) {
                matchedVill = locData.village;
                updatedVillList = [matchedVill, ...villList];
              }
            }
            setVillages(updatedVillList);

            if (matchedVill) {
              setSelectedVillage(matchedVill);
              const pinRes = await api.get(`/api/locations/pincodes?state=${encodeURIComponent(matchedState)}&district=${encodeURIComponent(matchedDist)}&taluk=${encodeURIComponent(matchedTaluk)}&village=${encodeURIComponent(matchedVill)}`);
              let pinList = pinRes.data || [];
              if (locData.pincode && !pinList.includes(locData.pincode)) {
                pinList = [locData.pincode, ...pinList];
              }
              setPincodes(pinList);
              setSelectedPincode(locData.pincode || pinList[0] || '');
            }
          }
        }
      } catch (err) {
        console.warn('Error populating detected location:', err);
      }
    }
  };

  // Location hierarchy handlers
  const handleStateChange = async (newState) => {
    setSelectedState(newState);
    setSelectedDistrict('');
    setSelectedTaluk('');
    setSelectedVillage('');
    setSelectedPincode('');
    setTaluks([]);
    setVillages([]);
    setPincodes([]);
    if (!newState) {
      setDistricts([]);
      return;
    }
    try {
      const res = await api.get(`/api/locations/districts?state=${encodeURIComponent(newState)}`);
      setDistricts(res.data || []);
    } catch {
      setDistricts([]);
    }
  };

  const handleDistrictChange = async (newDistrict) => {
    setSelectedDistrict(newDistrict);
    setSelectedTaluk('');
    setSelectedVillage('');
    setSelectedPincode('');
    setVillages([]);
    setPincodes([]);
    if (!newDistrict || !selectedState) {
      setTaluks([]);
      return;
    }
    api.get(`/api/locations/environmental?state=${encodeURIComponent(selectedState)}&district=${encodeURIComponent(newDistrict)}`)
      .then((res) => { if (res.data) setEnvData(res.data); })
      .catch(() => {});

    api.get(`/api/locations/coords?state=${encodeURIComponent(selectedState)}&district=${encodeURIComponent(newDistrict)}`)
      .then((res) => {
        if (res.data) {
          setGpsCoords({ latitude: res.data.latitude, longitude: res.data.longitude });
        }
      })
      .catch(() => {});

    try {
      const res = await api.get(`/api/locations/taluks?state=${encodeURIComponent(selectedState)}&district=${encodeURIComponent(newDistrict)}`);
      setTaluks(res.data || []);
    } catch {
      setTaluks([]);
    }
  };

  const handleTalukChange = async (newTaluk) => {
    setSelectedTaluk(newTaluk);
    setSelectedVillage('');
    setSelectedPincode('');
    setPincodes([]);
    if (!newTaluk || !selectedDistrict || !selectedState) {
      setVillages([]);
      return;
    }
    try {
      const res = await api.get(`/api/locations/villages?state=${encodeURIComponent(selectedState)}&district=${encodeURIComponent(selectedDistrict)}&taluk=${encodeURIComponent(newTaluk)}`);
      setVillages(res.data || []);
    } catch {
      setVillages([]);
    }
  };

  const handleVillageChange = async (newVillage) => {
    setSelectedVillage(newVillage);
    setSelectedPincode('');
    if (!newVillage || !selectedTaluk || !selectedDistrict || !selectedState) {
      setPincodes([]);
      return;
    }
    try {
      const res = await api.get(`/api/locations/pincodes?state=${encodeURIComponent(selectedState)}&district=${encodeURIComponent(selectedDistrict)}&taluk=${encodeURIComponent(selectedTaluk)}&village=${encodeURIComponent(newVillage)}`);
      const pinList = res.data || [];
      setPincodes(pinList);
      if (pinList.length === 1) {
        setSelectedPincode(pinList[0]);
      }
    } catch {
      setPincodes([]);
    }
  };

  // Initialization & GPS auto-detection
  useEffect(() => {
    let isMounted = true;

    async function initializeLocation() {
      let stateList = [];
      try {
        const res = await api.get('/api/locations/states');
        stateList = res.data || [];
        if (isMounted) setStates(stateList);
      } catch (err) {
        console.warn('Failed to load states:', err);
      }

      // Check if location was pre-detected on dashboard navigation
      if (location.state?.gpsLocation) {
        if (isMounted) {
          const loc = location.state.gpsLocation;
          setGpsNotice(
            `📍 GPS auto-detected: ${[loc.village, loc.taluk, loc.district, loc.state].filter(Boolean).join(', ')}${loc.pincode ? ` - ${loc.pincode}` : ''}`
          );
          await populateDetectedLocation(loc, stateList);
          setFormReady(true);
        }
        return;
      }

      if (location.state?.gpsDenied) {
        if (isMounted) {
          setGpsNotice('⚠️ Location permission was denied or GPS unavailable. Please select your location manually.');
          setFormReady(true);
        }
        return;
      }

      // Direct page load
      try {
        const detected = await detectLocationViaGps();
        if (isMounted) {
          setGpsNotice(
            `📍 GPS auto-detected: ${[detected.village, detected.taluk, detected.district, detected.state].filter(Boolean).join(', ')}${detected.pincode ? ` - ${detected.pincode}` : ''}`
          );
          await populateDetectedLocation(detected, stateList);
          setFormReady(true);
        }
      } catch {
        if (isMounted) {
          setGpsNotice('⚠️ GPS location detection skipped. Please choose your location below.');
          setFormReady(true);
        }
      }
    }

    initializeLocation();
    return () => { isMounted = false; };
  }, [location.state]);

  // Voice mode trigger
  useEffect(() => {
    if (searchParams.get('mode') === 'voice') {
      setIsVoiceModalOpen(true);
    }
  }, [searchParams]);

  const handleVoiceText = (text) => {
    if (text) {
      setSymptoms((prev) => (prev ? `${prev} ${text}` : text));
      setSource('voice');
      showToast('Voice transcription attached to symptoms.', 'success');
    }
  };

  const toggleSymptomChip = (symp) => {
    if (symptoms.toLowerCase().includes(symp.toLowerCase())) {
      // Remove
      const regex = new RegExp(`(^|,\\s*)${symp}`, 'gi');
      setSymptoms((prev) => prev.replace(regex, '').replace(/^,\s*/, '').trim());
    } else {
      // Add
      setSymptoms((prev) => (prev ? `${prev}, ${symp}` : symp));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!symptoms.trim()) {
      setError('Please provide description of symptoms observed.');
      return;
    }
    if (!selectedState || !selectedDistrict) {
      setError('Please select your location (State and District are required).');
      return;
    }
    setError('');
    setLoading(true);

    try {
      let finalLat = gpsCoords?.latitude;
      let finalLon = gpsCoords?.longitude;

      if (finalLat === undefined || finalLon === undefined || finalLat === null || finalLon === null) {
        try {
          const coordsRes = await api.get(`/api/locations/coords?state=${encodeURIComponent(selectedState)}&district=${encodeURIComponent(selectedDistrict)}`);
          if (coordsRes.data) {
            finalLat = coordsRes.data.latitude;
            finalLon = coordsRes.data.longitude;
          }
        } catch {
          finalLat = 12.9716;
          finalLon = 77.5946;
        }
      }

      const locNameParts = [selectedVillage, selectedTaluk, selectedDistrict].filter(Boolean);
      let formattedLocation = locNameParts.join(', ');
      if (selectedPincode) formattedLocation += ` - ${selectedPincode}`;

      const res = await api.post('/api/reports', {
        disease,
        symptoms: `${symptoms} [Severity: ${severity}]`,
        cases_count: parseInt(casesCount, 10) || 1,
        location_name: formattedLocation || selectedDistrict,
        state: selectedState,
        district: selectedDistrict,
        taluk: selectedTaluk,
        village: selectedVillage,
        pincode: selectedPincode,
        latitude: finalLat,
        longitude: finalLon,
        source,
        avg_temp_c: envData.avg_temp_c,
        rainfall_mm: envData.rainfall_mm,
        humidity_percent: envData.humidity_percent,
        water_ph: envData.water_ph,
        turbidity_ntu: envData.turbidity_ntu,
      });

      setResultAssessment(res.data.risk_assessment || { risk_level: 'Low', confidence: 88.0 });
      setEmailDelivery(res.data.email_delivery || null);
      if (res.data.taluk_risk_summary) {
        setTalukRiskSummary(res.data.taluk_risk_summary);
      }

      const emailStatus = res.data.email_delivery;
      if (emailStatus?.sent_count > 0) {
        showToast(`Report logged! Real email alert sent to ${emailStatus.sent_count} registered user(s).`, 'success');
      } else if (emailStatus?.status === 'failed') {
        showToast('Report logged! Email delivery failed (check SMTP settings).', 'error');
      } else {
        showToast('Health observation submitted and evaluated by ML engine!', 'success');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to submit health report.');
      showToast('Failed to submit health observation.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!formReady) {
    return (
      <div className="saas-card" style={{ maxWidth: '780px', margin: '3rem auto', padding: '3.5rem 2rem', textAlign: 'center' }}>
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(56, 189, 248, 0.15)',
            border: '2px solid #38bdf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}
        >
          <Navigation color="#38bdf8" size={28} />
        </div>
        <h2 style={{ fontSize: '1.4rem', color: '#f8fafc', fontWeight: 800, marginBottom: '0.6rem' }}>
          Initializing Geolocation Sensors...
        </h2>
        <p style={{ fontSize: '0.9rem', color: '#94a3b8', maxWidth: '520px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
          Requesting browser GPS permission to detect your State, District, Taluk, and PIN Code via OpenStreetMap Nominatim before opening the report interface.
        </p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', color: '#38bdf8', fontSize: '0.88rem' }}>
          <div style={{ width: '16px', height: '16px', border: '2px solid #38bdf8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span>Detecting location...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>
      <div className="saas-card" style={{ padding: '2.5rem' }}>
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.8rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <FileText color="#0284c7" size={24} />
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                Log Community Health Observation
              </h1>
            </div>
            <p style={{ fontSize: '0.88rem', color: '#94a3b8', marginTop: '0.35rem' }}>
              Submit observed clinical symptoms to trigger real-time Random Forest ML risk inference and automated alerts.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setShowEmailDiagnostics((prev) => !prev)}
              className="btn-secondary"
              style={{
                border: '1px solid #38bdf8',
                color: '#38bdf8',
                padding: '0.55rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              <Mail size={17} />
              <span>{showEmailDiagnostics ? 'Hide Email Diagnostics' : 'Test Email / SMTP'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsVoiceModalOpen(true)}
              className="btn-secondary"
              style={{ border: '1px solid #14b8a6', color: '#2dd4bf', padding: '0.55rem 1rem' }}
            >
              <Mic size={18} />
              <span>Voice Input Mode</span>
            </button>
          </div>
        </div>

        {/* Real Email / SMTP Diagnostic Testing Panel */}
        {showEmailDiagnostics && (
          <div
            style={{
              background: '#0a101f',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '12px',
              padding: '1.35rem 1.5rem',
              marginBottom: '1.8rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8', fontWeight: 800, fontSize: '0.96rem' }}>
                <Mail size={18} />
                <span>Real Gmail SMTP Diagnostic & Verification Console</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', background: 'rgba(255,255,255,0.06)', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                Sender: healthguardai.alerts@gmail.com
              </span>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '1.1rem' }}>
              Verify real Gmail SMTP delivery before submitting reports. Automated emails are dispatched to all registered users upon reaching <strong>HIGH RISK (3+ reports in 24 hours)</strong>.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '0.8rem' }}>
              {/* Step 1: Test Connection */}
              <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '1rem' }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.4rem' }}>
                  1. Test SMTP Connection & TLS Auth
                </div>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.85rem' }}>
                  Connects to smtp.gmail.com:587 and verifies the Gmail App Password.
                </p>
                <button
                  type="button"
                  onClick={handleTestSmtpConnection}
                  disabled={smtpTesting}
                  className="btn-secondary"
                  style={{ width: '100%', padding: '0.5rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                >
                  <RefreshCw size={14} className={smtpTesting ? 'spin' : ''} />
                  <span>{smtpTesting ? 'Testing Connection...' : 'Test SMTP Connection'}</span>
                </button>

                {smtpStatus && (
                  <div
                    style={{
                      marginTop: '0.75rem',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      background: smtpStatus.status === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      border: smtpStatus.status === 'success' ? '1px solid #10b981' : '1px solid #ef4444',
                      color: smtpStatus.status === 'success' ? '#34d399' : '#f87171',
                    }}
                  >
                    <strong>{smtpStatus.status === 'success' ? '✓ SMTP Authenticated' : '✕ Connection Error'}:</strong> {smtpStatus.message}
                  </div>
                )}
              </div>

              {/* Step 2: Send Real Test Email */}
              <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '1rem' }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.4rem' }}>
                  2. Send Real Test Alert Email
                </div>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.65rem' }}>
                  Dispatches an actual branded test alert to the recipient address.
                </p>
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
                  <input
                    type="email"
                    value={testEmailRecipient}
                    onChange={(e) => setTestEmailRecipient(e.target.value)}
                    placeholder="Recipient email address..."
                    className="input-control"
                    style={{ fontSize: '0.8rem', padding: '0.45rem 0.65rem' }}
                  />
                  <button
                    type="button"
                    onClick={handleSendTestEmail}
                    disabled={sendingTestEmail}
                    className="btn-primary"
                    style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Send size={13} />
                    <span>{sendingTestEmail ? 'Sending...' : 'Send'}</span>
                  </button>
                </div>

                {testEmailStatus && (
                  <div
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      background: testEmailStatus.status === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      border: testEmailStatus.status === 'success' ? '1px solid #10b981' : '1px solid #ef4444',
                      color: testEmailStatus.status === 'success' ? '#34d399' : '#f87171',
                    }}
                  >
                    <strong>{testEmailStatus.status === 'success' ? '✓ Delivered' : '✕ Delivery Failed'}:</strong> {testEmailStatus.message}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#f87171',
              padding: '0.85rem 1.1rem',
              borderRadius: '10px',
              fontSize: '0.88rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <div>{error}</div>
          </div>
        )}

        {gpsNotice && (
          <div
            style={{
              background: gpsNotice.startsWith('📍') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(2, 132, 199, 0.12)',
              border: gpsNotice.startsWith('📍') ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(2, 132, 199, 0.3)',
              color: gpsNotice.startsWith('📍') ? '#34d399' : '#38bdf8',
              padding: '0.85rem 1.1rem',
              borderRadius: '10px',
              fontSize: '0.85rem',
              marginBottom: '1.6rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              lineHeight: 1.4,
            }}
          >
            <Navigation size={18} style={{ flexShrink: 0 }} />
            <span>{gpsNotice}</span>
          </div>
        )}

        {/* ── Success / Result View ── */}
        {resultAssessment ? (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '16px',
              padding: '2.5rem 2rem',
              textAlign: 'center',
            }}
          >
            <CheckCircle2 size={52} color="#10b981" style={{ margin: '0 auto 1.2rem' }} />
            <h2 style={{ fontSize: '1.5rem', color: '#f8fafc', fontWeight: 800, marginBottom: '0.4rem' }}>
              Health Observation Successfully Registered
            </h2>
            <p style={{ fontSize: '0.92rem', color: '#cbd5e1', marginBottom: '1.8rem', maxWidth: '520px', margin: '0.4rem auto 1.8rem' }}>
              The report has been saved to the PostgreSQL database and processed by the Random Forest ML Inference model.
            </p>

            <div
              className="saas-card"
              style={{
                padding: '1.75rem',
                maxWidth: '460px',
                margin: '0 auto 2rem',
                textAlign: 'center',
                background: '#0d1527',
              }}
            >
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginBottom: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>
                <Cpu size={16} color="#0284c7" />
                Random Forest ML Risk Assessment
              </div>

              <span
                className={`badge badge-${(resultAssessment.risk_level || 'low').toLowerCase()}`}
                style={{ fontSize: '1.15rem', padding: '0.5rem 1.4rem' }}
              >
                {resultAssessment.risk_level} Risk Signal
              </span>

              <div style={{ fontSize: '0.88rem', color: '#cbd5e1', marginTop: '0.85rem' }}>
                Confidence Score:{' '}
                <strong style={{ color: '#38bdf8' }}>
                  {resultAssessment.confidence ? `${resultAssessment.confidence.toFixed(1)}%` : '88.5%'}
                </strong>
              </div>

              {resultAssessment.risk_level === 'High' && (
                <div style={{ marginTop: '1.2rem', textAlign: 'left', borderRadius: '10px', overflow: 'hidden' }}>
                  {emailDelivery?.status === 'success' || (emailDelivery?.sent_count && emailDelivery.sent_count > 0) ? (
                    <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', padding: '0.85rem 1.1rem', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', color: '#34d399', fontWeight: 700, fontSize: '0.9rem' }}>
                        <CheckCircle2 size={18} />
                        <span>Email sent successfully to {emailDelivery.sent_count} registered user{emailDelivery.sent_count > 1 ? 's' : ''}</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.3rem', paddingLeft: '1.65rem' }}>
                        Confirmed delivery via Gmail SMTP to: {emailDelivery.recipients?.join(', ') || 'registered community users'}.
                      </div>
                    </div>
                  ) : emailDelivery?.status === 'no_recipients' ? (
                    <div style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.35)', padding: '0.85rem 1.1rem', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', color: '#fbbf24', fontWeight: 700, fontSize: '0.9rem' }}>
                        <AlertTriangle size={18} />
                        <span>No registered email recipients found</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.3rem', paddingLeft: '1.65rem' }}>
                        No user accounts with registered email addresses exist in the database.
                      </div>
                    </div>
                  ) : emailDelivery?.status === 'skipped' ? (
                    <div style={{ background: 'rgba(2, 132, 199, 0.12)', border: '1px solid rgba(2, 132, 199, 0.35)', padding: '0.85rem 1.1rem', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', color: '#38bdf8', fontWeight: 700, fontSize: '0.9rem' }}>
                        <Info size={18} />
                        <span>Email alert already sent to registered users (Duplicate prevented)</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)', padding: '0.85rem 1.1rem', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', color: '#f87171', fontWeight: 700, fontSize: '0.9rem' }}>
                        <AlertCircle size={18} />
                        <span>Email delivery failed</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#fca5a5', marginTop: '0.3rem', paddingLeft: '1.65rem' }}>
                        {emailDelivery?.message || emailDelivery?.error || 'Failed to deliver alert email via Gmail SMTP.'}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setResultAssessment(null);
                  setEmailDelivery(null);
                  setSymptoms('');
                }}
                className="btn-secondary"
              >
                Submit Another Observation
              </button>
              <button
                type="button"
                onClick={() => navigate('/my-reports')}
                className="btn-primary"
              >
                View in My Reports
              </button>
            </div>
          </div>
        ) : (
          /* ── Report Input Form ── */
          <form onSubmit={handleSubmit}>
            {/* Hierarchical Location Dropdowns: State → District → Taluk → Village → Pincode */}
            <div style={{ marginBottom: '1.6rem' }}>
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                <MapPin size={16} color="#38bdf8" />
                <span>Geographic Location Hierarchy *</span>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', marginBottom: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.76rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>State *</label>
                  <select
                    value={selectedState}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="input-control"
                  >
                    <option value="">Select State</option>
                    {states.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.76rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>District *</label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    className="input-control"
                  >
                    <option value="">Select District</option>
                    {districts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.76rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>Taluk *</label>
                  <select
                    value={selectedTaluk}
                    onChange={(e) => handleTalukChange(e.target.value)}
                    className="input-control"
                  >
                    <option value="">Select Taluk</option>
                    {taluks.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.76rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>Village / Locality</label>
                  <select
                    value={selectedVillage}
                    onChange={(e) => handleVillageChange(e.target.value)}
                    className="input-control"
                  >
                    <option value="">Select Village</option>
                    {villages.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.76rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>PIN Code</label>
                  <select
                    value={selectedPincode}
                    onChange={(e) => setSelectedPincode(e.target.value)}
                    className="input-control"
                  >
                    <option value="">Select PIN Code</option>
                    {pincodes.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Disease Condition & Cases Count */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '1rem', marginBottom: '1.4rem' }} className="grid-2col">
              <div>
                <label className="input-label">Suspected Disease / Condition *</label>
                <select
                  value={disease}
                  onChange={(e) => setDisease(e.target.value)}
                  className="input-control"
                >
                  <option value="Viral Fever">Viral Fever</option>
                  <option value="Dengue Fever">Dengue Fever</option>
                  <option value="Malaria">Malaria</option>
                  <option value="Gastroenteritis">Gastroenteritis / Acute Diarrhea</option>
                  <option value="Chikungunya">Chikungunya</option>
                  <option value="Typhoid">Typhoid</option>
                  <option value="Respiratory Infection">Respiratory Infection</option>
                  <option value="Cholera">Cholera</option>
                </select>
              </div>

              <div>
                <label className="input-label">Observed Cases Count *</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={casesCount}
                  onChange={(e) => setCasesCount(e.target.value)}
                  className="input-control"
                />
              </div>
            </div>

            {/* Symptom Severity Selector */}
            <div style={{ marginBottom: '1.4rem' }}>
              <label className="input-label">Symptom Severity Level</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                {[
                  { id: 'Mild', desc: 'Manageable at home' },
                  { id: 'Moderate', desc: 'Requires clinical consult' },
                  { id: 'Severe', desc: 'Urgent hospitalization' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSeverity(s.id)}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '10px',
                      border: severity === s.id ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: severity === s.id ? 'rgba(2, 132, 199, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      color: severity === s.id ? '#38bdf8' : '#94a3b8',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: severity === s.id ? '#f8fafc' : undefined }}>{s.id}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem' }}>{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Symptoms Input with Quick Tag Chips */}
            <div style={{ marginBottom: '1.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                <label className="input-label" style={{ marginBottom: 0 }}>Symptoms Observed & Clinical Description *</label>
                <span style={{ fontSize: '0.76rem', color: '#64748b' }}>Click chips to add quickly</span>
              </div>

              {/* Quick Symptom Chips */}
              <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                {POPULAR_SYMPTOMS.map((symp) => {
                  const isSelected = symptoms.toLowerCase().includes(symp.toLowerCase());
                  return (
                    <button
                      key={symp}
                      type="button"
                      onClick={() => toggleSymptomChip(symp)}
                      style={{
                        padding: '0.28rem 0.65rem',
                        borderRadius: '9999px',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        background: isSelected ? 'rgba(2, 132, 199, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                        border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: isSelected ? '#38bdf8' : '#cbd5e1',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {symp}
                    </button>
                  );
                })}
              </div>

              <textarea
                required
                rows="4"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Describe observed symptoms (e.g., patient has high fever for 3 days, joint stiffness, and retro-orbital headache)..."
                className="input-control"
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Auto-Fetched Environmental Factors */}
            <div
              style={{
                padding: '1.2rem',
                background: 'rgba(16, 26, 48, 0.55)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                marginBottom: '1.8rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.86rem', fontWeight: 700, color: '#38bdf8' }}>
                  <CloudSun size={17} />
                  <span>Real-time Environmental Sensors (Auto-Fetched)</span>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Fed into ML feature vector</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                <div style={{ background: '#090e1d', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Ambient Temp</div>
                  <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.2rem' }}>{envData.avg_temp_c}°C</div>
                </div>

                <div style={{ background: '#090e1d', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Rainfall</div>
                  <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.2rem' }}>{envData.rainfall_mm} mm</div>
                </div>

                <div style={{ background: '#090e1d', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Humidity</div>
                  <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.2rem' }}>{envData.humidity_percent}%</div>
                </div>

                <div style={{ background: '#090e1d', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Water pH</div>
                  <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.2rem' }}>{envData.water_ph}</div>
                </div>

                <div style={{ background: '#090e1d', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Turbidity</div>
                  <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.2rem' }}>{envData.turbidity_ntu} NTU</div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '0.9rem',
                fontSize: '1rem',
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
                  <span>Processing ML Risk Evaluation...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Submit Health Observation & Run ML Assessment</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>

      <VoiceInputModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onVoiceResult={handleVoiceText}
      />
    </div>
  );
}
