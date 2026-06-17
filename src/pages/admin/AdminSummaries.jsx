import { useEffect, useState } from 'react';
import { api } from '../../api/client';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString();
}

function formatTime(timeStr) {
  return timeStr?.slice(0, 5);
}

function DoctorSummaryCard({ summary }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="summary-admin-card">
      <button type="button" className="summary-admin-card-header" onClick={() => setOpen(!open)}>
        <div>
          <h3>{summary.doctor_name}</h3>
          <p className="text-muted">{summary.specialty_name}</p>
        </div>
        <div className="summary-admin-card-stats">
          <span>{summary.stats.patients_count} patients</span>
          <span>{summary.stats.upcoming} upcoming</span>
          <span className="summary-chevron">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="summary-admin-card-body">
          <div className="admin-stats-grid summary-stats-grid">
            <div className="admin-stat-card">
              <span className="admin-stat-value">{summary.stats.total_appointments}</span>
              <span className="admin-stat-label">Total</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-value">{summary.stats.completed}</span>
              <span className="admin-stat-label">Completed</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-value">{summary.stats.cancelled}</span>
              <span className="admin-stat-label">Cancelled</span>
            </div>
          </div>

          <h4>Upcoming Appointments</h4>
          {summary.upcoming_appointments.length === 0 ? (
            <p className="text-muted">No upcoming appointments.</p>
          ) : (
            <ul className="summary-admin-list">
              {summary.upcoming_appointments.map((a) => (
                <li key={a.id}>
                  <strong>{a.patient_name}</strong> — {formatDate(a.appointment_date)} at{' '}
                  {formatTime(a.appointment_time)} ({a.type}, {a.status})
                </li>
              ))}
            </ul>
          )}

          <h4>Patients</h4>
          {summary.patients.length === 0 ? (
            <p className="text-muted">No patients yet.</p>
          ) : (
            <ul className="summary-admin-list">
              {summary.patients.map((p) => (
                <li key={p.patient_id}>
                  <strong>{p.patient_name}</strong> — {p.total_appointments} visit
                  {p.total_appointments !== 1 ? 's' : ''}
                  {p.last_visit_date && (
                    <span className="text-muted">
                      {' '}
                      (last: {formatDate(p.last_visit_date)})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function PatientSummaryCard({ summary }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="summary-admin-card">
      <button type="button" className="summary-admin-card-header" onClick={() => setOpen(!open)}>
        <div>
          <h3>{summary.patient_name}</h3>
          <p className="text-muted">{summary.patient_email}</p>
        </div>
        <div className="summary-admin-card-stats">
          <span>{summary.stats.doctors_count} doctors</span>
          <span>{summary.stats.upcoming} upcoming</span>
          <span className="summary-chevron">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="summary-admin-card-body">
          <div className="admin-stats-grid summary-stats-grid">
            <div className="admin-stat-card">
              <span className="admin-stat-value">{summary.stats.total_appointments}</span>
              <span className="admin-stat-label">Total</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-value">{summary.stats.completed}</span>
              <span className="admin-stat-label">Completed</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-value">{summary.stats.cancelled}</span>
              <span className="admin-stat-label">Cancelled</span>
            </div>
          </div>

          <h4>Upcoming Appointments</h4>
          {summary.upcoming_appointments.length === 0 ? (
            <p className="text-muted">No upcoming appointments.</p>
          ) : (
            <ul className="summary-admin-list">
              {summary.upcoming_appointments.map((a) => (
                <li key={a.id}>
                  <strong>{a.doctor_name}</strong> ({a.specialty_name}) —{' '}
                  {formatDate(a.appointment_date)} at {formatTime(a.appointment_time)}
                </li>
              ))}
            </ul>
          )}

          <h4>Doctors Visited</h4>
          {summary.doctors.length === 0 ? (
            <p className="text-muted">No doctors yet.</p>
          ) : (
            <ul className="summary-admin-list">
              {summary.doctors.map((d) => (
                <li key={d.doctor_id}>
                  <strong>{d.doctor_name}</strong> — {d.specialty_name} — {d.total_appointments}{' '}
                  visit{d.total_appointments !== 1 ? 's' : ''}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminSummaries() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('doctors');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.adminGetSummaries()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading summaries...</div>;
  if (!data) return <div className="loading">Failed to load summaries.</div>;

  return (
    <div>
      <h1 className="admin-title">User Summaries</h1>
      <p className="text-muted admin-subtitle">
        View all doctors and patients with their appointments and relationships
      </p>

      <div className="summary-tabs">
        <button
          type="button"
          className={tab === 'doctors' ? 'active' : ''}
          onClick={() => setTab('doctors')}
        >
          Doctors ({data.doctors.length})
        </button>
        <button
          type="button"
          className={tab === 'patients' ? 'active' : ''}
          onClick={() => setTab('patients')}
        >
          Patients ({data.patients.length})
        </button>
      </div>

      <div className="summary-admin-list-wrap">
        {tab === 'doctors'
          ? data.doctors.map((s) => <DoctorSummaryCard key={s.doctor_id} summary={s} />)
          : data.patients.map((s) => <PatientSummaryCard key={s.patient_id} summary={s} />)}
      </div>
    </div>
  );
}
