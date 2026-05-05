const JWTUtil = require("../utils/jwt.util");
const { query } = require("../config/db.config");
const { error: logError } = require("../utils/logger.util");

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    if (!token)
      return res
        .status(401)
        .json({ success: false, message: "Access token is required" });

    const decoded = JWTUtil.verifyToken(token);
    if (!decoded)
      return res
        .status(403)
        .json({ success: false, message: "Invalid or expired token" });

    req.user = { id: decoded.userId, role: decoded.role };
    next();
  } catch (error) {
    logError("Auth middleware error: " + error.message);
    res.status(500).json({ success: false, message: "Authentication error" });
  }
}

async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const payload = JWTUtil.verifyToken(token);
      if (payload) {
        const rows = await query(
          "SELECT id, email, role, created_at, updated_at FROM users WHERE id = ?",
          [payload.userId],
        );
        if (rows.length > 0) req.user = rows[0];
      }
    }
    next();
  } catch {
    next();
  }
}

function requireSetupToken(req, res, next) {
  const expectedToken = process.env.SETUP_TOKEN;
  const providedToken = req.get("x-setup-token");
  if (!expectedToken)
    return res.status(500).json({ message: "SETUP_TOKEN is not configured" });
  if (providedToken !== expectedToken)
    return res.status(403).json({ message: "Forbidden" });
  next();
}

module.exports = { requireAuth, optionalAuth, requireSetupToken };
