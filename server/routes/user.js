import express from 'express';
import { query } from '../utils/database.js';

const router = express.Router();

// Get user dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get linked accounts count
    const linkedAccountsResult = await query(
      'SELECT COUNT(*) as count FROM linked_accounts WHERE user_id = $1',
      [userId]
    );

    // Get mock P&L data (in production this would come from broker APIs)
    const pnlResult = await query(`
      SELECT COALESCE(SUM(
        CASE 
          WHEN e.order_status = 'filled' THEN 
            CASE 
              WHEN s.side = 'buy' THEN (e.filled_price - s.price) * e.filled_qty
              ELSE (s.price - e.filled_price) * e.filled_qty
            END
          ELSE 0
        END
      ), 0) as total_pnl
      FROM executions e
      JOIN signals s ON e.signal_id = s.id
      JOIN linked_accounts la ON e.linked_account_id = la.id
      WHERE la.user_id = $1
    `, [userId]);

    // Get active signals count
    const activeSignalsResult = await query(
      'SELECT COUNT(*) as count FROM signals WHERE status = $1 AND expires_at > NOW()',
      ['active']
    );

    // Get user subscription status
    const userResult = await query(
      'SELECT subscription_status FROM users WHERE id = $1',
      [userId]
    );

    res.json({
      linked_accounts: parseInt(linkedAccountsResult.rows[0].count),
      total_pnl: parseFloat(pnlResult.rows[0].total_pnl || 0),
      active_signals: parseInt(activeSignalsResult.rows[0].count),
      subscription_status: userResult.rows[0]?.subscription_status || 'free'
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Failed to load dashboard data' });
  }
});

// Get user trading history
router.get('/history', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 50, offset = 0 } = req.query;

    const result = await query(`
      SELECT 
        e.id,
        e.order_status,
        e.filled_qty,
        e.filled_price,
        e.timestamp as execution_time,
        s.symbol,
        s.side,
        s.price as signal_price,
        s.confidence,
        b.name as broker_name
      FROM executions e
      JOIN signals s ON e.signal_id = s.id
      JOIN linked_accounts la ON e.linked_account_id = la.id
      JOIN brokers b ON la.broker_id = b.id
      WHERE la.user_id = $1
      ORDER BY e.timestamp DESC
      LIMIT $2 OFFSET $3
    `, [userId, parseInt(limit), parseInt(offset)]);

    res.json(result.rows);
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ message: 'Failed to load trading history' });
  }
});

// Update user preferences
router.put('/preferences', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { preferences } = req.body;

    await query(
      'UPDATE users SET preferences = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(preferences), userId]
    );

    res.json({ message: 'Preferences updated successfully' });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ message: 'Failed to update preferences' });
  }
});

export default router;