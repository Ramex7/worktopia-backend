const { query } = require("../config/db.config");
const { error: logError } = require("../utils/logger.util");
const notificationService = require("./notification.service");

const connectionService = {
  async sendConnectionRequest(requesterId, targetUserId) {
    try {
      const userCheck = await query("SELECT id FROM users WHERE id IN (?, ?)", [requesterId, targetUserId]);
      if (userCheck.length < 2) return { error: "One or both users not found", status: 404 };

      const checkSql = `SELECT id, status FROM connections WHERE (requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?)`;
      const existing = await query(checkSql, [requesterId, targetUserId, targetUserId, requesterId]);

      if (existing.length > 0) {
        if (existing[0].status === "accepted") return { error: "Connection already exists", status: 409 };
        if (existing[0].status === "pending") return { error: "Connection request already sent", status: 409 };
      }

      const insertResult = await query("INSERT INTO connections (requester_id, receiver_id, status) VALUES (?, ?, 'pending')", [requesterId, targetUserId]);
      await notificationService.createNotification(targetUserId, requesterId, "New Connection Request", `User ${requesterId} sent you a connection request.`);

      const connection = await query(
        `SELECT c.*, req.full_name as requester_name, req.profile_pic_url as requester_profile_pic, rec.full_name as receiver_name, rec.profile_pic_url as receiver_profile_pic
         FROM connections c
         LEFT JOIN candidate_profiles req ON c.requester_id = req.user_id
         LEFT JOIN candidate_profiles rec ON c.receiver_id = rec.user_id
         WHERE c.id = ?`,
        [insertResult.insertId]
      );

      return { connection: connection[0] };
    } catch (error) {
      logError("sendConnectionRequest error: " + error.message);
      return { error: "Failed to send connection request", status: 500 };
    }
  },

  async acceptConnectionRequest(requesterId, accepterId) {
    try {
      const check = await query("SELECT id FROM connections WHERE requester_id = ? AND receiver_id = ? AND status = 'pending'", [requesterId, accepterId]);
      if (check.length === 0) return { error: "No pending connection request found", status: 404 };

      await query("UPDATE connections SET status = 'accepted' WHERE id = ?", [check[0].id]);
      await notificationService.createNotification(requesterId, accepterId, "Connection Accepted", `User ${accepterId} accepted your request.`);

      const connection = await query(
        `SELECT c.*, req.full_name as requester_name, req.profile_pic_url as requester_profile_pic, rec.full_name as receiver_name, rec.profile_pic_url as receiver_profile_pic
         FROM connections c
         LEFT JOIN candidate_profiles req ON c.requester_id = req.user_id
         LEFT JOIN candidate_profiles rec ON c.receiver_id = rec.user_id
         WHERE c.id = ?`,
        [check[0].id]
      );

      return { connection: connection[0] };
    } catch (error) {
      logError("acceptConnectionRequest error: " + error.message);
      return { error: "Failed to accept connection request", status: 500 };
    }
  },

  async rejectConnectionRequest(requesterId, rejecterId) {
    try {
      const result = await query("DELETE FROM connections WHERE requester_id = ? AND receiver_id = ? AND status = 'pending'", [requesterId, rejecterId]);
      if (result.affectedRows === 0) return { error: "No pending connection request found", status: 404 };
      return { success: true };
    } catch (error) {
      logError("rejectConnectionRequest error: " + error.message);
      return { error: "Failed to reject connection request", status: 500 };
    }
  },

  async removeConnection(removerId, targetUserId) {
    try {
      const result = await query("DELETE FROM connections WHERE ((requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?)) AND status = 'accepted'", [removerId, targetUserId, targetUserId, removerId]);
      if (result.affectedRows === 0) return { error: "Connection not found", status: 404 };
      return { success: true };
    } catch (error) {
      logError("removeConnection error: " + error.message);
      return { error: "Failed to remove connection", status: 500 };
    }
  },

  async getPendingRequests(userId) {
    try {
      const requests = await query(
        `SELECT c.*, cp.full_name as requester_name, cp.profile_pic_url as requester_profile_pic 
         FROM connections c JOIN candidate_profiles cp ON c.requester_id = cp.user_id 
         WHERE c.receiver_id = ? AND c.status = 'pending' ORDER BY c.created_at DESC`,
        [userId]
      );
      return { requests };
    } catch (error) {
      logError("getPendingRequests error: " + error.message);
      return { error: "Failed to fetch pending requests", status: 500 };
    }
  },

  async getConnections(userId, { page = 1, limit = 10 } = {}) {
    try {
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.max(1, Math.min(50, parseInt(limit) || 10));
      const offset = (pageNum - 1) * limitNum;

      const sql = `SELECT c.*,
        CASE WHEN c.requester_id = ? THEN cp2.full_name ELSE cp1.full_name END as connected_user_name,
        CASE WHEN c.requester_id = ? THEN cp2.profile_pic_url ELSE cp1.profile_pic_url END as connected_user_profile_pic,
        CASE WHEN c.requester_id = ? THEN cp2.field ELSE cp1.field END as connected_user_field
        FROM connections c
        LEFT JOIN candidate_profiles cp1 ON c.requester_id = cp1.user_id
        LEFT JOIN candidate_profiles cp2 ON c.receiver_id = cp2.user_id
        WHERE (c.requester_id = ? OR c.receiver_id = ?) AND c.status = 'accepted'
        ORDER BY c.updated_at DESC LIMIT ? OFFSET ?`;
      const connections = await query(sql, [userId, userId, userId, userId, userId, limitNum, offset]);

      const countResult = await query("SELECT COUNT(*) as total FROM connections WHERE (requester_id = ? OR receiver_id = ?) AND status = 'accepted'", [userId, userId]);
      const total = countResult[0].total;

      return {
        connections,
        meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum), hasNextPage: pageNum < Math.ceil(total / limitNum), hasPrevPage: pageNum > 1 }
      };
    } catch (error) {
      logError("getConnections error: " + error.message);
      return { error: "Failed to fetch connections", status: 500 };
    }
  }
};

module.exports = connectionService;