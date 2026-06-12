import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';

export default function Medicines() {
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const { addItem } = useCart();

  useEffect(() => {
    api.getMedicineCategories().then(setCategories).catch(console.error);
  }, []);

  useEffect(() => {
    const params = {};
    if (category) params.category = category;
    if (search) params.search = search;
    api.getMedicines(params).then(setMedicines).catch(console.error);
  }, [category, search]);

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>Order Medicines Online</h1>
          <p>Upload prescription or buy OTC medicines with home delivery</p>
        </div>

        <input
          type="text"
          placeholder="Search medicines..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="filter-input"
        />

        <div className="filter-tags">
          <button
            className={`filter-tag ${!category ? 'active' : ''}`}
            onClick={() => setCategory('')}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              className={`filter-tag ${category === c.slug ? 'active' : ''}`}
              onClick={() => setCategory(c.slug)}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="medicine-grid">
          {medicines.map((m) => (
            <div key={m.id} className="medicine-card">
              <div className="medicine-icon">💊</div>
              <h3>{m.name}</h3>
              <p className="text-muted">{m.category_name}</p>
              <p className="medicine-desc">{m.description}</p>
              <div className="medicine-price">
                {m.discounted_price && (
                  <span className="strike">Rs. {Number(m.price).toLocaleString()}</span>
                )}
                <span className="price">Rs. {Number(m.discounted_price || m.price).toLocaleString()}</span>
              </div>
              {m.requires_prescription && <span className="badge badge-rx">Prescription Required</span>}
              <button className="btn btn-primary btn-block" onClick={() => addItem(m)}>
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
