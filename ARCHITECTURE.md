# 🏗️ Architecture Documentation

## System Architecture Overview

This POS system follows a clean **MVC (Model-View-Controller)** architecture with separation of concerns.

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT TIER                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │   Login    │  │    POS     │  │   Kitchen  │  ┌────────┐ │
│  │   Screen   │  │   Screen   │  │   Screen   │  │ Admin  │ │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └───┬────┘ │
│        │               │               │              │       │
│        └───────────────┴───────────────┴──────────────┘       │
│                         │                                     │
│                    React Router                               │
└─────────────────────────┼─────────────────────────────────────┘
                          │
                    HTTP + WebSocket
                          │
┌─────────────────────────┼─────────────────────────────────────┐
│                    SERVER TIER                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                 Express.js Server                       │  │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────────────┐   │  │
│  │  │  Routes  │→ │Controllers│→ │     Services       │   │  │
│  │  │          │  │           │  │  ┌──────────────┐  │   │  │
│  │  │ Auth     │  │ Auth      │  │  │ Socket.io    │  │   │  │
│  │  │ Menu     │  │ Menu      │  │  │ KOT Service  │  │   │  │
│  │  │ Order    │  │ Order     │  │  └──────────────┘  │   │  │
│  │  │ Bill     │  │ Bill      │  │                     │   │  │
│  │  │ Report   │  │ Report    │  │                     │   │  │
│  │  └──────────┘  └──────────┘  └────────────────────┘   │  │
│  └────────────────────────┬───────────────────────────────┘  │
│                            │                                  │
└────────────────────────────┼──────────────────────────────────┘
                             │
                        Database Layer
                             │
┌────────────────────────────┼──────────────────────────────────┐
│                    DATA TIER                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              database.json (In-Memory)                │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────────┐    │   │
│  │  │ Users  │ │  Menu  │ │ Orders │ │ KOT Logs   │    │   │
│  │  └────────┘ └────────┘ └────────┘ └────────────┘    │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

---

## Backend Architecture

### 🎯 Design Pattern: MVC + Service Layer

#### **1. Routes Layer** (`routes/`)
- **Responsibility**: Define API endpoints and HTTP methods
- **Purpose**: Route incoming requests to appropriate controllers
- **Files**:
  - `authRoutes.js` - Authentication endpoints
  - `menuRoutes.js` - Menu management endpoints
  - `orderRoutes.js` - Order processing endpoints
  - `billRoutes.js` - Billing endpoints
  - `reportRoutes.js` - Analytics endpoints

#### **2. Controllers Layer** (`controllers/`)
- **Responsibility**: Handle HTTP request/response logic
- **Purpose**: Validate inputs, call services, return responses
- **Files**:
  - `authController.js` - User authentication
  - `menuController.js` - Menu CRUD operations
  - `orderController.js` - Order lifecycle management
  - `billController.js` - Bill generation
  - `reportController.js` - Report generation

#### **3. Services Layer** (`services/`)
- **Responsibility**: Business logic and external integrations
- **Purpose**: Reusable business operations
- **Files**:
  - `socketService.js` - Real-time event broadcasting
  - `kotService.js` - KOT logging and analytics

#### **4. Configuration** (`config/`)
- **Responsibility**: System configuration and initialization
- **Files**:
  - `db.js` - Database operations (load, save, get)

---

## Data Flow Examples

### 📋 Example 1: Creating an Order

```
1. Client: POST /api/orders
   ↓
2. orderRoutes.js → routes to createOrder()
   ↓
3. orderController.js → validates input
   ↓
4. db.js → saves order to database
   ↓
5. socketService.js → emits 'new_order' event
   ↓
6. kotService.js → logs KOT performance
   ↓
7. Response sent to client
   ↓
8. Kitchen screens receive WebSocket event in real-time
```

### 🔄 Example 2: Real-time Order Status Update

```
1. Kitchen: PUT /api/orders/:id/status
   ↓
2. orderController.updateOrderStatus()
   ↓
3. Database updated
   ↓
4. socketService.emitOrderStatusUpdate()
   ↓
5. All connected clients receive update
   ↓
6. Cashier screen shows "Ready" status instantly
```

---

## Frontend Architecture

### Component Hierarchy

```
App.js (Router)
├── Login.js (Public)
├── ProtectedRoute
│   ├── POS.js (Cashier Role)
│   │   ├── Menu Grid
│   │   ├── Cart Component
│   │   └── Recent Orders
│   ├── Kitchen.js (Kitchen Role)
│   │   ├── Order Filters
│   │   └── KOT Cards
│   └── Admin.js (Admin Role)
│       ├── Menu Management
│       ├── Daily Reports
│       └── KOT Logs
```

### State Management

- **Local State**: React `useState` for component-specific data
- **Session State**: `localStorage` for user authentication
- **Real-time State**: WebSocket events for live updates

---

## WebSocket Event Flow

### Events from Server → Client

