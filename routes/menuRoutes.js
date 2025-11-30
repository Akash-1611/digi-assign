const express = require('express');
const router = express.Router();
const { getMenu, getAllMenu, addMenuItem, updateMenuItem } = require('../controllers/menuController');

// GET /api/menu - Get enabled menu items
router.get('/menu', getMenu);

// GET /api/menu/all - Get all menu items (admin)
router.get('/menu/all', getAllMenu);

// POST /api/menu - Add new menu item
router.post('/menu', addMenuItem);

// PUT /api/menu/:id - Update menu item
router.put('/menu/:id', updateMenuItem);

module.exports = router;

