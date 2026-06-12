import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';

export default function HospitalDetail() {
  const { id } = useParams();
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getHospital(id)
      .then(setHospital)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading page">Loading...</div>;
  if (!hospital) return <div className="empty-state page">Hospital not found</div>;

  return (
    <div className="page">
      <div className="container">
        <div className="detail-header">
          <div className="hospital-icon large">🏥</div>
          <div>
            <h1>{hospital.name}</h1>
            <p className="text-muted">{hospital.city_name}</p>
            <span className="rating">★ {hospital.rating}</span>
            {hospital.is_verified && <span className="badge badge-verified">Verified</span>}
          </div>
        </div>

        <div className="detail-section">
          <h2>About</h2>
          <p>{hospital.description}</p>
          <p><strong>Address:</strong> {hospital.address}</p>
          {hospital.phone && <p><strong>Phone:</strong> {hospital.phone}</p>}
        </div>

        {hospital.doctors?.length > 0 && (
          <div className="detail-section">
            <h2>Doctors at this Hospital</h2>
            <div className="doctor-list">
              {hospital.doctors.map((d) => (
                <Link key={d.id} to={`/doctors/${d.id}`} className="doctor-list-item">
                  <span>{d.name}</span>
                  <span className="text-muted">{d.specialty_name}</span>
                  <span>Rs. {Number(d.consultation_fee).toLocaleString()}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
