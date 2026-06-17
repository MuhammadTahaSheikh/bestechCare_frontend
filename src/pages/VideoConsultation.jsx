import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { api } from '../api/client';
import { API_URL } from '../config.js';
import { useAuth } from '../context/AuthContext';
import { attachRemoteStream, getConsultationMediaStream, optimizeOutgoingVideo } from '../utils/consultationMedia.js';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 4,
};

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatAppointmentWhen(date, time) {
  if (!date) return '';
  const parsed = new Date(date);
  const dateLabel = Number.isNaN(parsed.getTime())
    ? date
    : parsed.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  const timeLabel = time?.slice(0, 5) || '';
  return timeLabel ? `${dateLabel} · ${timeLabel}` : dateLabel;
}

function statusLabel(status) {
  if (status === 'connected') return 'Connected';
  if (status === 'waiting') return 'Waiting for participant';
  return 'Connecting';
}

export default function VideoConsultation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [room, setRoom] = useState(null);
  const [status, setStatus] = useState('connecting');
  const [error, setError] = useState('');
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const offerSentRef = useRef(false);

  const remoteName = room
    ? (room.role === 'doctor' ? room.patient_name : room.doctor_name)
    : '';
  const remoteRoleLabel = room?.role === 'doctor' ? 'Patient' : 'Doctor';
  const backPath = room?.role === 'doctor' ? '/doctor/consultations' : '/appointments';

  useEffect(() => {
    let mounted = true;

    async function start() {
      try {
        const roomData = await api.getConsultationRoom(id);
        if (!mounted) return;
        setRoom(roomData);

        const stream = await getConsultationMediaStream();
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(() => {});
        }

        const token = localStorage.getItem('token');
        const socket = io(API_URL || window.location.origin, { auth: { token } });
        socketRef.current = socket;

        const pc = new RTCPeerConnection(ICE_SERVERS);
        pcRef.current = pc;

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        await optimizeOutgoingVideo(pc);

        pc.ontrack = (event) => {
          attachRemoteStream(remoteVideoRef.current, event.streams[0]);
          setStatus('connected');
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('ice-candidate', { roomId: roomData.room_id, candidate: event.candidate });
          }
        };

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'connected') {
            optimizeOutgoingVideo(pc).catch(() => {});
          }
        };

        const sendOfferIfDoctor = async () => {
          if (roomData.role !== 'doctor' || offerSentRef.current) return;
          offerSentRef.current = true;

          await optimizeOutgoingVideo(pc);
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
            iceRestart: false,
          });
          await pc.setLocalDescription(offer);
          socket.emit('offer', { roomId: roomData.room_id, offer });
        };

        socket.on('connect', () => {
          socket.emit('join-room', { roomId: roomData.room_id, role: roomData.role });
        });

        socket.on('user-joined', () => {
          sendOfferIfDoctor().catch(() => {});
        });

        socket.on('room-joined', ({ participants }) => {
          if (participants >= 2) sendOfferIfDoctor().catch(() => {});
        });

        socket.on('offer', async ({ offer }) => {
          await pc.setRemoteDescription(offer);
          await optimizeOutgoingVideo(pc);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('answer', { roomId: roomData.room_id, answer });
        });

        socket.on('answer', async ({ answer }) => {
          await pc.setRemoteDescription(answer);
          await optimizeOutgoingVideo(pc);
        });

        socket.on('ice-candidate', async ({ candidate }) => {
          try {
            await pc.addIceCandidate(candidate);
          } catch {
            // ignore stale candidates
          }
        });

        socket.on('user-left', () => {
          setStatus('waiting');
        });

        setStatus('waiting');
      } catch (err) {
        if (mounted) setError(err.message);
      }
    }

    start();

    return () => {
      mounted = false;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      pcRef.current?.close();
      socketRef.current?.disconnect();
    };
  }, [id]);

  useEffect(() => {
    const video = localVideoRef.current;
    const stream = localStreamRef.current;
    if (!video || !stream) return;

    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }

    if (!cameraOff) {
      video.play().catch(() => {});
    }
  }, [cameraOff]);

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setMuted((prev) => !prev);
  };

  const toggleCamera = () => {
    const tracks = localStreamRef.current?.getVideoTracks();
    if (!tracks?.length) return;

    const turningOff = tracks[0].enabled;
    tracks.forEach((track) => {
      track.enabled = !turningOff;
    });
    setCameraOff(turningOff);

    if (!turningOff && localVideoRef.current) {
      localVideoRef.current.play().catch(() => {});
    }
  };

  const endCall = () => {
    if (room?.room_id) {
      socketRef.current?.emit('leave-room', { roomId: room.room_id });
    }
    navigate(backPath);
  };

  if (error) {
    return (
      <div className="consultation-page consultation-page--error">
        <div className="consultation-error-card">
          <div className="consultation-error-icon" aria-hidden="true">⚠️</div>
          <h2>Cannot join consultation</h2>
          <p>{error}</p>
          <Link to="/appointments" className="btn btn-primary">Back to Appointments</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="consultation-page">
      <header className="consultation-topbar">
        <button type="button" className="consultation-back" onClick={endCall} aria-label="Leave call">
          ←
        </button>

        <div className="consultation-topbar-info">
          <h1>Online Consultation</h1>
          {room && (
            <p>
              <span className="consultation-participant-name">{remoteName}</span>
              <span className="consultation-meta-sep">·</span>
              <span>{formatAppointmentWhen(room.appointment_date, room.appointment_time)}</span>
            </p>
          )}
        </div>

        <div className={`consultation-live-badge consultation-live-badge--${status}`}>
          <span className="consultation-live-dot" aria-hidden="true" />
          {statusLabel(status)}
        </div>
      </header>

      <div className="consultation-stage">
        <div className={`consultation-remote ${status === 'connected' ? 'is-connected' : ''}`}>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={status === 'connected' ? 'is-visible' : ''}
          />

          {status !== 'connected' && (
            <div className="consultation-waiting">
              <div className="consultation-avatar consultation-avatar--lg consultation-avatar--pulse">
                {getInitials(remoteName)}
              </div>
              <p className="consultation-waiting-title">
                Waiting for {remoteRoleLabel.toLowerCase()}
              </p>
              <p className="consultation-waiting-name">{remoteName || '…'}</p>
              <p className="consultation-waiting-hint">
                They will appear here once they join the call
              </p>
            </div>
          )}

          {status === 'connected' && (
            <div className="consultation-remote-label">
              <span className="consultation-remote-role">{remoteRoleLabel}</span>
              <span>{remoteName}</span>
            </div>
          )}
        </div>

        <div className={`consultation-pip ${cameraOff ? 'camera-off' : ''}`}>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={cameraOff ? 'is-hidden' : ''}
          />

          {cameraOff && (
            <div className="consultation-pip-placeholder">
              <div className="consultation-avatar">{getInitials(user?.name || 'You')}</div>
            </div>
          )}

          <div className="consultation-pip-label">
            You
            {muted && <span className="consultation-pip-muted" title="Microphone muted">🔇</span>}
          </div>
        </div>
      </div>

      <footer className="consultation-toolbar-wrap">
        <div className="consultation-toolbar">
          <button
            type="button"
            className={`consultation-tool ${muted ? 'is-off' : ''}`}
            onClick={toggleMute}
            aria-pressed={muted}
            aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}
          >
            <span className="consultation-tool-icon" aria-hidden="true">{muted ? '🔇' : '🎤'}</span>
            <span className="consultation-tool-text">{muted ? 'Unmute' : 'Mute'}</span>
          </button>

          <button
            type="button"
            className={`consultation-tool ${cameraOff ? 'is-off' : ''}`}
            onClick={toggleCamera}
            aria-pressed={cameraOff}
            aria-label={cameraOff ? 'Turn camera on' : 'Turn camera off'}
          >
            <span className="consultation-tool-icon" aria-hidden="true">{cameraOff ? '📷' : '📹'}</span>
            <span className="consultation-tool-text">{cameraOff ? 'Start video' : 'Stop video'}</span>
          </button>

          <button
            type="button"
            className="consultation-tool consultation-tool--end"
            onClick={endCall}
            aria-label="End call"
          >
            <span className="consultation-tool-icon" aria-hidden="true">📞</span>
            <span className="consultation-tool-text">End call</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
