import { Link } from 'react-router-dom';

export default function HospitalCard({ hospital }) {
  return (
    <Link to={`/hospitals/${hospital.id}`} className="card hospital-card">
      <div className="hospital-icon">🏥</div>
      <div className="card-body">
        <h3>{hospital.name}</h3>
        <p className="text-muted">{hospital.city_name}</p>
        <p className="address">{hospital.address}</p>
        <div className="card-meta">
          <span className="rating">★ {hospital.rating}</span>
          {hospital.is_verified && <span className="badge badge-verified">Verified</span>}
        </div>
      </div>
    </Link>
  );
}
