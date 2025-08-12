# CopyTrade Syndicate MVP

A comprehensive copy trading platform that allows users to follow AI-powered trading signals automatically or manually. Built with React, Node.js, and PostgreSQL.

## 🚀 Features

### Core Features
- **Real-time Trading Signals**: AI-powered signals with confidence scores and expiry times
- **Secure Broker Integration**: Trade-only API key storage with encryption
- **Copy Trading**: Automated or manual signal execution across multiple broker accounts
- **Risk Management**: Configurable risk multipliers and position size limits
- **Admin Panel**: Signal generation, system monitoring, and emergency kill switch
- **Subscription Billing**: Stripe integration with free and pro tiers

### Security Features
- **Encrypted API Keys**: All broker credentials encrypted at rest
- **Trade-Only Access**: No withdrawal permissions required
- **JWT Authentication**: Secure user sessions with role-based access
- **Rate Limiting**: API protection against abuse
- **Audit Logging**: Comprehensive action tracking

## 🏗️ Architecture

### Frontend (React + Tailwind CSS)
- Modern, responsive design with dark/light theme support
- Real-time WebSocket integration for live signal updates
- Secure broker linking with encrypted credential storage
- Role-based access control (Admin, Trader, Investor)

### Backend (Node.js + Express)
- RESTful API with comprehensive endpoint coverage
- WebSocket server for real-time updates
- Signal engine with configurable mock data
- Broker adapter pattern for multi-exchange support
- Execution orchestrator for automated copy trading

### Database (PostgreSQL)
- Robust data models with proper relationships
- Encrypted sensitive data storage
- Performance optimized with strategic indexing
- Audit trail for all critical operations

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- Docker & Docker Compose (optional)
- Stripe account (for billing)

## 🛠️ Installation & Setup

### Option 1: Docker (Recommended)

1. **Clone and setup**:
   ```bash
   git clone <repository-url>
   cd copytrade-syndicate
   cp .env.example .env
   ```

2. **Configure environment variables** in `.env`:
   ```env
   JWT_SECRET=your-super-secure-jwt-secret
   ENCRYPTION_KEY=your-32-byte-encryption-key
   STRIPE_SECRET_KEY=sk_test_your_stripe_key
   ```

3. **Start with Docker**:
   ```bash
   docker-compose up -d
   ```

4. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - Default admin: admin@copytrade.com / admin123

### Option 2: Manual Setup

1. **Database Setup**:
   ```bash
   # Install PostgreSQL and create database
   createdb copytrade_syndicate
   ```

2. **Backend Setup**:
   ```bash
   npm install
   cp .env.example .env
   # Configure .env with your settings
   npm run server:dev
   ```

3. **Frontend Setup**:
   ```bash
   npm run client:dev
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DB_HOST` | PostgreSQL host | Yes |
| `DB_PORT` | PostgreSQL port | Yes |
| `DB_NAME` | Database name | Yes |
| `DB_USER` | Database user | Yes |
| `DB_PASSWORD` | Database password | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `ENCRYPTION_KEY` | API key encryption key | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key | Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | No |
| `FRONTEND_URL` | Frontend URL for CORS | No |

### Broker Configuration

The platform supports multiple brokers through an adapter pattern:

- **Deriv**: Popular derivatives platform
- **Mock Broker**: Sandbox environment for testing

## 📊 API Documentation

### Authentication Endpoints
- `POST /api/v1/auth/signup` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/profile` - Get user profile

### Signal Endpoints
- `GET /api/v1/signals/latest` - Get active signals
- `GET /api/v1/signals/history` - Get signal history
- `GET /api/v1/signals/:id` - Get specific signal

### User Endpoints
- `GET /api/v1/user/dashboard` - Dashboard data
- `GET /api/v1/user/history` - Trading history
- `PUT /api/v1/user/preferences` - Update preferences

### Broker Endpoints
- `POST /api/v1/broker/link` - Link broker account
- `GET /api/v1/broker/linked` - Get linked accounts
- `POST /api/v1/broker/test/:accountId` - Test connection

### Admin Endpoints (Admin Only)
- `GET /api/v1/admin/health` - System health
- `GET /api/v1/admin/metrics` - System metrics
- `POST /api/v1/admin/signals` - Emit signal
- `POST /api/v1/admin/kill-switch` - Emergency stop
- `POST /api/v1/execute` - Execute signal

## 🧪 Testing

### Running Tests
```bash
npm test
```

### Test Coverage Areas
- Authentication flows
- Signal generation and processing
- Broker adapter functionality
- Execution orchestration
- API endpoint validation

## 📱 Usage Guide

### For Investors
1. **Sign Up**: Create account with email/password
2. **Link Broker**: Add trade-only API credentials
3. **Configure Risk**: Set risk multiplier and limits
4. **Monitor Signals**: View real-time trading opportunities
5. **Copy Trading**: Enable auto-copy or manual execution

### For Admins
1. **Access Admin Panel**: Login with admin credentials
2. **Monitor System**: View metrics and health status
3. **Generate Signals**: Create custom trading signals
4. **Execute Trades**: Trigger signal distribution
5. **Emergency Controls**: Use kill switch when needed

## 🔒 Security Considerations

- **API Keys**: All broker credentials encrypted with AES-256
- **Authentication**: JWT tokens with role-based permissions
- **Data Protection**: HTTPS enforcement and input validation
- **Rate Limiting**: Protection against API abuse
- **Audit Trail**: Complete logging of all critical actions

## 🚀 Deployment

### Production Checklist
- [ ] Update environment variables for production
- [ ] Configure SSL certificates
- [ ] Set up database backups
- [ ] Configure monitoring and logging
- [ ] Test Stripe webhook integration
- [ ] Verify broker API credentials
- [ ] Set up domain and DNS

### Scaling Considerations
- Use Redis for WebSocket scaling
- Implement database read replicas
- Add CDN for static assets
- Configure load balancing
- Monitor system metrics

## 🛠️ Development

### Project Structure
```
├── src/                 # React frontend
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components
│   ├── contexts/       # React contexts
│   └── services/       # API services
├── server/             # Node.js backend
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── adapters/       # Broker adapters
│   ├── middleware/     # Express middleware
│   └── utils/          # Utilities
└── docker-compose.yml  # Docker configuration
```

### Adding New Brokers
1. Create new adapter extending `BrokerAdapter`
2. Implement required methods (`testConnection`, `placeOrder`, etc.)
3. Add to `BrokerAdapterFactory`
4. Update database with broker configuration

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation
- Review existing issues
- Create new issue with detailed description

## 🔮 Roadmap

- [ ] Mobile application
- [ ] Advanced charting and analytics
- [ ] Social trading features
- [ ] Additional broker integrations
- [ ] Portfolio management tools
- [ ] Advanced risk management