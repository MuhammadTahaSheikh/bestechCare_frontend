import { Link } from 'react-router-dom';

export default function LabCard({ lab }) {
  return (
    <Link to={`/labs/${lab.id}`} className="card lab-card">
      <div className="lab-icon">🔬</div>
      <div className="card-body">
        <h3>{lab.name}</h3>
        <p className="text-muted">{lab.city_name}</p>
        <div className="card-meta">
          <span className="rating">★ {lab.rating}</span>
          {lab.discount_percent > 0 && (
            <span className="badge badge-discount">Up to {lab.discount_percent}% OFF</span>
          )}
        </div>
      </div>
    </Link>
  );
}
