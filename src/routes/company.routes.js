const express = require("express");
const router = express.Router();
const companyController = require("../controllers/company.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireCompany } = require("../middleware/role.middleware");

/**
Company Routes
Base path: /api/companies
Public: list, view by ID
Protected (Company only): profile update
*/
router.get("/", companyController.getAllCompanies);

router.put("/profile", requireAuth, requireCompany, companyController.updateProfile);

router.get("/:id", companyController.getCompanyById);

module.exports = router;