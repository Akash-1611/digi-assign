const { getDatabase, saveDatabase } = require('../config/db');
const { emitNewOrder, emitOrderStatusUpdate, emitItemCancelled } = require('../services/socketService');
const { logKOT } = require('../services/kotService');

/**
 * Create new order
 * @route POST /api/orders
 */
const createOrder = (req, res) => {
  const startTime = Date.now();
  const { tableNumber, orderType, items, notes, cashierId } = req.body;
  const db = getDatabase();
  
  const order = {
    id: db.orders.length > 0 ? Math.max(...db.orders.map(o => o.id)) + 1 : 1,
    tableNumber,
    orderType,
    items: items.map(item => ({
      ...item,
      status: 'pending'
    })),
    notes,
    status: 'pending',
    cashierId,
    timestamp: new Date().toISOString(),
    kotPrintedAt: null
  };
  
  db.orders.push(order);
  saveDatabase();
  
  // Emit socket event to kitchen
  emitNewOrder(order);
  
  // Log KOT performance
  const latency = Date.now() - startTime;
  logKOT(order.id, 'new_order', true, latency);
  
  console.log(`⚡ Order #${order.id} processed in ${latency}ms`);
  
  res.json({ success: true, order, latency });
};

/**
 * Get all orders (with optional status filter)
 * @route GET /api/orders
 */
const getOrders = (req, res) => {
  const { status } = req.query;
  const db = getDatabase();
  let orders = db.orders;
  
  if (status) {
    orders = orders.filter(o => o.status === status);
  }
  
  res.json(orders);
};

/**
 * Update order status
 * @route PUT /api/orders/:id/status
 */
const updateOrderStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const db = getDatabase();
  
  const order = db.orders.find(o => o.id === parseInt(id));
  
  if (order) {
    order.status = status;
    saveDatabase();
    
    // Emit socket event
    emitOrderStatusUpdate(order.id, status);
    
    res.json({ success: true, order });
  } else {
    res.status(404).json({ success: false, message: 'Order not found' });
  }
};

/**
 * Cancel specific item in order
 * @route PUT /api/orders/:orderId/items/:itemId/cancel
 */
const cancelOrderItem = (req, res) => {
  const { orderId, itemId } = req.params;
  const db = getDatabase();
  
  const order = db.orders.find(o => o.id === parseInt(orderId));
  
  if (order) {
    const item = order.items.find(i => i.id === parseInt(itemId));
    if (item) {
      item.status = 'cancelled';
      saveDatabase();
      
      // Emit socket event
      emitItemCancelled(order.id, item.id);
      
      res.json({ success: true, order });
    } else {
      res.status(404).json({ success: false, message: 'Item not found' });
    }
  } else {
    res.status(404).json({ success: false, message: 'Order not found' });
  }
};

module.exports = {
  createOrder,
  getOrders,
  updateOrderStatus,
  cancelOrderItem
};

