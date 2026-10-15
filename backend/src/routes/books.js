const express = require("express");
const AppError = require("../errors/AppError");
const openLibrary = require("../services/openLibrary");
const pool = require("../db/pool");

const router = express.Router();

// GET /api/books/search?q=&page= — tìm sách, gắn cờ inShelf cho từng kết quả
router.get("/search", async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    const page = Number(req.query.page ?? 1);

    const errors = [];
    if (q == "") {
      errors.push({
        field: "q",
        message: "Từ khóa tìm kiếm không được để trống",
      });
    }
    if (!Number.isInteger(page) || page < 1) {
      errors.push({
        field: "page",
        message: "Page phải là số nguyên lớn hơn 0",
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

    const data = await openLibrary.searchBooks(q, page);
    const books = data.docs.map((doc) => ({
      workKey: doc.key.replace("/works/", ""),
      title: doc.title,
      author: doc.author_name ? doc.author_name.join(", ") : null,
      coverId: doc.cover_i ?? null,
      firstPublishYear: doc.first_publish_year ?? null,
      totalPages: doc.number_of_pages_median ?? null,
    }));

    let inShelfSet = new Set();
    if (books.length > 0) {
      const keys = books.map((b) => b.workKey);
      const [rows] = await pool.query(
        "SELECT work_key FROM shelf_books WHERE work_key IN (?)",
        [keys],
      );
      inShelfSet = new Set(rows.map((r) => r.work_key));
    }
    res.json({
      books: books.map((b) => ({ ...b, inShelf: inShelfSet.has(b.workKey) })),
      total: data.numFound,
      page,
    });
  } catch (err) {
    next(err);
  }
});

function normaliseDescription(description) {
  if (!description) return null;
  if (typeof description === "string") return description;
  return description.value ?? null;
}

// GET /api/books/:workId — chi tiết sách cho Màn 2 (đi theo redirect, lấy tên tác giả)
router.get("/:workId", async (req, res, next) => {
  try {
    const workId = String(req.params.workId || "").trim();
    if (!/^OL\d+W$/.test(workId)) {
      throw new AppError(400, "VALIDATION_ERROR", "Dữ liệu không hợp lệ", [
        { field: "workId", message: "workId phải có dạng OL<số>W" },
      ]);
    }

    let work = await openLibrary.getWork(workId);

    if (work.type?.key === "/type/redirect" && work.location) {
      work = await openLibrary.getWork(work.location.replace("/works/", ""));
    }

    const authorIds = (work.authors || [])
      .map((a) => a.author?.key?.replace("/authors/", ""))
      .filter(Boolean);
    const authors = await Promise.all(
      authorIds.map((id) => openLibrary.getAuthor(id).catch(() => null)),
    );
    const author =
      authors
        .filter(Boolean)
        .map((a) => a.name)
        .filter(Boolean)
        .join(", ") || null;

    res.json({
      workKey: work.key.replace("/works/", ""),
      title: work.title,
      author,
      description: normaliseDescription(work.description),
      coverId: work.covers?.[0] ?? null,
      subjects: work.subjects || [],
      firstPublishYear: work.first_publish_date ?? null,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
