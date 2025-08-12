import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, DollarSign, TrendingUp, Users, AlertCircle } from 'lucide-react';
import SignalCard from '../components/dashboard/SignalCard';
import SystemStatus from '../components/dashboard/SystemStatus';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useAuth } from '../contexts/AuthContext';
import { userAPI, brokerAPI } from '../services/api';

interface DashboardData {
  linked_accounts: number;
  total_pnl: number;
  active_signals: number;
  subscription_status: string;
}

export default function Dashboard() {
  const { signals } = useWebSocket();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    linked_accounts: 0,
    total_pnl: 0,
    active_signals: 0,
    subscription_status: 'free'
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const data = await userAPI.getDashboard();
        setDashboardData(data);
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const stats = [
    {
      name: 'Active Signals',
      value: signals.length,
      icon: <TrendingUp className="h-6 w-6 text-blue-600" />,
      color: 'bg-blue-100 dark:bg-blue-900'
    },
    {
      name: 'Linked Accounts',
      value: dashboardData.linked_accounts,
      icon: <Users className="h-6 w-6 text-green-600" />,
      color: 'bg-green-100 dark:bg-green-900'
    },
    {
      name: 'Total P&L',
      value: `$${dashboardData.total_pnl.toFixed(2)}`,
      icon: <DollarSign className="h-6 w-6 text-purple-600" />,
      color: 'bg-purple-100 dark:bg-purple-900'
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome back, {user?.email}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Monitor your trading signals and performance
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <SystemStatus />
              <Link
                to="/broker-link"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Link Broker</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Subscription Status */}
        {dashboardData.subscription_status === 'free' && (
          <div className="mb-6 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-3" />
              <div className="flex-1">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  You're on the free tier. Upgrade to Pro for automated copy trading and advanced features.
                </p>
              </div>
              <button className="bg-yellow-600 text-white px-4 py-2 rounded text-sm hover:bg-yellow-700 transition-colors">
                Upgrade Now
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color} mr-4`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Signals Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Live Trading Signals
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Real-time signals from our AI trading engine
            </p>
          </div>
          
          <div className="p-6">
            {signals.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No active signals
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Waiting for new trading opportunities...
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {signals.slice(0, 6).map((signal) => (
                  <SignalCard key={signal.id} signal={signal} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/broker-link"
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Plus className="h-8 w-8 text-blue-600 mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">Link Broker</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Connect trading account</p>
            </Link>
            
            <Link
              to="/settings"
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Users className="h-8 w-8 text-green-600 mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">Account Settings</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Manage preferences</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}