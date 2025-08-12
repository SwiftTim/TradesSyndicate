import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../utils/database.js';
import { encryptApiKey, decryptApiKey } from '../utils/encryption.js';
import { BrokerAdapterFactory } from '../adapters/broker-adapter-factory.js';

const router = express.Router();

// Link broker account
router.post('/link', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { broker_id, public_key, private_key, settings } = req.body;

    if (!broker_id || !public_key || !private_key) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if broker exists
    const brokerResult = await query(
      'SELECT id, name FROM brokers WHERE id = $1',
      [broker_id]
    );

    if (brokerResult.rows.length === 0) {
      return res.status(404).json({ message: 'Broker not found' });
    }

    // Encrypt API keys
    const encryptedPrivateKey = encryptApiKey(private_key);

    // Create linked account
    const accountId = uuidv4();
    await query(`
      INSERT INTO linked_accounts (
        id, user_id, broker_id, public_key, 
        private_key_encrypted, settings_json, 
        status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, [
      accountId,
      userId,
      broker_id,
      public_key,
      encryptedPrivateKey,
      JSON.stringify(settings || {}),
      'active'
    ]);

    // Test connection
    try {
      const adapter = BrokerAdapterFactory.create(broker_id, {
        publicKey: public_key,
        privateKey: private_key
      });
      await adapter.testConnection();
    } catch (testError) {
      console.warn('Broker connection test failed:', testError.message);
      // Don't fail the linking, just log the warning
    }

    res.status(201).json({
      message: 'Broker account linked successfully',
      account_id: accountId
    });
  } catch (error) {
    console.error('Link broker error:', error);
    res.status(500).json({ message: 'Failed to link broker account' });
  }
});

// Get linked accounts
router.get('/linked', async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await query(`
      SELECT 
        la.id,
        la.public_key,
        la.settings_json,
        la.status,
        la.created_at,
        b.name as broker_name,
        b.id as broker_id
      FROM linked_accounts la
      JOIN brokers b ON la.broker_id = b.id
      WHERE la.user_id = $1 AND la.status = 'active'
      ORDER BY la.created_at DESC
    `, [userId]);

    const accounts = result.rows.map(account => ({
      ...account,
      settings: JSON.parse(account.settings_json || '{}'),
      private_key_encrypted: undefined // Never send encrypted keys to client
    }));

    res.json(accounts);
  } catch (error) {
    console.error('Get linked accounts error:', error);
    res.status(500).json({ message: 'Failed to fetch linked accounts' });
  }
});

// Test broker connection
router.post('/test/:accountId', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { accountId } = req.params;

    const result = await query(`
      SELECT 
        la.public_key,
        la.private_key_encrypted,
        b.id as broker_id
      FROM linked_accounts la
      JOIN brokers b ON la.broker_id = b.id
      WHERE la.id = $1 AND la.user_id = $2 AND la.status = 'active'
    `, [accountId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Linked account not found' });
    }

    const account = result.rows[0];
    const privateKey = decryptApiKey(account.private_key_encrypted);

    const adapter = BrokerAdapterFactory.create(account.broker_id, {
      publicKey: account.public_key,
      privateKey
    });

    const testResult = await adapter.testConnection();
    res.json({ 
      success: true, 
      message: 'Connection successful',
      details: testResult
    });
  } catch (error) {
    console.error('Test connection error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Connection test failed' 
    });
  }
});

// Update account settings
router.put('/:accountId/settings', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { accountId } = req.params;
    const { settings } = req.body;

    await query(`
      UPDATE linked_accounts 
      SET settings_json = $1, updated_at = NOW()
      WHERE id = $2 AND user_id = $3
    `, [JSON.stringify(settings), accountId, userId]);

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Failed to update settings' });
  }
});

// Remove linked account
router.delete('/:accountId', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { accountId } = req.params;

    await query(
      'UPDATE linked_accounts SET status = $1 WHERE id = $2 AND user_id = $3',
      ['inactive', accountId, userId]
    );

    res.json({ message: 'Account unlinked successfully' });
  } catch (error) {
    console.error('Unlink account error:', error);
    res.status(500).json({ message: 'Failed to unlink account' });
  }
});

export default router;