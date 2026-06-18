import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { useCity } from '../context/CityContext';
import DoctorCard from '../components/DoctorCard';

export default function Doctors() {
  const { city } = useCity();
  const [searchParams] = useSearchParams();
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');

  const specialty = searchParams.get('specialty') || '';
  const online = searchParams.get('online') || '';

  useEffect(() => {
    api.getSpecialties().then(setSpecialties).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { city };
    if (specialty) params.specialty = specialty;
    if (online) params.online = online;
    if (search) params.search = search;

    api.getDoctors(params)
      .then(setDoctors)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [city, specialty, online, search]);

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>{online ? 'Doctors Online Now' : 'Find Doctors'}</h1>
          <p>
            {online
              ? 'Doctors currently available for online video consultations'
              : 'Book appointments with verified doctors in your city'}
          </p>
        </div>

        <div className="filters">
          <input
            type="text"
            placeholder="Search by name or specialty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="filter-input"
          />
          <div className="filter-tags">
            {specialties.map((s) => (
              <a
                key={s.id}
                href={`/doctors?specialty=${s.slug}`}
                className={`filter-tag ${specialty === s.slug ? 'active' : ''}`}
              >
                {s.name}
              </a>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading doctors...</div>
        ) : doctors.length === 0 ? (
          <div className="empty-state">No doctors found. Try a different search.</div>
        ) : (
          <div className="cards-grid">
            {doctors.map((d) => <DoctorCard key={d.id} doctor={d} />)}
          </div>
        )}
      </div>
    </div>
  );
}
