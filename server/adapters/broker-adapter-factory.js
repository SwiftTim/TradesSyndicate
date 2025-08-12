import { DerivAdapter } from './deriv-adapter.js';
import { MockBrokerAdapter } from './mock-broker-adapter.js';

export class BrokerAdapterFactory {
  static create(brokerId, credentials) {
    switch (brokerId) {
      case 'deriv':
        return new DerivAdapter(credentials);
      case 'mock_broker':
        return new MockBrokerAdapter(credentials);
      default:
        throw new Error(`Unsupported broker: ${brokerId}`);
    }
  }

  static getSupportedBrokers() {
    return [
      {
        id: 'deriv',
        name: 'Deriv',
        description: 'Popular derivatives trading platform',
        supported: true
      },
      {
        id: 'mock_broker',
        name: 'Demo Broker',
        description: 'Sandbox environment for testing',
        supported: true
      }
    ];
  }
}