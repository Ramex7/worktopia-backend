const { error: logError } = require("../utils/logger.util");

const healthController = {
  async healthCheck(req, res) {
    try {
      return res.status(200).json({
        success: true,
        message: "Worktopia Backend is running successfully!",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        endpoints: {
          auth: "/api/auth",
          candidates: "/api/candidates",
          companies: "/api/companies",
          jobs: "/api/jobs",
          notifications: "/api/notifications",
          connections: "/api/connections",
          posts: "/api/posts",
        },
      });
    } catch (error) {
      logError("healthCheck controller error: " + error.message);
      return res.status(500).json({
        success: false,
        message: "Health check failed",
        error: error.message,
      });
    }
  },
};

module.exports = healthController;
