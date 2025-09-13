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

const errorToHttp = (res, err, logger = console) => {
  if (err instanceof AppError) {
    logger.error(`[${err.code}] ${err.message}`, err.details || "");
    return res.status(err.status).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details || null,
      },
    });
  }
  logger.error("[UNEXPECTED_ERROR]", err);
  return res.status(500).json({
    success: false,
    error: {
      code: "UNEXPECTED_ERROR",
      message: "An unexpected error occurred.",
    },
  });
};

module.exports = { AppError, assert, errorToHttp };
