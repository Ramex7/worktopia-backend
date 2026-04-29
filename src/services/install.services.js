// Import the pool from the db.config.js file
const { pool } = require("../config/db.config");
// Import the fs module to read our sql file
const fs = require("fs").promises;
const path = require("path");

function splitSqlStatements(sqlContent) {
  const statements = [];
  let current = "";
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBacktick = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < sqlContent.length; i += 1) {
    const char = sqlContent[i];
    const nextChar = sqlContent[i + 1];
    const previousChar = sqlContent[i - 1];

    if (inLineComment) {
      if (char === "\n") {
        inLineComment = false;
        current += char;
      }
      continue;
    }

    if (inBlockComment) {
      if (char === "*" && nextChar === "/") {
        inBlockComment = false;
        i += 1;
      }
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote && !inBacktick) {
      if (char === "-" && nextChar === "-") {
        inLineComment = true;
        i += 1;
        continue;
      }

      if (char === "/" && nextChar === "*") {
        inBlockComment = true;
        i += 1;
        continue;
      }
    }

    if (char === "'" && !inDoubleQuote && !inBacktick && previousChar !== "\\") {
      inSingleQuote = !inSingleQuote;
      current += char;
      continue;
    }

    if (char === '"' && !inSingleQuote && !inBacktick && previousChar !== "\\") {
      inDoubleQuote = !inDoubleQuote;
      current += char;
      continue;
    }

    if (char === "`" && !inSingleQuote && !inDoubleQuote) {
      inBacktick = !inBacktick;
      current += char;
      continue;
    }

    if (char === ";" && !inSingleQuote && !inDoubleQuote && !inBacktick) {
      const statement = current.trim();
      if (statement) {
        statements.push(statement);
      }
      current = "";
      continue;
    }

    current += char;
  }

  const finalStatement = current.trim();
  if (finalStatement) {
    statements.push(finalStatement);
  }

  return statements;
}

// Write a function to create the database tables
async function install() {
  // Create a variable to hold the path to the sql file
  const queryfile = path.join(__dirname, "sql", "schema.sql");

  // Temporary variables used to store all queries and the return message
  let finalMessage = { message: "All tables are created", status: 200 };
  let connection;

  try {
    // Read the sql file asynchronously
    const fileContent = await fs.readFile(queryfile, "utf-8");
    const queries = splitSqlStatements(fileContent);

    connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      for (let i = 0; i < queries.length; i += 1) {
        await connection.query(queries[i]);
        console.log(`Query ${i + 1} executed successfully`);
      }

      await connection.commit();
    } catch (err) {
      finalMessage.message = "Not all tables are created";
      finalMessage.status = 500;

      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(`Rollback failed: ${rollbackError.message}`);
        finalMessage.message = "Database install failed and rollback was unsuccessful";
      }

      console.error(`Error executing schema installation: ${err.message}`);
    }
  } catch (err) {
    console.error(`Install failed: ${err.message}`);
    finalMessage.message = connection
      ? "Failed to initialize database schema"
      : "Failed to read SQL file";
    finalMessage.status = 500;
  } finally {
    if (connection) {
      connection.release();
    }
  }

  // Return the final message
  return finalMessage;
}

// Export the install function for use in the controller
module.exports = { install };
