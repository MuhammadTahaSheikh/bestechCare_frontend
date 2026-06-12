import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export default function Deals() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDeals()
      .then(setDeals)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>Deals & Discounts</h1>
          <p>Save on lab tests and healthcare services</p>
        </div>

        {loading ? (
          <div className="loading">Loading deals...</div>
        ) : deals.length === 0 ? (
          <div className="empty-state">No active deals at the moment.</div>
        ) : (
          <div className="deals-grid">
            {deals.map((deal) => (
              <div key={deal.id} className="deal-card large">
                <div className="deal-badge">{deal.discount_percent}% OFF</div>
                <h3>{deal.title}</h3>
                <p>{deal.description}</p>
                {deal.lab_name && <p className="text-muted">At {deal.lab_name}</p>}
                <Link to="/labs" className="btn btn-primary">Redeem Offer</Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
