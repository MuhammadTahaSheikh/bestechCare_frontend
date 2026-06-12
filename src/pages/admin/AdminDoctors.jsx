import { useEffect, useState } from 'react';
import { api } from '../../api/client';

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    api.adminGetDoctors().then(setDoctors).catch(console.error);
  }, []);

  const toggleVerify = async (id, current) => {
    await api.adminVerifyDoctor(id, !current);
    setDoctors((prev) =>
      prev.map((d) => (d.id === id ? { ...d, is_verified: !current } : d))
    );
  };

  return (
    <div>
      <h1 className="admin-title">Doctors</h1>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Specialty</th>
              <th>Fee</th>
              <th>Rating</th>
              <th>Verified</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map((d) => (
              <tr key={d.id}>
                <td>{d.name}</td>
                <td>{d.specialty_name}</td>
                <td>Rs. {Number(d.consultation_fee).toLocaleString()}</td>
                <td>★ {d.rating}</td>
                <td>{d.is_verified ? '✅' : '❌'}</td>
                <td>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => toggleVerify(d.id, d.is_verified)}
                  >
                    {d.is_verified ? 'Unverify' : 'Verify'}
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
