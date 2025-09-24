const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 20
});

pool.on('connect', function() {
    console.log('Database connected successfully');
});

pool.on('error', function(err) {
    console.log('Database connection error:', err);
});

module.exports = {
    query: function(text, params, callback) {
        return pool.query(text, params, callback);
    },
    
    testConnection: function() {
        pool.query('SELECT NOW()', function(err, res) {
            if (err) {
                console.log('Database connection failed:', err);
            } else {
                console.log('Database connection test successful:', res.rows[0]);
            }
        });
    }
};