import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { initSocket } from '../utils/socket';
import './POS.css';

const POS = () => {
  const [user, setUser] = useState(null);
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('dine-in');
  const [tableNumber, setTableNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [orders, setOrders] = useState([]);
  const [toast, setToast] = useState(null);
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }

    loadMenu();
    loadOrders();

    const socketInstance = initSocket();
    setSocket(socketInstance);

    socketInstance.on('order_status_update', (data) => {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === data.orderId ? { ...order, status: data.status } : order
        )
      );
      showToast(`Order #${data.orderId} status updated to ${data.status}`, 'info');
    });

    return () => {
      if (socketInstance) {
        socketInstance.off('order_status_update');
      }
    };
  }, []);

  const loadMenu = async () => {
    try {
      const data = await api.getMenu();
      setMenu(data);
      const cats = ['All', ...new Set(data.map((item) => item.category))];
      setCategories(cats);
    } catch (error) {
      showToast('Failed to load menu', 'error');
    }
  };

  const loadOrders = async () => {
    try {
      const data = await api.getOrders();
      setOrders(data.filter((o) => o.status !== 'completed').slice(-10));
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  const filteredMenu =
    selectedCategory === 'All'
      ? menu
      : menu.filter((item) => item.category === selectedCategory);

  const addToCart = (item) => {
    const existingItem = cart.find((i) => i.id === item.id);
    if (existingItem) {
      setCart(
        cart.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    showToast(`${item.name} added to cart`, 'success');
  };

  const updateQuantity = (itemId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId) {
            const newQuantity = item.quantity + delta;
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter((item) => item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setNotes('');
  };

  const sendToKitchen = async () => {
    if (cart.length === 0) {
      showToast('Cart is empty', 'error');
      return;
    }

    if (orderType === 'dine-in' && !tableNumber) {
      showToast('Please enter table number', 'error');
      return;
    }

    try {
      const order = {
        tableNumber: orderType === 'dine-in' ? tableNumber : 'Takeaway',
        orderType,
        items: cart,
        notes,
        cashierId: user.id
      };

      const response = await api.createOrder(order);
      if (response.success) {
        showToast(
          `Order #${response.order.id} sent! (${response.latency}ms)`,
          'success'
        );
        setOrders([response.order, ...orders]);
        clearCart();
        setTableNumber('');
      }
    } catch (error) {
      showToast('Failed to create order', 'error');
    }
  };

  const generateBill = async (orderId) => {
    try {
      const response = await api.generateBill(orderId);
      if (response.success) {
        showToast('Bill generated successfully', 'success');
        loadOrders();
        // In a real app, this would open a print dialog or generate PDF
        printBill(response.bill);
      }
    } catch (error) {
      showToast('Failed to generate bill', 'error');
    }
  };

  const printBill = (bill) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Bill #${bill.id}</title>
          <style>
            body { font-family: monospace; padding: 20px; max-width: 400px; }
            h2 { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
            table { width: 100%; margin: 20px 0; }
            td { padding: 5px; }
            .right { text-align: right; }
            .total { border-top: 2px solid #000; font-weight: bold; font-size: 18px; }
            .header { text-align: center; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>RESTAURANT POS</h2>
            <p>Bill #${bill.id}</p>
            <p>${new Date(bill.timestamp).toLocaleString()}</p>
            <p>Table: ${bill.tableNumber} | Type: ${bill.orderType}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th class="right">Price</th>
                <th class="right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${bill.items
                .map(
                  (item) => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td class="right">₹${item.price}</td>
                  <td class="right">₹${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
          <table>
            <tr>
              <td>Subtotal:</td>
              <td class="right">₹${bill.subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Tax (5%):</td>
              <td class="right">₹${bill.tax.toFixed(2)}</td>
            </tr>
            <tr class="total">
              <td>TOTAL:</td>
              <td class="right">₹${bill.total.toFixed(2)}</td>
            </tr>
          </table>
          <p style="text-align: center; margin-top: 30px;">Thank you for dining with us!</p>
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

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="pos-page">
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' && '✓ '}
          {toast.type === 'error' && '✕ '}
          {toast.type === 'info' && 'ℹ '}
          {toast.message}
        </div>
      )}

      <header className="pos-header">
        <div className="header-left">
          <h1>🍽️ POS System</h1>
          <span className="user-badge">👤 {user?.name}</span>
        </div>
        <button onClick={logout} className="btn btn-secondary btn-sm">
          Logout
        </button>
      </header>

      <div className="pos-container">
        <div className="menu-section">
          <div className="order-controls">
            <div className="order-type-toggle">
              <button
                className={`toggle-btn ${orderType === 'dine-in' ? 'active' : ''}`}
                onClick={() => setOrderType('dine-in')}
              >
                🏪 Dine-in
              </button>
              <button
                className={`toggle-btn ${orderType === 'takeaway' ? 'active' : ''}`}
                onClick={() => setOrderType('takeaway')}
              >
                📦 Takeaway
              </button>
            </div>
            {orderType === 'dine-in' && (
              <input
                type="text"
                className="form-control"
                placeholder="Table Number"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
              />
            )}
          </div>

          <div className="category-tabs">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`category-tab ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="menu-grid">
            {filteredMenu.map((item) => (
              <div key={item.id} className="menu-item" onClick={() => addToCart(item)}>
                <div className="item-name">{item.name}</div>
                <div className="item-category">{item.category}</div>
                <div className="item-price">₹{item.price}</div>
                <div className="add-btn">+</div>
              </div>
            ))}
          </div>
        </div>

        <div className="cart-section">
          <div className="cart-header">
            <h2>Current Order</h2>
            {cart.length > 0 && (
              <button onClick={clearCart} className="btn btn-danger btn-sm">
                Clear
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="empty-cart">
              <div className="empty-icon">🛒</div>
              <p>Cart is empty</p>
              <span>Add items from menu</span>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {cart.map((item) => (
                  <div key={item.id} className="cart-item">
                    <div className="item-info">
                      <div className="item-name">{item.name}</div>
                      <div className="item-price">₹{item.price}</div>
                    </div>
                    <div className="item-controls">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="qty-btn"
                      >
                        −
                      </button>
                      <span className="qty">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="qty-btn"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="remove-btn"
                      >
                        🗑️
                      </button>
                    </div>
                    <div className="item-total">₹{(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                ))}
              </div>

              <div className="cart-notes">
                <textarea
                  className="form-control"
                  placeholder="Add order notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="2"
                />
              </div>

              <div className="cart-total">
                <span>Total:</span>
                <span className="total-amount">₹{cartTotal.toFixed(2)}</span>
              </div>

              <button onClick={sendToKitchen} className="btn btn-primary btn-lg send-btn">
                📤 Send to Kitchen
              </button>
            </>
          )}

          <div className="recent-orders">
            <h3>Recent Orders</h3>
            <div className="orders-list">
              {orders.map((order) => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <span className="order-id">#{order.id}</span>
                    <span className={`badge badge-${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="order-info">
                    <span>🏪 {order.tableNumber}</span>
                    <span>{order.items.length} items</span>
                  </div>
                  {order.status === 'ready' && (
                    <button
                      onClick={() => generateBill(order.id)}
                      className="btn btn-success btn-sm"
                      style={{ marginTop: '10px', width: '100%' }}
                    >
                      Generate Bill
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const getStatusColor = (status) => {
  const colors = {
    pending: 'warning',
    preparing: 'info',
    ready: 'success',
    completed: 'primary'
  };
  return colors[status] || 'primary';
};

export default POS;

