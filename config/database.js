const { Pool } = require('pg');
require('dotenv').config();

// Create database connection
const pool = new Pool({
  host: "localhost",
  port: "5432",
  database: "natesa-digitaldreamer-db",
  user: "postgres",
  password: "DigitalDreamer",
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

module.exports = {
  query: query,
  testConnection: testConnection
};