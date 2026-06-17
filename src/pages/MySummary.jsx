import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString();
}

function formatTime(timeStr) {
  return timeStr?.slice(0, 5);
}

function StatCards({ stats, role }) {
  const cards = [
    { label: 'Total Appointments', value: stats.total_appointments },
    { label: 'Upcoming', value: stats.upcoming },
    { label: 'Completed', value: stats.completed },
    { label: 'Cancelled', value: stats.cancelled },
    role === 'doctor'
      ? { label: 'Patients Seen', value: stats.patients_count }
      : { label: 'Doctors Visited', value: stats.doctors_count },
  ];

  return (
    <div className="admin-stats-grid summary-stats-grid">
      {cards.map((card) => (
        <div key={card.label} className="admin-stat-card">
          <span className="admin-stat-value">{card.value}</span>
          <span className="admin-stat-label">{card.label}</span>
        </div>
      ))}
    </div>
  );
}

function UpcomingList({ appointments, role }) {
  if (appointments.length === 0) {
    return <div className="empty-state">No upcoming appointments.</div>;
  }

  return (
    <div className="appointments-list">
      {appointments.map((a) => (
        <div key={a.id} className="appointment-card">
          <div className="appointment-info">
            <h3>{role === 'doctor' ? a.patient_name : a.doctor_name}</h3>
            {role === 'patient' && <p className="text-muted">{a.specialty_name}</p>}
            <p>
              {formatDate(a.appointment_date)} at {formatTime(a.appointment_time)}
            </p>
            <div className="badges">
              <span className="badge">{a.type === 'online' ? 'Online' : 'In-Clinic'}</span>
              <span className={`status status-${a.status}`}>{a.status}</span>
            </div>
          </div>
          {role === 'doctor' && a.type === 'online' && a.status === 'confirmed' && a.payment_status === 'paid' && (
            <div className="appointment-actions">
              <Link to={`/consultation/${a.id}`} className="btn btn-primary btn-sm">
                Join Video Call
              </Link>
            </div>
          )}
          {role === 'patient' && a.type === 'online' && a.status === 'confirmed' && a.payment_status === 'paid' && (
            <div className="appointment-actions">
              <Link to={`/consultation/${a.id}`} className="btn btn-primary btn-sm">
                Join Video Call
              </Link>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function DoctorPatientList({ patients }) {
  if (patients.length === 0) {
    return <div className="empty-state">No patients yet.</div>;
  }

  return (
    <div className="summary-people-list">
      {patients.map((p) => (
        <div key={p.patient_id} className="summary-person-card">
          <div>
            <h3>{p.patient_name}</h3>
            <p className="text-muted">{p.patient_email}</p>
          </div>
          <div className="summary-person-meta">
            <span>{p.total_appointments} visit{p.total_appointments !== 1 ? 's' : ''}</span>
            {p.last_visit_date && (
              <span className="text-muted">
                Last: {formatDate(p.last_visit_date)} {formatTime(p.last_visit_time)}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function PatientDoctorList({ doctors }) {
  if (doctors.length === 0) {
    return <div className="empty-state">No doctors visited yet.</div>;
  }

  return (
    <div className="summary-people-list">
      {doctors.map((d) => (
        <div key={d.doctor_id} className="summary-person-card">
          <div>
            <h3>{d.doctor_name}</h3>
            <p className="text-muted">{d.specialty_name}</p>
          </div>
          <div className="summary-person-meta">
            <span>{d.total_appointments} visit{d.total_appointments !== 1 ? 's' : ''}</span>
            {d.last_visit_date && (
              <span className="text-muted">
                Last: {formatDate(d.last_visit_date)} {formatTime(d.last_visit_time)}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MySummary() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getMySummary()
      .then(setSummary)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading page">Loading...</div>;
  if (error) return <div className="page"><div className="container"><div className="empty-state">{error}</div></div></div>;

  const isDoctor = summary.role === 'doctor';

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>My Summary</h1>
          <p>
            {isDoctor
              ? 'Your patients, appointments, and activity overview'
              : 'Your doctors, appointments, and activity overview'}
          </p>
        </div>

        <StatCards stats={summary.stats} role={summary.role} />

        <section className="summary-section">
          <h2>Upcoming Appointments</h2>
          <UpcomingList appointments={summary.upcoming_appointments} role={summary.role} />
        </section>

        <section className="summary-section">
          <h2>{isDoctor ? 'Patients You Have Worked With' : 'Doctors You Have Visited'}</h2>
          {isDoctor ? (
            <DoctorPatientList patients={summary.patients} />
          ) : (
            <PatientDoctorList doctors={summary.doctors} />
          )}
        </section>
      </div>
    </div>
  );
}
