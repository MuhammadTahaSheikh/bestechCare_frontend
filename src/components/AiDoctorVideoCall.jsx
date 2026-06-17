import { usePatientCamera } from '../hooks/usePatientCamera';

const BOT_AVATAR = '/ai-doctor-bot.svg';

function callStatus({ isListening, isSpeaking, sending }) {
  if (sending) return { label: 'Thinking…', tone: 'thinking' };
  if (isSpeaking) return { label: 'AI speaking', tone: 'speaking' };
  if (isListening) return { label: 'Listening to you', tone: 'listening' };
  return { label: 'Connected', tone: 'idle' };
}

export default function AiDoctorVideoCall({
  active,
  doctorLabel,
  isListening,
  isSpeaking,
  sending,
  voiceSupported,
  toggleListening,
  voiceReplies,
  setVoiceReplies,
  handsFree,
  setHandsFree,
  languageLabel,
  interimText,
}) {
  const {
    videoRef,
    cameraOn,
    cameraError,
    permissionDenied,
    startCamera,
    toggleCamera,
  } = usePatientCamera({ enabled: active });

  if (!active) return null;

  const status = callStatus({ isListening, isSpeaking, sending });

  return (
    <div className="ai-doctor-video-call" aria-label="AI Doctor video consultation">
      <div className="ai-doctor-video-call-header">
        <span className="ai-doctor-video-call-live">● Live call</span>
        <span className={`ai-doctor-video-call-status ai-doctor-video-call-status-${status.tone}`}>
          {status.label}
        </span>
      </div>

      <div className="ai-doctor-video-call-grid">
        <div className={`ai-doctor-video-tile ai-doctor-video-tile-bot ${status.tone}`}>
          <div className="ai-doctor-video-tile-inner">
            <img
              src={BOT_AVATAR}
              alt=""
              className={`ai-doctor-bot-avatar ${isSpeaking ? 'speaking' : ''} ${isListening ? 'listening' : ''}`}
            />
            <div className="ai-doctor-video-name">{doctorLabel}</div>
            {isSpeaking && <div className="ai-doctor-video-wave" aria-hidden="true" />}
          </div>
        </div>

        <div className="ai-doctor-video-tile ai-doctor-video-tile-patient">
          <div className="ai-doctor-video-tile-inner">
            {cameraOn ? (
              <video
                ref={videoRef}
                className="ai-doctor-patient-video"
                autoPlay
                playsInline
                muted
                aria-label="Your camera"
              />
            ) : (
              <div className="ai-doctor-camera-placeholder">
                <span className="ai-doctor-camera-placeholder-icon" aria-hidden="true">📷</span>
                <p>{cameraError || 'Camera is off'}</p>
                <button type="button" className="btn btn-primary btn-sm" onClick={startCamera}>
                  {permissionDenied ? 'Allow camera' : 'Turn on camera'}
                </button>
              </div>
            )}
            <div className="ai-doctor-video-name">You</div>
          </div>
        </div>
      </div>

      {isListening && interimText && (
        <div className="ai-doctor-video-interim">You: {interimText}</div>
      )}

      <div className="ai-doctor-video-controls">
        {voiceSupported && (
          <button
            type="button"
            className={`ai-doctor-video-ctrl ${isListening ? 'active listening' : ''} ${isSpeaking ? 'speaking' : ''}`}
            onClick={toggleListening}
            disabled={sending}
            title={isListening ? 'Stop microphone' : 'Start microphone'}
            aria-label={isListening ? 'Stop microphone' : 'Start microphone'}
          >
            <span aria-hidden="true">{isListening ? '🎙️' : isSpeaking ? '🔊' : '🎤'}</span>
            <span>{isListening ? 'Mute' : 'Talk'}</span>
          </button>
        )}

        <button
          type="button"
          className={`ai-doctor-video-ctrl ${cameraOn ? 'active' : ''}`}
          onClick={toggleCamera}
          title={cameraOn ? 'Turn off camera' : 'Turn on camera'}
          aria-label={cameraOn ? 'Turn off camera' : 'Turn on camera'}
        >
          <span aria-hidden="true">{cameraOn ? '📹' : '📷'}</span>
          <span>{cameraOn ? 'Camera on' : 'Camera off'}</span>
        </button>

        {voiceSupported && (
          <>
            <label className="ai-doctor-video-toggle">
              <input
                type="checkbox"
                checked={voiceReplies}
                onChange={(e) => setVoiceReplies(e.target.checked)}
              />
              Voice replies
            </label>
            <label className="ai-doctor-video-toggle">
              <input
                type="checkbox"
                checked={handsFree}
                onChange={(e) => setHandsFree(e.target.checked)}
              />
              Hands-free
            </label>
            <span className="ai-doctor-lang-badge" title="Selected consultation language">
              {languageLabel}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
