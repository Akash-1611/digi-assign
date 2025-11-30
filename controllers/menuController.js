const { getDatabase, saveDatabase } = require('../config/db');

/**
 * Get enabled menu items (for cashier)
 * @route GET /api/menu
 */
const getMenu = (req, res) => {
  const db = getDatabase();
  const enabledMenu = db.menu.filter(item => item.enabled);
  res.json(enabledMenu);
};

/**
 * Get all menu items (for admin)
 * @route GET /api/menu/all
 */
const getAllMenu = (req, res) => {
  const db = getDatabase();
  res.json(db.menu);
};

/**
 * Add new menu item
 * @route POST /api/menu
 */
const addMenuItem = (req, res) => {
  const { name, category, price } = req.body;
  const db = getDatabase();
  
  const newItem = {
    id: db.menu.length > 0 ? Math.max(...db.menu.map(i => i.id)) + 1 : 1,
    name,
    category,
    price: parseFloat(price),
    enabled: true
  };
  
  db.menu.push(newItem);
  saveDatabase();
  
  res.json({ success: true, item: newItem });
};

/**
 * Update menu item
 * @route PUT /api/menu/:id
 */
const updateMenuItem = (req, res) => {
  const { id } = req.params;
  const { name, category, price, enabled } = req.body;
  const db = getDatabase();
  
  const item = db.menu.find(i => i.id === parseInt(id));
  
  if (item) {
    if (name !== undefined) item.name = name;
    if (category !== undefined) item.category = category;
    if (price !== undefined) item.price = parseFloat(price);
    if (enabled !== undefined) item.enabled = enabled;
    
    saveDatabase();
    res.json({ success: true, item });
  } else {
    res.status(404).json({ success: false, message: 'Item not found' });
  }
};

module.exports = {
  getMenu,
  getAllMenu,
  addMenuItem,
  updateMenuItem
};

