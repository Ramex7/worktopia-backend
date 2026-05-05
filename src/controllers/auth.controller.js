const authService = require("../services/auth.service");
const { successResponse, errorResponse } = require("../utils/response.util");
const { validateRegister, validateLogin } = require("../utils/validation.util");
const { error: logError } = require("../utils/logger.util");

const authController = {
  async register(req, res) {
    try {
      const validation = validateRegister(req.body);
      if (!validation.valid)
        return res.status(400).json(errorResponse(validation.message));

      const exists = await authService.emailExists(req.body.email);
      if (exists)
        return res
          .status(409)
          .json(errorResponse("Email is already registered"));

      const result = await authService.register(req.body);
      if (result.message)
        return res.status(result.status).json(errorResponse(result.message));

      return res.status(201).json(
        successResponse(
          {
            id: result.id,
            token: result.token,
            refreshToken: result.refreshToken,
          },
          "Registration successful",
        ),
      );
    } catch (error) {
      logError("register controller error: " + error.message);
      return res.status(500).json(errorResponse("Registration failed"));
    }
  },

  async login(req, res) {
    try {
      const validation = validateLogin(req.body);
      if (!validation.valid)
        return res.status(400).json(errorResponse(validation.message));

      const result = await authService.login(req.body.email, req.body.password);
      if (result.message)
        return res.status(result.status).json(errorResponse(result.message));

      return res.status(200).json(
        successResponse(
          {
            user: result.user,
            token: result.token,
            refreshToken: result.refreshToken,
          },
          "Login successful",
        ),
      );
    } catch (error) {
      logError("login controller error: " + error.message);
      return res.status(500).json(errorResponse("Login failed"));
    }
  },

  async refresh(req, res) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken)
        return res.status(400).json(errorResponse("Refresh token is required"));

      const result = await authService.refreshToken(refreshToken);
      if (result.message)
        return res.status(result.status).json(errorResponse(result.message));

      return res.status(200).json(
        successResponse(
          {
            token: result.token,
            refreshToken: result.refreshToken,
          },
          "Token refreshed successfully",
        ),
      );
    } catch (error) {
      logError("refresh controller error: " + error.message);
      return res.status(500).json(errorResponse("Token refresh failed"));
    }
  },

  async me(req, res) {
    try {
      return res
        .status(200)
        .json(
          successResponse({ user: req.user }, "Authenticated user retrieved"),
        );
    } catch (error) {
      logError("me controller error: " + error.message);
      return res.status(500).json(errorResponse("Failed to get user"));
    }
  },

  async checkEmail(req, res) {
    try {
      const email = req.query.email;
      if (!email)
        return res
          .status(400)
          .json(errorResponse("Email query parameter is required"));

      const exists = await authService.emailExists(email);
      return res
        .status(200)
        .json(successResponse({ email, available: !exists }));
    } catch (error) {
      logError("checkEmail controller error: " + error.message);
      return res.status(500).json(errorResponse("Failed to check email"));
    }
  },
};

module.exports = authController;