| Event | Trigger | Recipients | Purpose |
|-------|---------|------------|---------|
| `new_order` | Order created | Kitchen screens | Display new KOT |
| `order_status_update` | Status changed | Cashier screens | Update order status |
| `item_cancelled` | Item cancelled | Kitchen screens | Mark item as cancelled |
| `kot_reprint` | Reprint requested | All clients | Notify of reprint |

### Events from Client → Server

| Event | Sender | Purpose |
|-------|--------|---------|
| `reprint_kot` | Kitchen | Request KOT reprint |

---

## Database Schema

### Users Collection
```javascript
{
  id: Number,
  mobile: String (10 digits),
  pin: String,
  role: Enum['cashier', 'kitchen', 'admin'],
  name: String
}
```

### Menu Collection
```javascript
{
  id: Number,
  name: String,
  category: String,
  price: Number,
  enabled: Boolean
}
```

### Orders Collection
```javascript
{
  id: Number,
  tableNumber: String,
  orderType: Enum['dine-in', 'takeaway'],
  items: [{
    id: Number,
    name: String,
    price: Number,
    quantity: Number,
    status: Enum['pending', 'cancelled']
  }],
  notes: String,
  status: Enum['pending', 'preparing', 'ready', 'completed'],
  cashierId: Number,
  timestamp: ISO String,
  kotPrintedAt: ISO String | null
}
```

### Bills Collection
```javascript
{
  id: Number,
  orderId: Number,
  tableNumber: String,
  orderType: String,
  items: Array,
  subtotal: Number,
  tax: Number,
  total: Number,
  timestamp: ISO String
}
```

### KOT Logs Collection
```javascript
{
  id: Number,
  orderId: Number,
  type: String,
  timestamp: ISO String,
  success: Boolean,
  latency: Number (milliseconds)
}
```

---

## Performance Optimizations

### 1. **Database Operations**
- In-memory JSON for fast reads (< 1ms)
- Atomic writes with immediate persistence
- No database queries, direct array operations

### 2. **WebSocket Efficiency**
- Single connection per client
- Event-based updates (no polling)
- Automatic reconnection handling

### 3. **Frontend Optimizations**
- React functional components
- Minimal re-renders
- Efficient state updates
- CSS animations (GPU accelerated)

### 4. **API Response Times**
- Target: < 300ms for order creation
- Achieved: Typically 50-150ms
- Logged in KOT performance metrics

---

## Security Considerations

### Current Implementation
- ✅ Role-based access control (route level)
- ✅ Input validation in controllers
- ✅ CORS enabled for cross-origin requests
- ✅ Session persistence with localStorage

### Production Enhancements (Future)
- 🔒 JWT tokens instead of localStorage
- 🔒 Password hashing (bcrypt)
- 🔒 Rate limiting on endpoints
- 🔒 HTTPS enforcement
- 🔒 SQL injection protection (not applicable - using JSON)
- 🔒 XSS protection

---

## Error Handling Strategy

### Backend
```javascript
// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error'
  });
});
```

### Frontend
- Try-catch blocks for API calls
- Toast notifications for user feedback
- Graceful degradation for WebSocket failures

---

## Testing Strategy (Recommended)

### Unit Tests
- Controllers: Test business logic
- Services: Test socket emissions
- Routes: Test endpoint responses

### Integration Tests
- Full order flow (create → status update → bill)
- WebSocket event propagation
- Database operations

### E2E Tests
- User login flows
- Order placement
- Kitchen operations
- Admin functions

---

## Scalability Considerations

### Current Limitations
- Single server instance
- In-memory database (resets on restart)
- No authentication tokens

### Scale-Up Path
1. **Database**: Migrate to PostgreSQL/MongoDB
2. **Caching**: Add Redis for sessions
3. **Queue**: Add Bull/BullMQ for background jobs
4. **Load Balancing**: Add Nginx
5. **Clustering**: Use PM2 for multi-core usage
6. **Monitoring**: Add logging (Winston) and metrics (Prometheus)

---

## API Response Format

### Success Response
```javascript
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

### Error Response
```javascript
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (dev only)"
}
```

---

## Development Best Practices

✅ **Separation of Concerns**: Each layer has a single responsibility  
✅ **DRY Principle**: Reusable services and utilities  
✅ **Clean Code**: Meaningful variable names, JSDoc comments  
✅ **Error Handling**: Try-catch blocks and proper error responses  
✅ **Modularity**: Easy to add new features or modify existing ones  
✅ **Consistency**: Uniform code style and structure  

---

## Future Enhancements

### Phase 2 Features
- [ ] User management (add/edit/delete users)
- [ ] Table layout visualization
- [ ] Order modification (not just cancellation)
- [ ] Payment integration
- [ ] Receipt email/SMS
- [ ] Multi-restaurant support
- [ ] Inventory management
- [ ] Employee shift tracking
- [ ] Customer feedback module

---

**📚 For more information, see README.md and inline code comments.**

