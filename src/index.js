// Import the express module
const express = require("express");
// Import the dotenv module and call the config method to load the environment variables
require("dotenv").config();
// Import the sanitize-html module
// import cors module
const cors = require("cors");
const corsOptions = {
  origin: [process.env.FRONTEND_URL1, process.env.FRONTEND_URL2],
  allowedHeaders: ["Content-Type", "Authorization", "x-access-token"],
};
const sanitizeHtml = require("sanitize-html");
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
    for (let key in req.body) {
      if (req.body.hasOwnProperty(key)) {
        req.body[key] = sanitizeHtml(req.body[key]);
      }
    }
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