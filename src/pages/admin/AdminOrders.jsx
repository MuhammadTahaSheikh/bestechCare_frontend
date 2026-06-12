import { useEffect, useState } from 'react';
import { api } from '../../api/client';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.adminGetOrders().then(setOrders).catch(console.error);
  }, []);

  const updateStatus = async (id, status) => {
    await api.adminUpdateOrderStatus(id, status);
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  const nextStatus = { pending: 'confirmed', confirmed: 'shipped', shipped: 'delivered' };

  return (
    <div>
      <h1 className="admin-title">Medicine Orders</h1>
      <div className="admin-orders-list">
        {orders.map((order) => (
          <div key={order.id} className="admin-order-card">
            <div className="admin-order-header">
              <div>
                <strong>Order #{order.id}</strong>
                <span className="text-muted"> — {order.customer_name}</span>
              </div>
              <div>
                <span className={`status status-${order.status}`}>{order.status}</span>
                <strong className="order-total">Rs. {Number(order.total_amount).toLocaleString()}</strong>
              </div>
            </div>
            <p className="text-muted">{order.shipping_address} · {order.phone}</p>
            <ul className="order-items-list">
              {order.items?.map((item) => (
                <li key={item.id}>{item.medicine_name} × {item.quantity} — Rs. {Number(item.price).toLocaleString()}</li>
              ))}
            </ul>
            {nextStatus[order.status] && (
              <button
                className="btn btn-sm btn-primary"
                onClick={() => updateStatus(order.id, nextStatus[order.status])}
              >
                Mark as {nextStatus[order.status]}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
