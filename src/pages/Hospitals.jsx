import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useCity } from '../context/CityContext';
import HospitalCard from '../components/HospitalCard';

export default function Hospitals() {
  const { city } = useCity();
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = { city };
    if (search) params.search = search;
    api.getHospitals(params)
      .then(setHospitals)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [city, search]);

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>Find Hospitals</h1>
          <p>Discover top-rated hospitals near you</p>
        </div>

        <input
          type="text"
          placeholder="Search hospitals..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="filter-input"
        />

        {loading ? (
          <div className="loading">Loading hospitals...</div>
        ) : hospitals.length === 0 ? (
          <div className="empty-state">No hospitals found in this city.</div>
        ) : (
          <div className="cards-grid">
            {hospitals.map((h) => <HospitalCard key={h.id} hospital={h} />)}
          </div>
        )}
      </div>
    </div>
  );
}
