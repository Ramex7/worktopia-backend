const jwt = require("jsonwebtoken");
const authConfig = require("../config/auth.config");

class JWTUtil {
  static signToken(payload) {
    return jwt.sign(payload, authConfig.jwtSecret, {
      expiresIn: authConfig.jwtExpiresIn,
    });
  }

  static signRefreshToken(payload) {
    return jwt.sign(payload, authConfig.refreshTokenSecret, {
      expiresIn: authConfig.refreshTokenExpiresIn,
    });
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, authConfig.jwtSecret);
    } catch {
      return null;
    }
  }

  static verifyRefreshToken(token) {
    try {
      return jwt.verify(token, authConfig.refreshTokenSecret);
    } catch {
      return null;
    }
  }
}

module.exports = JWTUtil;
