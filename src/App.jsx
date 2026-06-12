import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CityProvider } from './context/CityContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AdminLayout from './components/admin/AdminLayout';
import Home from './pages/Home';
import Doctors from './pages/Doctors';
import DoctorDetail from './pages/DoctorDetail';
import Hospitals from './pages/Hospitals';
import HospitalDetail from './pages/HospitalDetail';
import Labs from './pages/Labs';
import LabDetail from './pages/LabDetail';
import Deals from './pages/Deals';
import Medicines from './pages/Medicines';
import Cart from './pages/Cart';
import MyOrders from './pages/MyOrders';
import Blog from './pages/Blog';
import Login from './pages/Login';
import Register from './pages/Register';
import Appointments from './pages/Appointments';
import Payment from './pages/Payment';
import VideoConsultation from './pages/VideoConsultation';
import DoctorConsultations from './pages/DoctorConsultations';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAppointments from './pages/admin/AdminAppointments';
import AdminDoctors from './pages/admin/AdminDoctors';
import AdminHospitals from './pages/admin/AdminHospitals';
import AdminMedicines from './pages/admin/AdminMedicines';
import AdminOrders from './pages/admin/AdminOrders';

function MainLayout() {
  return (
    <div className="app">
      <Navbar />
      <main><Outlet /></main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CityProvider>
          <CartProvider>
            <Routes>
              <Route path="/consultation/:id" element={
                <ProtectedRoute><VideoConsultation /></ProtectedRoute>
              } />

              <Route path="/admin" element={
                <ProtectedRoute roles={['admin']}><AdminLayout /></ProtectedRoute>
              }>
                <Route index element={<AdminDashboard />} />
                <Route path="appointments" element={<AdminAppointments />} />
                <Route path="doctors" element={<AdminDoctors />} />
                <Route path="hospitals" element={<AdminHospitals />} />
                <Route path="medicines" element={<AdminMedicines />} />
                <Route path="orders" element={<AdminOrders />} />
              </Route>

              <Route element={<MainLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/doctors" element={<Doctors />} />
                <Route path="/doctors/:id" element={<DoctorDetail />} />
                <Route path="/hospitals" element={<Hospitals />} />
                <Route path="/hospitals/:id" element={<HospitalDetail />} />
                <Route path="/labs" element={<Labs />} />
                <Route path="/labs/:id" element={<LabDetail />} />
                <Route path="/deals" element={<Deals />} />
                <Route path="/medicines" element={<Medicines />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/appointments" element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
                <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
                <Route path="/doctor/consultations" element={
                  <ProtectedRoute roles={['doctor']}><DoctorConsultations /></ProtectedRoute>
                } />
              </Route>
            </Routes>
          </CartProvider>
        </CityProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
