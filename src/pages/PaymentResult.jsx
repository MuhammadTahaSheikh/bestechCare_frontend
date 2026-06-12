import { Link, useSearchParams } from 'react-router-dom';

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');
  const message = searchParams.get('message');
  const success = status === 'success';

  return (
    <div className="page">
      <div className="container">
        <div className="payment-card">
          {success ? (
            <div className="payment-success">
              <div className="success-icon">✓</div>
              <h3>Payment Successful!</h3>
              <p className="text-muted">Your JazzCash payment was confirmed.</p>
              <Link to="/appointments" className="btn btn-primary btn-block mt-2">View Appointments</Link>
            </div>
          ) : (
            <div className="empty-state">
              <h3>Payment Failed</h3>
              <p className="text-muted">{message || 'Something went wrong with your payment.'}</p>
              <Link to="/appointments" className="btn btn-primary btn-block mt-2">Back to Appointments</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
