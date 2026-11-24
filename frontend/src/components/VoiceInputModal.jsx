import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, MicOff, CheckCircle2, X, Sparkles, Globe } from 'lucide-react';

export default function VoiceInputModal({ isOpen, onClose, onVoiceResult }) {
  const { t, i18n } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [selectedLang, setSelectedLang] = useState(i18n.language || 'en');
  const recognitionRef = useRef(null);
  const baseTranscriptRef = useRef('');

  useEffect(() => {
    setSelectedLang(i18n.language || 'en');
  }, [i18n.language, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recog = new SpeechRecognition();
      recog.continuous = true;
      recog.interimResults = true;

      // Set recognition language according to user selection
      if (selectedLang === 'kn') {
        recog.lang = 'kn-IN';
      } else if (selectedLang === 'hi') {
        recog.lang = 'hi-IN';
      } else {
        recog.lang = 'en-IN';
      }

      recog.onresult = (event) => {
        let interim = '';
        let final = '';

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            final += result[0].transcript + ' ';
          } else {
            interim += result[0].transcript;
          }
        }

        const combined = (baseTranscriptRef.current + ' ' + final + interim).trim();
        setTranscript(combined);
      };

      recog.onerror = (event) => {
        console.warn("Speech recognition notice/error:", event.error);
        if (event.error !== 'no-speech') {
          setIsListening(false);
        }
      };

      recog.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recog;
    }
  }, [isOpen, selectedLang]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      handleSimulatedSpeech();
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      baseTranscriptRef.current = transcript; // Preserve existing transcript and append
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn("Recognition start issue:", err);
        handleSimulatedSpeech();
      }
    }
  };

  const handleSimulatedSpeech = () => {
    const samples = {
      en: [
        "Patient in Bengaluru Central experiencing high fever of 102F, severe body ache, and joint pain for 2 days.",
        "Multiple children reported watery diarrhea and vomiting near community drinking water supply.",
        "Sudden spike in high fever cases with shivering and nausea in the northern village ward."
      ],
      kn: [
        "ಬೆಂಗಳೂರಿನಲ್ಲಿ 2 ದಿನಗಳಿಂದ ತೀವ್ರ ಜ್ವರ, ತಲೆನೋವು ಮತ್ತು ಕೀಲು ನೋವು ಕಾಣಿಸಿಕೊಂಡಿದೆ.",
        "ಗ್ರಾಮದ ಕುಡಿಯುವ ನೀರಿನ ಪೈಪ್ ಬಳಿ ಹಲವು ಜನರಿಗೆ ವಾಂತಿ ಮತ್ತು ಭೇದಿ ಕಾಣಿಸಿಕೊಂಡಿದೆ.",
        "ಮಕ್ಕಳಿಗೆ ನಡುಕದೊಂದಿಗೆ ವಿಪರೀತ ಜ್ವರ ಮತ್ತು ಮೈಕೈ ನೋವು ಹೆಚ್ಚಾಗಿದೆ."
      ],
      hi: [
        "मरीज को 2 दिनों से 102 डिग्री तेज बुखार, सिरदर्द और जोड़ों में गंभीर दर्द है।",
        "गाँव के सार्वजनिक नल के पास कई लोगों को उल्टी और दस्त की शिकायत है।",
        "तेज ठंड और बुखार के कई नए मामले सामने आए हैं।"
      ]
    };

    const currentLangSamples = samples[selectedLang] || samples.en;
    const randomSample = currentLangSamples[Math.floor(Math.random() * currentLangSamples.length)];
    setTranscript(prev => (prev ? `${prev} ${randomSample}` : randomSample));
  };

  const handleApply = () => {
    onVoiceResult(transcript);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem'
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '520px', padding: '1.8rem', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: isListening ? 'rgba(239, 68, 68, 0.2)' : 'rgba(2, 132, 199, 0.2)',
            border: `2px solid ${isListening ? '#ef4444' : '#0284c7'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem',
            boxShadow: isListening ? '0 0 24px rgba(239, 68, 68, 0.5)' : 'none',
            transition: 'all 0.3s ease'
          }}>
            {isListening ? <MicOff color="#ef4444" size={28} /> : <Mic color="#0284c7" size={28} />}
          </div>

          <h2 style={{ fontSize: '1.25rem', color: '#f8fafc', fontWeight: 700 }}>
            {isListening ? t('voiceModal.titleListening') : t('voiceModal.titleIdle')}
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.3rem' }}>
            {t('voiceModal.subtitle')}
          </p>
        </div>

        {/* Language selector for speech recognition */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Globe size={16} color="#94a3b8" />
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{t('voiceModal.switchLang')}:</span>
          <div style={{ display: 'inline-flex', background: '#0f172a', borderRadius: '6px', padding: '2px', border: '1px solid #334155' }}>
            {[
              { code: 'en', label: 'English (EN)' },
              { code: 'kn', label: 'ಕನ್ನಡ (KN)' },
              { code: 'hi', label: 'हिंदी (HI)' }
            ].map(l => (
              <button
                key={l.code}
                type="button"
                onClick={() => setSelectedLang(l.code)}
                style={{
                  background: selectedLang === l.code ? '#0284c7' : 'transparent',
                  color: selectedLang === l.code ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '3px 8px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: selectedLang === l.code ? 600 : 400
                }}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{
          background: '#0f172a', border: '1px solid #334155', borderRadius: '8px',
          padding: '1rem', minHeight: '110px', marginBottom: '1rem', color: transcript ? '#f8fafc' : '#64748b',
          fontSize: '0.9rem', lineHeight: 1.5, maxHeight: '180px', overflowY: 'auto'
        }}>
          {transcript || (isListening ? t('voiceModal.placeholderListening') : t('voiceModal.placeholderIdle'))}
        </div>

        {/* Quick simulation sample button */}
        <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
          <button
            type="button"
            onClick={handleSimulatedSpeech}
            style={{
              background: 'transparent',
              border: '1px dashed #334155',
              color: '#38bdf8',
              padding: '0.35rem 0.8rem',
              borderRadius: '6px',
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Sparkles size={14} /> {t('voiceModal.simulatedSample')}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button onClick={toggleListening} className={isListening ? 'btn-secondary' : 'btn-primary'}>
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            {isListening ? t('voiceModal.stopRecording') : t('voiceModal.startRecording')}
          </button>

          {transcript && (
            <button onClick={handleApply} className="btn-primary" style={{ background: '#10b981' }}>
              <CheckCircle2 size={18} /> {t('voiceModal.applyVoiceText')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
