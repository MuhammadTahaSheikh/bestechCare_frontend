import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';

export default function Payment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const type = searchParams.get('type');
  const id = searchParams.get('id');

  const [preview, setPreview] = useState(null);
  const [step, setStep] = useState('method');
  const [method, setMethod] = useState('jazzcash');
  const [phone, setPhone] = useState('');
  const [cnic, setCnic] = useState('');
  const [otp, setOtp] = useState('');
  const [paymentId, setPaymentId] = useState(null);
  const [paymentMode, setPaymentMode] = useState('demo');
  const [demoOtp, setDemoOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const requiresCnic = method === 'jazzcash';

  useEffect(() => {
    if (!type || !id) return;
    api.getPaymentPreview(type, id)
      .then((data) => {
        setPreview(data);
        if (data.payment_status === 'paid') setStep('done');
      })
      .catch((err) => setError(err.message));
  }, [type, id]);

  const handleInitiate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await api.initiatePayment({
        type,
        reference_id: Number(id),
        method,
        phone,
        cnic: method === 'jazzcash' ? cnic : undefined,
      });

      if (result.completed) {
        setStep('done');
        setTimeout(() => {
          navigate(result.reference_type === 'appointment' ? '/appointments' : '/orders');
        }, 2000);
        return;
      }

      setPaymentId(result.payment_id);
      setPaymentMode(result.mode || 'demo');
      setDemoOtp(result.demo_otp || '');
      setStep('otp');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await api.verifyPayment({ payment_id: paymentId, otp });
      setStep('done');
      setTimeout(() => {
        if (result.reference_type === 'appointment') {
          navigate('/appointments');
        } else {
          navigate('/orders');
        }
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!type || !id) {
    return (
      <div className="page empty-state">
        <p>Invalid payment link.</p>
        <Link to="/" className="btn btn-primary">Go Home</Link>
      </div>
    );
  }

  if (!preview && !error) return <div className="loading page">Loading payment...</div>;

  return (
    <div className="page">
      <div className="container">
        <div className="payment-card">
          <h1>Complete Payment</h1>

          {preview && (
            <div className="payment-summary">
              <p><strong>{preview.title}</strong></p>
              <p className="payment-amount">Rs. {Number(preview.amount).toLocaleString()}</p>
              {preview.jazzcash_live && (
                <p className="text-muted">JazzCash live payments enabled</p>
              )}
            </div>
          )}

          {step === 'method' && preview?.payment_status !== 'paid' && (
            <form onSubmit={handleInitiate}>
              <h3>Select Payment Method</h3>
              <div className="payment-methods">
                <label className={`payment-method ${method === 'jazzcash' ? 'active' : ''}`}>
                  <input type="radio" name="method" value="jazzcash" checked={method === 'jazzcash'} onChange={() => setMethod('jazzcash')} />
                  <span className="payment-logo">📱 JazzCash</span>
                </label>
                <label className={`payment-method ${method === 'easypaisa' ? 'active' : ''}`}>
                  <input type="radio" name="method" value="easypaisa" checked={method === 'easypaisa'} onChange={() => setMethod('easypaisa')} />
                  <span className="payment-logo">💚 EasyPaisa</span>
                </label>
              </div>
              <div className="form-group">
                <label>Mobile Wallet Number</label>
                <input
                  type="tel"
                  required
                  placeholder="03XX-XXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              {requiresCnic && (
                <div className="form-group">
                  <label>CNIC (last 6 digits)</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    pattern="[0-9]{6}"
                    placeholder="345678"
                    value={cnic}
                    onChange={(e) => setCnic(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                  <p className="text-muted">Sandbox test: use CNIC <strong>345678</strong></p>
                </div>
              )}
              {error && <p className="message error">{error}</p>}
              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? 'Sending OTP...' : 'Pay Now'}
              </button>
              {method === 'jazzcash' && preview?.jazzcash_live && (
                <p className="text-muted mt-2">OTP will be sent to your JazzCash number via SMS.</p>
              )}
              {method === 'jazzcash' && !preview?.jazzcash_live && (
                <p className="text-muted mt-2">Demo mode: OTP will be emailed to your account.</p>
              )}
              {method === 'easypaisa' && (
                <p className="text-muted mt-2">OTP will be emailed to your registered account.</p>
              )}
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerify}>
              <h3>Enter OTP</h3>
              <p className="text-muted">
                {paymentMode === 'jazzcash'
                  ? `An OTP has been sent to ${phone} via JazzCash SMS.`
                  : `An OTP has been sent to ${phone}`}
              </p>
              {demoOtp && <p className="demo-otp">Demo OTP: <strong>{demoOtp}</strong></p>}
              <div className="form-group">
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>
              {error && <p className="message error">{error}</p>}
              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify & Pay'}
              </button>
              <button type="button" className="btn btn-outline btn-block mt-2" onClick={() => setStep('method')}>
                Change Method
              </button>
            </form>
          )}

          {step === 'done' && (
            <div className="payment-success">
              <div className="success-icon">✓</div>
              <h3>Payment Successful!</h3>
              <p className="text-muted">Redirecting you shortly...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
