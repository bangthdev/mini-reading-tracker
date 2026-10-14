CREATE TABLE shelf_books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  work_key  VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(500) NOT NULL,
  author VARCHAR(500),
  cover_id INT,
  first_publish_year SMALLINT,
  total_pages INT,
  current_page INT NOT NULL DEFAULT 0,
  status ENUM('want_to_read', 'reading', 'read') DEFAULT 'want_to_read' NOT NULL,
  rating TINYINT,
  note TEXT,
  started_at DATETIME NULL,
  finished_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)
