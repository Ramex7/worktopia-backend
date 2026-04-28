// Import the query function from the db.config.js file
const conn = require("../config/db.config");
// Import the fs module to read our sql file
const fs = require("fs").promises;
const path = require("path");

// Write a function to create the database tables
async function install() {
  // Create a variable to hold the path to the sql file
  const queryfile = path.join(__dirname, "sql", "schema.sql");

  // Temporary variables used to store all queries and the return message
  let queries = [];
  let finalMessage = { message: "All tables are created", status: 200 };

  try {
    // Read the sql file asynchronously
    const fileContent = await fs.readFile(queryfile, "utf-8");
    const lines = fileContent.split("\n");

    // Remove comments and empty lines
    const cleanedLines = lines.filter(line => !line.trim().startsWith("--") && line.trim() !== "");
    const sqlContent = cleanedLines.join("\n");
    queries = sqlContent.split(";").map(q => q.trim()).filter(q => q.length > 0);

    // Loop through the queries and execute them one by one asynchronously
    for (let i = 0; i < queries.length; i++) {
      try {
        await conn.query(queries[i]);
        console.log(`Query ${i + 1} executed successfully`);
      } catch (err) {
        console.error(`Error executing query ${i + 1}: ${err.message}`);
        finalMessage.message = "Not all tables are created";
        finalMessage.status = 500;
      }
    }
  } catch (err) {
    console.error(`Error reading the SQL file: ${err.message}`);
    finalMessage.message = "Failed to read SQL file";
    finalMessage.status = 500;
  }

  // Return the final message
  return finalMessage;
}

// Export the install function for use in the controller
module.exports = { install };