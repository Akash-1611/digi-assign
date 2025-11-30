const { getDatabase } = require('../config/db');

/**
 * Get daily sales report
 * @route GET /api/reports/daily
 */
const getDailyReport = (req, res) => {
  const db = getDatabase();
  const today = new Date().toISOString().split('T')[0];
  
  const todayBills = db.bills.filter(bill => 
    bill.timestamp.startsWith(today)
  );
  
  const totalRevenue = todayBills.reduce((sum, bill) => sum + bill.total, 0);
  const totalOrders = todayBills.length;
  const totalItems = todayBills.reduce((sum, bill) => 
    sum + bill.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
  );
  
  // Calculate item sales
  const itemSales = {};
  todayBills.forEach(bill => {
    bill.items.forEach(item => {
      if (!itemSales[item.name]) {
        itemSales[item.name] = { quantity: 0, revenue: 0 };
      }
      itemSales[item.name].quantity += item.quantity;
      itemSales[item.name].revenue += item.price * item.quantity;
    });
  });
  
  const report = {
    date: today,
    totalRevenue: totalRevenue.toFixed(2),
    totalOrders,
    totalItems,
    avgOrderValue: totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0,
    itemSales: Object.entries(itemSales).map(([name, data]) => ({
      name,
      ...data
    })).sort((a, b) => b.revenue - a.revenue),
    bills: todayBills
  };
  
  res.json(report);
};

/**
 * Get KOT performance logs
 * @route GET /api/logs/kot
 */
const getKOTLogs = (req, res) => {
  const db = getDatabase();
  // Return last 100 logs
  res.json(db.kotLogs.slice(-100));
};

module.exports = {
  getDailyReport,
  getKOTLogs
};

