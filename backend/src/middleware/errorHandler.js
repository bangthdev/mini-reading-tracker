const AppError = require("../errors/AppError");
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }
  console.error(err);
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Something went wrong",
    },
  });
}

module.exports = errorHandler;
