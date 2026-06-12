import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.adminGetStats().then(setStats).catch(console.error);
  }, []);

  if (!stats) return <div className="loading">Loading dashboard...</div>;

  const cards = [
    { label: 'Total Users', value: stats.users, link: null },
    { label: 'Doctors', value: stats.doctors, link: '/admin/doctors' },
    { label: 'Hospitals', value: stats.hospitals, link: '/admin/hospitals' },
    { label: 'Appointments', value: stats.appointments, link: '/admin/appointments' },
    { label: 'Pending Appointments', value: stats.pending_appointments, link: '/admin/appointments' },
    { label: 'Medicine Orders', value: stats.orders, link: '/admin/orders' },
    { label: 'Active Medicines', value: stats.medicines, link: '/admin/medicines' },
    { label: 'Revenue (PKR)', value: `Rs. ${Number(stats.revenue).toLocaleString()}`, link: '/admin/orders' },
  ];

  return (
    <div>
      <h1 className="admin-title">Dashboard</h1>
      <p className="text-muted admin-subtitle">Platform overview and quick stats</p>

      <div className="admin-stats-grid">
        {cards.map((card) => (
          card.link ? (
            <Link key={card.label} to={card.link} className="admin-stat-card">
              <span className="admin-stat-value">{card.value}</span>
              <span className="admin-stat-label">{card.label}</span>
            </Link>
          ) : (
            <div key={card.label} className="admin-stat-card">
              <span className="admin-stat-value">{card.value}</span>
              <span className="admin-stat-label">{card.label}</span>
            </div>
          )
        ))}
      </div>
    </div>
  );
}
