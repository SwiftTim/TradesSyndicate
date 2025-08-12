import { v4 as uuidv4 } from 'uuid';
import { query } from '../utils/database.js';
import { BrokerAdapterFactory } from '../adapters/broker-adapter-factory.js';
import { decryptApiKey } from '../utils/encryption.js';

export class ExecutionOrchestrator {
  async executeSignal(signal) {
    const results = [];
    
    try {
      // Get all linked accounts that have auto-copy enabled
      const accountsResult = await query(`
        SELECT 
          la.id,
          la.user_id,
          la.broker_id,
          la.public_key,
          la.private_key_encrypted,
          la.settings_json,
          u.email,
          b.name as broker_name
        FROM linked_accounts la
        JOIN users u ON la.user_id = u.id
        JOIN brokers b ON la.broker_id = b.id
        WHERE la.status = 'active'
      `);

      console.log(`Executing signal ${signal.id} for ${accountsResult.rows.length} accounts`);

      for (const account of accountsResult.rows) {
        try {
          const settings = JSON.parse(account.settings_json || '{}');
          
          // Skip if auto-copy is not enabled for this account
          if (!settings.auto_copy) {
            console.log(`Skipping account ${account.id} - auto-copy disabled`);
            continue;
          }

          // Decrypt private key
          const privateKey = decryptApiKey(account.private_key_encrypted);

          // Create broker adapter
          const adapter = BrokerAdapterFactory.create(account.broker_id, {
            publicKey: account.public_key,
            privateKey
          });

          // Calculate position size based on user's risk settings
          const riskMultiplier = settings.risk_multiplier || 1.0;
          const maxPositionSize = settings.max_position_size || 10000;
          const positionSize = Math.min(
            signal.size_reco * riskMultiplier,
            maxPositionSize * 0.1 // Never risk more than 10% of max position
          );

          // Execute trade
          const orderResult = await adapter.placeOrder({
            symbol: signal.symbol,
            side: signal.side,
            size: positionSize,
            price: signal.price,
            type: 'market'
          });

          // Record execution
          const executionId = uuidv4();
          await query(`
            INSERT INTO executions (
              id, signal_id, linked_account_id, order_status,
              filled_qty, filled_price, timestamp, meta
            ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)
          `, [
            executionId,
            signal.id,
            account.id,
            orderResult.status,
            orderResult.filled_qty || 0,
            orderResult.filled_price || signal.price,
            JSON.stringify({
              broker_order_id: orderResult.order_id,
              risk_multiplier: riskMultiplier
            })
          ]);

          results.push({
            account_id: account.id,
            user_email: account.email,
            broker: account.broker_name,
            success: true,
            order_id: orderResult.order_id,
            status: orderResult.status,
            filled_qty: orderResult.filled_qty
          });

          // Log successful execution
          await query(`
            INSERT INTO audit_logs (level, message, metadata)
            VALUES ($1, $2, $3)
          `, [
            'info',
            'Signal executed',
            JSON.stringify({
              signal_id: signal.id,
              account_id: account.id,
              broker: account.broker_name,
              order_id: orderResult.order_id
            })
          ]);
        } catch (accountError) {
          console.error(`Execution failed for account ${account.id}:`, accountError);
          
          results.push({
            account_id: account.id,
            user_email: account.email,
            broker: account.broker_name,
            success: false,
            error: accountError.message
          });

          // Log failed execution
          await query(`
            INSERT INTO audit_logs (level, message, metadata)
            VALUES ($1, $2, $3)
          `, [
            'error',
            'Signal execution failed',
            JSON.stringify({
              signal_id: signal.id,
              account_id: account.id,
              error: accountError.message
            })
          ]);
        }
      }
    } catch (error) {
      console.error('Execution orchestrator error:', error);
      throw error;
    }

    return results;
  }
}