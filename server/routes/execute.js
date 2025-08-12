import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../utils/database.js';
import { requireAdmin } from '../middleware/auth.js';
import { ExecutionOrchestrator } from '../services/execution-orchestrator.js';

const router = express.Router();
const executionOrchestrator = new ExecutionOrchestrator();

// Execute signal (admin only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { signal_id } = req.body;

    if (!signal_id) {
      return res.status(400).json({ message: 'Signal ID is required' });
    }

    // Verify signal exists and is active
    const signalResult = await query(
      'SELECT * FROM signals WHERE id = $1 AND status = $2',
      [signal_id, 'active']
    );

    if (signalResult.rows.length === 0) {
      return res.status(404).json({ message: 'Signal not found or not active' });
    }

    const signal = signalResult.rows[0];

    // Check if signal has expired
    if (new Date(signal.expires_at) <= new Date()) {
      return res.status(400).json({ message: 'Signal has expired' });
    }

    // Execute signal across all linked accounts
    const results = await executionOrchestrator.executeSignal(signal);

    // Update signal status
    await query(
      'UPDATE signals SET status = $1 WHERE id = $2',
      ['executed', signal_id]
    );

    res.json({
      message: 'Signal executed successfully',
      results: {
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        total: results.length
      },
      details: results
    });
  } catch (error) {
    console.error('Execute signal error:', error);
    res.status(500).json({ message: 'Failed to execute signal' });
  }
});

// Get execution history
router.get('/history', requireAdmin, async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;

    const result = await query(`
      SELECT 
        e.id,
        e.order_status,
        e.filled_qty,
        e.filled_price,
        e.timestamp,
        s.symbol,
        s.side,
        s.price as signal_price,
        u.email as user_email,
        b.name as broker_name
      FROM executions e
      JOIN signals s ON e.signal_id = s.id
      JOIN linked_accounts la ON e.linked_account_id = la.id
      JOIN users u ON la.user_id = u.id
      JOIN brokers b ON la.broker_id = b.id
      ORDER BY e.timestamp DESC
      LIMIT $1 OFFSET $2
    `, [parseInt(limit), parseInt(offset)]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get execution history error:', error);
    res.status(500).json({ message: 'Failed to fetch execution history' });
  }
});

export default router;