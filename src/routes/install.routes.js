// import the express module
const express = require("express");
// call the router method from express to create the router
const router = express.Router();
// import the install controller
const installController = require("../controllers/install.controllers");

const requireAdminSetupToken = (req, res, next) => {
  const expectedToken = process.env.SETUP_TOKEN;
  const providedToken = req.get("x-setup-token");

  if (!expectedToken) {
    return res.status(500).json({ message: "SETUP_TOKEN is not configured" });
  }

  if (providedToken !== expectedToken) {
    return res.status(403).json({ message: "Forbidden" });
  }

  return next();
};

// create a route to handel the install request on post
router.post("/install", requireAdminSetupToken, installController.install);

// Export the router
module.exports = router;
