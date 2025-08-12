export class WebSocketManager {
  constructor(wss) {
    this.wss = wss;
    this.clients = new Set();
    
    this.wss.on('connection', (ws) => {
      console.log('WebSocket client connected');
      this.clients.add(ws);
      
      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connection',
        message: 'Connected to CopyTrade Syndicate'
      }));
      
      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        this.clients.delete(ws);
      });
      
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });
  }

  broadcast(data) {
    const message = JSON.stringify(data);
    const deadClients = [];
    
    this.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        try {
          client.send(message);
        } catch (error) {
          console.error('Error sending to client:', error);
          deadClients.push(client);
        }
      } else {
        deadClients.push(client);
      }
    });
    
    // Clean up dead connections
    deadClients.forEach(client => {
      this.clients.delete(client);
    });
  }

  getClientCount() {
    return this.clients.size;
  }
}