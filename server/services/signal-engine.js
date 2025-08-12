import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../utils/database.js';

export class SignalEngine extends EventEmitter {
  constructor() {
    super();
    this.isRunning = false;
    this.interval = null;
    this.mockSignals = [
      { symbol: 'EURUSD', side: 'buy', basePrice: 1.0850 },
      { symbol: 'GBPUSD', side: 'sell', basePrice: 1.2650 },
      { symbol: 'USDJPY', side: 'buy', basePrice: 148.50 },
      { symbol: 'BTCUSD', side: 'buy', basePrice: 43000 },
      { symbol: 'ETHUSD', side: 'sell', basePrice: 2800 }
    ];
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('Signal engine started');
    
    // Generate signals every 2-5 minutes
    this.scheduleNextSignal();
  }

  stop() {
    this.isRunning = false;
    if (this.interval) {
      clearTimeout(this.interval);
      this.interval = null;
    }
    console.log('Signal engine stopped');
  }

  scheduleNextSignal() {
    if (!this.isRunning) return;
    
    // Random interval between 2-5 minutes
    const delay = (2 + Math.random() * 3) * 60 * 1000;
    
    this.interval = setTimeout(() => {
      this.generateSignal();
      this.scheduleNextSignal();
    }, delay);
  }

  async generateSignal() {
    try {
      // Check kill switch
      const killSwitchResult = await query(
        'SELECT value FROM system_settings WHERE key = $1',
        ['kill_switch_enabled']
      );
      
      if (killSwitchResult.rows.length > 0 && 
          killSwitchResult.rows[0].value === 'true') {
        console.log('Signal generation skipped - kill switch enabled');
        return;
      }

      const template = this.mockSignals[Math.floor(Math.random() * this.mockSignals.length)];
      
      // Add some price variation
      const priceVariation = (Math.random() - 0.5) * 0.02; // ±2%
      const price = template.basePrice * (1 + priceVariation);
      
      const signal = {
        id: uuidv4(),
        symbol: template.symbol,
        side: Math.random() > 0.5 ? 'buy' : 'sell',
        price: parseFloat(price.toFixed(template.symbol.includes('JPY') ? 2 : 4)),
        size_reco: parseFloat((0.5 + Math.random() * 4.5).toFixed(1)), // 0.5% - 5%
        confidence: Math.floor(60 + Math.random() * 35), // 60-95%
        timestamp: new Date().toISOString(),
        expires_at: new Date(Date.now() + (5 + Math.random() * 25) * 60 * 1000), // 5-30 minutes
        status: 'active',
        meta: { source: 'ai_engine', model_version: '1.0' }
      };

      // Store in database
      await query(`
        INSERT INTO signals (
          id, symbol, side, price, size_reco, 
          confidence, timestamp, expires_at, status, meta
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        signal.id,
        signal.symbol,
        signal.side,
        signal.price,
        signal.size_reco,
        signal.confidence,
        signal.timestamp,
        signal.expires_at,
        signal.status,
        JSON.stringify(signal.meta)
      ]);

      console.log(`Generated signal: ${signal.symbol} ${signal.side} @ ${signal.price}`);
      
      // Emit event for WebSocket broadcasting
      this.emit('newSignal', signal);
      
      // Log to audit trail
      await query(`
        INSERT INTO audit_logs (level, message, metadata)
        VALUES ($1, $2, $3)
      `, [
        'info',
        'Signal generated',
        JSON.stringify({
          signal_id: signal.id,
          symbol: signal.symbol,
          side: signal.side,
          price: signal.price,
          confidence: signal.confidence
        })
      ]);
    } catch (error) {
      console.error('Signal generation error:', error);
    }
  }

  // Clean up expired signals
  async cleanupExpiredSignals() {
    try {
      const result = await query(`
        UPDATE signals 
        SET status = 'expired' 
        WHERE status = 'active' AND expires_at <= NOW()
        RETURNING id
      `);
      
      if (result.rows.length > 0) {
        console.log(`Marked ${result.rows.length} signals as expired`);
      }
    } catch (error) {
      console.error('Signal cleanup error:', error);
    }
  }
}