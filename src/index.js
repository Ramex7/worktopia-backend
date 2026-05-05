const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const sanitizeHtml = require("sanitize-html");
require("dotenv").config();

const { info, warn } = require("./utils/logger.util");
const routes = require("./routes");
const { errorHandler } = require("./middleware/errorHandler");

// ─── Rate Limiting ───────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── CORS Configuration ──────────────────────────────────────────────────────
const parseOrigins = () => {
  const urls = process.env.FRONTEND_URLS || process.env.FRONTEND_URL || "";
  return urls
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean);
};

const allowedOrigins = parseOrigins();
const corsOptions = {
  origin: allowedOrigins.length > 0 ? allowedOrigins : false,
  credentials: true,
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-access-token",
    "x-setup-token",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
};

// ─── XSS Sanitization ────────────────────────────────────────────────────────
const sanitizeValue = (value) => {
  if (typeof value === "string") {
    return sanitizeHtml(value, {
      allowedTags: ["b", "i", "em", "strong", "p", "br", "ul", "ol", "li"],
      allowedAttributes: {},
      disallowedTagsMode: "discard",
    });
  }
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === "object") {
    const sanitized = {};
    for (const key of Object.keys(value))
      sanitized[key] = sanitizeValue(value[key]);
    return sanitized;
  }
  return value;
};

// ─── App Setup ───────────────────────────────────────────────────────────────
const port = process.env.PORT || 3000;
const app = express();

app.use(helmet());
app.use(limiter);
app.use(express.json({ limit: "10mb" }));

app.use((req, res, next) => {
  if (req.body && typeof req.body === "object")
    req.body = sanitizeValue(req.body);
  next();
});

app.use(cors(corsOptions));
app.use(routes);

app.get("/", (req, res) => {
  const healthController = require("./controllers/health.controller");
  healthController.healthCheck(req, res);
});

app.use((req, res) => {
  res
    .status(404)
    .json({
      success: false,
      message: `Route ${req.method} ${req.originalUrl} not found`,
    });
});

app.use(errorHandler);

const server = app.listen(port, () => {
  info(`✅ Server running on http://localhost:${port}`);
  if (allowedOrigins.length === 0) {
    warn("⚠️ No FRONTEND_URLS configured. CORS will block browser requests.");
  }
});

const shutdown = (signal) => {
  info(`Received ${signal}, shutting down gracefully...`);
  server.close((err) => {
    if (err) {
      warn(`Error during shutdown: ${err.message}`);
      process.exit(1);
    }
    info("HTTP server closed");
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

module.exports = app;
