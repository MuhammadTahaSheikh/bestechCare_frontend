import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { getLoginPath, getRegisterPath } from '../utils/authRedirect';

export default function Cart() {
  const { items, updateQuantity, removeItem, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const loginPath = getLoginPath('/cart');
  const registerPath = getRegisterPath('/cart');
  const [form, setForm] = useState({ shipping_address: '', phone: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleCheckout = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const result = await api.placeOrder({
        items: items.map((i) => ({ medicine_id: i.id, quantity: i.quantity })),
        ...form,
      });
      clearCart();
      if (result.payment_required) {
        navigate(`/payment?type=order&id=${result.order_id}`);
        return;
      }
      setMessage('Order placed successfully!');
      setTimeout(() => navigate('/orders'), 1500);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && !message) {
    return (
      <div className="page">
        <div className="container empty-state">
          <h2>Your cart is empty</h2>
          <Link to="/medicines" className="btn btn-primary">Browse Medicines</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <h1 className="page-header">Shopping Cart</h1>

        <div className="cart-layout">
          <div className="cart-items">
            {items.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="medicine-icon">💊</div>
                <div className="cart-item-info">
                  <h3>{item.name}</h3>
                  <p className="price">Rs. {Number(item.discounted_price || item.price).toLocaleString()}</p>
                </div>
                <div className="cart-item-qty">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                </div>
                <button className="cart-remove" onClick={() => removeItem(item.id)}>×</button>
              </div>
            ))}
          </div>

          <div className="cart-checkout">
            <h3>Order Summary</h3>
            <div className="cart-total">
              <span>Total</span>
              <strong>Rs. {total.toLocaleString()}</strong>
            </div>

            {message ? (
              <p className={`message ${message.includes('success') ? 'success' : 'error'}`}>{message}</p>
            ) : !user ? (
              <div className="booking-login-gate">
                <p className="text-muted">Sign in to enter delivery details and place your order.</p>
                <Link to={loginPath} className="btn btn-primary btn-block">
                  Login to Place Order
                </Link>
                <p className="auth-footer">
                  New here? <Link to={registerPath}>Create an account</Link>
                </p>
              </div>
            ) : (
              <form onSubmit={handleCheckout}>
                <div className="form-group">
                  <label>Delivery Address</label>
                  <textarea
                    required
                    rows={3}
                    value={form.shipping_address}
                    onChange={(e) => setForm({ ...form, shipping_address: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Notes (optional)</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                  {loading ? 'Placing Order...' : 'Place Order'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
