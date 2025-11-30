const express = require('express');
const router = express.Router();
const { generateBill } = require('../controllers/billController');

// POST /api/bills - Generate bill for order
router.post('/bills', generateBill);

module.exports = router;

