const test = require("node:test");
const assert = require("node:assert/strict");

const {
  validateRegister,
  validateLogin,
  validateJobCreate,
  validateJobUpdate
} = require("../src/utils/validation.util");

test("validateRegister accepts valid candidate payload", () => {
  const result = validateRegister({
    email: "candidate@example.com",
    password: "Password123!",
    role: "candidate",
    full_name: "Candidate User"
  });

  assert.equal(result.valid, true);
});

test("validateLogin rejects short passwords", () => {
  const result = validateLogin({
    email: "candidate@example.com",
    password: "short"
  });

  assert.equal(result.valid, false);
  assert.match(result.message, /at least 8 characters/i);
});

test("validateJobCreate accepts snake_case payload", () => {
  const result = validateJobCreate({
    title: "Backend Engineer",
    location: "Remote",
    work_mode: "Remote",
    employment_type: "Full-time",
    level: "Mid",
    field: "Engineering",
    summary: "Build backend APIs",
    years_required: 3
  });

  assert.equal(result.valid, true);
});

test("validateJobUpdate accepts camelCase payload", () => {
  const result = validateJobUpdate({
    workMode: "Hybrid",
    employmentType: "Part-time",
    yearsRequired: 1
  });

  assert.equal(result.valid, true);
});

test("validateJobCreate rejects invalid enum values", () => {
  const result = validateJobCreate({
    title: "Backend Engineer",
    location: "Remote",
    work_mode: "Anywhere",
    employment_type: "Full-time",
    level: "Mid",
    field: "Engineering",
    summary: "Build backend APIs"
  });

  assert.equal(result.valid, false);
  assert.match(result.message, /invalid work mode/i);
});
