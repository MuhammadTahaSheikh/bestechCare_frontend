import { API_URL } from '../config.js';

const API_BASE = API_URL ? `${API_URL}/api` : '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    const err = new Error(data.error || 'Something went wrong');
    err.code = data.code;
    err.email = data.email;
    throw err;
  }
  return data;
}

export const api = {
  // Auth
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  googleLogin: (body) => request('/auth/google', { method: 'POST', body: JSON.stringify(body) }),
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  verifyEmail: (token) => request(`/auth/verify-email?token=${encodeURIComponent(token)}`),
  resendVerification: (body) =>
    request('/auth/resend-verification', { method: 'POST', body: JSON.stringify(body) }),
  getProfile: () => request('/auth/profile'),

  // Data
  getSpecialties: () => request('/specialties'),
  getCities: () => request('/cities'),
  getDoctors: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/doctors${query ? `?${query}` : ''}`);
  },
  getDoctor: (id) => request(`/doctors/${id}`),
  getDoctorAvailability: () => request('/doctor/availability'),
  setDoctorAvailability: (is_online) =>
    request('/doctor/availability', { method: 'PATCH', body: JSON.stringify({ is_online }) }),
  getDoctorAvailableSlots: (doctorId, date) =>
    request(`/doctors/${doctorId}/available-slots?date=${encodeURIComponent(date)}`),
  getHospitals: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/hospitals${query ? `?${query}` : ''}`);
  },
  getHospital: (id) => request(`/hospitals/${id}`),
  getLabs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/labs${query ? `?${query}` : ''}`);
  },
  getLab: (id) => request(`/labs/${id}`),
  getLabTests: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/lab-tests${query ? `?${query}` : ''}`);
  },
  getDeals: () => request('/deals'),
  getBlogPosts: () => request('/blog'),

  // Reviews
  getDoctorReviews: (doctorId) => request(`/doctors/${doctorId}/reviews`),
  submitReview: (body) => request('/reviews', { method: 'POST', body: JSON.stringify(body) }),

  // Medicines
  getMedicineCategories: () => request('/medicine-categories'),
  getMedicines: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/medicines${query ? `?${query}` : ''}`);
  },
  getMedicine: (id) => request(`/medicines/${id}`),
  placeOrder: (body) => request('/orders', { method: 'POST', body: JSON.stringify(body) }),
  getMyOrders: () => request('/orders/my'),

  // Appointments
  bookAppointment: (body) => request('/appointments', { method: 'POST', body: JSON.stringify(body) }),
  getMyAppointments: () => request('/appointments/my'),
  cancelAppointment: (id) => request(`/appointments/${id}/cancel`, { method: 'PATCH' }),

  // Payments
  getPaymentPreview: (type, id) => request(`/payments/preview?type=${type}&id=${id}`),
  initiatePayment: (body) => request('/payments/initiate', { method: 'POST', body: JSON.stringify(body) }),
  verifyPayment: (body) => request('/payments/verify', { method: 'POST', body: JSON.stringify(body) }),

  // Video Consultation
  getConsultationRoom: (id) => request(`/consultation/${id}`),
  getDoctorConsultations: () => request('/consultation/doctor/my'),

  // User summaries
  getMySummary: () => request('/summary/my'),

  // AI Doctor
  getAiDoctorStatus: () => request('/ai-doctor/status'),
  createAiDoctorSession: (city, prefs = {}) =>
    request('/ai-doctor/sessions', {
      method: 'POST',
      body: JSON.stringify({
        city,
        doctor_gender: prefs.doctorGender || 'male',
        preferred_language: prefs.preferredLanguage || 'en',
        roman_urdu: Boolean(prefs.romanUrdu),
      }),
    }),
  getAiDoctorSession: (id) => request(`/ai-doctor/sessions/${id}`),
  sendAiDoctorMessage: (id, message) =>
    request(`/ai-doctor/sessions/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
  completeAiDoctorSession: (id) =>
    request(`/ai-doctor/sessions/${id}/complete`, { method: 'POST', body: JSON.stringify({}) }),
  downloadAiDoctorPdf: async (id) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/ai-doctor/sessions/${id}/pdf`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to download PDF');
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bestechcare-ai-consultation-${id.slice(0, 8)}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // Admin
  adminGetStats: () => request('/admin/stats'),
  adminGetSummaries: () => request('/admin/summaries'),
  adminGetAppointments: () => request('/admin/appointments'),
  adminUpdateAppointmentStatus: (id, status) =>
    request(`/admin/appointments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  adminGetDoctors: () => request('/admin/doctors'),
  adminCreateDoctor: (body) =>
    request('/admin/doctors', { method: 'POST', body: JSON.stringify(body) }),
  adminVerifyDoctor: (id, is_verified) =>
    request(`/admin/doctors/${id}/verify`, { method: 'PATCH', body: JSON.stringify({ is_verified }) }),
  adminGetHospitals: () => request('/admin/hospitals'),
  adminCreateHospital: (body) =>
    request('/admin/hospitals', { method: 'POST', body: JSON.stringify(body) }),
  adminVerifyHospital: (id, is_verified) =>
    request(`/admin/hospitals/${id}/verify`, { method: 'PATCH', body: JSON.stringify({ is_verified }) }),
  adminGetLabs: () => request('/admin/labs'),
  adminCreateLab: (body) =>
    request('/admin/labs', { method: 'POST', body: JSON.stringify(body) }),
  adminGetLabTests: () => request('/admin/lab-tests'),
  adminCreateLabTest: (body) =>
    request('/admin/lab-tests', { method: 'POST', body: JSON.stringify(body) }),
  adminGetOrders: () => request('/admin/orders'),
  adminUpdateOrderStatus: (id, status) =>
    request(`/admin/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  adminCreateMedicine: (body) =>
    request('/admin/medicines', { method: 'POST', body: JSON.stringify(body) }),
  adminUpdateMedicine: (id, body) =>
    request(`/admin/medicines/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  adminDeleteMedicine: (id) => request(`/admin/medicines/${id}`, { method: 'DELETE' }),
};
