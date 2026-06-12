import { Link } from 'react-router-dom';

export default function DoctorCard({ doctor }) {
  return (
    <Link to={`/doctors/${doctor.id}`} className="card doctor-card">
      <div className="doctor-avatar">
        {doctor.name?.charAt(0) || 'D'}
      </div>
      <div className="card-body">
        <h3>{doctor.name}</h3>
        <p className="specialty">{doctor.specialty_name}</p>
        {doctor.hospital_name && <p className="text-muted">{doctor.hospital_name}</p>}
        <div className="card-meta">
          <span className="rating">★ {doctor.rating}</span>
          <span className="fee">Rs. {Number(doctor.consultation_fee).toLocaleString()}</span>
        </div>
        <div className="badges">
          {doctor.online_consultation && <span className="badge badge-online">Online</span>}
          {doctor.in_clinic && <span className="badge badge-clinic">In-Clinic</span>}
          {doctor.is_verified && <span className="badge badge-verified">Verified</span>}
        </div>
      </div>
    </Link>
  );
}
