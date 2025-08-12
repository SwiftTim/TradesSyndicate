import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Clock, Zap } from 'lucide-react';

interface Signal {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  price: number;
  size_reco: number;
  confidence: number;
  timestamp: string;
  expires_at: string;
  status: 'active' | 'expired' | 'executed';
}

interface SignalCardProps {
  signal: Signal;
  onExecute?: (signalId: string) => void;
  showActions?: boolean;
}

export default function SignalCard({ signal, onExecute, showActions = false }: SignalCardProps) {
  const [timeToExpiry, setTimeToExpiry] = useState<number>(0);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(signal.expires_at).getTime();
      const remaining = Math.max(0, expiry - now);
      setTimeToExpiry(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [signal.expires_at]);

  const formatTimeRemaining = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
    return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
  };

  const getSideColor = (side: string) => {
    return side === 'buy' 
      ? 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200'
      : 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${getSideColor(signal.side)}`}>
            {signal.side === 'buy' ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{signal.symbol}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {signal.side.toUpperCase()} @ ${signal.price.toFixed(4)}
            </p>
          </div>
        </div>
        
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getConfidenceColor(signal.confidence)}`}>
          {signal.confidence}% confidence
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Size Recommendation</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{signal.size_reco}%</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Time Remaining</p>
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4 text-orange-500" />
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatTimeRemaining(timeToExpiry)}
            </p>
          </div>
        </div>
      </div>

      {showActions && (
        <div className="flex justify-end">
          <button
            onClick={() => onExecute?.(signal.id)}
            disabled={signal.status !== 'active' || timeToExpiry <= 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
          >
            <Zap className="h-4 w-4" />
            <span>Execute</span>
          </button>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Generated: {new Date(signal.timestamp).toLocaleString()}
        </p>
      </div>
    </div>
  );
}