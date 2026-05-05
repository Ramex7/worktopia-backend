function validateEmail(email) {
  if (!email || typeof email !== "string")
    return { valid: false, message: "Email is required" };
  const trimmed = email.trim().toLowerCase();
  if (trimmed.length === 0)
    return { valid: false, message: "Email cannot be empty" };
  if (trimmed.length > 254)
    return { valid: false, message: "Email must be 254 characters or fewer" };
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed))
    return { valid: false, message: "Invalid email format" };
  return { valid: true, message: "", sanitized: trimmed };
}

function validatePassword(password) {
  if (!password || typeof password !== "string")
    return { valid: false, message: "Password is required" };
  if (password.length < 8)
    return { valid: false, message: "Password must be at least 8 characters" };
  if (password.length > 128)
    return {
      valid: false,
      message: "Password must be 128 characters or fewer",
    };
  return { valid: true, message: "" };
}

function validateId(id) {
  if (id === undefined || id === null)
    return { valid: false, message: "ID is required" };
  const num = Number(id);
  if (!Number.isInteger(num) || num <= 0)
    return { valid: false, message: "ID must be a positive integer" };
  return { valid: true, message: "", sanitized: num };
}

function validateRegister(body) {
  if (!body || typeof body !== "object")
    return { valid: false, message: "Request body is required" };
  const emailCheck = validateEmail(body.email);
  if (!emailCheck.valid) return emailCheck;
  const passwordCheck = validatePassword(body.password);
  if (!passwordCheck.valid) return passwordCheck;
  const role = body.role;
  if (!role || !["candidate", "company"].includes(role))
    return { valid: false, message: "Role must be 'candidate' or 'company'" };
  const nameField = role === "candidate" ? "full_name" : "company_name";
  const name = body[nameField];
  if (!name || typeof name !== "string" || name.trim().length === 0)
    return { valid: false, message: `${nameField} is required` };
  if (name.trim().length > 150)
    return {
      valid: false,
      message: `${nameField} must be 150 characters or fewer`,
    };
  return { valid: true, message: "" };
}

function validateLogin(body) {
  if (!body || typeof body !== "object")
    return { valid: false, message: "Request body is required" };
  const emailCheck = validateEmail(body.email);
  if (!emailCheck.valid) return emailCheck;
  const passwordCheck = validatePassword(body.password);
  if (!passwordCheck.valid) return passwordCheck;
  return { valid: true, message: "" };
}

function validateProfileUpdate(body, role) {
  if (!body || typeof body !== "object")
    return { valid: false, message: "Request body is required" };
  if (Object.keys(body).length === 0)
    return {
      valid: false,
      message: "At least one field is required for update",
    };
  const maxLengths = {
    full_name: 100,
    field: 100,
    headline: 255,
    bio: 65535,
    about: 65535,
    location: 100,
    company_name: 150,
    industry: 100,
    description: 65535,
  };
  for (const [key, maxLength] of Object.entries(maxLengths)) {
    if (
      body[key] !== undefined &&
      typeof body[key] === "string" &&
      body[key].length > maxLength
    ) {
      return {
        valid: false,
        message: `${key} must be ${maxLength} characters or fewer`,
      };
    }
  }
  return { valid: true, message: "" };
}

function validateJobCreate(data) {
  if (!data) return { valid: false, message: "Job data is required" };
  const workMode = data.workMode ?? data.work_mode;
  const employmentType = data.employmentType ?? data.employment_type;
  const yearsRequired = data.yearsRequired ?? data.years_required;
  const {
    title,
    location,
    level,
    field,
    summary,
    responsibilities,
    requirements,
    benefits,
  } = data;
  if (!title || typeof title !== "string" || title.trim().length === 0)
    return { valid: false, message: "Job title is required" };
  if (!location || typeof location !== "string" || location.trim().length === 0)
    return { valid: false, message: "Location is required" };
  if (!workMode || !["Remote", "Hybrid", "On-site"].includes(workMode))
    return { valid: false, message: "Invalid work mode" };
  if (
    !employmentType ||
    !["Full-time", "Part-time", "Internship"].includes(employmentType)
  )
    return { valid: false, message: "Invalid employment type" };
  if (!level || !["Junior", "Mid", "Senior", "Intern"].includes(level))
    return { valid: false, message: "Invalid level" };
  if (!field || typeof field !== "string" || field.trim().length === 0)
    return { valid: false, message: "Field is required" };
  if (!summary || typeof summary !== "string" || summary.trim().length === 0)
    return { valid: false, message: "Summary is required" };
  if (
    yearsRequired !== undefined &&
    (!Number.isInteger(Number(yearsRequired)) || Number(yearsRequired) < 0)
  ) {
    return { valid: false, message: "years_required must be 0 or greater" };
  }
  const validateArrayItems = (arr, name) => {
    if (arr && !Array.isArray(arr))
      return { valid: false, message: `${name} must be an array` };
    if (Array.isArray(arr)) {
      for (const item of arr) {
        if (
          !item.title ||
          typeof item.title !== "string" ||
          !item.detail ||
          typeof item.detail !== "string"
        ) {
          return {
            valid: false,
            message: `Each ${name.toLowerCase()} must have a title and detail`,
          };
        }
      }
    }
    return null;
  };
  return (
    validateArrayItems(responsibilities, "Responsibilities") ||
    validateArrayItems(requirements, "Requirements") ||
    validateArrayItems(benefits, "Benefits") || { valid: true, message: "" }
  );
}

function validateJobUpdate(data) {
  if (!data) return { valid: false, message: "Job data is required" };
  const title = data.title;
  const location = data.location;
  const workMode = data.workMode ?? data.work_mode;
  const employmentType = data.employmentType ?? data.employment_type;
  const level = data.level;
  const field = data.field;
  const summary = data.summary;
  const yearsRequired = data.yearsRequired ?? data.years_required;
  if (
    title !== undefined &&
    (typeof title !== "string" || title.trim().length === 0)
  )
    return { valid: false, message: "Invalid title" };
  if (
    location !== undefined &&
    (typeof location !== "string" || location.trim().length === 0)
  )
    return { valid: false, message: "Invalid location" };
  if (
    workMode !== undefined &&
    !["Remote", "Hybrid", "On-site"].includes(workMode)
  )
    return { valid: false, message: "Invalid work mode" };
  if (
    employmentType !== undefined &&
    !["Full-time", "Part-time", "Internship"].includes(employmentType)
  )
    return { valid: false, message: "Invalid employment type" };
  if (
    level !== undefined &&
    !["Junior", "Mid", "Senior", "Intern"].includes(level)
  )
    return { valid: false, message: "Invalid level" };
  if (
    field !== undefined &&
    (typeof field !== "string" || field.trim().length === 0)
  )
    return { valid: false, message: "Invalid field" };
  if (
    summary !== undefined &&
    (typeof summary !== "string" || summary.trim().length === 0)
  )
    return { valid: false, message: "Invalid summary" };
  if (
    yearsRequired !== undefined &&
    (!Number.isInteger(Number(yearsRequired)) || Number(yearsRequired) < 0)
  )
    return { valid: false, message: "Invalid years_required" };
  return { valid: true, message: "" };
}

module.exports = {
  validateEmail,
  validatePassword,
  validateId,
  validateRegister,
  validateLogin,
  validateProfileUpdate,
  validateJobCreate,
  validateJobUpdate,
};
