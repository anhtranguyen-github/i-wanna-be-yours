import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    user: process.env.MYSQL_USER || 'hanabira_user',
    password: process.env.MYSQL_PASSWORD || 'hanabira_password',
    database: process.env.MYSQL_DATABASE || 'hanabira_auth',
    port: Number(process.env.MYSQL_PORT) || 3307,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

export default pool;
