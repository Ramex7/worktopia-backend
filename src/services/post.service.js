const { query } = require("../config/db.config");
const { error: logError } = require("../utils/logger.util");

const postService = {
  async getAllPosts({ page = 1, limit = 10 }) {
    try {
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.max(1, Math.min(50, parseInt(limit) || 10));
      const offset = (pageNum - 1) * limitNum;

      const sql = `SELECT p.*, u.email as author_email, cp.full_name as author_name, cp.profile_pic_url as author_profile_pic, cp.field as author_field,
        (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = p.id) as comments_count
        FROM posts p JOIN users u ON p.user_id = u.id JOIN candidate_profiles cp ON u.id = cp.user_id
        WHERE p.parent_post_id IS NULL ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
      const posts = await query(sql, [limitNum, offset]);

      const countResult = await query("SELECT COUNT(*) as total FROM posts WHERE parent_post_id IS NULL");
      const total = countResult[0].total;

      return { posts, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum), hasNextPage: pageNum < Math.ceil(total / limitNum), hasPrevPage: pageNum > 1 } };
    } catch (error) {
      logError("getAllPosts error: " + error.message);
      return { error: "Failed to fetch posts", status: 500 };
    }
  },

  async getFeed(userId, { page = 1, limit = 10 }) {
    try {
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.max(1, Math.min(50, parseInt(limit) || 10));
      const offset = (pageNum - 1) * limitNum;

      const connectionsSql = `SELECT CASE WHEN requester_id = ? THEN receiver_id ELSE requester_id END as connected_user_id
        FROM connections WHERE (requester_id = ? OR receiver_id = ?) AND status = 'accepted'`;
      const connections = await query(connectionsSql, [userId, userId, userId]);
      const connectedUserIds = connections.map(c => c.connected_user_id);
      connectedUserIds.push(userId);

      if (connectedUserIds.length === 0) return { posts: [], meta: { total: 0, page: pageNum, limit: limitNum, totalPages: 0, hasNextPage: false, hasPrevPage: false } };

      const placeholders = connectedUserIds.map(() => "?").join(", ");
      const sql = `SELECT p.*, u.email as author_email, cp.full_name as author_name, cp.profile_pic_url as author_profile_pic, cp.field as author_field,
        (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = p.id) as comments_count
        FROM posts p JOIN users u ON p.user_id = u.id JOIN candidate_profiles cp ON u.id = cp.user_id
        WHERE p.user_id IN (${placeholders}) AND p.parent_post_id IS NULL ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
      const posts = await query(sql, [...connectedUserIds, limitNum, offset]);

      const countSql = `SELECT COUNT(*) as total FROM posts WHERE user_id IN (${placeholders}) AND parent_post_id IS NULL`;
      const countResult = await query(countSql, connectedUserIds);
      const total = countResult[0].total;

      return { posts, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum), hasNextPage: pageNum < Math.ceil(total / limitNum), hasPrevPage: pageNum > 1 } };
    } catch (error) {
      logError("getFeed error: " + error.message);
      return { error: "Failed to fetch feed", status: 500 };
    }
  },

  async createPost(userId, { content, imageUrl }) {
    try {
      const insertSql = "INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)";
      const insertResult = await query(insertSql, [userId, content, imageUrl || null]);

      const selectSql = `SELECT p.*, u.email as author_email, cp.full_name as author_name, cp.profile_pic_url as author_profile_pic, cp.field as author_field,
        (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = p.id) as comments_count
        FROM posts p JOIN users u ON p.user_id = u.id JOIN candidate_profiles cp ON u.id = cp.user_id WHERE p.id = ?`;
      const post = await query(selectSql, [insertResult.insertId]);
      return { post: post[0] };
    } catch (error) {
      logError("createPost error: " + error.message);
      return { error: "Failed to create post", status: 500 };
    }
  },

  async getPostById(postId) {
    try {
      const sql = `SELECT p.*, u.email as author_email, cp.full_name as author_name, cp.profile_pic_url as author_profile_pic, cp.field as author_field,
        (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = p.id) as comments_count
        FROM posts p JOIN users u ON p.user_id = u.id JOIN candidate_profiles cp ON u.id = cp.user_id WHERE p.id = ?`;
      const posts = await query(sql, [postId]);
      if (posts.length === 0) return { error: "Post not found", status: 404 };

      const post = posts[0];
      const [comments, likes] = await Promise.all([
        query(`SELECT pc.*, u.email as author_email, cp.full_name as author_name, cp.profile_pic_url as author_profile_pic FROM post_comments pc JOIN users u ON pc.user_id = u.id JOIN candidate_profiles cp ON u.id = cp.user_id WHERE pc.post_id = ? ORDER BY pc.created_at ASC`, [postId]),
        query(`SELECT u.email as liker_email, cp.full_name as liker_name, cp.profile_pic_url as liker_profile_pic FROM post_likes pl JOIN users u ON pl.user_id = u.id JOIN candidate_profiles cp ON u.id = cp.user_id WHERE pl.post_id = ?`, [postId])
      ]);

      return { ...post, comments, likes };
    } catch (error) {
      logError("getPostById error: " + error.message);
      return { error: "Failed to fetch post", status: 500 };
    }
  },

  async deletePost(postId, userId) {
    try {
      const check = await query("SELECT id FROM posts WHERE id = ? AND user_id = ?", [postId, userId]);
      if (check.length === 0) return { error: "Post not found or unauthorized", status: 403 };
      await query("DELETE FROM posts WHERE id = ?", [postId]);
      return { message: "Post deleted successfully" };
    } catch (error) {
      logError("deletePost error: " + error.message);
      return { error: "Failed to delete post", status: 500 };
    }
  },

  async likePost(postId, userId) {
    try {
      const postCheck = await query("SELECT id FROM posts WHERE id = ?", [postId]);
      if (postCheck.length === 0) return { error: "Post not found", status: 404 };
      const existing = await query("SELECT post_id FROM post_likes WHERE post_id = ? AND user_id = ?", [postId, userId]);
      if (existing.length > 0) return { error: "Post already liked", status: 409 };

      await query("INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)", [postId, userId]);
      return { success: true };
    } catch (error) {
      logError("likePost error: " + error.message);
      return { error: "Failed to like post", status: 500 };
    }
  },

  async unlikePost(postId, userId) {
    try {
      const result = await query("DELETE FROM post_likes WHERE post_id = ? AND user_id = ?", [postId, userId]);
      if (result.affectedRows === 0) return { error: "Like not found", status: 404 };
      return { success: true };
    } catch (error) {
      logError("unlikePost error: " + error.message);
      return { error: "Failed to unlike post", status: 500 };
    }
  },

  async commentOnPost(postId, userId, commentText) {
    try {
      const postCheck = await query("SELECT id FROM posts WHERE id = ?", [postId]);
      if (postCheck.length === 0) return { error: "Post not found", status: 404 };

      const insertResult = await query("INSERT INTO post_comments (post_id, user_id, comment_text) VALUES (?, ?, ?)", [postId, userId, commentText]);
      const comment = await query(
        `SELECT pc.*, u.email as author_email, cp.full_name as author_name, cp.profile_pic_url as author_profile_pic FROM post_comments pc JOIN users u ON pc.user_id = u.id JOIN candidate_profiles cp ON u.id = cp.user_id WHERE pc.id = ?`,
        [insertResult.insertId]
      );
      return { comment: comment[0] };
    } catch (error) {
      logError("commentOnPost error: " + error.message);
      return { error: "Failed to add comment", status: 500 };
    }
  }
};

module.exports = postService;