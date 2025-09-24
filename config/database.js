require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 20
});

pool.on('connect', () => {
  console.log('Connected to AWS RDS PostgreSQL');
});

pool.on('error', (err) => {
  console.error('PostgreSQL error:', err);
});

module.exports = {
  query: (text, params, callback) => pool.query(text, params, callback),

  testConnection: () => {
    pool.query('SELECT NOW()', (err, res) => {
      if (err) {
        console.error('Database connection failed:', err);
      } else {
        console.log('Database connection test successful:', res.rows[0]);
      }
    });
  }
};
