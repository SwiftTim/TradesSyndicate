import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'copytrade_syndicate',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const query = (text, params) => pool.query(text, params);

export const initializeDatabase = async () => {
  try {
    // Create tables
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'investor',
        subscription_status VARCHAR(50) DEFAULT 'free',
        subscription_id VARCHAR(255),
        subscription_data JSONB,
        preferences JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS brokers (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        adapter_config_schema JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS linked_accounts (
        id UUID PRIMARY KEY,
        user_id UUID REFERENCES users(id),
        broker_id VARCHAR(50) REFERENCES brokers(id),
        public_key VARCHAR(255) NOT NULL,
        private_key_encrypted TEXT NOT NULL,
        settings_json JSONB DEFAULT '{}',
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS signals (
        id UUID PRIMARY KEY,
        symbol VARCHAR(20) NOT NULL,
        side VARCHAR(10) NOT NULL,
        price DECIMAL(18,8) NOT NULL,
        size_reco DECIMAL(10,4) NOT NULL,
        confidence INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        meta JSONB DEFAULT '{}'
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS executions (
        id UUID PRIMARY KEY,
        signal_id UUID REFERENCES signals(id),
        linked_account_id UUID REFERENCES linked_accounts(id),
        order_status VARCHAR(50) NOT NULL,
        filled_qty DECIMAL(18,8) DEFAULT 0,
        filled_price DECIMAL(18,8) DEFAULT 0,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        meta JSONB DEFAULT '{}'
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        level VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        metadata JSONB DEFAULT '{}',
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default brokers
    await query(`
      INSERT INTO brokers (id, name, adapter_config_schema)
      VALUES 
        ('deriv', 'Deriv', '{"required": ["public_key", "private_key"]}'),
        ('mock_broker', 'Demo Broker', '{"required": ["public_key", "private_key"]}')
      ON CONFLICT (id) DO NOTHING
    `);

    // Create default admin user if not exists
    const adminExists = await query(
      'SELECT id FROM users WHERE email = $1',
      ['admin@copytrade.com']
    );

    if (adminExists.rows.length === 0) {
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.default.hash('admin123', 12);
      
      await query(`
        INSERT INTO users (id, email, password_hash, role)
        VALUES (gen_random_uuid(), $1, $2, $3)
      `, ['admin@copytrade.com', hashedPassword, 'admin']);
      
      console.log('Default admin user created: admin@copytrade.com / admin123');
    }

    // Create indexes for better performance
    await query('CREATE INDEX IF NOT EXISTS idx_signals_status_expires ON signals(status, expires_at)');
    await query('CREATE INDEX IF NOT EXISTS idx_executions_signal_id ON executions(signal_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_linked_accounts_user_id ON linked_accounts(user_id)');
    
    console.log('Database initialization completed');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

export default pool;