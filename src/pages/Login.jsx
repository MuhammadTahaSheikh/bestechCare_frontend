import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { GOOGLE_CLIENT_ID } from '../config';
import { getRedirectFromSearch, getRegisterPath } from '../utils/authRedirect';

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = getRedirectFromSearch(searchParams);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setUnverifiedEmail('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate(redirectTo);
    } catch (err) {
      if (err.code === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(err.email || form.email);
        setError(err.message);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const email = unverifiedEmail || form.email;
    if (!email) return;
    setResendLoading(true);
    setInfo('');
    try {
      const data = await api.resendVerification({ email });
      setInfo(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setResendLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setInfo('');
    setUnverifiedEmail('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle(credentialResponse.credential);
      navigate(redirectTo);
    } catch (err) {
      setError(err.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google sign-in was cancelled or failed. Please try again.');
  };

  return (
    <div className="page auth-page">
      <div className="auth-card">
        <h1>Login to BestechCare</h1>
        <p className="text-muted">Access your appointments and health records</p>

        {GOOGLE_CLIENT_ID && (
          <>
            <GoogleSignInButton
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              disabled={googleLoading || loading}
            />
            <div className="auth-divider">
              <span>or</span>
            </div>
          </>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          {error && <p className="message error">{error}</p>}
          {info && <p className="message success">{info}</p>}
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {unverifiedEmail && (
          <button
            type="button"
            className="btn btn-block"
            style={{ marginTop: '0.75rem' }}
            onClick={handleResend}
            disabled={resendLoading}
          >
            {resendLoading ? 'Sending...' : 'Resend verification email'}
          </button>
        )}

        <p className="auth-footer">
          Don't have an account? <Link to={getRegisterPath(searchParams.get('redirect'))}>Register</Link>
        </p>
      </div>
    </div>
  );
}
