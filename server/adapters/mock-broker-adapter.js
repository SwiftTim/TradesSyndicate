import { BrokerAdapter } from './broker-adapter.js';

export class MockBrokerAdapter extends BrokerAdapter {
  constructor(credentials) {
    super(credentials);
    this.mockBalance = 50000;
    this.mockPositions = [];
  }

  async testConnection() {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return {
        success: true,
        account_info: {
          balance: this.mockBalance,
          currency: 'USD',
          account_type: 'demo',
          broker: 'Mock Broker'
        }
      };
    } catch (error) {
      throw new Error(`Mock broker connection failed: ${error.message}`);
    }
  }

  async placeOrder(orderData) {
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const orderId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Simulate realistic order execution
      const filled_qty = orderData.size * (0.9 + Math.random() * 0.1); // 90-100% fill
      const slippage = (Math.random() - 0.5) * 0.002; // Small random slippage
      const filled_price = orderData.price * (1 + slippage);
      
      // Update mock balance (simplified)
      const cost = filled_qty * filled_price;
      if (orderData.side === 'buy') {
        this.mockBalance -= cost;
      } else {
        this.mockBalance += cost;
      }

      return {
        success: true,
        order_id: orderId,
        status: Math.random() > 0.05 ? 'filled' : 'partial', // 95% success rate
        filled_qty,
        filled_price: parseFloat(filled_price.toFixed(4)),
        timestamp: new Date().toISOString(),
        fees: cost * 0.001 // 0.1% fee
      };
    } catch (error) {
      throw new Error(`Mock broker order failed: ${error.message}`);
    }
  }

  async getAccountInfo() {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Add some realistic variation
      const variation = (Math.random() - 0.5) * 1000;
      
      return {
        balance: parseFloat((this.mockBalance + variation).toFixed(2)),
        currency: 'USD',
        equity: parseFloat((this.mockBalance * 1.02 + variation).toFixed(2)),
        margin_used: 2500,
        margin_free: this.mockBalance - 2500,
        positions: this.mockPositions.length,
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get mock account info: ${error.message}`);
    }
  }

  async getPositions() {
    try {
      await new Promise(resolve => setTimeout(resolve, 150));
      
      return this.mockPositions;
    } catch (error) {
      throw new Error(`Failed to get mock positions: ${error.message}`);
    }
  }

  async closePosition(positionId) {
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const positionIndex = this.mockPositions.findIndex(p => p.id === positionId);
      if (positionIndex === -1) {
        throw new Error('Position not found');
      }

      const position = this.mockPositions.splice(positionIndex, 1)[0];
      
      return {
        success: true,
        closed_position: position,
        pnl: position.pnl,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to close position: ${error.message}`);
    }
  }
}