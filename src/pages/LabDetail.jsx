import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';

export default function LabDetail() {
  const { id } = useParams();
  const [lab, setLab] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getLab(id)
      .then(setLab)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading page">Loading...</div>;
  if (!lab) return <div className="empty-state page">Lab not found</div>;

  return (
    <div className="page">
      <div className="container">
        <div className="detail-header">
          <div className="lab-icon large">🔬</div>
          <div>
            <h1>{lab.name}</h1>
            <p className="text-muted">{lab.city_name}</p>
            <span className="rating">★ {lab.rating}</span>
            {lab.discount_percent > 0 && (
              <span className="badge badge-discount">Up to {lab.discount_percent}% OFF</span>
            )}
          </div>
        </div>

        {lab.description && (
          <div className="detail-section">
            <h2>About</h2>
            <p>{lab.description}</p>
            {lab.phone && <p><strong>Phone:</strong> {lab.phone}</p>}
          </div>
        )}

        {lab.tests?.length > 0 && (
          <div className="detail-section">
            <h2>Available Tests</h2>
            <div className="tests-table">
              <table>
                <thead>
                  <tr>
                    <th>Test</th>
                    <th>Description</th>
                    <th>Price</th>
                    <th>Discounted</th>
                  </tr>
                </thead>
                <tbody>
                  {lab.tests.map((t) => (
                    <tr key={t.id}>
                      <td><strong>{t.name}</strong></td>
                      <td>{t.description}</td>
                      <td className="strike">Rs. {Number(t.price).toLocaleString()}</td>
                      <td className="price">Rs. {Number(t.discounted_price || t.price).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
