import { useEffect, useState } from 'react';
import { api } from '../../api/client';

const emptyForm = {
  name: '', email: '', password: '', phone: '', city_id: '',
  specialty_id: '', hospital_id: '', qualification: '', experience_years: 0,
  consultation_fee: '', online_consultation: true, in_clinic: true, bio: '',
};

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [cities, setCities] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const load = () => {
    api.adminGetDoctors().then(setDoctors).catch(console.error);
  };

  useEffect(() => {
    load();
    api.getSpecialties().then(setSpecialties).catch(console.error);
    api.adminGetHospitals().then(setHospitals).catch(console.error);
    api.getCities().then(setCities).catch(console.error);
  }, []);

  const toggleVerify = async (id, current) => {
    await api.adminVerifyDoctor(id, !current);
    setDoctors((prev) =>
      prev.map((d) => (d.id === id ? { ...d, is_verified: !current } : d))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.adminCreateDoctor({
        ...form,
        city_id: form.city_id ? Number(form.city_id) : null,
        specialty_id: Number(form.specialty_id),
        hospital_id: form.hospital_id ? Number(form.hospital_id) : null,
        experience_years: Number(form.experience_years) || 0,
        consultation_fee: Number(form.consultation_fee) || 0,
      });
      setShowForm(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="admin-header-row">
        <h1 className="admin-title">Doctors</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Doctor'}
        </button>
      </div>

      {showForm && (
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Password</label>
              <input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label>City</label>
              <select value={form.city_id} onChange={(e) => setForm({ ...form, city_id: e.target.value })}>
                <option value="">Select city</option>
                {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Specialty</label>
              <select required value={form.specialty_id} onChange={(e) => setForm({ ...form, specialty_id: e.target.value })}>
                <option value="">Select specialty</option>
                {specialties.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Hospital</label>
              <select value={form.hospital_id} onChange={(e) => setForm({ ...form, hospital_id: e.target.value })}>
                <option value="">None</option>
                {hospitals.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Qualification</label>
              <input value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} placeholder="e.g. MBBS, FCPS" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Experience (years)</label>
              <input type="number" min="0" value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Consultation Fee (PKR)</label>
              <input type="number" min="0" value={form.consultation_fee} onChange={(e) => setForm({ ...form, consultation_fee: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Bio</label>
            <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </div>
          <div className="form-row">
            <label className="checkbox-label">
              <input type="checkbox" checked={form.online_consultation} onChange={(e) => setForm({ ...form, online_consultation: e.target.checked })} />
              Online consultation
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={form.in_clinic} onChange={(e) => setForm({ ...form, in_clinic: e.target.checked })} />
              In-clinic
            </label>
          </div>
          {error && <p className="message error">{error}</p>}
          <button type="submit" className="btn btn-primary">Save Doctor</button>
        </form>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Specialty</th>
              <th>Fee</th>
              <th>Rating</th>
              <th>Verified</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map((d) => (
              <tr key={d.id}>
                <td>{d.name}</td>
                <td>{d.specialty_name}</td>
                <td>Rs. {Number(d.consultation_fee).toLocaleString()}</td>
                <td>★ {d.rating}</td>
                <td>{d.is_verified ? '✅' : '❌'}</td>
                <td>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => toggleVerify(d.id, d.is_verified)}
                  >
                    {d.is_verified ? 'Unverify' : 'Verify'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
