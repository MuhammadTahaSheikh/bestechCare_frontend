import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useCity } from '../context/CityContext';

const SESSION_KEY = 'ai_doctor_session_id';

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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, summary]);

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
        setMessages([{ role: 'assistant', content: session.message }]);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, [city]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !sessionId || sending) return;

    setInput('');
    setSending(true);
    setError('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);

    try {
      const { reply } = await api.sendAiDoctorMessage(sessionId, text);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setError(err.message);
      setMessages((prev) => prev.slice(0, -1));
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const handleComplete = async () => {
    if (!sessionId || completing) return;
    setCompleting(true);
    setError('');

    try {
      const result = await api.completeAiDoctorSession(sessionId);
      setSummary(result.summary);
      setDoctors(result.recommended_doctors || []);
      sessionStorage.removeItem(SESSION_KEY);
    } catch (err) {
      setError(err.message);
    } finally {
      setCompleting(false);
    }
  };

  const handleNewConsultation = async () => {
    setLoading(true);
    setSummary(null);
    setDoctors([]);
    setError('');
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
              Symptom guidance powered by AI — always consult a real doctor for diagnosis and treatment.
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
            AI Doctor is not configured yet. An administrator needs to set <code>OPENAI_API_KEY</code> on the backend.
          </div>
        )}

        {error && <div className="ai-doctor-error">{error}</div>}

        <div className="ai-doctor-layout">
          <div className="ai-doctor-chat">
            <div className="ai-doctor-messages">
              {messages.map((msg, i) => (
                <div key={i} className={`ai-doctor-msg ai-doctor-msg-${msg.role}`}>
                  <span className="ai-doctor-msg-label">
                    {msg.role === 'user' ? 'You' : 'AI Doctor'}
                  </span>
                  <div className="ai-doctor-msg-content">{msg.content}</div>
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
                  placeholder="Describe your symptoms or answer a question..."
                  disabled={sending || !sessionId}
                />
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
