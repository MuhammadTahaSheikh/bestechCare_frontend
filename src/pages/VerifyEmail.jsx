import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link.');
      return;
    }

    api.verifyEmail(token)
      .then((data) => {
        setStatus('success');
        setMessage(data.message);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message);
      });
  }, [token]);

  return (
    <div className="page auth-page">
      <div className="auth-card">
        <h1>Email verification</h1>

        {status === 'loading' && <p className="text-muted">Verifying your email...</p>}

        {status === 'success' && (
          <>
            <p className="message success">{message}</p>
            <Link to="/login" className="btn btn-primary btn-block">Go to login</Link>
          </>
        )}

        {status === 'error' && (
          <>
            <p className="message error">{message}</p>
            <Link to="/check-email" className="btn btn-primary btn-block">Resend verification</Link>
            <p className="auth-footer">
              <Link to="/login">Back to login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
