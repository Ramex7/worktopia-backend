const companyService = require("../services/company.service");
const {
  successResponse,
  errorResponse,
  paginatedResponse,
} = require("../utils/response.util");
const {
  validateId,
  validateProfileUpdate,
} = require("../utils/validation.util");
const { error: logError } = require("../utils/logger.util");

const companyController = {
  async getAllCompanies(req, res) {
    try {
      const { search, page, limit } = req.query;
      const result = await companyService.getAllCompanies({
        search,
        page,
        limit,
      });
      if (result.error)
        return res.status(result.status).json(errorResponse(result.error));
      return res
        .status(200)
        .json(
          paginatedResponse(
            result.companies,
            result.meta,
            "Companies retrieved",
          ),
        );
    } catch (error) {
      logError("getAllCompanies controller error: " + error.message);
      return res.status(500).json(errorResponse("Failed to fetch companies"));
    }
  },

  async getCompanyById(req, res) {
    try {
      const idValidation = validateId(req.params.id);
      if (!idValidation.valid)
        return res.status(400).json(errorResponse(idValidation.message));

      const result = await companyService.getCompanyById(
        idValidation.sanitized,
      );
      if (result.error)
        return res
          .status(result.status || 404)
          .json(errorResponse(result.error));
      return res.status(200).json(successResponse(result, "Company retrieved"));
    } catch (error) {
      logError("getCompanyById controller error: " + error.message);
      return res.status(500).json(errorResponse("Failed to fetch company"));
    }
  },

  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const validation = validateProfileUpdate(req.body, "company");
      if (!validation.valid)
        return res.status(400).json(errorResponse(validation.message));

      const result = await companyService.updateCompanyProfile(
        userId,
        req.body,
      );
      if (result.error)
        return res.status(result.status).json(errorResponse(result.error));
      return res
        .status(200)
        .json(successResponse(null, "Company profile updated"));
    } catch (error) {
      logError("updateProfile controller error: " + error.message);
      return res
        .status(500)
        .json(errorResponse("Failed to update company profile"));
    }
  },
};

module.exports = companyController;
