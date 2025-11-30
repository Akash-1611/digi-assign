const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

// Import configuration
const { loadDatabase } = require('./config/db');
const { initSocket } = require('./services/socketService');

// Import routes
const authRoutes = require('./routes/authRoutes');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const billRoutes = require('./routes/billRoutes');
const reportRoutes = require('./routes/reportRoutes');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Load database
loadDatabase();

// Initialize socket service
initSocket(io);

// API Routes
app.use('/api', authRoutes);
app.use('/api', menuRoutes);
app.use('/api', orderRoutes);
app.use('/api', billRoutes);
app.use('/api', reportRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Start server
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║     🍽️  POS System Server Running     ║
╠════════════════════════════════════════╣
║  Port: ${PORT}                           ║
║  Socket.io: ✅ Enabled                 ║
║  Database: ✅ JSON In-Memory           ║
║  Architecture: ✅ Modular MVC          ║
╚════════════════════════════════════════╝

🚀 Server started successfully!
   http://localhost:${PORT}

📱 Test Credentials:
   Cashier:  1234567890 / 1234
   Kitchen:  9876543210 / 5678
   Admin:    5555555555 / 9999

📚 API Documentation:
   GET  /health - Health check
   POST /api/login - User authentication
   
   📋 Menu Endpoints
   GET  /api/menu - Get enabled items
   GET  /api/menu/all - Get all items
   POST /api/menu - Add item
   PUT  /api/menu/:id - Update item
   
   🎫 Order Endpoints
   GET  /api/orders - Get orders
   POST /api/orders - Create order
   PUT  /api/orders/:id/status - Update status
   PUT  /api/orders/:id/items/:itemId/cancel - Cancel item
   
   💰 Billing & Reports
   POST /api/bills - Generate bill
   GET  /api/reports/daily - Daily report
   GET  /api/logs/kot - KOT logs
  `);
});

module.exports = { app, server };
