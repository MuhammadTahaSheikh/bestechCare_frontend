import { useEffect, useState } from 'react';
import { api } from '../../api/client';

export default function AdminHospitals() {
  const [hospitals, setHospitals] = useState([]);

  useEffect(() => {
    api.adminGetHospitals().then(setHospitals).catch(console.error);
  }, []);

  const toggleVerify = async (id, current) => {
    await api.adminVerifyHospital(id, !current);
    setHospitals((prev) =>
      prev.map((h) => (h.id === id ? { ...h, is_verified: !current } : h))
    );
  };

  return (
    <div>
      <h1 className="admin-title">Hospitals</h1>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>City</th>
              <th>Rating</th>
              <th>Verified</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {hospitals.map((h) => (
              <tr key={h.id}>
                <td>{h.name}</td>
                <td>{h.city_name}</td>
                <td>★ {h.rating}</td>
                <td>{h.is_verified ? '✅' : '❌'}</td>
                <td>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => toggleVerify(h.id, h.is_verified)}
                  >
                    {h.is_verified ? 'Unverify' : 'Verify'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
