-- Dữ liệu mẫu cho người chấm xem ngay khi mở app (yêu cầu mục 5 của đề).
-- Toàn bộ work_key, tên sách, tác giả, ảnh bìa, năm và số trang lấy thật từ
-- Open Library. Cuốn "Toad Is the Uncle of Heaven" cố ý giữ total_pages NULL —
-- Open Library thật sự không có số trang cho cuốn này, dùng để xem giao diện
-- xử lý trường hợp thiếu dữ liệu ra sao.
--
-- Chạy lại nhiều lần được: xoá sạch trước khi chèn.
DELETE FROM shelf_books;

INSERT INTO shelf_books
  (work_key, title, author, cover_id, first_publish_year, total_pages, current_page, status, rating, note, started_at, finished_at)
VALUES
  ('OL17075811W', 'Sapiens', 'Yuval Noah Harari', 8634250, 2011, 456, 456, 'read', 5,
   'Chương về cách mạng nhận thức đáng đọc lại', '2026-08-02 20:00:00', '2026-09-10 22:30:00'),

  ('OL27302828W', 'Nhà giả kim', 'Paulo Coelho', 12634885, 2016, 225, 225, 'read', 4,
   'Ngắn, đọc một buổi tối', '2026-09-14 21:00:00', '2026-09-15 00:40:00'),

  ('OL17930368W', 'Atomic Habits', 'James Clear', 12539702, 2016, 322, 322, 'read', 4,
   'Phần về môi trường tác động tới thói quen là hay nhất', '2026-07-01 19:00:00', '2026-07-21 23:10:00'),

  ('OL27482W', 'The Hobbit', 'J.R.R. Tolkien', 14627509, 1937, 310, 180, 'reading', NULL,
   'Đọc lại lần 2, phần Mirkwood vẫn hay nhất', '2026-10-05 21:30:00', NULL),

  ('OL17618370W', 'Clean Code', 'Robert C. Martin', 8065615, 2008, 444, 120, 'reading', NULL,
   'Đọc chậm, mỗi chương ngẫm một ngày', '2026-09-28 20:15:00', NULL),

  ('OL8550694W', 'Toad Is the Uncle of Heaven', 'Jeanne Lee', 1578435, 1999, NULL, 24, 'reading', NULL,
   'Open Library không có số trang cuốn này', '2026-10-12 22:00:00', NULL),

  ('OL19293745W', 'Designing Data-Intensive Applications', 'Martin Kleppmann', 8434671, 2017, 618, 0, 'want_to_read', NULL,
   NULL, NULL, NULL),

  ('OL5748544W', 'The Pragmatic Programmer', 'Andy Hunt, Dave Thomas', 10143650, 1999, 352, 0, 'want_to_read', NULL,
   NULL, NULL, NULL);
