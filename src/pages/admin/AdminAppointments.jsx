import { useEffect, useState } from 'react';
import { api } from '../../api/client';

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    api.adminGetAppointments().then(setAppointments).catch(console.error);
  }, []);

  const updateStatus = async (id, status) => {
    await api.adminUpdateAppointmentStatus(id, status);
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
  };

  return (
    <div>
      <h1 className="admin-title">Appointments</h1>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Specialty</th>
              <th>Date</th>
              <th>Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a.id}>
                <td>{a.patient_name}</td>
                <td>{a.doctor_name}</td>
                <td>{a.specialty_name}</td>
                <td>{new Date(a.appointment_date).toLocaleDateString()} {a.appointment_time?.slice(0, 5)}</td>
                <td>{a.type}</td>
                <td><span className={`status status-${a.status}`}>{a.status}</span></td>
                <td>
                  {a.status === 'pending' && (
                    <>
                      <button className="btn btn-sm btn-primary" onClick={() => updateStatus(a.id, 'confirmed')}>Confirm</button>
                      <button className="btn btn-sm btn-outline" onClick={() => updateStatus(a.id, 'cancelled')}>Cancel</button>
                    </>
                  )}
                  {a.status === 'confirmed' && (
                    <button className="btn btn-sm btn-primary" onClick={() => updateStatus(a.id, 'completed')}>Complete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
