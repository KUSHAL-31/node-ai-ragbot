// src/utils/errors.js
class AppError extends Error {
  constructor(code, message, status = 400, details = undefined) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

const assert = (cond, code, message, status = 400, details) => {
  if (!cond) throw new AppError(code, message, status, details);
};

function errorToHttpPayload(err) {
  if (err instanceof AppError) {
    return {
      status: err.status || 400,
      headers: { "Content-Type": "application/json" },
      body: {
        success: false,
        error: {
          code: err.code,
          message: err.message,
          details: err.details || null,
        },
      },
    };
  }
  // Unexpected
  return {
    status: 500,
    headers: { "Content-Type": "application/json" },
    body: {
      success: false,
      error: {
        code: "UNEXPECTED_ERROR",
        message: "An unexpected error occurred.",
      },
    },
  };
}

module.exports = { AppError, assert, errorToHttpPayload };
