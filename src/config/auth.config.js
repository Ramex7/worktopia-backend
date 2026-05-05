const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const isProduction = process.env.NODE_ENV === "production";
const accessSecret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;
const refreshSecret =
  process.env.REFRESH_TOKEN_SECRET || process.env.JWT_REFRESH_SECRET;

if (isProduction) {
  if (!accessSecret) {
    throw new Error(
      "ACCESS_TOKEN_SECRET (or JWT_SECRET) is required in production"
    );
  }
  if (!refreshSecret) {
    throw new Error(
      "REFRESH_TOKEN_SECRET (or JWT_REFRESH_SECRET) is required in production"
    );
  }
}

const parsedSaltRounds = parseInt(process.env.SALT_ROUNDS, 10);

const configs = {
  SALT_ROUNDS:
    Number.isInteger(parsedSaltRounds) && parsedSaltRounds > 0
      ? parsedSaltRounds
      : 12,
  jwtSecret: accessSecret || "default_access_secret",
  jwtExpiresIn: process.env.ACCESS_TOKEN_LIFE || "15m",
  refreshTokenSecret: refreshSecret || "default_refresh_secret",
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_LIFE || "7d",
  PASSWORD_RESET_TOKEN_LIFE: "1h",
  PASSWORD_RESET_EXPIRES: 3600000,
  EMAIL_VERIFICATION_TOKEN_LIFE: "24h",
  EMAIL_VERIFICATION_EXPIRES: 86400000,
};

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(configs.SALT_ROUNDS);
  return await bcrypt.hash(password, salt);
};

const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

const generateToken = (payload, secret, expiresIn) => {
  return jwt.sign(payload, secret, { expiresIn });
};

const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
};

module.exports = {
  ...configs,
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
};
