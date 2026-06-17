import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getLoginPath } from '../utils/authRedirect';

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="loading page">Loading...</div>;
  if (!user) {
    return <Navigate to={getLoginPath(`${location.pathname}${location.search}`)} replace />;
  }
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
}
