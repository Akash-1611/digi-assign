const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export const api = {
  login: async (mobile, pin) => {
    const response = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile, pin })
    });
    return response.json();
  },

  getMenu: async () => {
    const response = await fetch(`${API_URL}/api/menu`);
    return response.json();
  },

  getAllMenu: async () => {
    const response = await fetch(`${API_URL}/api/menu/all`);
    return response.json();
  },

  addMenuItem: async (item) => {
    const response = await fetch(`${API_URL}/api/menu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    return response.json();
  },

  updateMenuItem: async (id, item) => {
    const response = await fetch(`${API_URL}/api/menu/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    return response.json();
  },

  createOrder: async (order) => {
    const response = await fetch(`${API_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    return response.json();
  },

  getOrders: async (status) => {
    const url = status ? `${API_URL}/api/orders?status=${status}` : `${API_URL}/api/orders`;
    const response = await fetch(url);
    return response.json();
  },

  updateOrderStatus: async (orderId, status) => {
    const response = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return response.json();
  },

  cancelOrderItem: async (orderId, itemId) => {
    const response = await fetch(`${API_URL}/api/orders/${orderId}/items/${itemId}/cancel`, {
      method: 'PUT'
    });
    return response.json();
  },

  generateBill: async (orderId) => {
    const response = await fetch(`${API_URL}/api/bills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId })
    });
    return response.json();
  },

  getDailyReport: async () => {
    const response = await fetch(`${API_URL}/api/reports/daily`);
    return response.json();
  },

  getKOTLogs: async () => {
    const response = await fetch(`${API_URL}/api/logs/kot`);
    return response.json();
  }
};

