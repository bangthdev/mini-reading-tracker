const express = require("express");
const AppError = require("./errors/AppError");
const healthRouter = require("./routes/health");
const coversRouter = require("./routes/covers");
const errorHandler = require("./middleware/errorHandler");
const books = require("./routes/books");
const shelf = require("./routes/shelf");
const app = express();

app.use(express.json());
app.use("/api/health", healthRouter);
app.use("/api/covers", coversRouter);
app.use("/api/books", books);
app.use("/api/shelf", shelf);

// Không khớp route nào thì Express trả trang HTML mặc định của nó, lạc khỏi
// format lỗi JSON của phần còn lại. Đẩy vào errorHandler để mọi lỗi cùng dạng.
app.use((req, _res, next) => {
  next(
    new AppError(404, "NOT_FOUND", `Không có endpoint ${req.method} ${req.path}`),
  );
});

app.use(errorHandler);

module.exports = app;
