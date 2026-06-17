import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const links = [
  { to: '/admin', label: 'Dashboard', exact: true },
  { to: '/admin/appointments', label: 'Appointments' },
  { to: '/admin/doctors', label: 'Doctors' },
  { to: '/admin/hospitals', label: 'Hospitals' },
  { to: '/admin/medicines', label: 'Medicines' },
  { to: '/admin/labs', label: 'Labs & Tests' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/summaries', label: 'Summaries' },
];

export default function AdminLayout() {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (to, exact) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <Link to="/">BestechCare</Link>
          <span>Admin</span>
        </div>
        <nav>
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={isActive(link.to, link.exact) ? 'active' : ''}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <Link to="/">← Back to Site</Link>
          <button onClick={() => { logout(); navigate('/'); }}>Logout</button>
        </div>
      </aside>
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
}
