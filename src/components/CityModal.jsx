import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useCity } from '../context/CityContext';

export default function CityModal({ onClose }) {
  const { city, selectCity } = useCity();
  const [cities, setCities] = useState([]);

  useEffect(() => {
    api.getCities().then(setCities).catch(console.error);
  }, []);

  const handleSelect = (slug) => {
    selectCity(slug);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Change City</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <p className="modal-note">Changing your city will update search results.</p>
        <div className="city-grid">
          {cities.map((c) => (
            <button
              key={c.id}
              className={`city-option ${city === c.slug ? 'active' : ''}`}
              onClick={() => handleSelect(c.slug)}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
