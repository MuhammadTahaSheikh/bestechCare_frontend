import { useEffect, useState } from 'react';
import { api } from '../../api/client';

const emptyForm = {
  name: '', description: '', address: '', city_id: '', phone: '',
};

export default function AdminHospitals() {
  const [hospitals, setHospitals] = useState([]);
  const [cities, setCities] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const load = () => {
    api.adminGetHospitals().then(setHospitals).catch(console.error);
  };

  useEffect(() => {
    load();
    api.getCities().then(setCities).catch(console.error);
  }, []);

  const toggleVerify = async (id, current) => {
    await api.adminVerifyHospital(id, !current);
    setHospitals((prev) =>
      prev.map((h) => (h.id === id ? { ...h, is_verified: !current } : h))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.adminCreateHospital({
        ...form,
        city_id: Number(form.city_id),
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
        <h1 className="admin-title">Hospitals</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Hospital'}
        </button>
      </div>

      {showForm && (
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>City</label>
              <select required value={form.city_id} onChange={(e) => setForm({ ...form, city_id: e.target.value })}>
                <option value="">Select city</option>
                {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Address</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          {error && <p className="message error">{error}</p>}
          <button type="submit" className="btn btn-primary">Save Hospital</button>
        </form>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>City</th>
              <th>Rating</th>
              <th>Verified</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {hospitals.map((h) => (
              <tr key={h.id}>
                <td>{h.name}</td>
                <td>{h.city_name}</td>
                <td>★ {h.rating}</td>
                <td>{h.is_verified ? '✅' : '❌'}</td>
                <td>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => toggleVerify(h.id, h.is_verified)}
                  >
                    {h.is_verified ? 'Unverify' : 'Verify'}
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
