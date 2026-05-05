const mysql = require("mysql2/promise");

const requiredDbEnv = ["DB_HOST", "DB_USER", "DB_PASS", "DB_NAME", "DB_PORT"];
const missingDbEnv = requiredDbEnv.filter((name) => !process.env[name]);
if (missingDbEnv.length > 0) {
  throw new Error(
    `Missing required database environment variables: ${missingDbEnv.join(", ")}`,
  );
}

const dbPort = Number(process.env.DB_PORT);
if (!Number.isInteger(dbPort) || dbPort <= 0) {
  throw new Error(
    `Invalid DB_PORT value: ${process.env.DB_PORT}. Must be a positive integer.`,
  );
}

const dbConfig = {
  connectionLimit: 10,
  port: dbPort,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  host: process.env.DB_HOST,
  waitForConnections: true,
  queueLimit: 0,
};

const pool = mysql.createPool(dbConfig);

const query = async (sql, params = []) => {
  const [rows] = await pool.execute(sql, params);
  return rows;
};

const getConnection = async () => {
  return await pool.getConnection();
};

module.exports = { query, pool, getConnection };
