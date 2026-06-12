import { useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';

export default function CheckEmail() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const email = location.state?.email || searchParams.get('email') || '';
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResend = async () => {
    if (!email) {
      setError('Email address is missing. Please register again.');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const data = await api.resendVerification({ email });
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page auth-page">
      <div className="auth-card">
        <h1>Check your email</h1>
        <p className="text-muted">
          We sent a verification link to{' '}
          {email ? <strong>{email}</strong> : 'your email address'}.
          Click the link to activate your account.
        </p>

        {message && <p className="message success">{message}</p>}
        {error && <p className="message error">{error}</p>}

        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={handleResend}
          disabled={loading || !email}
        >
          {loading ? 'Sending...' : 'Resend verification email'}
        </button>

        <p className="auth-footer">
          <Link to="/login">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
