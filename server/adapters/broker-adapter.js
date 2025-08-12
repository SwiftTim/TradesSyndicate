/**
 * Abstract base class for broker adapters
 */
export class BrokerAdapter {
  constructor(credentials) {
    this.credentials = credentials;
    
    if (!credentials || !credentials.publicKey || !credentials.privateKey) {
      throw new Error('Broker credentials are required');
    }
  }

  /**
   * Test connection to broker API
   * @returns {Promise<Object>} Connection test result
   */
  async testConnection() {
    throw new Error('testConnection method must be implemented');
  }

  /**
   * Place a trading order
   * @param {Object} orderData - Order information
   * @param {string} orderData.symbol - Trading symbol
   * @param {string} orderData.side - 'buy' or 'sell'
   * @param {number} orderData.size - Order size
   * @param {number} orderData.price - Order price
   * @param {string} orderData.type - Order type ('market', 'limit')
   * @returns {Promise<Object>} Order result
   */
  async placeOrder(orderData) {
    throw new Error('placeOrder method must be implemented');
  }

  /**
   * Get account information
   * @returns {Promise<Object>} Account details
   */
  async getAccountInfo() {
    throw new Error('getAccountInfo method must be implemented');
  }

  /**
   * Get open positions
   * @returns {Promise<Array>} List of positions
   */
  async getPositions() {
    throw new Error('getPositions method must be implemented');
  }

  /**
   * Validate order data
   * @param {Object} orderData - Order to validate
   * @returns {boolean} True if valid
   */
  validateOrder(orderData) {
    const required = ['symbol', 'side', 'size', 'price'];
    const missing = required.filter(field => !orderData[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    if (!['buy', 'sell'].includes(orderData.side)) {
      throw new Error('Side must be "buy" or "sell"');
    }

    if (orderData.size <= 0) {
      throw new Error('Size must be greater than 0');
    }

    if (orderData.price <= 0) {
      throw new Error('Price must be greater than 0');
    }

    return true;
  }

  /**
   * Format symbol for broker API
   * @param {string} symbol - Standard symbol format
   * @returns {string} Broker-specific symbol format
   */
  formatSymbol(symbol) {
    // Override in specific adapters if needed
    return symbol;
  }

  /**
   * Get broker-specific error message
   * @param {Error} error - Original error
   * @returns {string} User-friendly error message
   */
  formatError(error) {
    return `Broker error: ${error.message}`;
  }
}