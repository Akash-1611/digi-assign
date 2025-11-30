const { getDatabase, saveDatabase } = require('../config/db');

/**
 * Log KOT event for performance tracking
 */
const logKOT = (orderId, type, success, latency) => {
  const db = getDatabase();
  
  const log = {
    id: db.kotLogs.length + 1,
    orderId,
    type,
    timestamp: new Date().toISOString(),
    success,
    latency
  };
  
  db.kotLogs.push(log);
  saveDatabase();
  
  return log;
};

/**
 * Get KOT performance statistics
 */
const getKOTStats = () => {
  const db = getDatabase();
  const logs = db.kotLogs;
  
  if (logs.length === 0) {
    return {
      avgLatency: 0,
      totalKOTs: 0,
      successRate: 100
    };
  }
  
  const avgLatency = logs.reduce((sum, log) => sum + log.latency, 0) / logs.length;
  const successCount = logs.filter(log => log.success).length;
  const successRate = (successCount / logs.length) * 100;
  
  return {
    avgLatency: Math.round(avgLatency),
    totalKOTs: logs.length,
    successRate: Math.round(successRate)
  };
};

module.exports = {
  logKOT,
  getKOTStats
};

