const { query } = require("../config/db.config");
const { error: logError } = require("../utils/logger.util");

const companyService = {
  async getAllCompanies(options = {}) {
    try {
      const { search, page = 1, limit = 10 } = options;
      const safeLimit = Math.max(1, Math.min(50, Number(limit) || 10));
      const safePage = Math.max(1, Number(page) || 1);
      const offset = (safePage - 1) * safeLimit;

      let whereClause = "";
      const params = [];
      if (search) {
        whereClause = `WHERE (comp.company_name LIKE ? OR comp.industry LIKE ? OR comp.location LIKE ?)`;
        const pattern = `%${search}%`;
        params.push(pattern, pattern, pattern);
      }

      const countSql = `SELECT COUNT(*) as total FROM company_profiles comp ${whereClause}`;
      const countResult = await query(countSql, params);
      const total = countResult[0].total;
      const totalPages = Math.ceil(total / safeLimit);

      const dataSql = `SELECT comp.user_id, comp.company_name, comp.industry, comp.description, comp.location, comp.website_url, comp.logo_url,
        (SELECT COUNT(*) FROM jobs j WHERE j.company_id = comp.user_id) AS job_count
        FROM company_profiles comp ${whereClause} ORDER BY comp.company_name ASC LIMIT ? OFFSET ?`;
      const companies = await query(dataSql, [...params, safeLimit, offset]);

      return {
        companies,
        meta: { total, page: safePage, limit: safeLimit, totalPages, hasNextPage: safePage < totalPages, hasPrevPage: safePage > 1 }
      };
    } catch (error) {
      logError("getAllCompanies error: " + error.message);
      return { error: "Failed to fetch companies", status: 500 };
    }
  },

  async getCompanyById(userId) {
    try {
      const profileRows = await query(
        `SELECT comp.user_id, comp.company_name, comp.industry, comp.description, comp.location, comp.website_url, comp.logo_url, u.email 
         FROM company_profiles comp JOIN users u ON u.id = comp.user_id WHERE comp.user_id = ?`,
        [userId]
      );
      if (profileRows.length === 0) return { error: "Company not found", status: 404 };

      const profile = profileRows[0];
      const jobs = await query(
        `SELECT j.id, j.title, j.location, j.work_mode, j.employment_type, j.level, j.field, j.years_required, j.summary, j.salary, j.created_at,
          (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id) AS application_count
         FROM jobs j WHERE j.company_id = ? ORDER BY j.created_at DESC`,
        [userId]
      );

      return { ...profile, jobs };
    } catch (error) {
      logError("getCompanyById error: " + error.message);
      return { error: "Failed to fetch company", status: 500 };
    }
  },

  async updateCompanyProfile(userId, updates) {
    try {
      const allowedFields = ["company_name", "industry", "description", "location", "website_url", "logo_url"];
      const setClauses = [];
      const values = [];

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key) && value !== undefined && value !== null) {
          setClauses.push(`${key} = ?`);
          values.push(value);
        }
      }
      if (setClauses.length === 0) return { error: "No valid fields provided for update", status: 400 };

      values.push(userId);
      const sql = `UPDATE company_profiles SET ${setClauses.join(", ")} WHERE user_id = ?`;
      const result = await query(sql, values);

      if (result.affectedRows === 0) return { error: "Company profile not found", status: 404 };
      return { status: 200, affectedRows: result.affectedRows };
    } catch (error) {
      logError("updateCompanyProfile error: " + error.message);
      return { error: "Failed to update company profile", status: 500 };
    }
  }
};

module.exports = companyService;