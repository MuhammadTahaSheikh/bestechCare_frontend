import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useCity } from '../context/CityContext';
import { useAiDoctorVoice } from '../hooks/useAiDoctorVoice';

const SESSION_KEY = 'ai_doctor_session_id';

function assistantDisplayContent(msg) {
  if (msg.role !== 'assistant' || !msg.recommended_doctors?.length) return msg.content;
  return msg.content.split(/\n\n\*\*(Doctors on BestechCare|BestechCare par|BestechCare پر)/)[0].trim();
}

export default function AiDoctor() {
  const { city } = useCity();
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
  const chatEndRef = useRef(null);
  const lastSpokenRef = useRef(-1);
  const sendMessageRef = useRef(null);

  const sendMessage = useCallback(async (text) => {
    const trimmed = text?.trim();
    if (!trimmed || !sessionId || sending) return;

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
      setError(err.message);
      setMessages((prev) => prev.slice(0, -1));
      setInput(trimmed);
      return null;
    } finally {
      setSending(false);
    }
  }, [sessionId, sending]);

  sendMessageRef.current = sendMessage;

  const handleVoiceTranscript = useCallback(async (text) => {
    setInput(text);
    const result = await sendMessageRef.current?.(text);
    if (result) {
      syncReplyLanguageRef.current?.(result.language, result.voice_lang);
    }
  }, []);

  const syncReplyLanguageRef = useRef(null);

  const voiceEnabled = configured && !summary && !loading;
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
    langMode,
    setManualVoiceLang,
    syncReplyLanguage,
    toggleListening,
    speak,
    stopSpeaking,
    startListening,
  } = useAiDoctorVoice({ onTranscript: handleVoiceTranscript, enabled: voiceEnabled });

  syncReplyLanguageRef.current = syncReplyLanguage;

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
              lastSpokenRef.current = Math.max(0, (session.messages?.length || 1) - 1);
              setLoading(false);
              return;
            }
          } catch {
            sessionStorage.removeItem(SESSION_KEY);
          }
        }

        const session = await api.createAiDoctorSession(city);
        if (cancelled) return;
        sessionStorage.setItem(SESSION_KEY, session.id);
        setSessionId(session.id);
        setMessages([{
          role: 'assistant',
          content: session.message,
          language: session.language,
          voice_lang: session.voice_lang,
        }]);
        lastSpokenRef.current = -1;
        if (session.language) {
          syncReplyLanguageRef.current?.(session.language, session.voice_lang);
        }
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
    if (!voiceReplies || sending || summary) return;

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
  }, [messages, voiceReplies, sending, summary, speak, handsFree, voiceEnabled, startListening, voiceLang]);

  const handleSend = async (e) => {
    e.preventDefault();
    const result = await sendMessage(input);
    if (result) syncReplyLanguage(result.language, result.voice_lang);
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

  const handleNewConsultation = async () => {
    stopSpeaking();
    setLoading(true);
    setSummary(null);
    setDoctors([]);
    setError('');
    lastSpokenRef.current = -1;
    sessionStorage.removeItem(SESSION_KEY);

    try {
      const session = await api.createAiDoctorSession(city);
      sessionStorage.setItem(SESSION_KEY, session.id);
      setSessionId(session.id);
      setMessages([{ role: 'assistant', content: session.message }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (sessionId) api.downloadAiDoctorPdf(sessionId);
  };

  const userMessageCount = messages.filter((m) => m.role === 'user').length;

  if (loading) {
    return (
      <div className="page">
        <div className="container">
          <p className="loading">Starting AI Doctor consultation...</p>
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
              Chat by text or voice — always consult a real doctor for diagnosis and treatment.
            </p>
          </div>
          {!summary && userMessageCount > 0 && (
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
            {voiceSupported && configured && !summary && (
              <div className="ai-doctor-voice-bar">
                <button
                  type="button"
                  className={`ai-doctor-mic-btn ${isListening ? 'listening' : ''} ${isSpeaking ? 'speaking' : ''}`}
                  onClick={toggleListening}
                  disabled={sending}
                  title={isListening ? 'Stop listening' : 'Tap to speak'}
                  aria-label={isListening ? 'Stop microphone' : 'Start microphone'}
                >
                  <span className="ai-doctor-mic-icon">
                    {isListening ? '🎙️' : isSpeaking ? '🔊' : '🎤'}
                  </span>
                  <span className="ai-doctor-mic-label">
                    {isListening ? 'Listening… tap to stop' : isSpeaking ? 'AI speaking…' : 'Tap to talk'}
                  </span>
                </button>

                <div className="ai-doctor-voice-options">
                  <label className="ai-doctor-voice-toggle">
                    <input
                      type="checkbox"
                      checked={voiceReplies}
                      onChange={(e) => setVoiceReplies(e.target.checked)}
                    />
                    Voice replies
                  </label>
                  <label className="ai-doctor-voice-toggle">
                    <input
                      type="checkbox"
                      checked={handsFree}
                      onChange={(e) => setHandsFree(e.target.checked)}
                    />
                    Hands-free
                  </label>
                  <select
                    className="ai-doctor-voice-lang"
                    value={langMode === 'auto' ? 'auto' : voiceLang}
                    onChange={(e) => setManualVoiceLang(e.target.value)}
                    aria-label="Voice language"
                  >
                    <option value="auto">Auto detect</option>
                    <option value="en-US">English</option>
                    <option value="ur-PK">Urdu</option>
                    <option value="hi-IN">Hindi</option>
                    <option value="ar-SA">Arabic</option>
                  </select>
                  <span className="ai-doctor-lang-badge">
                    {conversationLang === 'ur' ? 'اردو' : conversationLang === 'hi' ? 'हिंदी' : conversationLang === 'ar' ? 'العربية' : 'EN'}
                  </span>
                </div>
              </div>
            )}

            {!voiceSupported && configured && !summary && (
              <p className="ai-doctor-voice-hint">
                Voice chat works best in Chrome or Edge on desktop/mobile.
              </p>
            )}

            {(isListening && interimText) && (
              <div className="ai-doctor-interim">You: {interimText}</div>
            )}

            <div className="ai-doctor-messages">
              {messages.map((msg, i) => (
                <div key={i} className={`ai-doctor-msg ai-doctor-msg-${msg.role}`}>
                  <span className="ai-doctor-msg-label">
                    {msg.role === 'user' ? 'You' : 'AI Doctor'}
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
                  <span className="ai-doctor-msg-label">AI Doctor</span>
                  <div className="ai-doctor-msg-content ai-doctor-typing">Thinking...</div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {!summary && configured && (
              <form className="ai-doctor-input-form" onSubmit={handleSend}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type or tap the microphone to speak..."
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
