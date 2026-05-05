const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { requireAuth } = require("../middleware/auth.middleware");

/**
Auth Routes
Base path: /api/auth
Public: register, login, refresh, check-email
Protected: me
*/
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.get("/me", requireAuth, authController.me);
router.get("/check-email", authController.checkEmail);

module.exports = router;
