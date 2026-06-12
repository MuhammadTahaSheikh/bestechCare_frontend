import { Link } from 'react-router-dom';

const services = [
  { icon: '👨‍⚕️', title: 'Find Doctors', desc: 'Search by specialty, city, and read patient reviews to book the right doctor.', link: '/doctors' },
  { icon: '💻', title: 'Online Consultation', desc: 'Consult doctors via video call from the comfort of your home.', link: '/doctors?online=true' },
  { icon: '🏥', title: 'Hospitals', desc: 'Discover top-rated hospitals near you with verified listings.', link: '/hospitals' },
  { icon: '🔬', title: 'Lab Tests', desc: 'Browse lab tests with discounted pricing from trusted laboratories.', link: '/labs' },
  { icon: '💊', title: 'Order Medicines', desc: 'Buy medicines online with home delivery across Pakistan.', link: '/medicines' },
  { icon: '🎁', title: 'Deals & Discounts', desc: 'Save on lab tests, consultations, and healthcare services.', link: '/deals' },
];

const stats = [
  { value: '20,000+', label: 'Doctors Onboard' },
  { value: '100+', label: 'Specialties' },
  { value: '50+', label: 'Cities Covered' },
  { value: '24/7', label: 'Support Available' },
];

export default function About() {
  return (
    <div className="page">
      <section className="about-hero">
        <div className="container">
          <h1>About BestechCare</h1>
          <p className="about-lead">
            Pakistan&apos;s trusted digital healthcare platform — helping you find the best doctors,
            book appointments, order medicines, and access quality care online.
          </p>
        </div>
      </section>

      <div className="container">
        <section className="content-section">
          <h2>Who We Are</h2>
          <p>
            BestechCare provides complete access to healthcare information and services across Pakistan.
            You can book appointments, consult doctors online, find hospitals and labs, and order
            medicines — all from one platform.
          </p>
          <p>
            Our mission is to make healthcare efficient, accessible, and reliable for every Pakistani.
            Whether you need a specialist in Lahore, a lab test in Karachi, or an online consultation
            from home, BestechCare connects you to verified healthcare providers.
          </p>
        </section>

        <section className="content-section">
          <h2>Our Services</h2>
          <div className="about-services-grid">
            {services.map((s) => (
              <Link key={s.title} to={s.link} className="about-service-card">
                <span className="about-service-icon">{s.icon}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="content-section stats-banner">
          <h2>BestechCare at a Glance</h2>
          <div className="about-stats-grid">
            {stats.map((s) => (
              <div key={s.label} className="about-stat">
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="content-section">
          <h2>Why Choose BestechCare?</h2>
          <ul className="content-list">
            <li>Verified doctors and hospitals with real patient reviews</li>
            <li>Book in-clinic or online video consultations</li>
            <li>Secure payments via JazzCash and EasyPaisa</li>
            <li>Discounted lab tests and medicine delivery</li>
            <li>Dedicated helpline: <a href="tel:03114315611">0311-4315611</a> (9 AM – 11 PM, 7 days)</li>
          </ul>
        </section>

        <section className="content-section contact-box">
          <h2>Contact Us</h2>
          <p><strong>Head Office:</strong> 375 Airline Housing Society, Lahore</p>
          <p><strong>Email:</strong> <a href="mailto:hello@bestechcare.pk">hello@bestechcare.pk</a></p>
          <p><strong>Phone:</strong> <a href="tel:03114315611">0311-4315611</a></p>
          <p className="text-muted">Call center timings: 9 AM to 11 PM (7 days a week)</p>
          <div className="about-cta">
            <Link to="/doctors" className="btn btn-primary">Find a Doctor</Link>
            <Link to="/register?role=doctor" className="btn btn-outline">Join as a Doctor</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
