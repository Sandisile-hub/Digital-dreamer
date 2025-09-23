import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Create database connection pool
const pool = new pg.Pool({
  host: process.env.PG_HOST || "natesa-digitaldreamer-db.ctm44wy40k1z.eu-north-1.rds.amazonaws.com",
  port: process.env.PG_PORT || 5432,
  user: process.env.PG_USER || "postgres",
  password: process.env.PG_PASSWORD || "DigitalDreamer",
  database: process.env.PG_DATABASE || "natesa-digitaldreamer-db",
  ssl: {
    rejectUnauthorized: false // Adjust based on your SSL certificate setup
  },
  // Optional: Pool configuration
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // how long to wait for a connection
});

// Test connection function
function testConnection() {
  pool.query('SELECT NOW()', function(error, result) {
    if (error) {
      console.log('Database connection failed:', error);
    } else {
      console.log('Database connected successfully');
      console.log('Current time:', result.rows[0].now);
    }
  });
}

// Simple query function
function query(text, params, callback) {
  return pool.query(text, params, callback);
}

// Alternative promise-based query function (recommended)
async function queryAsync(text, params) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    throw error;
  }
}

// Export both CommonJS and ES modules style
export {
  query,
  queryAsync,
  testConnection,
  pool
};

export default {
  query,
  queryAsync,
  testConnection,
  pool
};