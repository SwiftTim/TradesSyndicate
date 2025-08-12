import express from 'express';
import { query } from '../utils/database.js';

const router = express.Router();

// Get latest signals
router.get('/latest', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        id, 
        symbol, 
        side, 
        price, 
        size_reco, 
        confidence, 
        timestamp, 
        expires_at,
        status,
        meta
      FROM signals 
      WHERE status = 'active' AND expires_at > NOW()
      ORDER BY timestamp DESC 
      LIMIT 50
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Get signals error:', error);
    res.status(500).json({ message: 'Failed to fetch signals' });
  }
});

// Get signal history
router.get('/history', async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    
    const result = await query(`
      SELECT 
        id, 
        symbol, 
        side, 
        price, 
        size_reco, 
        confidence, 
        timestamp, 
        expires_at,
        status,
        meta
      FROM signals 
      ORDER BY timestamp DESC 
      LIMIT $1 OFFSET $2
    `, [parseInt(limit), parseInt(offset)]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get signal history error:', error);
    res.status(500).json({ message: 'Failed to fetch signal history' });
  }
});

// Get signal by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT 
        id, 
        symbol, 
        side, 
        price, 
        size_reco, 
        confidence, 
        timestamp, 
        expires_at,
        status,
        meta
      FROM signals 
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Signal not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get signal error:', error);
    res.status(500).json({ message: 'Failed to fetch signal' });
  }
});

export default router;