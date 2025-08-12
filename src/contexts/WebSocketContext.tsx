import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

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

interface WebSocketContextType {
  signals: Signal[];
  isConnected: boolean;
  systemStatus: 'online' | 'offline' | 'maintenance';
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [systemStatus, setSystemStatus] = useState<'online' | 'offline' | 'maintenance'>('online');

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:3001/ws`);
    
    ws.onopen = () => {
      setIsConnected(true);
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'signal_update':
          setSignals(prev => {
            const updated = prev.filter(s => s.id !== data.signal.id);
            if (data.signal.status === 'active') {
              return [...updated, data.signal].sort((a, b) => 
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
              );
            }
            return updated;
          });
          break;
        case 'system_status':
          setSystemStatus(data.status);
          break;
      }
    };
    
    ws.onclose = () => {
      setIsConnected(false);
    };
    
    return () => ws.close();
  }, []);

  return (
    <WebSocketContext.Provider value={{ signals, isConnected, systemStatus }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}