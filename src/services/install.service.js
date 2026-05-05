const { pool } = require("../config/db.config");
const { error: logError } = require("../utils/logger.util");
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

  for (let i = 0; i < sqlContent.length; i++) {
    const char = sqlContent[i];
    const nextChar = sqlContent[i + 1];
    const prevChar = sqlContent[i - 1];

    if (inLineComment) {
      if (char === "\n") inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (char === "*" && nextChar === "/") {
        inBlockComment = false;
        i++;
      }
      continue;
    }
    if (!inSingleQuote && !inDoubleQuote && !inBacktick) {
      if (char === "-" && nextChar === "-") {
        inLineComment = true;
        i++;
        continue;
      }
      if (char === "/" && nextChar === "*") {
        inBlockComment = true;
        i++;
        continue;
      }
    }
    if (char === "'" && !inDoubleQuote && !inBacktick && prevChar !== "\\") {
      inSingleQuote = !inSingleQuote;
      current += char;
      continue;
    }
    if (char === '"' && !inSingleQuote && !inBacktick && prevChar !== "\\") {
      inDoubleQuote = !inDoubleQuote;
      current += char;
      continue;
    }
    if (char === "`" && !inSingleQuote && !inDoubleQuote) {
      inBacktick = !inBacktick;
      current += char;
      continue;
    }
    if (
      char === ";" &&
      !inSingleQuote &&
      !inDoubleQuote &&
      !inBacktick &&
      !inLineComment &&
      !inBlockComment
    ) {
      const stmt = current.trim();
      if (stmt) statements.push(stmt);
      current = "";
      continue;
    }
    current += char;
  }
  const finalStmt = current.trim();
  if (finalStmt) statements.push(finalStmt);
  return statements;
}

async function install() {
  const queryFile = path.join(__dirname, "sql", "schema.sql");
  let finalMessage = {
    message: "Database schema installed successfully",
    status: 200,
  };
  let connection;

  try {
    const fileContent = await fs.readFile(queryFile, "utf-8");
    const queries = splitSqlStatements(fileContent);
    connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      for (const q of queries) await connection.query(q);
      await connection.commit();
    } catch (err) {
      finalMessage.message = "Schema installation failed";
      finalMessage.status = 500;
      try {
        await connection.rollback();
      } catch (rbErr) {
        logError("Rollback failed: " + rbErr.message);
        finalMessage.message = "Install failed and rollback was unsuccessful";
      }
      logError("Schema execution error: " + err.message);
    }
  } catch (err) {
    logError("Install service error: " + err.message);
    finalMessage.message = connection
      ? "Failed to initialize database schema"
      : "Failed to read SQL file";
    finalMessage.status = 500;
  } finally {
    if (connection) connection.release();
  }
  return finalMessage;
}

module.exports = { install };
