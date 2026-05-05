const jobService = require("../services/job.service");
const {
  successResponse,
  errorResponse,
  paginatedResponse,
} = require("../utils/response.util");
const {
  validateId,
  validateJobCreate,
  validateJobUpdate,
} = require("../utils/validation.util");
const { error: logError } = require("../utils/logger.util");

const jobController = {
  async getAllJobs(req, res) {
    try {
      const {
        search,
        field,
        location,
        workMode: rawWorkMode,
        work_mode,
        employmentType: rawEmploymentType,
        employment_type,
        level,
        page,
        limit,
      } = req.query;
      const workMode = rawWorkMode ?? work_mode;
      const employmentType = rawEmploymentType ?? employment_type;
      const result = await jobService.getAllJobs({
        search,
        field,
        location,
        workMode,
        employmentType,
        level,
        page,
        limit,
      });
      if (result.error)
        return res.status(result.status).json(errorResponse(result.error));
      return res
        .status(200)
        .json(paginatedResponse(result.jobs, result.meta, "Jobs retrieved"));
    } catch (error) {
      logError("getAllJobs controller error: " + error.message);
      return res.status(500).json(errorResponse("Failed to fetch jobs"));
    }
  },

  async getJobById(req, res) {
    try {
      const idValidation = validateId(req.params.id);
      if (!idValidation.valid)
        return res.status(400).json(errorResponse(idValidation.message));

      const result = await jobService.getJobById(idValidation.sanitized);
      if (result.error)
        return res
          .status(result.status || 404)
          .json(errorResponse(result.error));
      return res.status(200).json(successResponse(result, "Job retrieved"));
    } catch (error) {
      logError("getJobById controller error: " + error.message);
      return res.status(500).json(errorResponse("Failed to fetch job"));
    }
  },

  async createJob(req, res) {
    try {
      const companyId = req.user.id;
      const validation = validateJobCreate(req.body);
      if (!validation.valid)
        return res.status(400).json(errorResponse(validation.message));

      const result = await jobService.createJob(companyId, req.body);
      if (result.error)
        return res.status(result.status).json(errorResponse(result.error));
      return res.status(201).json(successResponse(result.data, "Job created"));
    } catch (error) {
      logError("createJob controller error: " + error.message);
      return res.status(500).json(errorResponse("Failed to create job"));
    }
  },

  async updateJob(req, res) {
    try {
      const idValidation = validateId(req.params.id);
      if (!idValidation.valid)
        return res.status(400).json(errorResponse(idValidation.message));

      const validation = validateJobUpdate(req.body);
      if (!validation.valid)
        return res.status(400).json(errorResponse(validation.message));

      const result = await jobService.updateJob(
        idValidation.sanitized,
        req.user.id,
        req.body,
      );
      if (result.error)
        return res.status(result.status).json(errorResponse(result.error));
      return res.status(200).json(successResponse(result.data, "Job updated"));
    } catch (error) {
      logError("updateJob controller error: " + error.message);
      return res.status(500).json(errorResponse("Failed to update job"));
    }
  },

  async deleteJob(req, res) {
    try {
      const idValidation = validateId(req.params.id);
      if (!idValidation.valid)
        return res.status(400).json(errorResponse(idValidation.message));

      const result = await jobService.deleteJob(
        idValidation.sanitized,
        req.user.id,
      );
      if (result.error)
        return res.status(result.status).json(errorResponse(result.error));
      return res.status(200).json(successResponse(null, result.message));
    } catch (error) {
      logError("deleteJob controller error: " + error.message);
      return res.status(500).json(errorResponse("Failed to delete job"));
    }
  },

  async applyToJob(req, res) {
    try {
      const jobIdValidation = validateId(req.params.id);
      if (!jobIdValidation.valid)
        return res.status(400).json(errorResponse(jobIdValidation.message));

      const result = await jobService.applyToJob(
        jobIdValidation.sanitized,
        req.user.id,
      );
      if (result.error)
        return res.status(result.status).json(errorResponse(result.error));
      return res
        .status(200)
        .json(successResponse(null, "Successfully applied to job"));
    } catch (error) {
      logError("applyToJob controller error: " + error.message);
      return res.status(500).json(errorResponse("Failed to apply to job"));
    }
  },

  async getApplicantsForJob(req, res) {
    try {
      const jobIdValidation = validateId(req.params.id);
      if (!jobIdValidation.valid)
        return res.status(400).json(errorResponse(jobIdValidation.message));

      const result = await jobService.getApplicantsForJob(
        jobIdValidation.sanitized,
        req.user.id,
      );
      if (result.error)
        return res.status(result.status).json(errorResponse(result.error));
      return res
        .status(200)
        .json(successResponse(result.applicants, "Applicants retrieved"));
    } catch (error) {
      logError("getApplicantsForJob controller error: " + error.message);
      return res.status(500).json(errorResponse("Failed to fetch applicants"));
    }
  },

  async saveJob(req, res) {
    try {
      const jobIdValidation = validateId(req.params.id);
      if (!jobIdValidation.valid)
        return res.status(400).json(errorResponse(jobIdValidation.message));

      const result = await jobService.saveJob(
        jobIdValidation.sanitized,
        req.user.id,
      );
      if (result.error)
        return res.status(result.status).json(errorResponse(result.error));
      return res.status(200).json(successResponse(null, "Job saved"));
    } catch (error) {
      logError("saveJob controller error: " + error.message);
      return res.status(500).json(errorResponse("Failed to save job"));
    }
  },

  async unsaveJob(req, res) {
    try {
      const jobIdValidation = validateId(req.params.id);
      if (!jobIdValidation.valid)
        return res.status(400).json(errorResponse(jobIdValidation.message));

      const result = await jobService.unsaveJob(
        jobIdValidation.sanitized,
        req.user.id,
      );
      if (result.error)
        return res.status(result.status).json(errorResponse(result.error));
      return res
        .status(200)
        .json(successResponse(null, "Job removed from saved list"));
    } catch (error) {
      logError("unsaveJob controller error: " + error.message);
      return res.status(500).json(errorResponse("Failed to unsave job"));
    }
  },

  async getSavedJobs(req, res) {
    try {
      const result = await jobService.getSavedJobs(req.user.id);
      if (result.error)
        return res.status(result.status).json(errorResponse(result.error));
      return res
        .status(200)
        .json(successResponse(result.savedJobs, "Saved jobs retrieved"));
    } catch (error) {
      logError("getSavedJobs controller error: " + error.message);
      return res.status(500).json(errorResponse("Failed to fetch saved jobs"));
    }
  },

  async addResponsibility(req, res) {
    try {
      const jobIdValidation = validateId(req.params.id);
      if (!jobIdValidation.valid)
        return res.status(400).json(errorResponse(jobIdValidation.message));

      const { title, detail } = req.body;
      if (!title || !detail)
        return res
          .status(400)
          .json(errorResponse("Title and detail are required"));

      const result = await jobService.addResponsibility(
        jobIdValidation.sanitized,
        req.user.id,
        { title, detail },
      );
      if (result.error)
        return res.status(result.status).json(errorResponse(result.error));
      return res
        .status(201)
        .json(successResponse(result.data, "Responsibility added"));
    } catch (error) {
      logError("addResponsibility controller error: " + error.message);
      return res
        .status(500)
        .json(errorResponse("Failed to add responsibility"));
    }
  },

  async updateResponsibility(req, res) {
    try {
      const idValidation = validateId(req.params.id);
      if (!idValidation.valid)
        return res.status(400).json(errorResponse(idValidation.message));

      const { title, detail } = req.body;
      if (!title || !detail)
        return res
          .status(400)
          .json(errorResponse("Title and detail are required"));

      const result = await jobService.updateResponsibility(
        idValidation.sanitized,
        req.user.id,
        { title, detail },
      );
      if (result.error)
        return res.status(result.status).json(errorResponse(result.error));
      return res
        .status(200)
        .json(successResponse(result.data, "Responsibility updated"));
    } catch (error) {
      logError("updateResponsibility controller error: " + error.message);
      return res
        .status(500)
        .json(errorResponse("Failed to update responsibility"));
    }
  },

  async deleteResponsibility(req, res) {
    try {
      const idValidation = validateId(req.params.id);
      if (!idValidation.valid)
        return res.status(400).json(errorResponse(idValidation.message));

      const result = await jobService.deleteResponsibility(
        idValidation.sanitized,
        req.user.id,
      );
      if (result.error)
        return res.status(result.status).json(errorResponse(result.error));
      return res.status(200).json(successResponse(null, result.message));
    } catch (error) {
      logError("deleteResponsibility controller error: " + error.message);
      return res
        .status(500)
        .json(errorResponse("Failed to delete responsibility"));
    }
  },

  async addRequirement(req, res) {
    try {
      const jobIdValidation = validateId(req.params.id);
      if (!jobIdValidation.valid)
        return res.status(400).json(errorResponse(jobIdValidation.message));

      const { title, detail } = req.body;
      if (!title || !detail)
        return res
          .status(400)
          .json(errorResponse("Title and detail are required"));

      const result = await jobService.addRequirement(
        jobIdValidation.sanitized,
        req.user.id,
        { title, detail },
      );
      if (result.error)
        return res.status(result.status).json(errorResponse(result.error));
      return res
        .status(201)
        .json(successResponse(result.data, "Requirement added"));
    } catch (error) {
      logError("addRequirement controller error: " + error.message);
      return res.status(500).json(errorResponse("Failed to add requirement"));
    }
  },

  async updateRequirement(req, res) {
    try {
      const idValidation = validateId(req.params.id);
      if (!idValidation.valid)
        return res.status(400).json(errorResponse(idValidation.message));

      const { title, detail } = req.body;
      if (!title || !detail)
        return res
          .status(400)
          .json(errorResponse("Title and detail are required"));

      const result = await jobService.updateRequirement(
        idValidation.sanitized,
        req.user.id,
        { title, detail },
      );
      if (result.error)
        return res.status(result.status).json(errorResponse(result.error));
      return res
        .status(200)
        .json(successResponse(result.data, "Requirement updated"));
    } catch (error) {
      logError("updateRequirement controller error: " + error.message);
      return res
        .status(500)
        .json(errorResponse("Failed to update requirement"));
    }
  },

  async deleteRequirement(req, res) {
    try {
      const idValidation = validateId(req.params.id);
      if (!idValidation.valid)
        return res.status(400).json(errorResponse(idValidation.message));

      const result = await jobService.deleteRequirement(
        idValidation.sanitized,
        req.user.id,
      );
      if (result.error)
        return res.status(result.status).json(errorResponse(result.error));
      return res.status(200).json(successResponse(null, result.message));
    } catch (error) {
      logError("deleteRequirement controller error: " + error.message);
      return res
        .status(500)
        .json(errorResponse("Failed to delete requirement"));
    }
  },

  async addBenefit(req, res) {
    try {
      const jobIdValidation = validateId(req.params.id);
      if (!jobIdValidation.valid)
        return res.status(400).json(errorResponse(jobIdValidation.message));

      const { title, detail } = req.body;
      if (!title || !detail)
        return res
          .status(400)
          .json(errorResponse("Title and detail are required"));

      const result = await jobService.addBenefit(
        jobIdValidation.sanitized,
        req.user.id,
        { title, detail },
      );
      if (result.error)
        return res.status(result.status).json(errorResponse(result.error));
      return res
        .status(201)
        .json(successResponse(result.data, "Benefit added"));
    } catch (error) {
      logError("addBenefit controller error: " + error.message);
      return res.status(500).json(errorResponse("Failed to add benefit"));
    }
  },

  async updateBenefit(req, res) {
    try {
      const idValidation = validateId(req.params.id);
      if (!idValidation.valid)
        return res.status(400).json(errorResponse(idValidation.message));

      const { title, detail } = req.body;
      if (!title || !detail)
        return res
          .status(400)
          .json(errorResponse("Title and detail are required"));

      const result = await jobService.updateBenefit(
        idValidation.sanitized,
        req.user.id,
        { title, detail },
      );
      if (result.error)
        return res.status(result.status).json(errorResponse(result.error));
      return res
        .status(200)
        .json(successResponse(result.data, "Benefit updated"));
    } catch (error) {
      logError("updateBenefit controller error: " + error.message);
      return res.status(500).json(errorResponse("Failed to update benefit"));
    }
  },

  async deleteBenefit(req, res) {
    try {
      const idValidation = validateId(req.params.id);
      if (!idValidation.valid)
        return res.status(400).json(errorResponse(idValidation.message));

      const result = await jobService.deleteBenefit(
        idValidation.sanitized,
        req.user.id,
      );
      if (result.error)
        return res.status(result.status).json(errorResponse(result.error));
      return res.status(200).json(successResponse(null, result.message));
    } catch (error) {
      logError("deleteBenefit controller error: " + error.message);
      return res.status(500).json(errorResponse("Failed to delete benefit"));
    }
  },
};

module.exports = jobController;
