require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT) || 5432,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 20
});

pool.on('connect', () => {
    console.log('✅ Database connected successfully');
});

pool.on('error', (err) => {
    console.error('❌ Database connection error:', err);
});

module.exports = {
    query: (text, params, callback) => pool.query(text, params, callback),

    testConnection: () => {
        pool.query('SELECT NOW()', (err, res) => {
            if (err) {
                console.error('❌ Database connection failed:', err);
            } else {
                console.log('✅ Database connection test successful:', res.rows[0]);
            }
        });
    }
};
