const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'database.json');

// Initial database structure
const initialData = {
  users: [
    { id: 1, mobile: '1234567890', pin: '1234', role: 'cashier', name: 'John Cashier' },
    { id: 2, mobile: '9876543210', pin: '5678', role: 'kitchen', name: 'Sarah Kitchen' },
    { id: 3, mobile: '5555555555', pin: '9999', role: 'admin', name: 'Admin User' }
  ],
  menu: [
    { id: 1, name: 'Butter Chicken', category: 'Main Course', price: 350, enabled: true },
    { id: 2, name: 'Dal Makhani', category: 'Main Course', price: 250, enabled: true },
    { id: 3, name: 'Paneer Tikka', category: 'Starter', price: 280, enabled: true },
    { id: 4, name: 'Naan', category: 'Breads', price: 40, enabled: true },
    { id: 5, name: 'Garlic Naan', category: 'Breads', price: 50, enabled: true },
    { id: 6, name: 'Biryani', category: 'Main Course', price: 320, enabled: true },
    { id: 7, name: 'Raita', category: 'Sides', price: 60, enabled: true },
    { id: 8, name: 'Gulab Jamun', category: 'Dessert', price: 80, enabled: true },
    { id: 9, name: 'Masala Dosa', category: 'South Indian', price: 120, enabled: true },
    { id: 10, name: 'Filter Coffee', category: 'Beverages', price: 50, enabled: true }
  ],
  orders: [],
  bills: [],
  kotLogs: []
};

let db = { ...initialData };

/**
 * Load database from JSON file
 */
const loadDatabase = () => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      db = JSON.parse(data);
      console.log('✅ Database loaded from file');
    } else {
      saveDatabase();
      console.log('✅ New database initialized');
    }
  } catch (error) {
    console.error('❌ Error loading database:', error);
  }
};

/**
 * Save database to JSON file
 */
const saveDatabase = () => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (error) {
    console.error('❌ Error saving database:', error);
  }
};

/**
 * Get database instance
 */
const getDatabase = () => db;

module.exports = {
  loadDatabase,
  saveDatabase,
  getDatabase
};

