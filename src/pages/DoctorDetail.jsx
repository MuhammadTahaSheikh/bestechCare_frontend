import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function DoctorDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [form, setForm] = useState({
    appointment_date: '',
    appointment_time: '',
    type: 'in_clinic',
    notes: '',
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewMsg, setReviewMsg] = useState('');

  const loadReviews = () => {
    api.getDoctorReviews(id).then(setReviews).catch(console.error);
  };

  useEffect(() => {
    api.getDoctor(id)
      .then(setDoctor)
      .catch(console.error)
      .finally(() => setLoading(false));
    loadReviews();
  }, [id]);

  useEffect(() => {
    if (!form.appointment_date) {
      setAvailableSlots([]);
      setForm((prev) => ({ ...prev, appointment_time: '' }));
      return;
    }

    setSlotsLoading(true);
    api
      .getDoctorAvailableSlots(id, form.appointment_date)
      .then((data) => {
        setAvailableSlots(data.slots || []);
        setForm((prev) => ({
          ...prev,
          appointment_time: data.slots?.includes(prev.appointment_time) ? prev.appointment_time : '',
        }));
      })
      .catch(() => setAvailableSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [id, form.appointment_date]);

  const minDate = new Date().toISOString().slice(0, 10);

  const handleReview = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    setReviewMsg('');
    try {
      await api.submitReview({ doctor_id: Number(id), ...reviewForm });
      setReviewMsg('Thank you for your review!');
      setReviewForm({ rating: 5, comment: '' });
      loadReviews();
      api.getDoctor(id).then(setDoctor);
    } catch (err) {
      setReviewMsg(err.message);
    }
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    if (!form.appointment_date || !form.appointment_time) {
      setMessage('Please select a date and time slot');
      return;
    }

    setBooking(true);
    setMessage('');
    try {
      const result = await api.bookAppointment({ doctor_id: Number(id), ...form });
      if (result.payment_required) {
        navigate(`/payment?type=appointment&id=${result.id}`);
        return;
      }
      setMessage('Appointment booked successfully!');
      setForm({ appointment_date: '', appointment_time: '', type: 'in_clinic', notes: '' });
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <div className="loading page">Loading...</div>;
  if (!doctor) return <div className="empty-state page">Doctor not found</div>;

  return (
    <div className="page">
      <div className="container">
        <div className="detail-layout">
          <div className="detail-main">
            <div className="doctor-profile">
              <div className="doctor-avatar large">{doctor.name?.charAt(0)}</div>
              <div>
                <h1>{doctor.name}</h1>
                <p className="specialty">{doctor.specialty_name}</p>
                <p className="text-muted">{doctor.qualification}</p>
                <div className="card-meta">
                  <span className="rating">★ {doctor.rating}</span>
                  <span>{doctor.experience_years} years experience</span>
                </div>
                <div className="badges mt-2">
                  {doctor.online_consultation && <span className="badge badge-online">Online</span>}
                  {doctor.in_clinic && <span className="badge badge-clinic">In-Clinic</span>}
                  {doctor.is_verified && <span className="badge badge-verified">Verified</span>}
                </div>
              </div>
            </div>

            {doctor.bio && (
              <div className="detail-section">
                <h2>About</h2>
                <p>{doctor.bio}</p>
              </div>
            )}

            {doctor.hospital_name && (
              <div className="detail-section">
                <h2>Hospital</h2>
                <p><strong>{doctor.hospital_name}</strong></p>
                <p className="text-muted">{doctor.hospital_address}</p>
                <p className="text-muted">{doctor.city_name}</p>
              </div>
            )}

            <div className="detail-section">
              <h2>Patient Reviews ({reviews.length})</h2>
              {reviews.length === 0 ? (
                <p className="text-muted">No reviews yet. Be the first to review!</p>
              ) : (
                <div className="reviews-list">
                  {reviews.map((r) => (
                    <div key={r.id} className="review-item">
                      <div className="review-header">
                        <strong>{r.user_name}</strong>
                        <span className="rating">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                      </div>
                      {r.comment && <p>{r.comment}</p>}
                      <span className="text-muted">{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}

              {user && (
                <form className="review-form" onSubmit={handleReview}>
                  <h3>Write a Review</h3>
                  <div className="form-group">
                    <label>Rating</label>
                    <select
                      value={reviewForm.rating}
                      onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>{n} Stars</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Comment</label>
                    <textarea
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                      rows={3}
                      placeholder="Share your experience..."
                    />
                  </div>
                  <button type="submit" className="btn btn-primary btn-sm">Submit Review</button>
                  {reviewMsg && <p className={`message ${reviewMsg.includes('Thank') ? 'success' : 'error'}`}>{reviewMsg}</p>}
                </form>
              )}
            </div>
          </div>

          <div className="detail-sidebar">
            <div className="booking-card">
              <h3>Book Appointment</h3>
              <p className="fee-display">Rs. {Number(doctor.consultation_fee).toLocaleString()}</p>

              <form onSubmit={handleBook}>
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    required
                    min={minDate}
                    value={form.appointment_date}
                    onChange={(e) => setForm({ ...form, appointment_date: e.target.value, appointment_time: '' })}
                  />
                </div>
                <div className="form-group">
                  <label>Time</label>
                  {!form.appointment_date ? (
                    <p className="text-muted">Select a date to see available slots</p>
                  ) : slotsLoading ? (
                    <p className="text-muted">Loading available slots...</p>
                  ) : availableSlots.length === 0 ? (
                    <p className="text-muted">No slots available for this date</p>
                  ) : (
                    <div className="slot-grid">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          className={`slot-btn ${form.appointment_time === slot ? 'active' : ''}`}
                          onClick={() => setForm({ ...form, appointment_time: slot })}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    {doctor.in_clinic && <option value="in_clinic">In-Clinic</option>}
                    {doctor.online_consultation && <option value="online">Online</option>}
                  </select>
                </div>
                <div className="form-group">
                  <label>Notes (optional)</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={3}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  disabled={booking || !form.appointment_time}
                >
                  {booking ? 'Booking...' : 'Book Now'}
                </button>
              </form>
              {message && <p className={`message ${message.includes('success') ? 'success' : 'error'}`}>{message}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
