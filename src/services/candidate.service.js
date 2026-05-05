const { query } = require("../config/db.config");
const { error: logError } = require("../utils/logger.util");

const candidateService = {
  async getAllCandidates(options = {}) {
    try {
      const { search, field, page = 1, limit = 10 } = options;
      const safeLimit = Math.max(1, Math.min(50, Number(limit) || 10));
      const safePage = Math.max(1, Number(page) || 1);
      const offset = (safePage - 1) * safeLimit;

      let whereClause = "";
      const params = [];
      if (field) {
        whereClause += " WHERE cp.field = ?";
        params.push(field);
      }
      if (search) {
        const connector = params.length > 0 ? " AND" : " WHERE";
        whereClause += `${connector} (cp.full_name LIKE ? OR cp.field LIKE ? OR cp.location LIKE ? OR cp.headline LIKE ?)`;
        const pattern = `%${search}%`;
        params.push(pattern, pattern, pattern, pattern);
      }

      const countSql = `SELECT COUNT(*) as total FROM candidate_profiles cp ${whereClause}`;
      const countResult = await query(countSql, params);
      const total = countResult[0].total;

      const dataSql = `SELECT cp.user_id, cp.full_name, cp.field, cp.headline, cp.bio, cp.location, cp.years_of_experience, cp.profile_pic_url,
        (SELECT COUNT(*) FROM posts p WHERE p.user_id = cp.user_id) AS post_count,
        (SELECT COUNT(*) FROM candidate_certificates cc WHERE cc.user_id = cp.user_id) AS cert_count
        FROM candidate_profiles cp ${whereClause} ORDER BY cp.full_name ASC LIMIT ? OFFSET ?`;
      const candidates = await query(dataSql, [...params, safeLimit, offset]);

      return {
        candidates,
        meta: { total, page: safePage, limit: safeLimit, totalPages: Math.ceil(total / safeLimit), hasNextPage: safePage < Math.ceil(total / safeLimit), hasPrevPage: safePage > 1 }
      };
    } catch (error) {
      logError("getAllCandidates error: " + error.message);
      return { error: "Failed to fetch candidates", status: 500 };
    }
  },

  async getCandidateById(userId) {
    try {
      const profileRows = await query(
        `SELECT cp.user_id, cp.full_name, cp.field, cp.headline, cp.bio, cp.about, cp.location, cp.years_of_experience, cp.skills_json, cp.profile_pic_url, u.email 
         FROM candidate_profiles cp JOIN users u ON u.id = cp.user_id WHERE cp.user_id = ?`,
        [userId]
      );
      if (profileRows.length === 0) return { error: "Candidate not found", status: 404 };

      const profile = profileRows[0];
      const [experience, education, certificates, posts] = await Promise.all([
        query("SELECT id, role, company, period, summary FROM candidate_experience WHERE user_id = ? ORDER BY id DESC", [userId]),
        query("SELECT id, school, program, period FROM candidate_education WHERE user_id = ? ORDER BY id DESC", [userId]),
        query("SELECT id, name, issuer, year FROM candidate_certificates WHERE user_id = ? ORDER BY id DESC", [userId]),
        query(`SELECT p.id, p.content, p.image_url, p.created_at,
                (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) AS like_count,
                (SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = p.id) AS comment_count
         FROM posts p WHERE p.user_id = ? AND p.parent_post_id IS NULL ORDER BY p.created_at DESC LIMIT 10`, [userId])
      ]);

      return { ...profile, experience, education, certificates, posts };
    } catch (error) {
      logError("getCandidateById error: " + error.message);
      return { error: "Failed to fetch candidate", status: 500 };
    }
  },

  async updateCandidateProfile(userId, updates) {
    try {
      const allowedFields = ["full_name", "field", "headline", "bio", "about", "location", "years_of_experience", "profile_pic_url"];
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
      const sql = `UPDATE candidate_profiles SET ${setClauses.join(", ")} WHERE user_id = ?`;
      const result = await query(sql, values);

      if (result.affectedRows === 0) return { error: "Candidate profile not found", status: 404 };
      return { status: 200, affectedRows: result.affectedRows };
    } catch (error) {
      logError("updateCandidateProfile error: " + error.message);
      return { error: "Failed to update profile", status: 500 };
    }
  },

  async addExperience(userId, data) {
    try {
      const result = await query("INSERT INTO candidate_experience (user_id, role, company, period, summary) VALUES (?, ?, ?, ?, ?)", [userId, data.role, data.company, data.period || null, data.summary || null]);
      const rows = await query("SELECT * FROM candidate_experience WHERE id = ?", [result.insertId]);
      return { status: 201, data: rows[0] };
    } catch (error) {
      logError("addExperience error: " + error.message);
      return { error: "Failed to add experience", status: 500 };
    }
  },

  async updateExperience(experienceId, userId, data) {
    try {
      const result = await query(`UPDATE candidate_experience SET role = COALESCE(?, role), company = COALESCE(?, company), period = COALESCE(?, period), summary = COALESCE(?, summary) WHERE id = ? AND user_id = ?`, [data.role || null, data.company || null, data.period || null, data.summary || null, experienceId, userId]);
      if (result.affectedRows === 0) return { error: "Experience not found or unauthorized", status: 404 };
      const rows = await query("SELECT * FROM candidate_experience WHERE id = ?", [experienceId]);
      return { status: 200, data: rows[0] };
    } catch (error) {
      logError("updateExperience error: " + error.message);
      return { error: "Failed to update experience", status: 500 };
    }
  },

  async deleteExperience(experienceId, userId) {
    try {
      const result = await query("DELETE FROM candidate_experience WHERE id = ? AND user_id = ?", [experienceId, userId]);
      if (result.affectedRows === 0) return { error: "Experience not found or unauthorized", status: 404 };
      return { status: 200, message: "Experience deleted" };
    } catch (error) {
      logError("deleteExperience error: " + error.message);
      return { error: "Failed to delete experience", status: 500 };
    }
  },

  async addEducation(userId, data) {
    try {
      const result = await query("INSERT INTO candidate_education (user_id, school, program, period) VALUES (?, ?, ?, ?)", [userId, data.school, data.program || null, data.period || null]);
      const rows = await query("SELECT * FROM candidate_education WHERE id = ?", [result.insertId]);
      return { status: 201, data: rows[0] };
    } catch (error) {
      logError("addEducation error: " + error.message);
      return { error: "Failed to add education", status: 500 };
    }
  },

  async updateEducation(educationId, userId, data) {
    try {
      const result = await query(`UPDATE candidate_education SET school = COALESCE(?, school), program = COALESCE(?, program), period = COALESCE(?, period) WHERE id = ? AND user_id = ?`, [data.school || null, data.program || null, data.period || null, educationId, userId]);
      if (result.affectedRows === 0) return { error: "Education not found or unauthorized", status: 404 };
      const rows = await query("SELECT * FROM candidate_education WHERE id = ?", [educationId]);
      return { status: 200, data: rows[0] };
    } catch (error) {
      logError("updateEducation error: " + error.message);
      return { error: "Failed to update education", status: 500 };
    }
  },

  async deleteEducation(educationId, userId) {
    try {
      const result = await query("DELETE FROM candidate_education WHERE id = ? AND user_id = ?", [educationId, userId]);
      if (result.affectedRows === 0) return { error: "Education not found or unauthorized", status: 404 };
      return { status: 200, message: "Education deleted" };
    } catch (error) {
      logError("deleteEducation error: " + error.message);
      return { error: "Failed to delete education", status: 500 };
    }
  },

  async addCertificate(userId, data) {
    try {
      const result = await query("INSERT INTO candidate_certificates (user_id, name, issuer, year) VALUES (?, ?, ?, ?)", [userId, data.name, data.issuer, data.year || null]);
      const rows = await query("SELECT * FROM candidate_certificates WHERE id = ?", [result.insertId]);
      return { status: 201, data: rows[0] };
    } catch (error) {
      logError("addCertificate error: " + error.message);
      return { error: "Failed to add certificate", status: 500 };
    }
  },

  async updateCertificate(certId, userId, data) {
    try {
      const result = await query(`UPDATE candidate_certificates SET name = COALESCE(?, name), issuer = COALESCE(?, issuer), year = COALESCE(?, year) WHERE id = ? AND user_id = ?`, [data.name || null, data.issuer || null, data.year || null, certId, userId]);
      if (result.affectedRows === 0) return { error: "Certificate not found or unauthorized", status: 404 };
      const rows = await query("SELECT * FROM candidate_certificates WHERE id = ?", [certId]);
      return { status: 200, data: rows[0] };
    } catch (error) {
      logError("updateCertificate error: " + error.message);
      return { error: "Failed to update certificate", status: 500 };
    }
  },

  async deleteCertificate(certId, userId) {
    try {
      const result = await query("DELETE FROM candidate_certificates WHERE id = ? AND user_id = ?", [certId, userId]);
      if (result.affectedRows === 0) return { error: "Certificate not found or unauthorized", status: 404 };
      return { status: 200, message: "Certificate deleted" };
    } catch (error) {
      logError("deleteCertificate error: " + error.message);
      return { error: "Failed to delete certificate", status: 500 };
    }
  }
};

module.exports = candidateService;