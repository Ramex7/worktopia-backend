// import the mysql2 module promise wrapper
const mysql = require("mysql2/promise");
// prepare connection parameter we use to connect to the database
const dbConfig = {
  connectionLimit: 10,
  port: process.env.DB_PORT,
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