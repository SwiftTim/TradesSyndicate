import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../utils/database.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Apply admin middleware to all routes
router.use(requireAdmin);

// Get system health
router.get('/health', async (req, res) => {
  try {
    // Check database connection
    const dbCheck = await query('SELECT NOW() as timestamp');
    
    // Get system metrics
    const metrics = {
      database: 'healthy',
      timestamp: dbCheck.rows[0].timestamp,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      node_version: process.version
    };

    res.json({
      status: 'healthy',
      metrics
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Get system metrics
router.get('/metrics', async (req, res) => {
  try {
    // Get active users (logged in within last 24 hours)
    const activeUsersResult = await query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE last_login > NOW() - INTERVAL '24 hours'
    `);

    // Get linked accounts count
    const linkedAccountsResult = await query(`
      SELECT COUNT(*) as count 
      FROM linked_accounts 
      WHERE status = 'active'
    `);

    // Get signals today
    const signalsTodayResult = await query(`
      SELECT COUNT(*) as count 
      FROM signals 
      WHERE DATE(timestamp) = CURRENT_DATE
    `);

    // Mock system load (in production this would come from system metrics)
    const systemLoad = Math.floor(Math.random() * 100);

    res.json({
      active_users: parseInt(activeUsersResult.rows[0].count),
      linked_accounts: parseInt(linkedAccountsResult.rows[0].count),
      signals_today: parseInt(signalsTodayResult.rows[0].count),
      system_load: systemLoad
    });
  } catch (error) {
    console.error('Metrics error:', error);
    res.status(500).json({ message: 'Failed to fetch metrics' });
  }
});

// Emit signal
router.post('/signals', async (req, res) => {
  try {
    const { symbol, side, price, size_reco, confidence, expires_in } = req.body;

    if (!symbol || !side || !price || !size_reco || !confidence || !expires_in) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const signalId = uuidv4();
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    await query(`
      INSERT INTO signals (
        id, symbol, side, price, size_reco, 
        confidence, timestamp, expires_at, status, meta
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8, $9)
    `, [
      signalId,
      symbol,
      side,
      parseFloat(price),
      parseFloat(size_reco),
      parseInt(confidence),
      expiresAt,
      'active',
      JSON.stringify({ created_by: 'admin', source: 'manual' })
    ]);

    // Signal will be broadcasted by the signal engine
    res.status(201).json({
      message: 'Signal emitted successfully',
      signal_id: signalId
    });
  } catch (error) {
    console.error('Emit signal error:', error);
    res.status(500).json({ message: 'Failed to emit signal' });
  }
});

// Kill switch
router.post('/kill-switch', async (req, res) => {
  try {
    const { enabled } = req.body;

    // Store kill switch state (in production this might use Redis or another fast store)
    await query(`
      INSERT INTO system_settings (key, value, updated_at)
      VALUES ('kill_switch_enabled', $1, NOW())
      ON CONFLICT (key)
      DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at
    `, [enabled.toString()]);

    res.json({
      message: `Kill switch ${enabled ? 'activated' : 'deactivated'}`,
      enabled
    });
  } catch (error) {
    console.error('Kill switch error:', error);
    res.status(500).json({ message: 'Failed to toggle kill switch' });
  }
});

// Get audit logs
router.get('/logs', async (req, res) => {
  try {
    const { limit = 100, offset = 0, level = 'all' } = req.query;

    let whereClause = '';
    let params = [parseInt(limit), parseInt(offset)];

    if (level !== 'all') {
      whereClause = 'WHERE level = $3';
      params.push(level);
    }

    const result = await query(`
      SELECT 
        id, level, message, metadata, timestamp
      FROM audit_logs 
      ${whereClause}
      ORDER BY timestamp DESC 
      LIMIT $1 OFFSET $2
    `, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ message: 'Failed to fetch logs' });
  }
});

// Get user management data
router.get('/users', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const result = await query(`
      SELECT 
        id, email, role, subscription_status,
        created_at, last_login,
        (SELECT COUNT(*) FROM linked_accounts WHERE user_id = users.id AND status = 'active') as linked_accounts
      FROM users 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `, [parseInt(limit), parseInt(offset)]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

export default router;