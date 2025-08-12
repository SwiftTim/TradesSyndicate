import React from 'react';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { useWebSocket } from '../../contexts/WebSocketContext';

export default function SystemStatus() {
  const { isConnected, systemStatus } = useWebSocket();

  const getStatusIcon = () => {
    if (!isConnected) return <WifiOff className="h-5 w-5 text-red-500" />;
    if (systemStatus === 'maintenance') return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    return <Wifi className="h-5 w-5 text-green-500" />;
  };

  const getStatusText = () => {
    if (!isConnected) return 'Disconnected';
    if (systemStatus === 'maintenance') return 'Maintenance Mode';
    return 'Connected';
  };

  const getStatusColor = () => {
    if (!isConnected) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (systemStatus === 'maintenance') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  };

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
      {getStatusIcon()}
      <span>{getStatusText()}</span>
    </div>
  );
}