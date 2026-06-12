import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { api } from '../api/client';
import { API_URL } from '../config.js';

const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

export default function VideoConsultation() {
  const { id } = useParams();
  const navigate = useNavigate();
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

  useEffect(() => {
    let mounted = true;

    async function start() {
      try {
        const roomData = await api.getConsultationRoom(id);
        if (!mounted) return;
        setRoom(roomData);

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const token = localStorage.getItem('token');
        const socket = io(API_URL || window.location.origin, { auth: { token } });
        socketRef.current = socket;

        const pc = new RTCPeerConnection(ICE_SERVERS);
        pcRef.current = pc;

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        pc.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
          setStatus('connected');
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('ice-candidate', { roomId: roomData.room_id, candidate: event.candidate });
          }
        };

        const sendOfferIfDoctor = async () => {
          if (roomData.role !== 'doctor') return;
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('offer', { roomId: roomData.room_id, offer });
        };

        socket.on('connect', () => {
          socket.emit('join-room', { roomId: roomData.room_id, role: roomData.role });
        });

        // Doctor already in room: patient joining triggers offer.
        socket.on('user-joined', () => {
          sendOfferIfDoctor().catch(() => {});
        });

        // Patient already in room: doctor joining must start offer (user-joined only goes to existing peers).
        socket.on('room-joined', ({ participants }) => {
          if (participants >= 2) sendOfferIfDoctor().catch(() => {});
        });

        socket.on('offer', async ({ offer }) => {
          await pc.setRemoteDescription(offer);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('answer', { roomId: roomData.room_id, answer });
        });

        socket.on('answer', async ({ answer }) => {
          await pc.setRemoteDescription(answer);
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

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setMuted(!muted);
  };

  const toggleCamera = () => {
    localStreamRef.current?.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
    setCameraOff(!cameraOff);
  };

  const endCall = () => {
    if (room?.room_id) {
      socketRef.current?.emit('leave-room', { roomId: room.room_id });
    }
    navigate(room?.role === 'doctor' ? '/doctor/consultations' : '/appointments');
  };

  if (error) {
    return (
      <div className="page">
        <div className="container empty-state">
          <h2>Cannot join consultation</h2>
          <p>{error}</p>
          <Link to="/appointments" className="btn btn-primary">Back to Appointments</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="consultation-page">
      <div className="consultation-header">
        <div>
          <h2>Online Consultation</h2>
          {room && (
            <p className="text-muted">
              {room.role === 'doctor' ? room.patient_name : room.doctor_name} ·{' '}
              {new Date(room.appointment_date).toLocaleDateString()} {room.appointment_time?.slice(0, 5)}
            </p>
          )}
        </div>
        <span className={`consultation-status status-${status}`}>
          {status === 'connected' ? 'Connected' : status === 'waiting' ? 'Waiting for other party...' : 'Connecting...'}
        </span>
      </div>

      <div className="video-grid">
        <div className="video-box remote">
          <video ref={remoteVideoRef} autoPlay playsInline />
          {status !== 'connected' && <div className="video-placeholder">Waiting for {room?.role === 'doctor' ? 'patient' : 'doctor'}...</div>}
          <span className="video-label">{room?.role === 'doctor' ? room?.patient_name : room?.doctor_name}</span>
        </div>
        <div className="video-box local">
          <video ref={localVideoRef} autoPlay playsInline muted />
          <span className="video-label">You {muted && '(muted)'} {cameraOff && '(camera off)'}</span>
        </div>
      </div>

      <div className="consultation-controls">
        <button className={`control-btn ${muted ? 'active' : ''}`} onClick={toggleMute}>
          {muted ? '🔇' : '🎤'} {muted ? 'Unmute' : 'Mute'}
        </button>
        <button className={`control-btn ${cameraOff ? 'active' : ''}`} onClick={toggleCamera}>
          {cameraOff ? '📷' : '📹'} {cameraOff ? 'Camera On' : 'Camera Off'}
        </button>
        <button className="control-btn end-call" onClick={endCall}>
          📞 End Call
        </button>
      </div>
    </div>
  );
}
