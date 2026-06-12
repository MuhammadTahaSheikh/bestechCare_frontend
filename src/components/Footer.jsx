import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <h4>Contact Us</h4>
          <p>375 Airline Housing Society, Lahore</p>
          <p>hello@bestechcare.pk</p>
          <p>0311-4315611</p>
          <p className="text-muted">9 AM to 11 PM (7 Days a week)</p>
        </div>
        <div>
          <h4>Company</h4>
          <Link to="/about">About Us</Link>
          <Link to="/blog">Blog</Link>
          <Link to="/terms">Terms & Conditions</Link>
        </div>
        <div>
          <h4>Useful Links</h4>
          <Link to="/doctors">Doctors</Link>
          <Link to="/hospitals">Hospitals</Link>
          <Link to="/labs">Lab Tests</Link>
          <Link to="/deals">Deals & Discounts</Link>
        </div>
        <div>
          <h4>For Doctors</h4>
          <Link to="/register?role=doctor">Join as a Doctor</Link>
          <Link to="/register?role=hospital">Join as a Hospital</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">
          <p>© 2018-2026 BestechCare | All Rights Reserved</p>
        </div>
      </div>
    </footer>
  );
}
