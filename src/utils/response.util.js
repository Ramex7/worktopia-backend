function successResponse(data, message = "Success") {
  return { success: true, data: data !== undefined ? data : null, message };
}

function errorResponse(message, error) {
  const response = {
    success: false,
    message: message || "An unexpected error occurred",
  };
  if (error && process.env.NODE_ENV !== "production") response.error = error;
  return response;
}

function paginatedResponse(data, meta, message = "Success") {
  return {
    success: true,
    data: Array.isArray(data) ? data : [],
    meta: meta || {},
    message,
  };
}

module.exports = { successResponse, errorResponse, paginatedResponse };
