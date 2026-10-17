-- Dữ liệu mẫu cho người chấm xem ngay khi mở app (yêu cầu mục 5 của đề).
-- 60 cuốn, 20 mỗi trạng thái. Toàn bộ work_key, tên sách, tác giả, ảnh bìa,
-- năm và số trang lấy thật từ Open Library; từng ảnh bìa đã kiểm là tải được.
--
-- Cố ý giữ vài cuốn thiếu dữ liệu để xem giao diện xử lý ra sao:
--   3 cuốn total_pages NULL  — ẩn thanh tiến độ, chỉ ghi "đã đọc đến trang N"
--   3 cuốn cover_id NULL     — vẽ ô giấy mang tên sách thay ảnh bìa
--
-- Chạy lại nhiều lần được: xoá sạch trước khi chèn.
DELETE FROM shelf_books;

INSERT INTO shelf_books
  (work_key, title, author, cover_id, first_publish_year, total_pages, current_page, status, rating, note, started_at, finished_at)
VALUES
  ('OL262460W', 'The Lost World', 'Arthur Conan Doyle', 8231444, 1900, 238, 238, 'read', 3, 'Chương cuối làm thay đổi cách nhìn cả cuốn', '2026-04-07 20:30:00', '2026-08-08 19:40:00'),
  ('OL5735363W', 'The Hunger Games', 'Suzanne Collins', 12646537, 2008, 397, 397, 'read', 4, 'Hay hơn mình tưởng nhiều', '2026-07-11 20:45:00', '2026-09-26 19:25:00'),
  ('OL15940730W', 'The productive programmer', 'Neal Ford', 8710347, 2008, 206, 206, 'read', 3, 'Không hợp gu lắm nhưng vẫn học được vài thứ', '2026-05-06 21:45:00', '2026-10-22 19:25:00'),
  ('OL18130476W', 'Tales from a Not-So-Happy Birthday', 'Rachel Renée Russell', 14418432, 2018, 300, 300, 'read', 3, 'Phần giữa hơi dài nhưng kết rất đáng', '2026-06-16 19:30:00', '2026-09-13 20:10:00'),
  ('OL16526040W', 'Real World Haskell', 'Bryan O''Sullivan, John Goerzen', 7170889, 2008, 710, 710, 'read', 3, 'Mượn của bạn, đọc xong muốn mua một bản riêng', '2026-05-16 22:00:00', '2026-10-11 20:25:00'),
  ('OL4781294W', 'Introduction to Algorithms', 'Thomas H. Cormen, Charles E. Leiserson', 2341462, 1990, 1292, 1292, 'read', 4, 'Ghi chú kín cả lề sách', '2026-06-19 20:45:00', '2026-08-06 23:40:00'),
  ('OL9486352W', 'JavaScript', 'Douglas Crockford, Ke luo ke fu de', 9245523, 2008, 190, 190, 'read', 4, 'Đọc xong mới tiếc là đọc muộn', '2026-04-02 22:00:00', '2026-08-21 23:40:00'),
  ('OL1099513W', 'Voyage au Centre de la Terre', 'Jules Verne', 5890987, 1867, 244, 244, 'read', 3, 'Câu văn đẹp, cốt truyện thì vừa phải', '2026-05-04 21:15:00', '2026-08-11 20:10:00'),
  ('OL8977929W', 'Managing Humans', 'Michael Lopp', 1971212, 2007, 209, 209, 'read', 4, 'Sẽ đọc lại sau một năm nữa', '2026-07-23 20:00:00', '2026-08-26 21:25:00'),
  ('OL16336633W', 'Fifty Shades of Grey', 'E. L. James', 12648183, 2000, 544, 544, 'read', 4, 'Đọc lần hai mới hiểu phần mở đầu', '2026-03-12 20:15:00', '2026-08-14 20:40:00'),
  ('OL9188185W', 'Lean Software Development', 'Mary Poppendieck, Tom Poppendieck', 5547795, 2003, 222, 222, 'read', 5, 'Đọc trên tàu, hết đúng lúc xuống ga', '2026-05-11 21:45:00', '2026-10-15 21:10:00'),
  ('OL18146365W', 'Refactoring', 'Martin Fowler', 8507565, 2018, 448, 448, 'read', 3, 'Đọc một mạch, không bỏ xuống được', '2026-03-06 19:30:00', '2026-10-03 19:10:00'),
  ('OL20006564W', 'The effective engineer', 'Edmond Lau', 9173899, 2015, 245, 245, 'read', 5, NULL, '2026-04-09 21:30:00', '2026-08-24 19:25:00'),
  ('OL262984W', 'Papillon', 'Henri Charrière', 8752, 1969, 560, 560, 'read', 5, NULL, '2026-03-26 21:45:00', '2026-10-12 19:40:00'),
  ('OL4482600W', 'Dispatches', 'Michael Herr', 2388924, 1977, 260, 260, 'read', 3, NULL, '2026-05-04 21:15:00', '2026-09-17 20:40:00'),
  ('OL15518787W', 'The Hunger Games Trilogy (Hunger Games / Catching Fire / Mockingjay)', 'Suzanne Collins', 12878880, 2010, 1136, 1136, 'read', 4, NULL, '2026-06-11 20:45:00', '2026-08-23 20:10:00'),
  ('OL5748544W', 'The Pragmatic Programmer', 'Andy Hunt, Dave Thomas', 10143650, 1999, 352, 352, 'read', 5, NULL, '2026-06-18 19:15:00', '2026-09-27 20:25:00'),
  ('OL11822690W', 'Paper Towns', 'John Green', 5731773, 2008, 367, 367, 'read', 3, NULL, '2026-05-17 21:15:00', '2026-09-09 23:40:00'),
  ('OL7938163W', 'Advances in Computers, Volume 49 (Advances in Computers)', 'Marvin V. Zelkowitz, Marshall C. Yovits', 1094406, 1995, 345, 345, 'read', 5, NULL, '2026-04-07 20:15:00', '2026-10-21 20:25:00'),
  ('OL5819884W', 'Brisingr', 'Christopher Paolini', 2411585, 2004, 784, 784, 'read', 4, NULL, '2026-05-22 19:45:00', '2026-08-25 20:10:00'),
  ('OL15842384W', 'Designing the user interface', 'Ben Shneiderman, Catherine Plaisant', 6805696, 1987, 632, 517, 'reading', 3, 'Đọc được một phần ba, đang cuốn', '2026-10-13 21:00:00', NULL),
  ('OL20028554W', 'Site Reliability Engineering', 'Betsy Beyer, Jones, Chris (Computer engineer)', 9196682, 2016, 524, 79, 'reading', NULL, 'Hơi khó vào, cố thêm vài chương nữa', '2026-09-04 21:00:00', NULL),
  ('OL5735360W', 'Catching Fire', 'Suzanne Collins', 12646539, 2009, 400, 86, 'reading', NULL, 'Mang theo đọc lúc chờ xe', '2026-10-05 22:00:00', NULL),
  ('OL24233014W', 'Genius Makers', 'Cade Metz', 10708874, 2021, 360, 61, 'reading', NULL, 'Đang chậm lại ở phần giữa', '2026-09-01 19:40:00', NULL),
  ('OL3510570W', 'The Mythical Man-Month', 'Frederick P. Brooks', 6915361, 1974, 195, 78, 'reading', NULL, 'Đọc mỗi tối một chương', '2026-10-01 19:40:00', NULL),
  ('OL23205W', 'The Grapes of Wrath', 'John Steinbeck', 12715902, 1939, 544, 339, 'reading', NULL, 'Đọc song song với một cuốn khác', '2026-10-25 20:40:00', NULL),
  ('OL23204W', 'Of Mice and Men', 'John Steinbeck', 14319003, 1937, 119, 67, 'reading', 4, 'Vừa đọc vừa ghi chép', '2026-10-07 19:40:00', NULL),
  ('OL8578577W', 'Don''t Make Me Think', 'Steve Krug', 554640, 2000, 201, 134, 'reading', NULL, 'Để trên bàn làm việc, đọc lúc nghỉ', '2026-09-21 19:20:00', NULL),
  ('OL14908941W', 'Mockingjay', 'Suzanne Collins', 12646459, 2010, 424, 253, 'reading', NULL, NULL, '2026-09-25 19:40:00', NULL),
  ('OL20716197W', 'The Ballad of Songbirds and Snakes', 'Suzanne Collins', 14421833, 2020, 528, 153, 'reading', NULL, NULL, '2026-09-15 20:20:00', NULL),
  ('OL5720025W', 'Eclipse', 'Stephenie Meyer', 12643410, 2006, 629, 538, 'reading', NULL, NULL, '2026-09-07 21:00:00', NULL),
  ('OL19547402W', 'Effective Modern C++: 42 Specific Ways to Improve Your Use of C++11 and C++14', 'Scott Meyers', 8513620, 2014, 334, 101, 'reading', NULL, NULL, '2026-09-26 20:00:00', NULL),
  ('OL19542983W', 'Accelerate', 'Nicole Forsgren, Jez Humble', 8509069, 2018, 288, 111, 'reading', 3, NULL, '2026-09-12 21:40:00', NULL),
  ('OL1701004W', 'Programming Perl', 'Larry Wall, Tom Christiansen', 715250, 1990, 645, 183, 'reading', NULL, NULL, '2026-09-08 22:20:00', NULL),
  ('OL8856129W', 'Real-Time Collision Detection (The Morgan Kaufmann Series in Interactive 3-D Technology)', 'Christer Ericson', 784253, 2004, 593, 332, 'reading', NULL, NULL, '2026-09-04 21:00:00', NULL),
  ('OL1961692W', 'Test-driven development', 'Kent Beck', 192577, 2002, 220, 38, 'reading', NULL, NULL, '2026-10-01 21:20:00', NULL),
  ('OL15522481W', 'Version control with Git', 'Jon Loeliger', 6755148, 2009, 436, 214, 'reading', NULL, NULL, '2026-09-23 22:00:00', NULL),
  ('OL27870212W', 'I See Yellow Flowers in the Green Grass', 'Nguyen Nhat Anh', 13201286, 2021, NULL, 76, 'reading', NULL, NULL, '2026-10-05 20:00:00', NULL),
  ('OL23937540W', 'Operaciones especiales en la edad de la caballería', 'Yuval Noah Harari', 10526784, 2018, NULL, 110, 'reading', 5, NULL, '2026-10-08 19:00:00', NULL),
  ('OL28025310W', 'Unstoppable Us, Volume 1', 'Ricard Zaplana Ruiz, Yuval Noah Harari', 13147242, 2022, NULL, 175, 'reading', NULL, NULL, '2026-09-24 21:40:00', NULL),
  ('OL5957689W', 'Masters of Doom', 'David Kushner', 606299, 2003, 336, 0, 'want_to_read', NULL, 'Thấy trên kệ hiệu sách', NULL, NULL),
  ('OL875437W', 'The Perks of Being a Wallflower', 'Stephen Chbosky', 14315052, 1999, 231, 0, 'want_to_read', NULL, 'Đọc sau khi xong cuốn đang dở', NULL, NULL),
  ('OL528094W', 'Autobiography of a Yogi', 'Yogananda Paramahansa', 805448, 1946, 514, 0, 'want_to_read', NULL, 'Mua rồi chưa mở', NULL, NULL),
  ('OL893461W', 'Dune Messiah', 'Frank Herbert', 980253, 1969, 279, 0, 'want_to_read', NULL, 'Bạn giới thiệu', NULL, NULL),
  ('OL2960016W', 'Software engineering', 'Ian Sommerville, Sommerville, Ian.', 3973371, 1982, 742, 0, 'want_to_read', NULL, 'Để dành cuối tuần', NULL, NULL),
  ('OL1308096W', 'Suite française', 'Irène Némirovsky', 10586111, 2004, 468, 0, 'want_to_read', NULL, 'Nghe nhắc tới nhiều lần', NULL, NULL),
  ('OL1972516W', 'Code', 'Charles Petzold, Charles Petzold', 460968, 1999, 393, 0, 'want_to_read', NULL, NULL, NULL, NULL),
  ('OL1953422W', 'Object-Oriented Software Engineering', 'Ivar Jacobson', 135140, 1992, 524, 0, 'want_to_read', NULL, NULL, NULL, NULL),
  ('OL17345497W', 'The Sympathizer', 'Viet Thanh Nguyen, Francois Chau', 7913176, 2015, 391, 0, 'want_to_read', NULL, NULL, NULL, NULL),
  ('OL5720027W', 'New Moon', 'Stephenie Meyer', 12643406, 2006, 563, 0, 'want_to_read', NULL, NULL, NULL, NULL),
  ('OL16298147W', 'The clean coder', 'Robert C. Martin', 7318893, 2011, 210, 0, 'want_to_read', NULL, NULL, NULL, NULL),
  ('OL7941012W', 'Usability Engineering (Interactive Technologies)', 'Jakob Nielsen', 80227, 1993, 362, 0, 'want_to_read', NULL, NULL, NULL, NULL),
  ('OL19542938W', 'Domain Modeling Made Functional', 'Scott Wlaschin', 8508987, 2018, 312, 0, 'want_to_read', NULL, NULL, NULL, NULL),
  ('OL3267304W', 'Structure and Interpretation of Computer Programs (SICP)', 'Harold Abelson, Gerald Jay Sussman', 149338, 1985, 542, 0, 'want_to_read', NULL, NULL, NULL, NULL),
  ('OL17203232W', 'Dork Diaries 7', 'Rachel Renée Russell', 7879562, 2014, 344, 0, 'want_to_read', NULL, NULL, NULL, NULL),
  ('OL17427523W', 'The Brilliant World of Tom Gates', 'Liz Pichon', 7557379, 2011, 256, 0, 'want_to_read', NULL, NULL, NULL, NULL),
  ('OL16310859W', 'Pro Git', 'Scott Chacon, Ben Straub', 7892827, 2009, 426, 0, 'want_to_read', NULL, NULL, NULL, NULL),
  ('OL23205957W', 'Sương khói quê nhà', 'Nhật Ánh Nguyễn', NULL, 2012, 214, 0, 'want_to_read', NULL, NULL, NULL, NULL),
  ('OL23402828W', 'Chú bé rắc rối', 'Nhật Ánh Nguyễn', NULL, 2013, 181, 0, 'want_to_read', NULL, NULL, NULL, NULL),
  ('OL23402803W', 'Đi qua hoa cúc', 'Nhật Ánh Nguyễn', NULL, 2012, 226, 0, 'want_to_read', NULL, NULL, NULL, NULL);
