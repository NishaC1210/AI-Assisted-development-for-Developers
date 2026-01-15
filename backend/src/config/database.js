const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5433,
  database: process.env.DB_NAME || 'dashboard_db',
  user: process.env.DB_USER || 'dashboard_user',
  password: process.env.DB_PASSWORD || 'dashboard_secret_password',
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;

