import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function DoctorOnlineToggle({ className = '' }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [onlineConsultation, setOnlineConsultation] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getDoctorAvailability()
      .then((data) => {
        setOnlineConsultation(Boolean(data.online_consultation));
        setIsOnline(Boolean(data.is_online));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async () => {
    if (saving || !onlineConsultation) return;
    setSaving(true);
    setError('');
    const next = !isOnline;
    try {
      const data = await api.setDoctorAvailability(next);
      setIsOnline(Boolean(data.is_online));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className={`text-muted ${className}`.trim()}>Loading availability...</p>;
  }

  if (!onlineConsultation) {
    return (
      <div className={`doctor-online-toggle disabled ${className}`.trim()}>
        <p className="text-muted">Online consultations are not enabled on your profile.</p>
      </div>
    );
  }

  return (
    <div className={`doctor-online-toggle ${className}`.trim()}>
      <div className="doctor-online-toggle-row">
        <div>
          <h3>Online Status</h3>
          <p className="text-muted">
            {isOnline
              ? 'You are visible to patients as online for video consultations.'
              : 'You are offline. Patients cannot book online appointments right now.'}
          </p>
        </div>
        <button
          type="button"
          className={`online-toggle-btn ${isOnline ? 'online' : 'offline'}`}
          onClick={handleToggle}
          disabled={saving}
          aria-pressed={isOnline}
        >
          <span className="online-toggle-knob" />
          <span className="online-toggle-label">{isOnline ? 'Online' : 'Offline'}</span>
        </button>
      </div>
      {error && <p className="message error">{error}</p>}
    </div>
  );
}

export function DoctorStatusBadge({ doctor }) {
  if (!doctor?.online_consultation) return null;

  if (doctor.is_online) {
    return <span className="badge badge-live-online">● Online now</span>;
  }

  return <span className="badge badge-offline">● Offline</span>;
}
