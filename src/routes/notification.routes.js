const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification.controller");
const { requireAuth } = require("../middleware/auth.middleware");

/**
Notification Routes
Base path: /api/notifications
All endpoints require authentication.
*/
router.get("/", requireAuth, notificationController.getUserNotifications);
router.put("/read-all", requireAuth, notificationController.markAllAsRead);

router.put("/:id/read", requireAuth, notificationController.markAsRead);
router.delete("/:id", requireAuth, notificationController.deleteNotification);

module.exports = router;