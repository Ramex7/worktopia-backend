const bcrypt = require("bcryptjs");
const { query, getConnection } = require("../config/db.config");
const JWTUtil = require("../utils/jwt.util");
const { error: logError } = require("../utils/logger.util");

const authService = {
  async register(userData) {
    let connection;
    try {
      connection = await getConnection();
      await connection.beginTransaction();
      const passwordHash = await bcrypt.hash(userData.password, 10);
      const userSql = `INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)`;
      const [userResult] = await connection.execute(userSql, [
        userData.email.toLowerCase().trim(),
        passwordHash,
        userData.role,
      ]);
      const userId = userResult.insertId;

      if (userData.role === "candidate") {
        await connection.execute(
          `INSERT INTO candidate_profiles (user_id, full_name) VALUES (?, ?)`,
          [userId, userData.full_name.trim()],
        );
      } else if (userData.role === "company") {
        await connection.execute(
          `INSERT INTO company_profiles (user_id, company_name) VALUES (?, ?)`,
          [userId, userData.company_name.trim()],
        );
      }

      await connection.commit();
      const token = JWTUtil.signToken({ userId, role: userData.role });
      const refreshToken = JWTUtil.signRefreshToken({ userId });
      await query("UPDATE users SET refresh_token = ? WHERE id = ?", [
        refreshToken,
        userId,
      ]);
      return { status: 201, id: userId, token, refreshToken };
    } catch (error) {
      if (connection)
        try {
          await connection.rollback();
        } catch (rb) {
          logError("Rollback failed: " + rb.message);
        }
      if (error.code === "ER_DUP_ENTRY")
        return { status: 409, message: "Email is already registered" };
      logError("Register error: " + error.message);
      return { status: 500, message: "Registration failed" };
    } finally {
      if (connection) connection.release();
    }
  },

  async login(email, password) {
    try {
      const rows = await query(
        "SELECT id, email, password_hash, role, refresh_token, created_at, updated_at FROM users WHERE email = ?",
        [email.toLowerCase().trim()],
      );
      if (rows.length === 0)
        return { status: 404, message: "No account found with this email" };
      const user = rows[0];
      if (!(await bcrypt.compare(password, user.password_hash)))
        return { status: 401, message: "Invalid credentials" };

      const token = JWTUtil.signToken({ userId: user.id, role: user.role });
      const refreshToken = JWTUtil.signRefreshToken({ userId: user.id });
      await query("UPDATE users SET refresh_token = ? WHERE id = ?", [
        refreshToken,
        user.id,
      ]);
      const { password_hash, refresh_token, ...userWithoutPassword } = user;
      return { status: 200, user: userWithoutPassword, token, refreshToken };
    } catch (error) {
      logError("Login error: " + error.message);
      return { status: 500, message: "Login failed" };
    }
  },

  async refreshToken(refreshToken) {
    try {
      const payload = JWTUtil.verifyRefreshToken(refreshToken);
      if (!payload)
        return { status: 401, message: "Invalid or expired refresh token" };
      const rows = await query(
        "SELECT id, role, refresh_token FROM users WHERE id = ?",
        [payload.userId],
      );
      if (rows.length === 0) return { status: 401, message: "User not found" };
      const user = rows[0];
      if (user.refresh_token !== refreshToken)
        return { status: 401, message: "Refresh token has been revoked" };

      const newToken = JWTUtil.signToken({ userId: user.id, role: user.role });
      const newRefreshToken = JWTUtil.signRefreshToken({ userId: user.id });
      await query("UPDATE users SET refresh_token = ? WHERE id = ?", [
        newRefreshToken,
        user.id,
      ]);
      return { status: 200, token: newToken, refreshToken: newRefreshToken };
    } catch (error) {
      logError("Refresh token error: " + error.message);
      return { status: 500, message: "Token refresh failed" };
    }
  },

  async getUserById(id) {
    try {
      const rows = await query(
        "SELECT id, email, role, created_at, updated_at FROM users WHERE id = ?",
        [id],
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      logError("getUserById error: " + error.message);
      return null;
    }
  },

  async emailExists(email) {
    try {
      const rows = await query("SELECT id FROM users WHERE email = ? LIMIT 1", [
        email.toLowerCase().trim(),
      ]);
      return rows.length > 0;
    } catch (error) {
      logError("emailExists error: " + error.message);
      return false;
    }
  },
};

module.exports = authService;
