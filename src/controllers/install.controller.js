const installService = require("../services/install.service");
const { successResponse, errorResponse } = require("../utils/response.util");
const { error: logError } = require("../utils/logger.util");

const installController = {
  async install(req, res) {
    try {
      const result = await installService.install();
      const statusCode =
        Number.isInteger(result?.status) &&
        result.status >= 200 &&
        result.status < 600
          ? result.status
          : 500;
      const message = result?.message || "Database installation completed";

      if (statusCode >= 400)
        return res.status(statusCode).json(errorResponse(message));
      return res.status(statusCode).json(successResponse(null, message));
    } catch (error) {
      logError("Install controller error: " + error.message);
      return res
        .status(500)
        .json(errorResponse("Database installation failed", error.message));
    }
  },
};

module.exports = installController;
