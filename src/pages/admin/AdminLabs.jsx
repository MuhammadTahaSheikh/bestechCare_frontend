import { useEffect, useState } from 'react';
import { api } from '../../api/client';

const emptyLabForm = { name: '', description: '', city_id: '', phone: '', discount_percent: 0 };
const emptyTestForm = { lab_id: '', name: '', description: '', price: '', discounted_price: '' };

export default function AdminLabs() {
  const [labs, setLabs] = useState([]);
  const [tests, setTests] = useState([]);
  const [cities, setCities] = useState([]);
  const [showLabForm, setShowLabForm] = useState(false);
  const [showTestForm, setShowTestForm] = useState(false);
  const [labForm, setLabForm] = useState(emptyLabForm);
  const [testForm, setTestForm] = useState(emptyTestForm);
  const [error, setError] = useState('');

  const load = () => {
    api.adminGetLabs().then(setLabs).catch(console.error);
    api.adminGetLabTests().then(setTests).catch(console.error);
  };

  useEffect(() => {
    load();
    api.getCities().then(setCities).catch(console.error);
  }, []);

  const handleLabSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.adminCreateLab({
        ...labForm,
        city_id: Number(labForm.city_id),
        discount_percent: Number(labForm.discount_percent) || 0,
      });
      setShowLabForm(false);
      setLabForm(emptyLabForm);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTestSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.adminCreateLabTest({
        ...testForm,
        lab_id: Number(testForm.lab_id),
        price: Number(testForm.price),
        discounted_price: testForm.discounted_price ? Number(testForm.discounted_price) : null,
      });
      setShowTestForm(false);
      setTestForm(emptyTestForm);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="admin-header-row">
        <h1 className="admin-title">Labs & Tests</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-primary" onClick={() => { setShowLabForm(!showLabForm); setShowTestForm(false); }}>
            {showLabForm ? 'Cancel' : '+ Add Lab'}
          </button>
          <button className="btn btn-outline" onClick={() => { setShowTestForm(!showTestForm); setShowLabForm(false); }}>
            {showTestForm ? 'Cancel' : '+ Add Lab Test'}
          </button>
        </div>
      </div>

      {showLabForm && (
        <form className="admin-form" onSubmit={handleLabSubmit}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>New Lab</h2>
          <div className="form-row">
            <div className="form-group">
              <label>Name</label>
              <input required value={labForm.name} onChange={(e) => setLabForm({ ...labForm, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>City</label>
              <select required value={labForm.city_id} onChange={(e) => setLabForm({ ...labForm, city_id: e.target.value })}>
                <option value="">Select city</option>
                {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input value={labForm.phone} onChange={(e) => setLabForm({ ...labForm, phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Discount %</label>
              <input type="number" min="0" max="100" value={labForm.discount_percent} onChange={(e) => setLabForm({ ...labForm, discount_percent: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={labForm.description} onChange={(e) => setLabForm({ ...labForm, description: e.target.value })} />
          </div>
          {error && <p className="message error">{error}</p>}
          <button type="submit" className="btn btn-primary">Save Lab</button>
        </form>
      )}

      {showTestForm && (
        <form className="admin-form" onSubmit={handleTestSubmit}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>New Lab Test</h2>
          <div className="form-row">
            <div className="form-group">
              <label>Lab</label>
              <select required value={testForm.lab_id} onChange={(e) => setTestForm({ ...testForm, lab_id: e.target.value })}>
                <option value="">Select lab</option>
                {labs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Test Name</label>
              <input required value={testForm.name} onChange={(e) => setTestForm({ ...testForm, name: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Price (PKR)</label>
              <input type="number" required min="0" value={testForm.price} onChange={(e) => setTestForm({ ...testForm, price: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Discounted Price</label>
              <input type="number" min="0" value={testForm.discounted_price} onChange={(e) => setTestForm({ ...testForm, discounted_price: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={testForm.description} onChange={(e) => setTestForm({ ...testForm, description: e.target.value })} />
          </div>
          {error && <p className="message error">{error}</p>}
          <button type="submit" className="btn btn-primary">Save Lab Test</button>
        </form>
      )}

      <h2 style={{ margin: '2rem 0 1rem', fontSize: '1.1rem' }}>Labs</h2>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>City</th>
              <th>Phone</th>
              <th>Discount</th>
              <th>Rating</th>
            </tr>
          </thead>
          <tbody>
            {labs.map((l) => (
              <tr key={l.id}>
                <td>{l.name}</td>
                <td>{l.city_name}</td>
                <td>{l.phone || '—'}</td>
                <td>{l.discount_percent}%</td>
                <td>★ {l.rating}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={{ margin: '2rem 0 1rem', fontSize: '1.1rem' }}>Lab Tests</h2>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Test</th>
              <th>Lab</th>
              <th>Price</th>
              <th>Discounted</th>
            </tr>
          </thead>
          <tbody>
            {tests.map((t) => (
              <tr key={t.id}>
                <td>{t.name}</td>
                <td>{t.lab_name}</td>
                <td>Rs. {Number(t.price).toLocaleString()}</td>
                <td>{t.discounted_price ? `Rs. ${Number(t.discounted_price).toLocaleString()}` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
