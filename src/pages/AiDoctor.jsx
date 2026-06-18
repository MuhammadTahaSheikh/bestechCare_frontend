import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useCity } from '../context/CityContext';
import { useAuth } from '../context/AuthContext';
import { useAiDoctorVoice } from '../hooks/useAiDoctorVoice';
import { voiceLangFor } from '../utils/languageUtils';
import { getLoginPath, getRegisterPath } from '../utils/authRedirect';
import AiDoctorVideoCall from '../components/AiDoctorVideoCall';

const SESSION_KEY = 'ai_doctor_session_id';
const GUEST_MESSAGE_LIMIT = 3;

const LANGUAGE_OPTIONS = [
  { id: 'en', label: 'English', native: 'English' },
  { id: 'ur', label: 'Urdu', native: 'اردو' },
  { id: 'ur-roman', label: 'Urdu (Roman)', native: 'Roman Urdu', language: 'ur', roman: true },
  { id: 'hi', label: 'Hindi', native: 'हिंदी' },
  { id: 'ar', label: 'Arabic', native: 'العربية' },
];

const LANG_LABELS = {
  en: 'English',
  ur: 'اردو',
  hi: 'हिंदी',
  ar: 'العربية',
};

function assistantDisplayContent(msg) {
  if (msg.role !== 'assistant' || !msg.recommended_doctors?.length) return msg.content;
  return msg.content.split(/\n\n\*\*(Doctors on BestechCare|BestechCare par|BestechCare پر)/)[0].trim();
}

function doctorLabel(gender) {
  return gender === 'female' ? 'AI Doctor (Female)' : 'AI Doctor (Male)';
}

