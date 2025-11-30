const express = require('express');
const router = express.Router();
const { getDailyReport, getKOTLogs } = require('../controllers/reportController');

// GET /api/reports/daily - Get daily sales report
router.get('/reports/daily', getDailyReport);

// GET /api/logs/kot - Get KOT performance logs
router.get('/logs/kot', getKOTLogs);

module.exports = router;

