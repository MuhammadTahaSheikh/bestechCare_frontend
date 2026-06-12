import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMyOrders()
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading page">Loading...</div>;

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>My Medicine Orders</h1>
        </div>

        {orders.length === 0 ? (
          <div className="empty-state">
            <p>No orders yet.</p>
            <Link to="/medicines" className="btn btn-primary">Shop Medicines</Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <strong>Order #{order.id}</strong>
                  <span className={`status status-${order.status}`}>{order.status}</span>
                </div>
                <p className="text-muted">{new Date(order.created_at).toLocaleString()}</p>
                <ul>
                  {order.items?.map((item) => (
                    <li key={item.id}>{item.medicine_name} × {item.quantity}</li>
                  ))}
                </ul>
                <p className="order-total">Total: Rs. {Number(order.total_amount).toLocaleString()}</p>
                {order.payment_status === 'unpaid' && order.status !== 'cancelled' && (
                  <Link to={`/payment?type=order&id=${order.id}`} className="btn btn-primary btn-sm">
                    Pay Now
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
