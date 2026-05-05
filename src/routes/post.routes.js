const express = require("express");
const router = express.Router();
const postController = require("../controllers/post.controller");
const { requireAuth } = require("../middleware/auth.middleware");

/**
Post Routes
Base path: /api/posts
Public: list, view by ID
Protected: feed, create, delete, like, comment
*/
router.get("/", postController.getAllPosts);

router.get("/feed", requireAuth, postController.getFeed);
router.post("/", requireAuth, postController.createPost);

router.get("/:id", postController.getPostById);
router.delete("/:id", requireAuth, postController.deletePost);
router.post("/:id/like", requireAuth, postController.likePost);
router.delete("/:id/unlike", requireAuth, postController.unlikePost);
router.post("/:id/comments", requireAuth, postController.commentOnPost);

module.exports = router;