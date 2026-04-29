// Import the express module
const express = require("express");
// Import the dotenv module and call the config method to load the environment variables
require("dotenv").config();
// Import the sanitize-html module
// import cors module
const cors = require("cors");
const sanitizeHtml = require("sanitize-html");

const allowedOrigins = [
  process.env.FRONTEND_URL1,
  process.env.FRONTEND_URL2,
].filter(Boolean);

const corsOptions = {
  origin: allowedOrigins.length > 0 ? allowedOrigins : true,
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-access-token",
    "x-setup-token",
  ],
};

const sanitizeValue = (value) => {
  if (typeof value === "string") {
    return sanitizeHtml(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (value && typeof value === "object") {
    const sanitizedObject = {};
    for (const key of Object.keys(value)) {
      sanitizedObject[key] = sanitizeValue(value[key]);
    }
    return sanitizedObject;
  }

  return value;
};

// Create a variable to hold the port number
const port = process.env.PORT;
// Create the webserver
const app = express();
app.use(cors(corsOptions));
// Import the Router
const router = require("./routes");
// Middleware to parse JSON bodies
app.use(express.json());
// Middleware to sanitize user input
app.use((req, res, next) => {
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  next();
});
// Add the routes to the application as a middleware
app.use(router);
// Start the webserver
app.listen(port, () => {
  console.log(`Server started on port http://localhost:${port}`);
});

// Export the webserver for use in the application
module.exports = app;
