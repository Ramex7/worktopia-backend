const postService = require("../services/post.service");
const {
  successResponse,
  errorResponse,
  paginatedResponse,
} = require("../utils/response.util");
const { validateId } = require("../utils/validation.util");
const { error: logError } = require("../utils/logger.util");

const postController = {
  async getAllPosts(req, res) {
    try {
      const { page, limit } = req.query;
      const result = await postService.getAllPosts({ page, limit });
      if (result.error)
        return res
          .status(result.status || 500)
          .json(errorResponse(result.error));
      return res
        .status(200)
        .json(paginatedResponse(result.posts, result.meta, "Posts retrieved"));
    } catch (error) {
      logError("getAllPosts controller error: " + error.message);
      return res.status(500).json(errorResponse("Failed to fetch posts"));
    }
  },

  async getFeed(req, res) {
    try {
      const { page, limit } = req.query;
      const userId = req.user.id;
      const result = await postService.getFeed(userId, { page, limit });
      if (result.error)
        return res
          .status(result.status || 500)
          .json(errorResponse(result.error));
      return res
        .status(200)
        .json(paginatedResponse(result.posts, result.meta, "Feed retrieved"));
    } catch (error) {
      logError("getFeed controller error: " + error.message);
      return res.status(500).json(errorResponse("Failed to fetch feed"));
    }
  },

  async createPost(req, res) {
    try {
      const userId = req.user.id;
      const { content, imageUrl, image_url } = req.body;
      const result = await postService.createPost(userId, {
        content,
        imageUrl: imageUrl ?? image_url,
      });
      if (result.error)
        return res
          .status(result.status || 500)
          .json(errorResponse(result.error));
      return res.status(201).json(successResponse(result.post, "Post created"));
    } catch (error) {
      logError("createPost controller error: " + error.message);
      return res.status(500).json(errorResponse("Failed to create post"));
    }
  },

  async getPostById(req, res) {
    try {
      const idValidation = validateId(req.params.id);
      if (!idValidation.valid)
        return res.status(400).json(errorResponse(idValidation.message));

      const result = await postService.getPostById(idValidation.sanitized);
      if (result.error)
        return res
          .status(result.status || 404)
          .json(errorResponse(result.error));
      return res
        .status(200)
        .json(successResponse(result.post || result, "Post retrieved"));
    } catch (error) {
      logError("getPostById controller error: " + error.message);
      return res.status(500).json(errorResponse("Failed to fetch post"));
    }
  },

  async deletePost(req, res) {
    try {
      const idValidation = validateId(req.params.id);
      if (!idValidation.valid)
        return res.status(400).json(errorResponse(idValidation.message));

      const userId = req.user.id;
      const postId = idValidation.sanitized;
      const result = await postService.deletePost(postId, userId);
      if (result.error)
        return res
          .status(result.status || 500)
          .json(errorResponse(result.error));
      return res
        .status(200)
        .json(successResponse(null, result.message || "Post deleted"));
    } catch (error) {
      logError("deletePost controller error: " + error.message);
      return res.status(500).json(errorResponse("Failed to delete post"));
    }
  },

  async likePost(req, res) {
    try {
      const idValidation = validateId(req.params.id);
      if (!idValidation.valid)
        return res.status(400).json(errorResponse(idValidation.message));

      const userId = req.user.id;
      const postId = idValidation.sanitized;
      const result = await postService.likePost(postId, userId);
      if (result.error)
        return res
          .status(result.status || 500)
          .json(errorResponse(result.error));
      return res.status(200).json(successResponse(null, "Post liked"));
    } catch (error) {
      logError("likePost controller error: " + error.message);
      return res.status(500).json(errorResponse("Failed to like post"));
    }
  },

  async unlikePost(req, res) {
    try {
      const idValidation = validateId(req.params.id);
      if (!idValidation.valid)
        return res.status(400).json(errorResponse(idValidation.message));

      const userId = req.user.id;
      const postId = idValidation.sanitized;
      const result = await postService.unlikePost(postId, userId);
      if (result.error)
        return res
          .status(result.status || 500)
          .json(errorResponse(result.error));
      return res.status(200).json(successResponse(null, "Post unliked"));
    } catch (error) {
      logError("unlikePost controller error: " + error.message);
      return res.status(500).json(errorResponse("Failed to unlike post"));
    }
  },

  async commentOnPost(req, res) {
    try {
      const idValidation = validateId(req.params.id);
      if (!idValidation.valid)
        return res.status(400).json(errorResponse(idValidation.message));

      const userId = req.user.id;
      const postId = idValidation.sanitized;
      const { commentText, comment_text } = req.body;
      const finalCommentText = commentText ?? comment_text;
      if (
        !finalCommentText ||
        typeof finalCommentText !== "string" ||
        finalCommentText.trim().length === 0
      ) {
        return res.status(400).json(errorResponse("Comment text is required"));
      }

      const result = await postService.commentOnPost(
        postId,
        userId,
        finalCommentText.trim(),
      );
      if (result.error)
        return res
          .status(result.status || 500)
          .json(errorResponse(result.error));
      return res
        .status(201)
        .json(successResponse(result.comment, "Comment added"));
    } catch (error) {
      logError("commentOnPost controller error: " + error.message);
      return res.status(500).json(errorResponse("Failed to comment on post"));
    }
  },
};

module.exports = postController;
