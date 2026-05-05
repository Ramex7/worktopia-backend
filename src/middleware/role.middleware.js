const { errorResponse } = require("../utils/response.util");

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role)
      return res.status(401).json(errorResponse("Authentication required"));
    if (!allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json(
          errorResponse("Access denied — insufficient permissions", {
            required_roles: allowedRoles,
            your_role: req.user.role,
          }),
        );
    }
    next();
  };
}

const requireCandidate = requireRole("candidate");
const requireCompany = requireRole("company");
const requireAnyUser = requireRole("candidate", "company");

module.exports = {
  requireRole,
  requireCandidate,
  requireCompany,
  requireAnyUser,
};
