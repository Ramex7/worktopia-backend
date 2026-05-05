const { query } = require("../config/db.config");
const { error: logError } = require("../utils/logger.util");

const notificationService = {
  async getUserNotifications({
    userId,
    page = 1,
    limit = 10,
    unreadOnly = false,
  }) {
    try {
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.max(1, Math.min(50, parseInt(limit) || 10));
      const offset = (pageNum - 1) * limitNum;

      let sql = `SELECT n.*, u.email as sender_email, u.role as sender_role FROM notifications n LEFT JOIN users u ON n.sender_id = u.id WHERE n.user_id = ?`;
      const params = [userId];
      if (unreadOnly) sql += " AND n.is_read = 0";
      sql += " ORDER BY n.created_at DESC LIMIT ? OFFSET ?";
      params.push(limitNum, offset);

      const notifications = await query(sql, params);

      let countSql =
        "SELECT COUNT(*) as total FROM notifications WHERE user_id = ?";
      const countParams = [userId];
      if (unreadOnly) countSql += " AND is_read = 0";
      const countResult = await query(countSql, countParams);
      const total = countResult[0].total;

      return {
        notifications,
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
          hasNextPage: pageNum < Math.ceil(total / limitNum),
          hasPrevPage: pageNum > 1,
        },
      };
    } catch (error) {
      logError("getUserNotifications error: " + error.message);
      return { error: "Failed to fetch notifications", status: 500 };
    }
  },

  async markNotificationAsRead(notificationId, userId) {
    try {
      const result = await query(
        "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?",
        [notificationId, userId],
      );
      if (result.affectedRows === 0)
        return { error: "Notification not found or unauthorized", status: 403 };
      return { success: true };
    } catch (error) {
      logError("markNotificationAsRead error: " + error.message);
      return { error: "Failed to mark notification as read", status: 500 };
    }
  },

  async markAllNotificationsAsRead(userId) {
    try {
      await query(
        "UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0",
        [userId],
      );
      return { success: true };
    } catch (error) {
      logError("markAllNotificationsAsRead error: " + error.message);
      return { error: "Failed to mark all notifications as read", status: 500 };
    }
  },

  async deleteNotification(notificationId, userId) {
    try {
      const result = await query(
        "DELETE FROM notifications WHERE id = ? AND user_id = ?",
        [notificationId, userId],
      );
      if (result.affectedRows === 0)
        return { error: "Notification not found or unauthorized", status: 403 };
      return { success: true };
    } catch (error) {
      logError("deleteNotification error: " + error.message);
      return { error: "Failed to delete notification", status: 500 };
    }
  },

  async createNotification(userId, senderId, title, detail) {
    try {
      const sql =
        "INSERT INTO notifications (user_id, sender_id, title, detail) VALUES (?, ?, ?, ?)";
      const result = await query(sql, [userId, senderId, title, detail]);
      return {
        id: result.insertId,
        user_id: userId,
        sender_id: senderId,
        title,
        detail,
        is_read: 0,
        created_at: new Date(),
      };
    } catch (error) {
      logError("createNotification error: " + error.message);
      return { error: "Failed to create notification", status: 500 };
    }
  },
};

module.exports = notificationService;
