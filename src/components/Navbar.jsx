import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCity } from '../context/CityContext';
import { useCart } from '../context/CartContext';
import CityModal from './CityModal';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { city } = useCity();
  const { count } = useCart();
  const navigate = useNavigate();
  const [showCityModal, setShowCityModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <nav className="navbar">
        <div className="container navbar-inner">
          <Link to="/" className="logo">
            <span className="logo-icon">+</span>
            BestechCare
          </Link>

          <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
            <Link to="/doctors" onClick={() => setMenuOpen(false)}>Doctors</Link>
            <Link to="/doctors?online=true" onClick={() => setMenuOpen(false)}>Online Consultation</Link>
            <Link to="/hospitals" onClick={() => setMenuOpen(false)}>Hospitals</Link>
            <Link to="/labs" onClick={() => setMenuOpen(false)}>Lab Tests</Link>
            <Link to="/medicines" onClick={() => setMenuOpen(false)}>Medicines</Link>
            <Link to="/deals" onClick={() => setMenuOpen(false)}>Deals</Link>
          </div>

          <div className="nav-actions">
            <button className="city-btn" onClick={() => setShowCityModal(true)}>
              📍 {city.charAt(0).toUpperCase() + city.slice(1)}
            </button>
            <a href="tel:03114315611" className="helpline">0311-4315611</a>
            <Link to="/cart" className="cart-btn">
              🛒 {count > 0 && <span className="cart-count">{count}</span>}
            </Link>
            {user ? (
              <div className="user-menu">
                {user.role === 'admin' && (
                  <Link to="/admin" className="btn btn-outline btn-sm">Admin</Link>
                )}
                {user.role === 'doctor' && (
                  <Link to="/doctor/consultations" className="btn btn-outline btn-sm">Consultations</Link>
                )}
                <Link to="/appointments" className="btn btn-outline btn-sm">Appointments</Link>
                <button onClick={handleLogout} className="btn btn-primary btn-sm">Logout</button>
              </div>
            ) : (
              <Link to="/login" className="btn btn-primary btn-sm">Login</Link>
            )}
            <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
          </div>
        </div>
      </nav>
      {showCityModal && <CityModal onClose={() => setShowCityModal(false)} />}
    </>
  );
}
