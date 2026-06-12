import { useEffect, useState } from 'react';
import { api } from '../../api/client';

export default function AdminMedicines() {
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', slug: '', category_id: '', description: '', price: '', discounted_price: '', requires_prescription: false, stock: 100,
  });

  const load = () => {
    api.getMedicines().then(setMedicines).catch(console.error);
    api.getMedicineCategories().then(setCategories).catch(console.error);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, '-');
    await api.adminCreateMedicine({ ...form, slug, category_id: Number(form.category_id), price: Number(form.price), discounted_price: form.discounted_price ? Number(form.discounted_price) : null });
    setShowForm(false);
    setForm({ name: '', slug: '', category_id: '', description: '', price: '', discounted_price: '', requires_prescription: false, stock: 100 });
    load();
  };

  const deactivate = async (id) => {
    if (!confirm('Deactivate this medicine?')) return;
    await api.adminDeleteMedicine(id);
    load();
  };

  return (
    <div>
      <div className="admin-header-row">
        <h1 className="admin-title">Medicines</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Medicine'}
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
              <label>Category</label>
              <select required value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <option value="">Select</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Price (PKR)</label>
              <input type="number" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Discounted Price</label>
              <input type="number" value={form.discounted_price} onChange={(e) => setForm({ ...form, discounted_price: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Stock</label>
              <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <label className="checkbox-label">
            <input type="checkbox" checked={form.requires_prescription} onChange={(e) => setForm({ ...form, requires_prescription: e.target.checked })} />
            Requires Prescription
          </label>
          <button type="submit" className="btn btn-primary">Save Medicine</button>
        </form>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Rx</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {medicines.map((m) => (
              <tr key={m.id}>
                <td>{m.name}</td>
                <td>{m.category_name}</td>
                <td>Rs. {Number(m.discounted_price || m.price).toLocaleString()}</td>
                <td>{m.stock}</td>
                <td>{m.requires_prescription ? 'Yes' : 'No'}</td>
                <td>
                  <button className="btn btn-sm btn-outline" onClick={() => deactivate(m.id)}>Deactivate</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
