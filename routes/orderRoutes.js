const express = require('express');
const router = express.Router();
const { createOrder, getOrders, updateOrderStatus, cancelOrderItem } = require('../controllers/orderController');

// GET /api/orders - Get all orders
router.get('/orders', getOrders);

// POST /api/orders - Create new order
router.post('/orders', createOrder);

// PUT /api/orders/:id/status - Update order status
router.put('/orders/:id/status', updateOrderStatus);

// PUT /api/orders/:orderId/items/:itemId/cancel - Cancel order item
router.put('/orders/:orderId/items/:itemId/cancel', cancelOrderItem);

module.exports = router;

