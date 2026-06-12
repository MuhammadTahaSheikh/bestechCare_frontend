import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Appointments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    api.getMyAppointments()
      .then(setAppointments)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const handleCancel = async (id) => {
    if (!confirm('Cancel this appointment?')) return;
    try {
      await api.cancelAppointment(id);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'cancelled' } : a))
      );
    } catch (err) {
      alert(err.message);
    }
  };

  const statusClass = (status) => {
    const map = {
      pending: 'status-pending',
      confirmed: 'status-confirmed',
      completed: 'status-completed',
      cancelled: 'status-cancelled',
    };
    return map[status] || '';
  };

  if (loading) return <div className="loading page">Loading...</div>;

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>My Appointments</h1>
          <p>View, pay for, and join your consultations</p>
        </div>

        {appointments.length === 0 ? (
          <div className="empty-state">
            <p>You have no appointments yet.</p>
            <Link to="/doctors" className="btn btn-primary">Find a Doctor</Link>
          </div>
        ) : (
          <div className="appointments-list">
            {appointments.map((a) => (
              <div key={a.id} className="appointment-card">
                <div className="appointment-info">
                  <h3>{a.doctor_name}</h3>
                  <p className="text-muted">{a.specialty_name}</p>
                  <p>
                    {new Date(a.appointment_date).toLocaleDateString()} at{' '}
                    {a.appointment_time?.slice(0, 5)}
                  </p>
                  <div className="badges">
                    <span className="badge">{a.type === 'online' ? 'Online' : 'In-Clinic'}</span>
                    {a.payment_status === 'unpaid' && (
                      <span className="badge badge-rx">Payment Pending</span>
                    )}
                    {a.payment_status === 'paid' && (
                      <span className="badge badge-verified">Paid</span>
                    )}
                  </div>
                  {a.consultation_fee && (
                    <p className="fee">Fee: Rs. {Number(a.consultation_fee).toLocaleString()}</p>
                  )}
                </div>
                <div className="appointment-actions">
                  <span className={`status ${statusClass(a.status)}`}>{a.status}</span>
                  {a.payment_status === 'unpaid' && a.status !== 'cancelled' && (
                    <Link
                      to={`/payment?type=appointment&id=${a.id}`}
                      className="btn btn-primary btn-sm"
                    >
                      Pay Now
                    </Link>
                  )}
                  {a.type === 'online' && a.status === 'confirmed' && a.payment_status === 'paid' && (
                    <Link to={`/consultation/${a.id}`} className="btn btn-primary btn-sm">
                      Join Video Call
                    </Link>
                  )}
                  {a.status === 'pending' && a.payment_status === 'unpaid' && (
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleCancel(a.id)}
                    >
                      Cancel
                    </button>
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
