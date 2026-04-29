// import the mysql2 module promise wrapper
const mysql = require("mysql2/promise");

const requiredDbEnv = ["DB_HOST", "DB_USER", "DB_PASS", "DB_NAME", "DB_PORT"];
const missingDbEnv = requiredDbEnv.filter((name) => !process.env[name]);
if (missingDbEnv.length > 0) {
  throw new Error(
    `Missing required database environment variables: ${missingDbEnv.join(", ")}`
  );
}

const dbPort = Number(process.env.DB_PORT);
if (!Number.isInteger(dbPort) || dbPort <= 0) {
  throw new Error(
    `Invalid DB_PORT value: ${process.env.DB_PORT}. DB_PORT must be a positive integer.`
  );
}

// prepare connection parameter we use to connect to the database
const dbConfig = {
  connectionLimit: 10,
  port: dbPort,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  host: process.env.DB_HOST,
};

// create a connection pool
const pool = mysql.createPool(dbConfig);
// prepare a function that will execute the SQL quires asynchronously
// and return the result as a promise
const query = async (sql, params) => {
  const [rows, fields] = await pool.execute(sql, params);
  return rows;
};

// export the query function
module.exports = {query, pool}; // pool is needed for transaction