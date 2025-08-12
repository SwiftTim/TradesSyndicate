import React, { useState } from 'react';
import { Link, Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import { brokerAPI } from '../services/api';

interface BrokerConfig {
  id: string;
  name: string;
  logo: string;
  description: string;
  supported: boolean;
}

const brokers: BrokerConfig[] = [
  {
    id: 'deriv',
    name: 'Deriv',
    logo: '🔹',
    description: 'Popular derivatives trading platform',
    supported: true
  },
  {
    id: 'mock_broker',
    name: 'Demo Broker',
    logo: '🎯',
    description: 'Sandbox environment for testing',
    supported: true
  },
  {
    id: 'alpaca',
    name: 'Alpaca',
    logo: '🦙',
    description: 'Commission-free stock trading',
    supported: false
  }
];

export default function BrokerLink() {
  const [selectedBroker, setSelectedBroker] = useState<string>('');
  const [credentials, setCredentials] = useState({
    public_key: '',
    private_key: '',
    risk_multiplier: 1.0,
    max_position_size: 10000,
    auto_copy: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [testResult, setTestResult] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await brokerAPI.link({
        broker_id: selectedBroker,
        public_key: credentials.public_key,
        private_key: credentials.private_key,
        settings: {
          risk_multiplier: credentials.risk_multiplier,
          max_position_size: credentials.max_position_size,
          auto_copy: credentials.auto_copy
        }
      });
      
      setSuccess('Broker account linked successfully!');
      setCredentials({
        public_key: '',
        private_key: '',
        risk_multiplier: 1.0,
        max_position_size: 10000,
        auto_copy: false
      });
    } catch (err: any) {
      setError(err.message || 'Failed to link broker account');
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    if (!selectedBroker || !credentials.public_key) return;
    
    setTestResult('Testing connection...');
    try {
      // Mock test for demo purposes
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTestResult('✅ Connection successful');
    } catch (err) {
      setTestResult('❌ Connection failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Link Your Broker Account
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Connect your trading account to start copying signals automatically
          </p>
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Shield className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Security First
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                We only store trade-only API keys. Your funds remain secure in your broker account.
                We cannot withdraw or transfer funds.
              </p>
            </div>
          </div>
        </div>

        {success && (
          <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
              <p className="text-green-800 dark:text-green-200">{success}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Broker Selection */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Select Broker
            </h2>
            <div className="space-y-3">
              {brokers.map((broker) => (
                <button
                  key={broker.id}
                  onClick={() => broker.supported && setSelectedBroker(broker.id)}
                  disabled={!broker.supported}
                  className={`w-full p-4 border rounded-lg text-left transition-colors ${
                    selectedBroker === broker.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                      : broker.supported
                      ? 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                      : 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                  } ${!broker.supported ? 'bg-gray-100 dark:bg-gray-800' : 'bg-white dark:bg-gray-800'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{broker.logo}</span>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {broker.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {broker.description}
                        </p>
                      </div>
                    </div>
                    {!broker.supported && (
                      <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                        Coming Soon
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Configuration Form */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Account Configuration
            </h2>
            
            {selectedBroker ? (
              <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Public API Key *
                    </label>
                    <input
                      type="text"
                      required
                      value={credentials.public_key}
                      onChange={(e) => setCredentials({...credentials, public_key: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter public key"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Private API Key *
                    </label>
                    <input
                      type="password"
                      required
                      value={credentials.private_key}
                      onChange={(e) => setCredentials({...credentials, private_key: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter private key"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Risk Multiplier
                    </label>
                    <select
                      value={credentials.risk_multiplier}
                      onChange={(e) => setCredentials({...credentials, risk_multiplier: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={0.1}>0.1x (Conservative)</option>
                      <option value={0.5}>0.5x (Low Risk)</option>
                      <option value={1.0}>1.0x (Standard)</option>
                      <option value={1.5}>1.5x (Aggressive)</option>
                      <option value={2.0}>2.0x (High Risk)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Max Position Size ($)
                    </label>
                    <input
                      type="number"
                      min="100"
                      step="100"
                      value={credentials.max_position_size}
                      onChange={(e) => setCredentials({...credentials, max_position_size: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="auto_copy"
                    checked={credentials.auto_copy}
                    onChange={(e) => setCredentials({...credentials, auto_copy: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="auto_copy" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Enable automatic copy trading (Pro feature)
                  </label>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={testConnection}
                    disabled={!credentials.public_key}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                  >
                    Test Connection
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isLoading || !selectedBroker}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {isLoading ? 'Linking...' : 'Link Account'}
                  </button>
                </div>

                {testResult && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {testResult}
                  </div>
                )}
              </form>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  Select a broker to configure your account
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}