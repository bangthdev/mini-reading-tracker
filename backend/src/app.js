const express = require("express");
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
app.use(errorHandler);

module.exports = app;
