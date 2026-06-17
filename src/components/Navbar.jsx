import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCity } from '../context/CityContext';
import { useCart } from '../context/CartContext';
import CityModal from './CityModal';

const navItems = [
  { to: '/doctors', label: 'Doctors' },
  { to: '/doctors?online=true', label: 'Online' },
  { to: '/hospitals', label: 'Hospitals' },
  { to: '/labs', label: 'Lab Tests' },
  { to: '/medicines', label: 'Medicines' },
  { to: '/ai-doctor', label: 'AI Doctor' },
  { to: '/deals', label: 'Deals' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { city } = useCity();
  const { count } = useCart();
  const navigate = useNavigate();
  const [showCityModal, setShowCityModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef(null);

  const firstName = user?.name?.split(' ')[0] || 'Account';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userRef.current && !userRef.current.contains(e.target)) {
        setUserOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setUserOpen(false);
    setMenuOpen(false);
    logout();
    navigate('/');
  };

  const closeMobile = () => setMenuOpen(false);

  return (
    <>
      <nav className="navbar">
        <div className="container navbar-inner">
          <Link to="/" className="logo" onClick={closeMobile}>
            <span className="logo-icon">+</span>
            <span className="logo-text">BestechCare</span>
          </Link>

          <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
            {navItems.map((item) => (
              <Link key={item.to} to={item.to} onClick={closeMobile}>
                {item.label}
              </Link>
            ))}

            <div className="nav-mobile-extras">
              <button className="city-btn city-btn-mobile" onClick={() => { setShowCityModal(true); closeMobile(); }}>
                📍 {city.charAt(0).toUpperCase() + city.slice(1)}
              </button>
              <a href="tel:03114315611" className="helpline-mobile">0311-4315611</a>
            </div>

            {user && (
              <div className="nav-mobile-user">
                <p className="nav-mobile-greeting">Hi, {firstName}</p>
                <Link to="/appointments" onClick={closeMobile}>My Appointments</Link>
                <Link to="/my-summary" onClick={closeMobile}>My Summary</Link>
                <Link to="/orders" onClick={closeMobile}>My Orders</Link>
                {user.role === 'doctor' && (
                  <Link to="/doctor/consultations" onClick={closeMobile}>Consultations</Link>
                )}
                {user.role === 'admin' && (
                  <Link to="/admin" onClick={closeMobile}>Admin Panel</Link>
                )}
                <button type="button" className="nav-mobile-logout" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            )}
            {!user && (
              <Link to="/login" onClick={closeMobile} className="btn btn-primary btn-sm nav-mobile-login">
                Login
              </Link>
            )}
          </div>

          <div className="nav-actions">
            <button className="city-btn" onClick={() => setShowCityModal(true)} title="Change city">
              📍 <span>{city.charAt(0).toUpperCase() + city.slice(1)}</span>
            </button>

            <a href="tel:03114315611" className="helpline" title="Call us">
              0311-4315611
            </a>

            <Link to="/cart" className="cart-btn" title="Cart">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {count > 0 && <span className="cart-count">{count}</span>}
            </Link>

            {user ? (
              <div className="user-dropdown" ref={userRef}>
                <button
                  type="button"
                  className={`user-dropdown-trigger ${userOpen ? 'open' : ''}`}
                  onClick={() => setUserOpen(!userOpen)}
                  aria-expanded={userOpen}
                >
                  <span className="user-avatar">{user.name?.charAt(0) || 'U'}</span>
                  <span className="user-name">{firstName}</span>
                  <svg className="user-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {userOpen && (
                  <div className="user-dropdown-menu">
                    <div className="user-dropdown-header">
                      <strong>{user.name}</strong>
                      <span className="text-muted">{user.email}</span>
                    </div>
                    <Link to="/appointments" onClick={() => setUserOpen(false)}>My Appointments</Link>
                    <Link to="/my-summary" onClick={() => setUserOpen(false)}>My Summary</Link>
                    <Link to="/orders" onClick={() => setUserOpen(false)}>My Orders</Link>
                    {user.role === 'doctor' && (
                      <Link to="/doctor/consultations" onClick={() => setUserOpen(false)}>Consultations</Link>
                    )}
                    {user.role === 'admin' && (
                      <Link to="/admin" onClick={() => setUserOpen(false)}>Admin Panel</Link>
                    )}
                    <div className="user-dropdown-divider" />
                    <button type="button" className="user-dropdown-logout" onClick={handleLogout}>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn btn-primary btn-sm nav-login-btn">Login</Link>
            )}

            <button
              type="button"
              className={`menu-toggle ${menuOpen ? 'open' : ''}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </nav>
      {showCityModal && <CityModal onClose={() => setShowCityModal(false)} />}
    </>
  );
}
