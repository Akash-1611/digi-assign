const { getDatabase, saveDatabase } = require('../config/db');

/**
 * Generate bill for an order
 * @route POST /api/bills
 */
const generateBill = (req, res) => {
  const { orderId } = req.body;
  const db = getDatabase();
  
  const order = db.orders.find(o => o.id === parseInt(orderId));
  
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }
  
  // Calculate bill details
  const activeItems = order.items.filter(i => i.status !== 'cancelled');
  const subtotal = activeItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.05; // 5% tax
  const total = subtotal + tax;
  
  const bill = {
    id: db.bills.length > 0 ? Math.max(...db.bills.map(b => b.id)) + 1 : 1,
    orderId: order.id,
    tableNumber: order.tableNumber,
    orderType: order.orderType,
    items: activeItems,
    subtotal,
    tax,
    total,
    timestamp: new Date().toISOString()
  };
  
  db.bills.push(bill);
  order.status = 'completed';
  saveDatabase();
  
  res.json({ success: true, bill });
};

module.exports = {
  generateBill
};

