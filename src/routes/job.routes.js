const express = require("express");
const router = express.Router();
const jobController = require("../controllers/job.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireCompany, requireCandidate } = require("../middleware/role.middleware");

/**
Job Routes
Base path: /api/jobs
Public: list, view by ID
Company-only: CRUD, applicants, sub-resources
Candidate-only: apply, save/unsave, saved list
*/
router.get("/", jobController.getAllJobs);

router.get("/saved", requireAuth, requireCandidate, jobController.getSavedJobs);
router.post("/", requireAuth, requireCompany, jobController.createJob);

router.get("/:id", jobController.getJobById);
router.put("/:id", requireAuth, requireCompany, jobController.updateJob);
router.delete("/:id", requireAuth, requireCompany, jobController.deleteJob);

router.post("/:id/apply", requireAuth, requireCandidate, jobController.applyToJob);
router.get("/:id/applicants", requireAuth, requireCompany, jobController.getApplicantsForJob);
router.post("/:id/save", requireAuth, requireCandidate, jobController.saveJob);
router.delete("/:id/unsave", requireAuth, requireCandidate, jobController.unsaveJob);

// Sub-resources (Company only)
router.post("/:id/responsibilities", requireAuth, requireCompany, jobController.addResponsibility);
router.put("/responsibilities/:id", requireAuth, requireCompany, jobController.updateResponsibility);
router.delete("/responsibilities/:id", requireAuth, requireCompany, jobController.deleteResponsibility);

router.post("/:id/requirements", requireAuth, requireCompany, jobController.addRequirement);
router.put("/requirements/:id", requireAuth, requireCompany, jobController.updateRequirement);
router.delete("/requirements/:id", requireAuth, requireCompany, jobController.deleteRequirement);

router.post("/:id/benefits", requireAuth, requireCompany, jobController.addBenefit);
router.put("/benefits/:id", requireAuth, requireCompany, jobController.updateBenefit);
router.delete("/benefits/:id", requireAuth, requireCompany, jobController.deleteBenefit);

module.exports = router;