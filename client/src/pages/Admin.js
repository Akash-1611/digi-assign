import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import './Admin.css';

const Admin = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('menu');
  const [menu, setMenu] = useState([]);
  const [report, setReport] = useState(null);
  const [kotLogs, setKotLogs] = useState([]);
  const [toast, setToast] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }

    loadMenu();
    loadReport();
    loadKOTLogs();
  }, []);

  const loadMenu = async () => {
    try {
      const data = await api.getAllMenu();
      setMenu(data);
    } catch (error) {
      showToast('Failed to load menu', 'error');
    }
  };

  const loadReport = async () => {
    try {
      const data = await api.getDailyReport();
      setReport(data);
    } catch (error) {
      showToast('Failed to load report', 'error');
    }
  };

  const loadKOTLogs = async () => {
    try {
      const data = await api.getKOTLogs();
      setKotLogs(data);
    } catch (error) {
      console.error('Failed to load KOT logs:', error);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.category || !formData.price) {
      showToast('Please fill all fields', 'error');
      return;
    }

    try {
      if (editingItem) {
        const response = await api.updateMenuItem(editingItem.id, formData);
        if (response.success) {
          showToast('Menu item updated successfully', 'success');
          loadMenu();
          closeModal();
        }
      } else {
        const response = await api.addMenuItem(formData);
        if (response.success) {
          showToast('Menu item added successfully', 'success');
          loadMenu();
          closeModal();
        }
      }
    } catch (error) {
      showToast('Failed to save menu item', 'error');
    }
  };

  const toggleItemStatus = async (item) => {
    try {
      const response = await api.updateMenuItem(item.id, { enabled: !item.enabled });
      if (response.success) {
        showToast(`${item.name} ${!item.enabled ? 'enabled' : 'disabled'}`, 'success');
        loadMenu();
      }
    } catch (error) {
      showToast('Failed to update item status', 'error');
    }
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price
    });
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingItem(null);
    setFormData({ name: '', category: '', price: '' });
  };

  const exportReport = () => {
    if (!report) return;

    const csvContent = [
      ['Daily Sales Report', report.date],
      [],
      ['Metric', 'Value'],
      ['Total Revenue', `₹${report.totalRevenue}`],
      ['Total Orders', report.totalOrders],
      ['Total Items Sold', report.totalItems],
      ['Average Order Value', `₹${report.avgOrderValue}`],
      [],
      ['Item Sales'],
      ['Item Name', 'Quantity', 'Revenue'],
      ...report.itemSales.map((item) => [item.name, item.quantity, `₹${item.revenue}`])
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${report.date}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast('Report exported successfully', 'success');
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const logout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const categories = [...new Set(menu.map((item) => item.category))];

  return (
    <div className="admin-page">
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' && '✓ '}
          {toast.type === 'error' && '✕ '}
          {toast.type === 'info' && 'ℹ '}
          {toast.message}
        </div>
      )}

      <header className="admin-header">
        <div className="header-left">
          <h1>⚙️ Admin Panel</h1>
          <span className="user-badge">{user?.name}</span>
        </div>
        <button onClick={logout} className="btn btn-secondary btn-sm">
          Logout
        </button>
      </header>

      <div className="admin-container">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'menu' ? 'active' : ''}`}
            onClick={() => setActiveTab('menu')}
          >
            <span className="tab-icon">📋</span>
            <span>Menu Management</span>
          </button>
          <button
            className={`tab ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <span className="tab-icon">📊</span>
            <span>Daily Reports</span>
          </button>
          <button
            className={`tab ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            <span className="tab-icon">📝</span>
            <span>KOT Logs</span>
          </button>
        </div>

        {activeTab === 'menu' && (
          <div className="tab-content fade-in">
            <div className="content-header">
              <h2>Menu Items</h2>
              <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
                + Add Item
              </button>
            </div>

            <div className="menu-categories">
              {categories.map((category) => (
                <div key={category} className="category-section">
                  <h3 className="category-title">{category}</h3>
                  <div className="menu-items-grid">
                    {menu
                      .filter((item) => item.category === category)
                      .map((item) => (
                        <div key={item.id} className={`menu-item-card ${!item.enabled ? 'disabled' : ''}`}>
                          <div className="item-header">
                            <h4>{item.name}</h4>
                            <div className="item-actions">
                              <button
                                onClick={() => openEditModal(item)}
                                className="icon-btn"
                                title="Edit"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => toggleItemStatus(item)}
                                className={`icon-btn ${item.enabled ? 'enabled' : 'disabled'}`}
                                title={item.enabled ? 'Disable' : 'Enable'}
                              >
                                {item.enabled ? '👁️' : '🚫'}
                              </button>
                            </div>
                          </div>
                          <div className="item-price">₹{item.price}</div>
                          <div className="item-status">
                            {item.enabled ? (
                              <span className="badge badge-success">Active</span>
                            ) : (
                              <span className="badge badge-danger">Disabled</span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reports' && report && (
          <div className="tab-content fade-in">
            <div className="content-header">
              <h2>Daily Sales Report - {report.date}</h2>
              <button onClick={exportReport} className="btn btn-success">
                📥 Export CSV
              </button>
            </div>

            <div className="stats-grid">
              <div className="stat-card primary">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <div className="stat-label">Total Revenue</div>
                  <div className="stat-value">₹{report.totalRevenue}</div>
                </div>
              </div>
              <div className="stat-card success">
                <div className="stat-icon">🎫</div>
                <div className="stat-content">
                  <div className="stat-label">Total Orders</div>
                  <div className="stat-value">{report.totalOrders}</div>
                </div>
              </div>
              <div className="stat-card info">
                <div className="stat-icon">🍽️</div>
                <div className="stat-content">
                  <div className="stat-label">Items Sold</div>
                  <div className="stat-value">{report.totalItems}</div>
                </div>
              </div>
              <div className="stat-card warning">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <div className="stat-label">Avg Order Value</div>
                  <div className="stat-value">₹{report.avgOrderValue}</div>
                </div>
              </div>
            </div>

            <div className="report-section">
              <h3>Top Selling Items</h3>
              <div className="items-table">
                <table>
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>Quantity Sold</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.itemSales.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <strong>{item.name}</strong>
                        </td>
                        <td>{item.quantity}</td>
                        <td className="revenue">₹{item.revenue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="tab-content fade-in">
            <div className="content-header">
              <h2>KOT Performance Logs</h2>
              <button onClick={loadKOTLogs} className="btn btn-secondary">
                🔄 Refresh
              </button>
            </div>

            <div className="logs-table">
              <table>
                <thead>
                  <tr>
                    <th>Log ID</th>
                    <th>Order ID</th>
                    <th>Type</th>
                    <th>Timestamp</th>
                    <th>Latency</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {kotLogs.slice().reverse().map((log) => (
                    <tr key={log.id}>
                      <td>#{log.id}</td>
                      <td>
                        <strong>#{log.orderId}</strong>
                      </td>
                      <td>{log.type}</td>
                      <td>{new Date(log.timestamp).toLocaleString()}</td>
                      <td>
                        <span className={`latency ${log.latency < 300 ? 'fast' : 'slow'}`}>
                          {log.latency}ms
                        </span>
                      </td>
                      <td>
                        {log.success ? (
                          <span className="badge badge-success">✓ Success</span>
                        ) : (
                          <span className="badge badge-danger">✕ Failed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="performance-summary">
              <div className="summary-card">
                <h4>Average Latency</h4>
                <div className="summary-value">
                  {kotLogs.length > 0
                    ? Math.round(
                        kotLogs.reduce((sum, log) => sum + log.latency, 0) / kotLogs.length
                      )
                    : 0}
                  ms
                </div>
              </div>
              <div className="summary-card">
                <h4>Total KOTs</h4>
                <div className="summary-value">{kotLogs.length}</div>
              </div>
              <div className="summary-card">
                <h4>Success Rate</h4>
                <div className="summary-value">
                  {kotLogs.length > 0
                    ? Math.round((kotLogs.filter((log) => log.success).length / kotLogs.length) * 100)
                    : 0}
                  %
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h2>
              <button onClick={closeModal} className="close-btn">
                ✕
              </button>
            </div>
            <form onSubmit={handleAddItem} className="modal-form">
              <div className="form-group">
                <label>Item Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Butter Chicken"
                  required
                />
              </div>
              <div className="form-group">
                <label>Category *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Main Course"
                  list="categories"
                  required
                />
                <datalist id="categories">
                  {categories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
              <div className="form-group">
                <label>Price (₹) *</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="e.g., 350"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'Update' : 'Add'} Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;

