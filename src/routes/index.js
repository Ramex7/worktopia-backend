const express = require("express");
const router = express.Router();

const installRouter = require("./install.routes");
const authRouter = require("./auth.routes");
const candidateRouter = require("./candidate.routes");
const companyRouter = require("./company.routes");
const jobRouter = require("./job.routes");
const notificationRouter = require("./notification.routes");
const connectionRouter = require("./connection.routes");
const postRouter = require("./post.routes");

// Mount feature routers under /api/* base paths
router.use("/api", installRouter);
router.use("/api/auth", authRouter);
router.use("/api/candidates", candidateRouter);
router.use("/api/companies", companyRouter);
router.use("/api/jobs", jobRouter);
router.use("/api/notifications", notificationRouter);
router.use("/api/connections", connectionRouter);
router.use("/api/posts", postRouter);

module.exports = router;