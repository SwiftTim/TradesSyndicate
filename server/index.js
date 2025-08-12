import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { WebSocketServer } from 'ws';
import http from 'http';
import authRoutes from './routes/auth.js';
import signalRoutes from './routes/signals.js';
import userRoutes from './routes/user.js';
import brokerRoutes from './routes/broker.js';
import adminRoutes from './routes/admin.js';
import billingRoutes from './routes/billing.js';
import executeRoutes from './routes/execute.js';
import { authenticateToken } from './middleware/auth.js';
import { initializeDatabase } from './utils/database.js';
import { SignalEngine } from './services/signal-engine.js';
import { WebSocketManager } from './services/websocket-manager.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Initialize services
const signalEngine = new SignalEngine();
const wsManager = new WebSocketManager(wss);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : 'http://localhost:5173',
  credentials: true
}));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/signals', signalRoutes);
app.use('/api/v1/user', authenticateToken, userRoutes);
app.use('/api/v1/broker', authenticateToken, brokerRoutes);
app.use('/api/v1/admin', authenticateToken, adminRoutes);
app.use('/api/v1/billing', authenticateToken, billingRoutes);
app.use('/api/v1/execute', authenticateToken, executeRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Initialize database and start server
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    await initializeDatabase();
    console.log('Database initialized successfully');
    
    // Start signal engine
    signalEngine.start();
    console.log('Signal engine started');
    
    // Set up signal broadcasting
    signalEngine.on('newSignal', (signal) => {
      wsManager.broadcast({
        type: 'signal_update',
        signal
      });
    });
    
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`WebSocket server ready on ws://localhost:${PORT}/ws`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  signalEngine.stop();
  server.close(() => {
    console.log('Process terminated');
  });
});