import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useCity } from '../context/CityContext';
import LabCard from '../components/LabCard';

export default function Labs() {
  const { city } = useCity();
  const [labs, setLabs] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getLabs({ city }),
      api.getLabTests(),
    ])
      .then(([labsData, testsData]) => {
        setLabs(labsData);
        setTests(testsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [city]);

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>Book Lab Tests</h1>
          <p>Get up to 20% discount on lab tests from top laboratories</p>
        </div>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            <h2 className="section-subtitle">Labs in {city.charAt(0).toUpperCase() + city.slice(1)}</h2>
            <div className="cards-grid">
              {labs.map((l) => <LabCard key={l.id} lab={l} />)}
            </div>

            {tests.length > 0 && (
              <>
                <h2 className="section-subtitle mt-4">Popular Lab Tests</h2>
                <div className="tests-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Test Name</th>
                        <th>Lab</th>
                        <th>Price</th>
                        <th>Discounted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tests.map((t) => (
                        <tr key={t.id}>
                          <td>{t.name}</td>
                          <td>{t.lab_name}</td>
                          <td className="strike">Rs. {Number(t.price).toLocaleString()}</td>
                          <td className="price">Rs. {Number(t.discounted_price || t.price).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
