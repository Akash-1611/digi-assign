let io = null;

/**
 * Initialize Socket.io instance
 */
const initSocket = (socketIO) => {
  io = socketIO;
  
  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);
    
    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id);
    });
    
    socket.on('reprint_kot', (data) => {
      io.emit('kot_reprint', data);
    });
  });
};

/**
 * Emit new order event to all clients
 */
const emitNewOrder = (order) => {
  if (io) {
    io.emit('new_order', order);
  }
};

/**
 * Emit order status update event
 */
const emitOrderStatusUpdate = (orderId, status) => {
  if (io) {
    io.emit('order_status_update', { orderId, status });
  }
};

/**
 * Emit item cancelled event
 */
const emitItemCancelled = (orderId, itemId) => {
  if (io) {
    io.emit('item_cancelled', { orderId, itemId });
  }
};

module.exports = {
  initSocket,
  emitNewOrder,
  emitOrderStatusUpdate,
  emitItemCancelled
};

