const express = require("express");
const router = express.Router();
const candidateController = require("../controllers/candidate.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireCandidate } = require("../middleware/role.middleware");

/**
Candidate Routes
Base path: /api/candidates
Public: list, view by ID
Protected (Candidate only): profile update, experience, education, certificates
*/
router.get("/", candidateController.getAllCandidates);

router.put("/profile", requireAuth, requireCandidate, candidateController.updateProfile);

router.post("/experience", requireAuth, requireCandidate, candidateController.addExperience);
router.put("/experience/:id", requireAuth, requireCandidate, candidateController.updateExperience);
router.delete("/experience/:id", requireAuth, requireCandidate, candidateController.deleteExperience);

router.post("/education", requireAuth, requireCandidate, candidateController.addEducation);
router.put("/education/:id", requireAuth, requireCandidate, candidateController.updateEducation);
router.delete("/education/:id", requireAuth, requireCandidate, candidateController.deleteEducation);

router.post("/certificates", requireAuth, requireCandidate, candidateController.addCertificate);
router.put("/certificates/:id", requireAuth, requireCandidate, candidateController.updateCertificate);
router.delete("/certificates/:id", requireAuth, requireCandidate, candidateController.deleteCertificate);

router.get("/:id", candidateController.getCandidateById);

module.exports = router;