const { query, getConnection } = require("../config/db.config");
const { error: logError } = require("../utils/logger.util");

const jobService = {
  async getAllJobs({
    search,
    field,
    location,
    workMode,
    employmentType,
    level,
    page = 1,
    limit = 10,
  }) {
    try {
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.max(1, Math.min(50, parseInt(limit) || 10));
      const offset = (pageNum - 1) * limitNum;

      let sql = `SELECT j.*, cp.company_name as company FROM jobs j JOIN company_profiles cp ON j.company_id = cp.user_id`;
      const conditions = [];
      const params = [];

      if (search) {
        conditions.push(
          "(j.title LIKE ? OR j.summary LIKE ? OR cp.company_name LIKE ? OR j.field LIKE ?)",
        );
        const p = `%${search}%`;
        params.push(p, p, p, p);
      }
      if (field) {
        conditions.push("j.field = ?");
        params.push(field);
      }
      if (location) {
        conditions.push("j.location = ?");
        params.push(location);
      }
      if (workMode) {
        conditions.push("j.work_mode = ?");
        params.push(workMode);
      }
      if (employmentType) {
        conditions.push("j.employment_type = ?");
        params.push(employmentType);
      }
      if (level) {
        conditions.push("j.level = ?");
        params.push(level);
      }

      if (conditions.length > 0) sql += " WHERE " + conditions.join(" AND ");
      sql += " ORDER BY j.created_at DESC LIMIT ? OFFSET ?";
      params.push(limitNum, offset);

      const jobs = await query(sql, params);

      let countSql =
        "SELECT COUNT(*) as total FROM jobs j JOIN company_profiles cp ON j.company_id = cp.user_id";
      if (conditions.length > 0)
        countSql += " WHERE " + conditions.join(" AND ");
      const countResult = await query(countSql, params.slice(0, -2));
      const total = countResult[0].total;

      return {
        jobs,
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
          hasNextPage: pageNum < Math.ceil(total / limitNum),
          hasPrevPage: pageNum > 1,
        },
      };
    } catch (error) {
      logError("getAllJobs error: " + error.message);
      return { error: "Failed to fetch jobs", status: 500 };
    }
  },

  async getJobById(jobId) {
    try {
      const jobRows = await query(
        `SELECT j.*, cp.company_name as company FROM jobs j JOIN company_profiles cp ON j.company_id = cp.user_id WHERE j.id = ?`,
        [jobId],
      );
      if (jobRows.length === 0) return { error: "Job not found", status: 404 };

      const [responsibilities, requirements, benefits] = await Promise.all([
        query(
          "SELECT id, title, detail FROM job_responsibilities WHERE job_id = ?",
          [jobId],
        ),
        query(
          "SELECT id, title, detail FROM job_requirements WHERE job_id = ?",
          [jobId],
        ),
        query("SELECT id, title, detail FROM job_benefits WHERE job_id = ?", [
          jobId,
        ]),
      ]);

      return { ...jobRows[0], responsibilities, requirements, benefits };
    } catch (error) {
      logError("getJobById error: " + error.message);
      return { error: "Failed to fetch job", status: 500 };
    }
  },

  async createJob(companyId, jobData) {
    let connection;
    try {
      const companyCheck = await query(
        "SELECT user_id FROM company_profiles WHERE user_id = ?",
        [companyId],
      );
      if (companyCheck.length === 0)
        return { error: "Company profile not found", status: 404 };

      connection = await getConnection();
      await connection.beginTransaction();

      const {
        title,
        location,
        workMode: rawWorkMode,
        work_mode,
        employmentType: rawEmploymentType,
        employment_type,
        level,
        field,
        yearsRequired: rawYearsRequired,
        years_required,
        summary,
        overview,
        salary,
        responsibilities,
        requirements,
        benefits,
      } = jobData;
      const workMode = rawWorkMode ?? work_mode;
      const employmentType = rawEmploymentType ?? employment_type;
      const yearsRequired = rawYearsRequired ?? years_required;
      const jobSql = `INSERT INTO jobs (company_id, title, location, work_mode, employment_type, level, field, years_required, summary, overview, salary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const jobParams = [
        companyId,
        title,
        location,
        workMode,
        employmentType,
        level,
        field,
        yearsRequired ?? 0,
        summary,
        overview ?? null,
        salary ?? null,
      ];

      const [jobResult] = await connection.execute(jobSql, jobParams);
      const jobId = jobResult.insertId;

      const insertBatch = async (table, items) => {
        if (Array.isArray(items)) {
          for (const item of items) {
            await connection.execute(
              `INSERT INTO ${table} (job_id, title, detail) VALUES (?, ?, ?)`,
              [jobId, item.title, item.detail],
            );
          }
        }
      };

      await Promise.all([
        insertBatch("job_responsibilities", responsibilities),
        insertBatch("job_requirements", requirements),
        insertBatch("job_benefits", benefits),
      ]);
      await connection.commit();
      return { data: await this.getJobById(jobId) };
    } catch (error) {
      if (connection) {
        try {
          await connection.rollback();
        } catch (e) {
          logError("Rollback failed: " + e.message);
        }
      }
      logError("createJob error: " + error.message);
      return { error: "Failed to create job", status: 500 };
    } finally {
      if (connection) connection.release();
    }
  },

  async updateJob(jobId, companyId, jobData) {
    try {
      const check = await query(
        "SELECT id FROM jobs WHERE id = ? AND company_id = ?",
        [jobId, companyId],
      );
      if (check.length === 0)
        return { error: "Job not found or unauthorized", status: 403 };

      const fields = [];
      const params = [];
      for (const [key, value] of Object.entries(jobData)) {
        const dbKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
        if (value !== undefined) {
          fields.push(`${dbKey} = ?`);
          params.push(value);
        }
      }
      if (fields.length === 0)
        return { error: "No fields to update", status: 400 };

      params.push(jobId);
      await query(`UPDATE jobs SET ${fields.join(", ")} WHERE id = ?`, params);
      return { data: await this.getJobById(jobId) };
    } catch (error) {
      logError("updateJob error: " + error.message);
      return { error: "Failed to update job", status: 500 };
    }
  },

  async deleteJob(jobId, companyId) {
    try {
      const result = await query(
        "DELETE FROM jobs WHERE id = ? AND company_id = ?",
        [jobId, companyId],
      );
      if (result.affectedRows === 0)
        return { error: "Job not found or unauthorized", status: 403 };
      return { message: "Job deleted successfully" };
    } catch (error) {
      logError("deleteJob error: " + error.message);
      return { error: "Failed to delete job", status: 500 };
    }
  },

  async applyToJob(jobId, candidateId) {
    try {
      const jobCheck = await query("SELECT id FROM jobs WHERE id = ?", [jobId]);
      if (jobCheck.length === 0) return { error: "Job not found", status: 404 };
      const candCheck = await query(
        "SELECT user_id FROM candidate_profiles WHERE user_id = ?",
        [candidateId],
      );
      if (candCheck.length === 0)
        return { error: "Candidate profile not found", status: 404 };

      const existing = await query(
        "SELECT id FROM job_applications WHERE job_id = ? AND user_id = ?",
        [jobId, candidateId],
      );
      if (existing.length > 0)
        return { error: "Already applied to this job", status: 409 };

      await query(
        "INSERT INTO job_applications (job_id, user_id) VALUES (?, ?)",
        [jobId, candidateId],
      );
      return { success: true };
    } catch (error) {
      logError("applyToJob error: " + error.message);
      return { error: "Failed to apply to job", status: 500 };
    }
  },

  async getApplicantsForJob(jobId, companyId) {
    try {
      const check = await query(
        "SELECT id FROM jobs WHERE id = ? AND company_id = ?",
        [jobId, companyId],
      );
      if (check.length === 0)
        return { error: "Job not found or unauthorized", status: 403 };

      const applicants = await query(
        `SELECT u.id, u.email, cp.full_name, cp.headline, cp.field, ja.status, ja.applied_at 
         FROM job_applications ja JOIN users u ON ja.user_id = u.id JOIN candidate_profiles cp ON u.id = cp.user_id 
         WHERE ja.job_id = ? ORDER BY ja.applied_at DESC`,
        [jobId],
      );
      return { applicants };
    } catch (error) {
      logError("getApplicantsForJob error: " + error.message);
      return { error: "Failed to fetch applicants", status: 500 };
    }
  },

  async saveJob(jobId, candidateId) {
    try {
      const jobCheck = await query("SELECT id FROM jobs WHERE id = ?", [jobId]);
      if (jobCheck.length === 0) return { error: "Job not found", status: 404 };
      const existing = await query(
        "SELECT user_id FROM saved_jobs WHERE user_id = ? AND job_id = ?",
        [candidateId, jobId],
      );
      if (existing.length > 0)
        return { error: "Job already saved", status: 409 };

      await query("INSERT INTO saved_jobs (user_id, job_id) VALUES (?, ?)", [
        candidateId,
        jobId,
      ]);
      return { success: true };
    } catch (error) {
      logError("saveJob error: " + error.message);
      return { error: "Failed to save job", status: 500 };
    }
  },

  async unsaveJob(jobId, candidateId) {
    try {
      const result = await query(
        "DELETE FROM saved_jobs WHERE user_id = ? AND job_id = ?",
        [candidateId, jobId],
      );
      if (result.affectedRows === 0)
        return { error: "Job was not saved", status: 404 };
      return { success: true };
    } catch (error) {
      logError("unsaveJob error: " + error.message);
      return { error: "Failed to unsave job", status: 500 };
    }
  },

  async getSavedJobs(candidateId) {
    try {
      const savedJobs = await query(
        `SELECT j.*, cp.company_name as company FROM saved_jobs sj JOIN jobs j ON sj.job_id = j.id JOIN company_profiles cp ON j.company_id = cp.user_id WHERE sj.user_id = ? ORDER BY sj.saved_at DESC`,
        [candidateId],
      );
      return { savedJobs };
    } catch (error) {
      logError("getSavedJobs error: " + error.message);
      return { error: "Failed to fetch saved jobs", status: 500 };
    }
  },

  async _manageSubResource(action, table, id, companyId, data = {}) {
    try {
      const checkSql = `SELECT jr.id FROM ${table} jr JOIN jobs j ON jr.job_id = j.id WHERE jr.id = ? AND j.company_id = ?`;
      const check = await query(checkSql, [id, companyId]);
      if (check.length === 0)
        return { error: "Item not found or unauthorized", status: 403 };

      if (action === "update") {
        await query(`UPDATE ${table} SET title = ?, detail = ? WHERE id = ?`, [
          data.title,
          data.detail,
          id,
        ]);
        return { data: { id, title: data.title, detail: data.detail } };
      }
      if (action === "delete") {
        await query(`DELETE FROM ${table} WHERE id = ?`, [id]);
        return { message: "Item deleted successfully" };
      }
    } catch (error) {
      logError(`${action} ${table} error: ${error.message}`);
      return { error: `Failed to ${action} item`, status: 500 };
    }
  },

  async addResponsibility(jobId, companyId, { title, detail }) {
    try {
      const check = await query(
        "SELECT id FROM jobs WHERE id = ? AND company_id = ?",
        [jobId, companyId],
      );
      if (check.length === 0)
        return { error: "Job not found or unauthorized", status: 403 };
      const result = await query(
        "INSERT INTO job_responsibilities (job_id, title, detail) VALUES (?, ?, ?)",
        [jobId, title, detail],
      );
      return { data: { id: result.insertId, job_id: jobId, title, detail } };
    } catch (error) {
      logError("addResponsibility error: " + error.message);
      return { error: "Failed to add responsibility", status: 500 };
    }
  },

  updateResponsibility: (id, companyId, data) =>
    jobService._manageSubResource(
      "update",
      "job_responsibilities",
      id,
      companyId,
      data,
    ),
  deleteResponsibility: (id, companyId) =>
    jobService._manageSubResource(
      "delete",
      "job_responsibilities",
      id,
      companyId,
    ),

  async addRequirement(jobId, companyId, { title, detail }) {
    try {
      const check = await query(
        "SELECT id FROM jobs WHERE id = ? AND company_id = ?",
        [jobId, companyId],
      );
      if (check.length === 0)
        return { error: "Job not found or unauthorized", status: 403 };
      const result = await query(
        "INSERT INTO job_requirements (job_id, title, detail) VALUES (?, ?, ?)",
        [jobId, title, detail],
      );
      return { data: { id: result.insertId, job_id: jobId, title, detail } };
    } catch (error) {
      logError("addRequirement error: " + error.message);
      return { error: "Failed to add requirement", status: 500 };
    }
  },

  updateRequirement: (id, companyId, data) =>
    jobService._manageSubResource(
      "update",
      "job_requirements",
      id,
      companyId,
      data,
    ),
  deleteRequirement: (id, companyId) =>
    jobService._manageSubResource("delete", "job_requirements", id, companyId),

  async addBenefit(jobId, companyId, { title, detail }) {
    try {
      const check = await query(
        "SELECT id FROM jobs WHERE id = ? AND company_id = ?",
        [jobId, companyId],
      );
      if (check.length === 0)
        return { error: "Job not found or unauthorized", status: 403 };
      const result = await query(
        "INSERT INTO job_benefits (job_id, title, detail) VALUES (?, ?, ?)",
        [jobId, title, detail],
      );
      return { data: { id: result.insertId, job_id: jobId, title, detail } };
    } catch (error) {
      logError("addBenefit error: " + error.message);
      return { error: "Failed to add benefit", status: 500 };
    }
  },

  updateBenefit: (id, companyId, data) =>
    jobService._manageSubResource(
      "update",
      "job_benefits",
      id,
      companyId,
      data,
    ),
  deleteBenefit: (id, companyId) =>
    jobService._manageSubResource("delete", "job_benefits", id, companyId),
};

module.exports = jobService;
