import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useCity } from '../context/CityContext';
import DoctorCard from '../components/DoctorCard';

export default function Home() {
  const { city } = useCity();
  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [deals, setDeals] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getSpecialties().then(setSpecialties).catch(console.error);
    api.getDeals().then(setDeals).catch(console.error);
    api.getBlogPosts().then(setBlogPosts).catch(console.error);
  }, []);

  useEffect(() => {
    api.getDoctors({ city, limit: 6 }).then(setDoctors).catch(console.error);
  }, [city]);

  return (
    <div className="home">
      <section className="hero">
        <div className="container">
          <h1>We Help You Find The Best Doctors And Hospitals In Pakistan</h1>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search doctors, specialties, hospitals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Link to={`/doctors?search=${search}`} className="btn btn-primary">Search</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Choose Our Top Rated Doctors by Speciality</h2>
          <div className="specialty-grid">
            {specialties.slice(0, 8).map((s) => (
              <Link key={s.id} to={`/doctors?specialty=${s.slug}`} className="specialty-card">
                <span className="specialty-icon">🩺</span>
                <span>{s.name}</span>
              </Link>
            ))}
          </div>
          <div className="text-center mt-4">
            <Link to="/doctors" className="btn btn-outline">View All Specialities</Link>
          </div>
        </div>
      </section>

      <section className="section services-section">
        <div className="container">
          <h2 className="section-title">One Stop Solution for Your Health Care Needs</h2>
          <div className="services-grid">
            <Link to="/doctors" className="service-card">
              <div className="service-icon">📅</div>
              <h3>Book Appointment</h3>
              <p>20,000+ doctors onboard</p>
              <span className="service-link">Book Now →</span>
            </Link>
            <Link to="/doctors?online=true" className="service-card">
              <div className="service-icon">💻</div>
              <h3>Consult Doctor Now</h3>
              <p>In-clinic and video consultation</p>
              <span className="service-link">Consult Now →</span>
            </Link>
            <Link to="/hospitals" className="service-card">
              <div className="service-icon">🏥</div>
              <h3>Find Best Hospitals</h3>
              <p>Find best hospitals near you</p>
              <span className="service-link">Find Now →</span>
            </Link>
            <Link to="/labs" className="service-card">
              <div className="service-icon">🔬</div>
              <h3>Book Lab Tests</h3>
              <p>Get up to 20% OFF</p>
              <span className="service-link">Book Now →</span>
            </Link>
            <Link to="/medicines" className="service-card">
              <div className="service-icon">💊</div>
              <h3>Order Medicines</h3>
              <p>Upload prescription & get delivery</p>
              <span className="service-link">Shop Now →</span>
            </Link>
          </div>
        </div>
      </section>

      {deals.length > 0 && (
        <section className="section deals-section">
          <div className="container">
            <h2 className="section-title">Discounts & Offers</h2>
            <div className="deals-grid">
              {deals.map((deal) => (
                <div key={deal.id} className="deal-card">
                  <h3>{deal.title}</h3>
                  <p>{deal.description}</p>
                  <Link to="/labs" className="btn btn-primary btn-sm">Redeem Offer</Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="container">
          <h2 className="section-title">Top Doctors in {city.charAt(0).toUpperCase() + city.slice(1)}</h2>
          <div className="cards-grid">
            {doctors.map((d) => <DoctorCard key={d.id} doctor={d} />)}
          </div>
        </div>
      </section>

      {blogPosts.length > 0 && (
        <section className="section blog-section">
          <div className="container">
            <h2 className="section-title">Latest from our Blog</h2>
            <div className="blog-grid">
              {blogPosts.map((post) => (
                <div key={post.id} className="blog-card">
                  <h3>{post.title}</h3>
                  <p>{post.excerpt}</p>
                  <span className="text-muted">By {post.author}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="cta-section">
        <div className="container">
          <h2>Join BestechCare As A Doctor</h2>
          <p>Reach millions of patients and grow your practice</p>
          <Link to="/register?role=doctor" className="btn btn-white">Signup Now</Link>
        </div>
      </section>
    </div>
  );
}
