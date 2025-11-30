import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { initSocket } from '../utils/socket';
import './Kitchen.css';

const Kitchen = () => {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [toast, setToast] = useState(null);
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }

    loadOrders();

    const socketInstance = initSocket();
    setSocket(socketInstance);

    // Listen for new orders
    socketInstance.on('new_order', (order) => {
      setOrders((prev) => [order, ...prev]);
      showToast(`New Order #${order.id} received!`, 'success');
      playNotificationSound();
    });

    socketInstance.on('item_cancelled', ({ orderId, itemId }) => {
      setOrders((prev) =>
        prev.map((order) => {
          if (order.id === orderId) {
            return {
              ...order,
              items: order.items.map((item) =>
                item.id === itemId ? { ...item, status: 'cancelled' } : item
              )
            };
          }
          return order;
        })
      );
      showToast(`Item cancelled in Order #${orderId}`, 'info');
    });

    return () => {
      if (socketInstance) {
        socketInstance.off('new_order');
        socketInstance.off('item_cancelled');
      }
    };
  }, []);

  const loadOrders = async () => {
    try {
      const data = await api.getOrders();
      setOrders(data.filter((o) => o.status !== 'completed').reverse());
    } catch (error) {
      showToast('Failed to load orders', 'error');
    }
  };

  const playNotificationSound = () => {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const response = await api.updateOrderStatus(orderId, status);
      if (response.success) {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId ? { ...order, status } : order
          )
        );
        showToast(`Order #${orderId} marked as ${status}`, 'success');
      }
    } catch (error) {
      showToast('Failed to update order status', 'error');
    }
  };

  const reprintKOT = (order) => {
    if (socket) {
      socket.emit('reprint_kot', { orderId: order.id });
      showToast(`KOT #${order.id} reprinted`, 'info');
    }
    printKOT(order);
  };

  const printKOT = (order) => {
    const printWindow = window.open('', '_blank');
    const activeItems = order.items.filter((item) => item.status !== 'cancelled');

    printWindow.document.write(`
      <html>
        <head>
          <title>KOT #${order.id}</title>
          <style>
            body { 
              font-family: 'Courier New', monospace; 
              padding: 20px; 
              max-width: 400px; 
              margin: 0 auto;
            }
            h1 { 
              text-align: center; 
              border-bottom: 3px double #000; 
              padding-bottom: 10px;
              font-size: 28px;
              margin-bottom: 20px;
            }
            .header { 
              text-align: center; 
              margin-bottom: 20px;
              font-size: 14px;
            }
            .order-info {
              background: #f0f0f0;
              padding: 10px;
              margin-bottom: 20px;
              border-radius: 5px;
            }
            .order-info div {
              margin: 5px 0;
              font-weight: bold;
            }
            table { 
              width: 100%; 
              margin: 20px 0;
              border-collapse: collapse;
            }
            th {
              border-bottom: 2px solid #000;
              padding: 10px 5px;
              text-align: left;
            }
            td { 
              padding: 8px 5px;
              border-bottom: 1px dashed #ccc;
            }
            .qty {
              text-align: center;
              font-weight: bold;
              font-size: 18px;
            }
            .notes {
              background: #fffacd;
              padding: 10px;
              margin-top: 20px;
              border-left: 4px solid #ffd700;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              border-top: 2px solid #000;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <h1>🍽️ KITCHEN ORDER TICKET</h1>
          <div class="header">
            <div style="font-size: 20px; font-weight: bold;">KOT #${order.id}</div>
            <div>${new Date(order.timestamp).toLocaleString()}</div>
          </div>
          <div class="order-info">
            <div>📍 Table: ${order.tableNumber}</div>
            <div>🔄 Type: ${order.orderType.toUpperCase()}</div>
            <div>👤 Cashier ID: ${order.cashierId}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>ITEM</th>
                <th class="qty">QTY</th>
              </tr>
            </thead>
            <tbody>
              ${activeItems
                .map(
                  (item) => `
                <tr>
                  <td><strong>${item.name}</strong></td>
                  <td class="qty">${item.quantity}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
          ${
            order.notes
              ? `
            <div class="notes">
              <strong>📝 SPECIAL INSTRUCTIONS:</strong><br/>
              ${order.notes}
            </div>
          `
              : ''
          }
          <div class="footer">
            <strong>Total Items: ${activeItems.reduce(
              (sum, item) => sum + item.quantity,
              0
            )}</strong>
          </div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 100);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const logout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const filteredOrders = orders.filter((order) => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  const getStatusCounts = () => {
    return {
      all: orders.length,
      pending: orders.filter((o) => o.status === 'pending').length,
      preparing: orders.filter((o) => o.status === 'preparing').length,
      ready: orders.filter((o) => o.status === 'ready').length
    };
  };

  const counts = getStatusCounts();

  return (
    <div className="kitchen-page">
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' && '✓ '}
          {toast.type === 'error' && '✕ '}
          {toast.type === 'info' && 'ℹ '}
          {toast.message}
        </div>
      )}

      <header className="kitchen-header">
        <div className="header-left">
          <h1>👨‍🍳 Kitchen Display</h1>
          <span className="user-badge">{user?.name}</span>
        </div>
        <button onClick={logout} className="btn btn-secondary btn-sm">
          Logout
        </button>
      </header>

      <div className="kitchen-container">
        <div className="status-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            <span className="filter-label">All Orders</span>
            <span className="filter-count">{counts.all}</span>
          </button>
          <button
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            <span className="filter-label">⏳ Pending</span>
            <span className="filter-count pending">{counts.pending}</span>
          </button>
          <button
            className={`filter-btn ${filter === 'preparing' ? 'active' : ''}`}
            onClick={() => setFilter('preparing')}
          >
            <span className="filter-label">👨‍🍳 Preparing</span>
            <span className="filter-count preparing">{counts.preparing}</span>
          </button>
          <button
            className={`filter-btn ${filter === 'ready' ? 'active' : ''}`}
            onClick={() => setFilter('ready')}
          >
            <span className="filter-label">✅ Ready</span>
            <span className="filter-count ready">{counts.ready}</span>
          </button>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🍳</div>
            <h2>No {filter !== 'all' ? filter : ''} orders</h2>
            <p>Orders will appear here in real-time</p>
          </div>
        ) : (
          <div className="orders-grid">
            {filteredOrders.map((order) => (
              <div key={order.id} className={`kot-card status-${order.status}`}>
                <div className="kot-header">
                  <div className="kot-id">KOT #{order.id}</div>
                  <span className={`badge badge-${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                <div className="kot-info">
                  <div className="info-row">
                    <span>🏪 Table:</span>
                    <strong>{order.tableNumber}</strong>
                  </div>
                  <div className="info-row">
                    <span>🔄 Type:</span>
                    <strong>{order.orderType}</strong>
                  </div>
                  <div className="info-row">
                    <span>⏰ Time:</span>
                    <strong>{new Date(order.timestamp).toLocaleTimeString()}</strong>
                  </div>
                </div>

                <div className="kot-items">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className={`kot-item ${item.status === 'cancelled' ? 'cancelled' : ''}`}
                    >
                      <span className="item-qty">{item.quantity}x</span>
                      <span className="item-name">{item.name}</span>
                      {item.status === 'cancelled' && (
                        <span className="cancelled-badge">Cancelled</span>
                      )}
                    </div>
                  ))}
                </div>

                {order.notes && (
                  <div className="kot-notes">
                    <strong>📝 Notes:</strong> {order.notes}
                  </div>
                )}

                <div className="kot-actions">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      className="btn btn-primary btn-sm"
                    >
                      Start Preparing
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      className="btn btn-success btn-sm"
                    >
                      Mark Ready
                    </button>
                  )}
                  <button
                    onClick={() => reprintKOT(order)}
                    className="btn btn-secondary btn-sm"
                  >
                    🖨️ Reprint
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const getStatusColor = (status) => {
  const colors = {
    pending: 'warning',
    preparing: 'info',
    ready: 'success'
  };
  return colors[status] || 'primary';
};

export default Kitchen;

