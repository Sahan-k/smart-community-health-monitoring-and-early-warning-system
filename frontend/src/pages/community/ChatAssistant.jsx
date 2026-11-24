import React, { useState, useEffect, useRef, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bot,
  User,
  Send,
  Sparkles,
  Globe,
  Trash2,
  Mic,
  Shield,
  HelpCircle,
  Activity,
} from 'lucide-react';
import api from '../../services/api';
import VoiceInputModal from '../../components/VoiceInputModal';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function ChatAssistant() {
  const { user } = useContext(AuthContext);
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();

  const getInitialGreeting = (lng) => {
    if (lng === 'kn') {
      return 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಸಮುದಾಯ ಆರೋಗ್ಯ ಎಐ ಸಹಾಯಕ. ರೋಗ ಲಕ್ಷಣಗಳ ಜಾಗೃತಿ, ತುರ್ತು ತಡೆಗಟ್ಟುವ ಕ್ರಮಗಳು ಮತ್ತು ಸ್ಥಳೀಯ ಆರೋಗ್ಯ ಮಾರ್ಗಸೂಚಿಗಳನ್ನು ಒದಗಿಸಲು ನಾನು ಇಲ್ಲಿದ್ದೇನೆ.\n\n*ಗಮನಿಸಿ: ಇದು ವೈದ್ಯಕೀಯ ರೋಗನಿರ್ಣಯವನ್ನು ಬದಲಿಸುವುದಿಲ್ಲ.*';
    }
    if (lng === 'hi') {
      return 'नमस्ते! मैं आपका समुदाय स्वास्थ्य एआई सहायक हूँ। बीमारी की रोकथाम, लक्षणों की जागरूकता और आपातकालीन मार्गदर्शन के लिए यहाँ उपस्थित हूँ।\n\n*नोट: यह चिकित्सीय निदान का विकल्प नहीं है।*';
    }
    return "Hello! I am your HealthGuard AI Clinical Assistant. I can help guide you on symptom recognition, preventive protocols, fever management, and report submissions.\n\n*Note: This automated assistant does not provide a formal medical diagnosis.*";
  };

  const [language, setLanguage] = useState(i18n.language || 'en');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'assistant',
      text: getInitialGreeting(i18n.language || 'en'),
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setLanguage(i18n.language || 'en');
  }, [i18n.language]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userText = inputMessage.trim();
    setInputMessage('');

    const userMsgObj = {
      id: Date.now(),
      sender: 'user',
      text: userText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsgObj]);
    setLoading(true);

    try {
      const res = await api.post('/api/chat', {
        message: userText,
        language: language,
      });

      const assistantMsgObj = {
        id: res.data.id || Date.now() + 1,
        sender: 'assistant',
        text: res.data.assistant_response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsgObj]);
    } catch (err) {
      console.error('Chat API error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          sender: 'assistant',
          text:
            language === 'kn'
              ? 'ಪ್ರಸ್ತುತ ಆರೋಗ್ಯ ಜ್ಞಾನ ವ್ಯವಸ್ಥೆಯನ್ನು ಸಂಪರ್ಕಿಸಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ನಂತರ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ಸ್ಥಳೀಯ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.'
              : language === 'hi'
              ? 'वर्तमान में स्वास्थ्य ज्ञान प्रणाली से जुड़ने में असमर्थ हूँ। कृपया पुनः प्रयास करें या डॉक्टर से संपर्क करें।'
              : 'I am experiencing connectivity delay with the healthcare knowledge base. Please try again or visit your nearest primary health clinic.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'assistant',
        text: getInitialGreeting(language),
        timestamp: new Date(),
      },
    ]);
    showToast('Chat history cleared.', 'info');
  };

  const handleQuickPrompt = (promptText) => {
    setInputMessage(promptText);
  };

  const handleVoiceResult = (text) => {
    if (text) {
      setInputMessage((prev) => (prev ? `${prev} ${text}` : text));
      showToast('Voice speech recognized.', 'success');
    }
  };

  const suggestedQuestions = [
    language === 'kn' ? 'ಡೆಂಗ್ಯೂ ಜ್ವರದ ಲಕ್ಷಣಗಳು ಯಾವುವು?' : language === 'hi' ? 'डेंगू के मुख्य लक्षण क्या हैं?' : 'What are the classic symptoms of Dengue fever?',
    language === 'kn' ? 'ಕಾಲರಾ ರೋಗವನ್ನು ಹೇಗೆ ತಡೆಗಟ್ಟಬಹುದು?' : language === 'hi' ? 'हैजा (Cholera) से बचाव के क्या उपाय हैं?' : 'How can I prevent waterborne cholera during rains?',
    language === 'kn' ? 'ಮನೆಯಲ್ಲಿ ವೈರಲ್ ಜ್ವರ ನಿರ್ವಹಣೆ ಹೇಗೆ?' : language === 'hi' ? 'वायरल बुखार में प्राथमिक देखभाल कैसे करें?' : 'What home care steps should I take for viral fever?',
    language === 'kn' ? 'ಆರೋಗ್ಯ ವರದಿಯನ್ನು ಹೇಗೆ ಸಲ್ಲಿಸಬೇಕು?' : language === 'hi' ? 'रिपोर्ट कैसे दर्ज करें?' : 'How do I submit an observation report on this app?',
  ];

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      <div
        className="saas-card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Chat Header */}
        <div
          style={{
            padding: '1.2rem 1.5rem',
            background: 'rgba(10, 18, 38, 0.9)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
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
              <Bot size={24} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.2 }}>
                  {t('assistant.chatTitle')}
                </h1>
                <span className="badge badge-low" style={{ fontSize: '0.62rem' }}>
                  {t('assistant.onlineBadge')}
                </span>
              </div>
              <p style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                {t('assistant.chatSubtitle')}
              </p>
            </div>
          </div>

          {/* Right Toolbar: Language & Clear */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {/* Language Selector */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '0.3rem 0.6rem',
                borderRadius: '8px',
              }}
            >
              <Globe size={14} color="#38bdf8" />
              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  i18n.changeLanguage(e.target.value);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#f8fafc',
                  fontSize: '0.78rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="en" style={{ background: '#0f1a36' }}>English</option>
                <option value="kn" style={{ background: '#0f1a36' }}>ಕನ್ನಡ (Kannada)</option>
                <option value="hi" style={{ background: '#0f1a36' }}>हिंदी (Hindi)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={clearChat}
              className="btn-ghost"
              style={{ padding: '0.4rem 0.6rem', color: '#94a3b8', fontSize: '0.8rem' }}
              title="Clear chat messages"
            >
              <Trash2 size={16} />
              <span className="hide-on-mobile">{t('assistant.clearChat')}</span>
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.2rem',
          }}
        >
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  gap: '0.85rem',
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  flexDirection: isUser ? 'row-reverse' : 'row',
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: isUser ? 'linear-gradient(135deg, #0284c7, #0d9488)' : '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  }}
                >
                  {isUser ? <User size={18} color="#ffffff" /> : <Bot size={19} color="#ffffff" />}
                </div>

                {/* Message Bubble */}
                <div>
                  <div
                    style={{
                      background: isUser
                        ? 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)'
                        : '#0e172e',
                      color: '#f8fafc',
                      padding: '0.9rem 1.25rem',
                      borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      border: isUser ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                      fontSize: '0.9rem',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-line',
                      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
                    }}
                  >
                    {msg.text}
                  </div>
                  <div
                    style={{
                      fontSize: '0.68rem',
                      color: '#64748b',
                      marginTop: '0.3rem',
                      textAlign: isUser ? 'right' : 'left',
                      padding: '0 0.3rem',
                    }}
                  >
                    {msg.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {loading && (
            <div style={{ display: 'flex', gap: '0.85rem', alignSelf: 'flex-start' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bot size={19} color="#ffffff" />
              </div>
              <div
                style={{
                  background: '#0e172e',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '18px 18px 18px 4px',
                  padding: '0.85rem 1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8', animation: 'pulseDot 1.4s infinite' }} />
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8', animation: 'pulseDot 1.4s infinite 0.2s' }} />
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8', animation: 'pulseDot 1.4s infinite 0.4s' }} />
                <span style={{ fontSize: '0.82rem', color: '#94a3b8', marginLeft: '0.4rem' }}>
                  {t('assistant.analyzingQuery')}
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts Bar */}
        <div
          style={{
            padding: '0.6rem 1.5rem',
            background: 'rgba(8, 14, 30, 0.85)',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            gap: '0.5rem',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
          }}
        >
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleQuickPrompt(q)}
              className="btn-secondary"
              style={{
                padding: '0.3rem 0.75rem',
                fontSize: '0.76rem',
                borderRadius: '9999px',
                flexShrink: 0,
              }}
            >
              <Sparkles size={12} color="#38bdf8" />
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSend}
          style={{
            padding: '1rem 1.5rem',
            background: 'rgba(10, 18, 38, 0.95)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={t('assistant.inputPlaceholder')}
            className="input-control"
            style={{ flex: 1, padding: '0.8rem 1.1rem' }}
          />

          <button
            type="button"
            onClick={() => setIsVoiceOpen(true)}
            className="btn-secondary"
            style={{ padding: '0.8rem', borderRadius: '10px' }}
            title="Speech-to-text input"
          >
            <Mic size={18} color="#14b8a6" />
          </button>

          <button
            type="submit"
            disabled={loading || !inputMessage.trim()}
            className="btn-primary"
            style={{ padding: '0.8rem 1.3rem', borderRadius: '10px' }}
          >
            <Send size={18} />
          </button>
        </form>
      </div>

      <VoiceInputModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onVoiceResult={handleVoiceResult}
      />
    </div>
  );
}
