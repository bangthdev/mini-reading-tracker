const express = require("express");
const AppError = require("../errors/AppError");
const pool = require("../db/pool");
const { applyChanges } = require("../services/shelfRules");

const router = express.Router();

const STATUSES = ["want_to_read", "reading", "read"];

// POST /api/shelf — thêm sách vào tủ, trả 409 nếu trùng work_key
router.post("/", async (req, res, next) => {
  try {
    const {
      workKey,
      title,
      author,
      coverId,
      firstPublishYear,
      totalPages,
      status,
    } = req.body;

    const errors = [];
    if (!/^OL\d+W$/.test(String(workKey || ""))) {
      errors.push({
        field: "workKey",
        message: "workKey phải có dạng OL<số>W",
      });
    }
    if (!String(title || "").trim()) {
      errors.push({ field: "title", message: "Tên sách không được để trống" });
    }
    if (status !== undefined && !STATUSES.includes(status)) {
      errors.push({
        field: "status",
        message: `status phải là một trong ${STATUSES.join(", ")}`,
      });
    }
    if (
      totalPages !== undefined &&
      totalPages !== null &&
      (!Number.isInteger(totalPages) || totalPages < 1)
    ) {
      errors.push({
        field: "totalPages",
        message: "totalPages phải là số nguyên lớn hơn 0",
      });
    }
    // Cột first_publish_year là SMALLINT: giá trị không phải số nguyên làm
    // MySQL ném lỗi, thành 500 thay vì 400.
    if (
      firstPublishYear !== undefined &&
      firstPublishYear !== null &&
      !Number.isInteger(firstPublishYear)
    ) {
      errors.push({
        field: "firstPublishYear",
        message: "firstPublishYear phải là số nguyên (năm)",
      });
    }
    if (errors.length > 0) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Dữ liệu không hợp lệ",
        errors,
      );
    }

    // Sách mới vào tủ ở "muốn đọc", trang 0; trạng thái chọn sẵn thì để
    // shelfRules suy ra. Chép lại luật ở đây thì thêm và sửa sẽ lệch nhau.
    const sachMoi = {
      status: "want_to_read",
      current_page: 0,
      total_pages: totalPages ?? null,
      rating: null,
      note: null,
      started_at: null,
      finished_at: null,
    };
    const { fields, errors: loiLuat } = applyChanges(
      sachMoi,
      status === undefined ? {} : { status },
    );
    if (loiLuat.length > 0) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Dữ liệu không hợp lệ",
        loiLuat,
      );
    }
    const banGhi = { ...sachMoi, ...fields };

    const [result] = await pool.query(
      `INSERT INTO shelf_books (work_key, title, author, cover_id, first_publish_year, total_pages, current_page, status, started_at, finished_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        workKey,
        title,
        author ?? null,
        coverId ?? null,
        firstPublishYear ?? null,
        banGhi.total_pages,
        banGhi.current_page,
        banGhi.status,
        banGhi.started_at,
        banGhi.finished_at,
      ],
    );

    const [rows] = await pool.query("SELECT * FROM shelf_books WHERE id = ?", [
      result.insertId,
    ]);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return next(
        new AppError(409, "BOOK_ALREADY_IN_SHELF", "Sách đã có trong tủ"),
      );
    }
    next(err);
  }
});
// GET /api/shelf?status=  — danh sách tủ sách, lọc theo tab
router.get("/", async (req, res, next) => {
  try {
    const { status } = req.query;

    if (status !== undefined && !STATUSES.includes(status)) {
      throw new AppError(400, "VALIDATION_ERROR", "Dữ liệu không hợp lệ", [
        {
          field: "status",
          message: `status phải là một trong ${STATUSES.join(", ")}`,
        },
      ]);
    }

    const [rows] = status
      ? await pool.query(
          "SELECT * FROM shelf_books WHERE status = ? ORDER BY created_at DESC, id DESC",
          [status],
        )
      : await pool.query(
          "SELECT * FROM shelf_books ORDER BY created_at DESC, id DESC",
        );

    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/shelf/stats — thống kê cho Màn 3
router.get("/stats", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS total, SUM(status = 'reading') AS reading, SUM(status = 'read') AS \`read\` FROM shelf_books`,
    );

    res.json({
      total: Number(rows[0].total),
      reading: Number(rows[0].reading ?? 0),
      read: Number(rows[0].read ?? 0),
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/shelf/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      throw new AppError(400, "VALIDATION_ERROR", "Dữ liệu không hợp lệ", [
        { field: "id", message: "id phải là số nguyên dương" },
      ]);
    }

    const [result] = await pool.query("DELETE FROM shelf_books WHERE id = ?", [
      id,
    ]);
    if (result.affectedRows === 0) {
      throw new AppError(404, "NO_BOOK", "Không tìm thấy sách trong tủ");
    }

    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// PATCH /api/shelf/:id — cập nhật tiến độ, trạng thái, đánh giá, ghi chú
router.patch("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      throw new AppError(400, "VALIDATION_ERROR", "Dữ liệu không hợp lệ", [
        { field: "id", message: "id phải là số nguyên dương" },
      ]);
    }

    const [rows] = await pool.query("SELECT * FROM shelf_books WHERE id = ?", [
      id,
    ]);
    if (rows.length === 0) {
      throw new AppError(404, "NO_BOOK", "Không tìm thấy sách trong tủ");
    }

    const { fields, errors } = applyChanges(rows[0], req.body ?? {});
    if (errors.length > 0) {
      throw new AppError(400, "VALIDATION_ERROR", "Dữ liệu không hợp lệ", errors);
    }

    const columns = Object.keys(fields);
    if (columns.length > 0) {
      await pool.query(
        `UPDATE shelf_books SET ${columns.map((c) => `${c} = ?`).join(", ")} WHERE id = ?`,
        [...columns.map((c) => fields[c]), id],
      );
    }

    const [updated] = await pool.query(
      "SELECT * FROM shelf_books WHERE id = ?",
      [id],
    );
    res.json(updated[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
