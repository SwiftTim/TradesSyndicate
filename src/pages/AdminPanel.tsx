import React, { useState, useEffect } from 'react';
import { Shield, Zap, AlertTriangle, Activity, Users, TrendingUp } from 'lucide-react';
import SignalCard from '../components/dashboard/SignalCard';
import { useWebSocket } from '../contexts/WebSocketContext';
import { adminAPI } from '../services/api';

interface SystemMetrics {
  active_users: number;
  linked_accounts: number;
  signals_today: number;
  system_load: number;
}

export default function AdminPanel() {
  const { signals, systemStatus } = useWebSocket();
  const [metrics, setMetrics] = useState<SystemMetrics>({
    active_users: 0,
    linked_accounts: 0,
    signals_today: 0,
    system_load: 0
  });
  const [killSwitchEnabled, setKillSwitchEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newSignal, setNewSignal] = useState({
    symbol: 'EURUSD',
    side: 'buy' as 'buy' | 'sell',
    price: 1.0850,
    size_reco: 2.0,
    confidence: 75,
    expires_in: 300 // seconds
  });

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const data = await adminAPI.getMetrics();
        setMetrics(data);
      } catch (error) {
        console.error('Failed to load metrics:', error);
      }
    };

    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleEmitSignal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await adminAPI.emitSignal(newSignal);
      // Reset form
      setNewSignal({
        symbol: 'EURUSD',
        side: 'buy',
        price: 1.0850,
        size_reco: 2.0,
        confidence: 75,
        expires_in: 300
      });
    } catch (error) {
      console.error('Failed to emit signal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteSignal = async (signalId: string) => {
    try {
      await adminAPI.execute(signalId);
    } catch (error) {
      console.error('Failed to execute signal:', error);
    }
  };

  const handleKillSwitch = async () => {
    try {
      await adminAPI.killSwitch(!killSwitchEnabled);
      setKillSwitchEnabled(!killSwitchEnabled);
    } catch (error) {
      console.error('Failed to toggle kill switch:', error);
    }
  };

  const metricCards = [
    {
      name: 'Active Users',
      value: metrics.active_users,
      icon: <Users className="h-6 w-6 text-blue-600" />,
      color: 'bg-blue-100 dark:bg-blue-900'
    },
    {
      name: 'Linked Accounts',
      value: metrics.linked_accounts,
      icon: <Activity className="h-6 w-6 text-green-600" />,
      color: 'bg-green-100 dark:bg-green-900'
    },
    {
      name: 'Signals Today',
      value: metrics.signals_today,
      icon: <TrendingUp className="h-6 w-6 text-purple-600" />,
      color: 'bg-purple-100 dark:bg-purple-900'
    },
    {
      name: 'System Load',
      value: `${metrics.system_load}%`,
      icon: <Activity className="h-6 w-6 text-orange-600" />,
      color: 'bg-orange-100 dark:bg-orange-900'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <Shield className="h-8 w-8 text-red-600 mr-3" />
                Admin Panel
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                System monitoring and signal management
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                systemStatus === 'online' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                System: {systemStatus}
              </div>
              
              <button
                onClick={handleKillSwitch}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                  killSwitchEnabled
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                <AlertTriangle className="h-4 w-4" />
                <span>{killSwitchEnabled ? 'Enable Trading' : 'KILL SWITCH'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Kill Switch Warning */}
        {killSwitchEnabled && (
          <div className="mb-6 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
              <p className="text-red-800 dark:text-red-200 font-medium">
                KILL SWITCH ACTIVATED: All trading has been suspended
              </p>
            </div>
          </div>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {metricCards.map((metric, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${metric.color} mr-4`}>
                  {metric.icon}
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{metric.name}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{metric.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Signal Generator */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <Zap className="h-5 w-5 text-yellow-500 mr-2" />
                Signal Generator
              </h2>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleEmitSignal} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Symbol
                    </label>
                    <select
                      value={newSignal.symbol}
                      onChange={(e) => setNewSignal({...newSignal, symbol: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="EURUSD">EUR/USD</option>
                      <option value="GBPUSD">GBP/USD</option>
                      <option value="USDJPY">USD/JPY</option>
                      <option value="BTCUSD">BTC/USD</option>
                      <option value="ETHUSD">ETH/USD</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Side
                    </label>
                    <select
                      value={newSignal.side}
                      onChange={(e) => setNewSignal({...newSignal, side: e.target.value as 'buy' | 'sell'})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="buy">Buy</option>
                      <option value="sell">Sell</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Price
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={newSignal.price}
                      onChange={(e) => setNewSignal({...newSignal, price: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Size Recommendation (%)
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      max="10"
                      step="0.1"
                      value={newSignal.size_reco}
                      onChange={(e) => setNewSignal({...newSignal, size_reco: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Confidence (%)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={newSignal.confidence}
                      onChange={(e) => setNewSignal({...newSignal, confidence: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Expires In (seconds)
                    </label>
                    <select
                      value={newSignal.expires_in}
                      onChange={(e) => setNewSignal({...newSignal, expires_in: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value={60}>1 minute</option>
                      <option value={300}>5 minutes</option>
                      <option value={900}>15 minutes</option>
                      <option value={1800}>30 minutes</option>
                      <option value={3600}>1 hour</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || killSwitchEnabled}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? 'Emitting Signal...' : 'Emit Signal'}
                </button>
              </form>
            </div>
          </div>

          {/* Active Signals */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Active Signals ({signals.length})
              </h2>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto">
              {signals.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">No active signals</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {signals.slice(0, 3).map((signal) => (
                    <SignalCard 
                      key={signal.id} 
                      signal={signal} 
                      onExecute={handleExecuteSignal}
                      showActions={true}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}