export default function AiDoctor() {
  const { city } = useCity();
  const { user } = useAuth();
  const loginPath = getLoginPath('/ai-doctor');
  const registerPath = getRegisterPath('/ai-doctor');
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [summary, setSummary] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [error, setError] = useState('');
  const [setupStep, setSetupStep] = useState(null);
  const [doctorGender, setDoctorGender] = useState(null);
  const [preferredLanguage, setPreferredLanguage] = useState(null);
  const [romanUrdu, setRomanUrdu] = useState(false);
  const [sessionVoiceLang, setSessionVoiceLang] = useState(null);
  const chatEndRef = useRef(null);
  const lastSpokenRef = useRef(-1);
  const sendMessageRef = useRef(null);
  const syncReplyLanguageRef = useRef(null);

  const chatReady = Boolean(sessionId && setupStep === null);
  const guestMessagesUsed = messages.filter((m) => m.role === 'user').length;
  const loginRequired = !user && guestMessagesUsed >= GUEST_MESSAGE_LIMIT;
  const guestMessagesRemaining = !user
    ? Math.max(0, GUEST_MESSAGE_LIMIT - guestMessagesUsed)
    : null;

  const sendMessage = useCallback(async (text) => {
    const trimmed = text?.trim();
    if (!trimmed || !sessionId || sending || loginRequired) return;

    setInput('');
    setSending(true);
    setError('');
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);

    try {
      const { reply, language, voice_lang: replyVoiceLang, recommended_doctors: recommendedDoctors } =
        await api.sendAiDoctorMessage(sessionId, trimmed);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: reply,
          language,
          voice_lang: replyVoiceLang,
          recommended_doctors: recommendedDoctors || [],
        },
      ]);
      return { language, voice_lang: replyVoiceLang, reply, recommended_doctors: recommendedDoctors || [] };
    } catch (err) {
      setMessages((prev) => prev.slice(0, -1));
      setInput(trimmed);
      if (err.code === 'LOGIN_REQUIRED') {
        setError('You have used your 3 free messages. Please log in to continue.');
      } else {
        setError(err.message);
      }
      return null;
    } finally {
      setSending(false);
    }
  }, [sessionId, sending, loginRequired]);

  sendMessageRef.current = sendMessage;

  const handleVoiceTranscript = useCallback(async (text) => {
    setInput(text);
    await sendMessageRef.current?.(text);
  }, []);

  const voiceEnabled = configured && !summary && chatReady;
  const {
    voiceSupported,
    isListening,
    isSpeaking,
    voiceReplies,
    setVoiceReplies,
    handsFree,
    setHandsFree,
    interimText,
    conversationLang,
    voiceLang,
    syncReplyLanguage,
    applySessionLanguage,
    toggleListening,
    speak,
    stopSpeaking,
    startListening,
  } = useAiDoctorVoice({
    onTranscript: handleVoiceTranscript,
    enabled: voiceEnabled,
    initialLanguage: preferredLanguage,
    initialVoiceLang: sessionVoiceLang,
    doctorGender: doctorGender || 'male',
    lockLanguage: Boolean(preferredLanguage),
  });

  syncReplyLanguageRef.current = syncReplyLanguage;

  const beginSession = useCallback(async (gender, language, roman) => {
    setLoading(true);
    setError('');
    setSetupStep(null);

    try {
      const session = await api.createAiDoctorSession(city, {
        doctorGender: gender,
        preferredLanguage: language,
        romanUrdu: roman,
      });
      sessionStorage.setItem(SESSION_KEY, session.id);
      setSessionId(session.id);
      setDoctorGender(session.doctor_gender || gender);
      setPreferredLanguage(session.preferred_language || language);
      setRomanUrdu(Boolean(session.roman_urdu ?? roman));
      setSessionVoiceLang(session.voice_lang || voiceLangFor(language));
      applySessionLanguage(session.preferred_language || language, session.voice_lang);
      setMessages([{
        role: 'assistant',
        content: session.message,
        language: session.language,
        voice_lang: session.voice_lang,
      }]);
      lastSpokenRef.current = -1;
    } catch (err) {
      setError(err.message);
      setSetupStep('gender');
      setDoctorGender(null);
    } finally {
      setLoading(false);
    }
  }, [city, applySessionLanguage]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, summary, interimText]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const status = await api.getAiDoctorStatus();
        if (cancelled) return;
        setConfigured(status.configured);

        if (!status.configured) {
          setLoading(false);
          return;
        }

        const savedId = sessionStorage.getItem(SESSION_KEY);
        if (savedId) {
          try {
            const session = await api.getAiDoctorSession(savedId);
            if (cancelled) return;
            if (session.status === 'active') {
              setSessionId(savedId);
              setMessages(session.messages || []);
              setDoctorGender(session.doctor_gender || 'male');
              setPreferredLanguage(session.preferred_language || 'en');
              setRomanUrdu(Boolean(session.roman_urdu));
              setSessionVoiceLang(voiceLangFor(session.preferred_language || 'en'));
              lastSpokenRef.current = Math.max(0, (session.messages?.length || 1) - 1);
              setSetupStep(null);
              setLoading(false);
              return;
            }
          } catch {
            sessionStorage.removeItem(SESSION_KEY);
          }
        }

        setSetupStep('gender');
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, [city]);

  useEffect(() => {
    if (!voiceReplies || sending || summary || !chatReady) return;

    const lastIdx = messages.length - 1;
    const last = messages[lastIdx];
    if (!last || last.role !== 'assistant') return;
    if (lastIdx <= lastSpokenRef.current) return;

    lastSpokenRef.current = lastIdx;
    const replyLang = last.voice_lang || voiceLang;
    const speakText = last.recommended_doctors?.length
      ? last.content.split(/\n\n\*\*(Doctors on BestechCare|BestechCare par|BestechCare پر)/)[0].trim()
      : last.content;
    speak(speakText, {
      lang: replyLang,
      onDone: () => {
        if (handsFree && voiceEnabled && !sending) {
          setTimeout(() => startListening(), 500);
        }
      },
    });
  }, [messages, voiceReplies, sending, summary, speak, handsFree, voiceEnabled, startListening, voiceLang, chatReady]);

  const handleSend = async (e) => {
    e.preventDefault();
    await sendMessage(input);
  };

  const handleComplete = async () => {
    if (!sessionId || completing) return;
    stopSpeaking();
    setCompleting(true);
    setError('');

    try {
      const result = await api.completeAiDoctorSession(sessionId);
      setSummary(result.summary);
      setDoctors(result.recommended_doctors || []);
      sessionStorage.removeItem(SESSION_KEY);
      if (voiceReplies && result.summary?.summary) {
        const vLang = result.summary.voice_lang || voiceLang;
        speak(`Consultation complete. ${result.summary.summary}`, { lang: vLang });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCompleting(false);
    }
  };

  const handleNewConsultation = () => {
    stopSpeaking();
    setSummary(null);
    setDoctors([]);
    setError('');
    setSessionId(null);
    setMessages([]);
    setDoctorGender(null);
    setPreferredLanguage(null);
    setRomanUrdu(false);
    setSessionVoiceLang(null);
    lastSpokenRef.current = -1;
    sessionStorage.removeItem(SESSION_KEY);
    setSetupStep('gender');
  };

  const handleDownloadPdf = () => {
    if (sessionId) api.downloadAiDoctorPdf(sessionId);
  };

  const handleGenderSelect = (gender) => {
    setDoctorGender(gender);
    setSetupStep('language');
    setError('');
  };

  const handleLanguageSelect = (option) => {
    const language = option.language || option.id;
    const roman = Boolean(option.roman);
    beginSession(doctorGender, language, roman);
  };

  const userMessageCount = messages.filter((m) => m.role === 'user').length;
  const languageLabel = romanUrdu ? 'Roman Urdu' : (LANG_LABELS[preferredLanguage] || 'English');

  if (loading) {
    return (
      <div className="page">
        <div className="container">
          <p className="loading">Starting AI Doctor consultation...</p>
        </div>
      </div>
    );
  }

  if (setupStep) {
    return (
      <div className="page ai-doctor-page">
        <div className="container">
          <div className="page-header">
            <div>
              <h1>AI Doctor</h1>
              <p className="text-muted">
                {setupStep === 'gender'
                  ? 'Step 1 of 2 — Choose your AI doctor'
                  : 'Step 2 of 2 — Choose your language'}
              </p>
            </div>
          </div>

          <div className="ai-doctor-disclaimer">
            <strong>Medical disclaimer:</strong> This AI assistant provides general health information only.
            It is not a licensed physician and cannot diagnose or prescribe.
          </div>

          {!configured && (
            <div className="ai-doctor-error">
              AI Doctor bot is starting or unavailable. Ensure the Python bot service is running on port 5003.
            </div>
          )}

          {error && <div className="ai-doctor-error">{error}</div>}

          {setupStep === 'gender' && (
            <div className="ai-doctor-setup">
              <h2>Who would you like to consult with?</h2>
              <div className="ai-doctor-setup-grid">
                <button
                  type="button"
                  className="ai-doctor-setup-card"
                  onClick={() => handleGenderSelect('male')}
                  disabled={!configured}
                >
                  <span className="ai-doctor-setup-icon">👨‍⚕️</span>
                  <strong>Male Doctor</strong>
                  <span className="text-muted">AI health assistant (male voice)</span>
                </button>
                <button
                  type="button"
                  className="ai-doctor-setup-card"
                  onClick={() => handleGenderSelect('female')}
                  disabled={!configured}
                >
                  <span className="ai-doctor-setup-icon">👩‍⚕️</span>
                  <strong>Female Doctor</strong>
                  <span className="text-muted">AI health assistant (female voice)</span>
                </button>
              </div>
            </div>
          )}

          {setupStep === 'language' && (
            <div className="ai-doctor-setup">
              <button
                type="button"
                className="ai-doctor-setup-back"
                onClick={() => setSetupStep('gender')}
              >
                ← Back to doctor selection
              </button>
              <h2>Which language should the doctor use?</h2>
              <p className="text-muted ai-doctor-setup-note">
                The AI doctor will reply in your chosen language for this consultation.
              </p>
              <div className="ai-doctor-setup-grid ai-doctor-setup-grid-lang">
                {LANGUAGE_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className="ai-doctor-setup-card ai-doctor-setup-card-lang"
                    onClick={() => handleLanguageSelect(option)}
                    disabled={!configured}
                  >
                    <strong>{option.label}</strong>
                    <span>{option.native}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page ai-doctor-page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1>AI Doctor</h1>
            <p className="text-muted">
              Video call with your AI doctor — talk, type, or use hands-free mode. Always consult a real doctor for diagnosis and treatment.
            </p>
            {doctorGender && preferredLanguage && (
              <p className="ai-doctor-session-meta">
                {doctorLabel(doctorGender)} · {languageLabel}
              </p>
            )}
          </div>
          {!summary && user && guestMessagesUsed > 0 && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleComplete}
              disabled={completing}
            >
              {completing ? 'Generating summary...' : 'End Consultation'}
            </button>
          )}
          {summary && (
            <div className="ai-doctor-actions">
              <button type="button" className="btn btn-primary" onClick={handleDownloadPdf}>
                Download PDF Report
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleNewConsultation}>
                New Consultation
              </button>
            </div>
          )}
        </div>

        <div className="ai-doctor-disclaimer">
          <strong>Medical disclaimer:</strong> This AI assistant provides general health information only.
          It is not a licensed physician and cannot diagnose or prescribe. For emergencies, call emergency
          services or visit the nearest hospital immediately.
        </div>

        {!configured && (
          <div className="ai-doctor-error">
            AI Doctor bot is starting or unavailable. Ensure the Python bot service is running on port 5003.
          </div>
        )}

        {error && <div className="ai-doctor-error">{error}</div>}

        <div className="ai-doctor-layout">
          <div className="ai-doctor-chat">
            {configured && !summary && chatReady && (
              <AiDoctorVideoCall
                active
                doctorLabel={doctorLabel(doctorGender)}
                isListening={isListening}
                isSpeaking={isSpeaking}
                sending={sending}
                voiceSupported={voiceSupported}
                toggleListening={toggleListening}
                voiceReplies={voiceReplies}
                setVoiceReplies={setVoiceReplies}
                handsFree={handsFree}
                setHandsFree={setHandsFree}
                languageLabel={languageLabel}
                interimText={interimText}
              />
            )}

            {!voiceSupported && configured && !summary && (
              <p className="ai-doctor-voice-hint">
                Voice chat works best in Chrome or Edge on desktop/mobile.
              </p>
            )}

            <div className="ai-doctor-messages">
              {messages.map((msg, i) => (
                <div key={i} className={`ai-doctor-msg ai-doctor-msg-${msg.role}`}>
                  <span className="ai-doctor-msg-label">
                    {msg.role === 'user' ? 'You' : doctorLabel(doctorGender)}
                    {msg.role === 'assistant' && voiceSupported && (
                      <button
                        type="button"
                        className="ai-doctor-speak-btn"
                        onClick={() => speak(assistantDisplayContent(msg), { lang: msg.voice_lang || voiceLang })}
                        title="Listen to this message"
                        aria-label="Play message audio"
                      >
                        🔊
                      </button>
                    )}
                  </span>
                  <div className="ai-doctor-msg-content">{assistantDisplayContent(msg)}</div>
                  {msg.role === 'assistant' && msg.recommended_doctors?.length > 0 && (
                    <div className="ai-doctor-doctors ai-doctor-doctors-inline">
                      {msg.recommended_doctors.map((d) => (
                        <Link key={d.id} to={`/doctors/${d.id}`} className="ai-doctor-doctor-card">
                          <strong>{d.name}</strong>
                          <span>{d.specialty_name}</span>
                          {d.hospital_name && <span className="text-muted">{d.hospital_name}</span>}
                          <span>★ {d.rating} · PKR {Number(d.consultation_fee).toLocaleString()}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {sending && (
                <div className="ai-doctor-msg ai-doctor-msg-assistant">
                  <span className="ai-doctor-msg-label">{doctorLabel(doctorGender)}</span>
                  <div className="ai-doctor-msg-content ai-doctor-typing">Thinking...</div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {!summary && configured && !user && chatReady && !loginRequired && (
              <p className="ai-doctor-guest-notice">
                Free trial: {guestMessagesRemaining} of {GUEST_MESSAGE_LIMIT} messages remaining.{' '}
                <Link to={loginPath}>Log in</Link> for unlimited chat and a full summary.
              </p>
            )}

            {!summary && configured && loginRequired && (
              <div className="ai-doctor-login-gate">
                <p>You have used your {GUEST_MESSAGE_LIMIT} free messages.</p>
                <p className="text-muted">Log in to continue this consultation and get your full summary.</p>
                <Link to={loginPath} className="btn btn-primary btn-sm">Login to Continue</Link>
                <p className="auth-footer">
                  New here? <Link to={registerPath}>Create an account</Link>
                </p>
              </div>
            )}

            {!summary && configured && !loginRequired && (
              <form className="ai-doctor-input-form" onSubmit={handleSend}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe your symptoms..."
                  disabled={sending || !sessionId}
                />
                {voiceSupported && (
                  <button
                    type="button"
                    className={`btn btn-secondary ai-doctor-mic-inline ${isListening ? 'active' : ''}`}
                    onClick={toggleListening}
                    disabled={sending}
                    title="Speak"
                    aria-label="Microphone"
                  >
                    🎤
                  </button>
                )}
                <button type="submit" className="btn btn-primary" disabled={sending || !input.trim()}>
                  Send
                </button>
              </form>
            )}
          </div>

          {summary && (
            <aside className="ai-doctor-summary">
              <h2>Consultation Summary</h2>
              <p>{summary.summary}</p>

              {summary.urgent_care_required && (
                <div className="ai-doctor-urgent">
                  <strong>Seek urgent medical care</strong>
                  <p>{summary.urgent_care_reason || 'Your symptoms may require immediate attention.'}</p>
                </div>
              )}

              {summary.possible_conditions?.length > 0 && (
                <section>
                  <h3>Possible Conditions</h3>
                  <ul>
                    {summary.possible_conditions.map((c, i) => (
                      <li key={i}>
                        <strong>{c.name}</strong> ({c.likelihood}) — {c.note}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {summary.medicines?.length > 0 && (
                <section>
                  <h3>Suggested Treatments</h3>
                  <ul>
                    {summary.medicines.map((m, i) => (
                      <li key={i}>
                        <strong>{m.name}</strong> ({m.type}): {m.usage}
                        {m.precaution && <span> — {m.precaution}</span>}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {summary.suggested_tests?.length > 0 && (
                <section>
                  <h3>Suggested Tests</h3>
                  <ul>{summary.suggested_tests.map((t, i) => <li key={i}>{t}</li>)}</ul>
                </section>
              )}

              {summary.precautions?.length > 0 && (
                <section>
                  <h3>Precautions</h3>
                  <ul>{summary.precautions.map((p, i) => <li key={i}>{p}</li>)}</ul>
                </section>
              )}

              {summary.self_care?.length > 0 && (
                <section>
                  <h3>Self-Care</h3>
                  <ul>{summary.self_care.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </section>
              )}

              <p className="ai-doctor-final-note">{summary.disclaimer}</p>

              {doctors.length > 0 && (
                <section>
                  <h3>Recommended Doctors</h3>
                  <div className="ai-doctor-doctors">
                    {doctors.map((d) => (
                      <Link key={d.id} to={`/doctors/${d.id}`} className="ai-doctor-doctor-card">
                        <strong>{d.name}</strong>
                        <span>{d.specialty_name}</span>
                        {d.hospital_name && <span className="text-muted">{d.hospital_name}</span>}
                        <span>★ {d.rating} · PKR {d.consultation_fee}</span>
                      </Link>
                    ))}
                  </div>
                  <Link to={`/doctors?specialty=${summary.recommended_specialty_slug}`} className="btn btn-primary btn-sm">
                    View all matching doctors
                  </Link>
                </section>
              )}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
