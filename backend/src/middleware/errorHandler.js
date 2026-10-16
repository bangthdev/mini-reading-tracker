const AppError = require("../errors/AppError");
function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }
  // express.json() ném SyntaxError kèm status 400 khi body không parse được.
  // Không bắt ở đây thì nó rơi xuống nhánh 500, đổ lỗi cho máy chủ.
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      error: {
        code: "INVALID_JSON",
        message: "Body không phải JSON hợp lệ",
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
