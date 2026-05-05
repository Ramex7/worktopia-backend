const express = require("express");
const router = express.Router();
const connectionController = require("../controllers/connection.controller");
const { requireAuth } = require("../middleware/auth.middleware");

/**
Connection Routes
Base path: /api/connections
All endpoints require authentication.
Static routes defined before parameterized routes to prevent shadowing.
*/
router.get("/pending", requireAuth, connectionController.getPendingRequests);
router.get("/", requireAuth, connectionController.getConnections);

router.post("/request/:userId", requireAuth, connectionController.sendConnectionRequest);
router.put("/accept/:userId", requireAuth, connectionController.acceptConnectionRequest);
router.delete("/reject/:userId", requireAuth, connectionController.rejectConnectionRequest);
router.delete("/remove/:userId", requireAuth, connectionController.removeConnection);

module.exports = router;