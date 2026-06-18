import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import DoctorOnlineToggle from '../components/DoctorOnlineToggle';

export default function DoctorConsultations() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDoctorConsultations()
      .then(setAppointments)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading page">Loading...</div>;

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>My Online Consultations</h1>
          <p>Join video calls with your patients</p>
        </div>

        <DoctorOnlineToggle className="detail-section" />

        {appointments.length === 0 ? (
          <div className="empty-state">No online consultations scheduled.</div>
        ) : (
          <div className="appointments-list">
            {appointments.map((a) => (
              <div key={a.id} className="appointment-card">
                <div className="appointment-info">
                  <h3>{a.patient_name}</h3>
                  <p className="text-muted">{a.specialty_name}</p>
                  <p>
                    {new Date(a.appointment_date).toLocaleDateString()} at {a.appointment_time?.slice(0, 5)}
                  </p>
                  <span className={`status status-${a.status}`}>{a.status}</span>
                  {a.payment_status === 'unpaid' && <span className="badge badge-rx">Unpaid</span>}
                </div>
                <div className="appointment-actions">
                  {a.status === 'confirmed' && a.payment_status === 'paid' && (
                    <Link to={`/consultation/${a.id}`} className="btn btn-primary btn-sm">
                      Join Video Call
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
