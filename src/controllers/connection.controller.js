const connectionService = require("../services/connection.service");
const {
  successResponse,
  errorResponse,
  paginatedResponse,
} = require("../utils/response.util");
const { validateId } = require("../utils/validation.util");
const { error: logError } = require("../utils/logger.util");

const connectionController = {
  async sendConnectionRequest(req, res) {
    try {
      const targetValidation = validateId(req.params.userId);
      if (!targetValidation.valid)
        return res.status(400).json(errorResponse(targetValidation.message));

      const requesterId = req.user.id;
      const targetUserId = targetValidation.sanitized;
      if (requesterId === targetUserId)
        return res
          .status(400)
          .json(errorResponse("Cannot connect to yourself"));

      const result = await connectionService.sendConnectionRequest(
        requesterId,
        targetUserId,
      );
      if (result.error)
        return res.status(result.status).json(errorResponse(result.error));
      return res
        .status(200)
        .json(successResponse(result.connection, "Connection request sent"));
    } catch (error) {
      logError("sendConnectionRequest controller error: " + error.message);
      return res
        .status(500)
        .json(errorResponse("Failed to send connection request"));
    }
  },

  async acceptConnectionRequest(req, res) {
    try {
      const requesterValidation = validateId(req.params.userId);
      if (!requesterValidation.valid)
        return res.status(400).json(errorResponse(requesterValidation.message));

      const accepterId = req.user.id;
      const requesterId = requesterValidation.sanitized;
      const result = await connectionService.acceptConnectionRequest(
        requesterId,
        accepterId,
      );
      if (result.error)
        return res.status(result.status).json(errorResponse(result.error));
      return res
        .status(200)
        .json(
          successResponse(result.connection, "Connection request accepted"),
        );
    } catch (error) {
      logError("acceptConnectionRequest controller error: " + error.message);
      return res
        .status(500)
        .json(errorResponse("Failed to accept connection request"));
    }
  },

  async rejectConnectionRequest(req, res) {
    try {
      const requesterValidation = validateId(req.params.userId);
      if (!requesterValidation.valid)
        return res.status(400).json(errorResponse(requesterValidation.message));

      const rejecterId = req.user.id;
      const requesterId = requesterValidation.sanitized;
      const result = await connectionService.rejectConnectionRequest(
        requesterId,
        rejecterId,
      );
      if (result.error)
        return res.status(result.status).json(errorResponse(result.error));
      return res
        .status(200)
        .json(successResponse(null, "Connection request rejected"));
    } catch (error) {
      logError("rejectConnectionRequest controller error: " + error.message);
      return res
        .status(500)
        .json(errorResponse("Failed to reject connection request"));
    }
  },

  async removeConnection(req, res) {
    try {
      const targetValidation = validateId(req.params.userId);
      if (!targetValidation.valid)
        return res.status(400).json(errorResponse(targetValidation.message));

      const removerId = req.user.id;
      const targetUserId = targetValidation.sanitized;
      const result = await connectionService.removeConnection(
        removerId,
        targetUserId,
      );
      if (result.error)
        return res.status(result.status).json(errorResponse(result.error));
      return res.status(200).json(successResponse(null, "Connection removed"));
    } catch (error) {
      logError("removeConnection controller error: " + error.message);
      return res.status(500).json(errorResponse("Failed to remove connection"));
    }
  },

  async getPendingRequests(req, res) {
    try {
      const userId = req.user.id;
      const result = await connectionService.getPendingRequests(userId);
      if (result.error)
        return res.status(result.status).json(errorResponse(result.error));
      return res
        .status(200)
        .json(successResponse(result.requests, "Pending requests retrieved"));
    } catch (error) {
      logError("getPendingRequests controller error: " + error.message);
      return res
        .status(500)
        .json(errorResponse("Failed to fetch pending requests"));
    }
  },

  async getConnections(req, res) {
    try {
      const { page, limit } = req.query;
      const userId = req.user.id;
      const result = await connectionService.getConnections(userId, {
        page,
        limit,
      });
      if (result.error)
        return res.status(result.status).json(errorResponse(result.error));
      return res
        .status(200)
        .json(
          paginatedResponse(
            result.connections,
            result.meta,
            "Connections retrieved",
          ),
        );
    } catch (error) {
      logError("getConnections controller error: " + error.message);
      return res.status(500).json(errorResponse("Failed to fetch connections"));
    }
  },
};

module.exports = connectionController;
