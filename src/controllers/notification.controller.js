const notificationService = require("../services/notification.service");
const {
  successResponse,
  errorResponse,
  paginatedResponse,
} = require("../utils/response.util");
const { validateId } = require("../utils/validation.util");
const { error: logError } = require("../utils/logger.util");

const notificationController = {
  async getUserNotifications(req, res) {
    try {
      const { page, limit, unreadOnly } = req.query;
      const userId = req.user.id;
      const result = await notificationService.getUserNotifications({
        userId,
        page,
        limit,
        unreadOnly: unreadOnly === "true" || unreadOnly === "1",
      });
      if (result.error)
        return res
          .status(result.status || 500)
          .json(errorResponse(result.error));
      return res
        .status(200)
        .json(
          paginatedResponse(
            result.notifications,
            result.meta,
            "Notifications retrieved",
          ),
        );
    } catch (error) {
      logError("getUserNotifications controller error: " + error.message);
      return res
        .status(500)
        .json(errorResponse("Failed to fetch notifications"));
    }
  },

  async markAsRead(req, res) {
    try {
      const idValidation = validateId(req.params.id);
      if (!idValidation.valid)
        return res.status(400).json(errorResponse(idValidation.message));

      const userId = req.user.id;
      const notificationId = idValidation.sanitized;
      const result = await notificationService.markNotificationAsRead(
        notificationId,
        userId,
      );
      if (result.error)
        return res
          .status(result.status || 500)
          .json(errorResponse(result.error));
      return res
        .status(200)
        .json(successResponse(null, "Notification marked as read"));
    } catch (error) {
      logError("markAsRead controller error: " + error.message);
      return res
        .status(500)
        .json(errorResponse("Failed to mark notification as read"));
    }
  },

  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;
      const result =
        await notificationService.markAllNotificationsAsRead(userId);
      if (result.error)
        return res
          .status(result.status || 500)
          .json(errorResponse(result.error));
      return res
        .status(200)
        .json(successResponse(null, "All notifications marked as read"));
    } catch (error) {
      logError("markAllAsRead controller error: " + error.message);
      return res
        .status(500)
        .json(errorResponse("Failed to mark all notifications as read"));
    }
  },

  async deleteNotification(req, res) {
    try {
      const idValidation = validateId(req.params.id);
      if (!idValidation.valid)
        return res.status(400).json(errorResponse(idValidation.message));

      const userId = req.user.id;
      const notificationId = idValidation.sanitized;
      const result = await notificationService.deleteNotification(
        notificationId,
        userId,
      );
      if (result.error)
        return res
          .status(result.status || 500)
          .json(errorResponse(result.error));
      return res
        .status(200)
        .json(successResponse(null, "Notification deleted"));
    } catch (error) {
      logError("deleteNotification controller error: " + error.message);
      return res
        .status(500)
        .json(errorResponse("Failed to delete notification"));
    }
  },
};

module.exports = notificationController;
