const express = require("express");
const router = express.Router();
const installController = require("../controllers/install.controller");
const { requireSetupToken } = require("../middleware/auth.middleware");

/**
Install Routes
Base path: /api (mounted in index.js as /api)
Protected by x-setup-token header
*/
router.post("/install", requireSetupToken, installController.install);

module.exports = router;