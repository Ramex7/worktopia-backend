const candidateService = require("../services/candidate.service");
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

const candidateController = {
  async getAllCandidates(req, res) {
    try {
      const { search, field, page, limit } = req.query;
      const result = await candidateService.getAllCandidates({
        search,
        field,
        page,
        limit,
      });
      if (result.error)
        return res.status(result.status).json(errorResponse(result.error));
      return res
        .status(200)
        .json(
          paginatedResponse(
            result.candidates,
            result.meta,
            "Candidates retrieved",
          ),
        );
    } catch (error) {
      logError("getAllCandidates controller error: " + error.message);
      return res.status(500).json(errorResponse("Failed to fetch candidates"));
    }
  },

  async getCandidateById(req, res) {
    try {
      const idValidation = validateId(req.params.id);
      if (!idValidation.valid)
        return res.status(400).json(errorResponse(idValidation.message));

      const result = await candidateService.getCandidateById(
        idValidation.sanitized,
      );
      if (result.error)
        return res
          .status(result.status || 404)
          .json(errorResponse(result.error));
      return res
        .status(200)
        .json(successResponse(result, "Candidate retrieved"));
    } catch (error) {
      logError("getCandidateById controller error: " + error.message);
      return res.status(500).json(errorResponse("Failed to fetch candidate"));
    }
  },

  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const validation = validateProfileUpdate(req.body, "candidate");
      if (!validation.valid)
        return res.status(400).json(errorResponse(validation.message));

      const result = await candidateService.updateCandidateProfile(
        userId,
        req.body,
      );
      if (result.error)
        return res.status(result.status).json(errorResponse(result.error));
      return res.status(200).json(successResponse(null, "Profile updated"));
    } catch (error) {
      logError("updateProfile controller error: " + error.message);
      return res.status(500).json(errorResponse("Failed to update profile"));
    }
  },

  async addExperience(req, res) {
    try {
      const { role, company, period, summary } = req.body;
      if (!role || !company)
        return res
          .status(400)
          .json(errorResponse("Role and company are required"));

      const result = await candidateService.addExperience(req.user.id, {
        role,
        company,
        period,
        summary,
      });
      if (result.error)
        return res.status(result.status).json(errorResponse(result.error));
      return res
        .status(201)
        .json(successResponse(result.data, "Experience added"));
    } catch (error) {
      logError("addExperience controller error: " + error.message);
      return res.status(500).json(errorResponse("Failed to add experience"));
    }
  },

  async updateExperience(req, res) {
    try {
      const idValidation = validateId(req.params.id);
      if (!idValidation.valid)
        return res.status(400).json(errorResponse(idValidation.message));

      const result = await candidateService.updateExperience(
        idValidation.sanitized,
        req.user.id,
        req.body,
      );
      if (result.error)
        return res.status(result.status).json(errorResponse(result.error));
      return res
        .status(200)
        .json(successResponse(result.data, "Experience updated"));
    } catch (error) {
      logError("updateExperience controller error: " + error.message);
      return res.status(500).json(errorResponse("Failed to update experience"));
    }
  },

  async deleteExperience(req, res) {
    try {
      const idValidation = validateId(req.params.id);
      if (!idValidation.valid)
        return res.status(400).json(errorResponse(idValidation.message));

      const result = await candidateService.deleteExperience(
        idValidation.sanitized,
        req.user.id,
      );
      if (result.error)
        return res.status(result.status).json(errorResponse(result.error));
      return res.status(200).json(successResponse(null, result.message));
    } catch (error) {
      logError("deleteExperience controller error: " + error.message);
      return res.status(500).json(errorResponse("Failed to delete experience"));
    }
  },

  async addEducation(req, res) {
    try {
      const { school, program, period } = req.body;
      if (!school)
        return res.status(400).json(errorResponse("School is required"));

      const result = await candidateService.addEducation(req.user.id, {
        school,
        program,
        period,
      });
      if (result.error)
        return res.status(result.status).json(errorResponse(result.error));
      return res
        .status(201)
        .json(successResponse(result.data, "Education added"));
    } catch (error) {
      logError("addEducation controller error: " + error.message);
      return res.status(500).json(errorResponse("Failed to add education"));
    }
  },

  async updateEducation(req, res) {
    try {
      const idValidation = validateId(req.params.id);
      if (!idValidation.valid)
        return res.status(400).json(errorResponse(idValidation.message));

      const result = await candidateService.updateEducation(
        idValidation.sanitized,
        req.user.id,
        req.body,
      );
      if (result.error)
        return res.status(result.status).json(errorResponse(result.error));
      return res
        .status(200)
        .json(successResponse(result.data, "Education updated"));
    } catch (error) {
      logError("updateEducation controller error: " + error.message);
      return res.status(500).json(errorResponse("Failed to update education"));
    }
  },

  async deleteEducation(req, res) {
    try {
      const idValidation = validateId(req.params.id);
      if (!idValidation.valid)
        return res.status(400).json(errorResponse(idValidation.message));

      const result = await candidateService.deleteEducation(
        idValidation.sanitized,
        req.user.id,
      );
      if (result.error)
        return res.status(result.status).json(errorResponse(result.error));
      return res.status(200).json(successResponse(null, result.message));
    } catch (error) {
      logError("deleteEducation controller error: " + error.message);
      return res.status(500).json(errorResponse("Failed to delete education"));
    }
  },

  async addCertificate(req, res) {
    try {
      const { name, issuer, year } = req.body;
      if (!name || !issuer)
        return res
          .status(400)
          .json(errorResponse("Name and issuer are required"));

      const result = await candidateService.addCertificate(req.user.id, {
        name,
        issuer,
        year,
      });
      if (result.error)
        return res.status(result.status).json(errorResponse(result.error));
      return res
        .status(201)
        .json(successResponse(result.data, "Certificate added"));
    } catch (error) {
      logError("addCertificate controller error: " + error.message);
      return res.status(500).json(errorResponse("Failed to add certificate"));
    }
  },

  async updateCertificate(req, res) {
    try {
      const idValidation = validateId(req.params.id);
      if (!idValidation.valid)
        return res.status(400).json(errorResponse(idValidation.message));

      const result = await candidateService.updateCertificate(
        idValidation.sanitized,
        req.user.id,
        req.body,
      );
      if (result.error)
        return res.status(result.status).json(errorResponse(result.error));
      return res
        .status(200)
        .json(successResponse(result.data, "Certificate updated"));
    } catch (error) {
      logError("updateCertificate controller error: " + error.message);
      return res
        .status(500)
        .json(errorResponse("Failed to update certificate"));
    }
  },

  async deleteCertificate(req, res) {
    try {
      const idValidation = validateId(req.params.id);
      if (!idValidation.valid)
        return res.status(400).json(errorResponse(idValidation.message));

      const result = await candidateService.deleteCertificate(
        idValidation.sanitized,
        req.user.id,
      );
      if (result.error)
        return res.status(result.status).json(errorResponse(result.error));
      return res.status(200).json(successResponse(null, result.message));
    } catch (error) {
      logError("deleteCertificate controller error: " + error.message);
      return res
        .status(500)
        .json(errorResponse("Failed to delete certificate"));
    }
  },
};

module.exports = candidateController;
