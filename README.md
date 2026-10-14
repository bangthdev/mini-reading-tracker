# Mini Reading Tracker

Ứng dụng web theo dõi việc đọc sách cá nhân: tìm sách qua Open Library, lưu vào tủ sách riêng, cập nhật tiến độ đọc, chấm sao và ghi chú.

> **TODO trước khi nộp:** điền link demo, chèn ảnh chụp màn hình, viết mục Giả định & Hạn chế.

**Demo:** <!-- TODO: Frontend URL --> · **API:** <!-- TODO: Backend URL -->

<!-- TODO: ảnh chụp 3 màn hình hoặc GIF -->

## Công nghệ sử dụng

| Lớp | Công nghệ | Lý do chọn |
|---|---|---|
| Frontend | Vue 3 (Composition API) + Vite + Vue Router + axios | Đề yêu cầu Vue. Không dùng Pinia vì state của app nhỏ, không chia sẻ chéo nhiều màn |
| Backend | Node.js + Express | Đề yêu cầu Node.js |
| Database | MySQL 8.4 | Đề yêu cầu MySQL |
| Truy vấn DB | `mysql2` viết SQL thuần | Không dùng ORM để kiểm soát và giải thích được từng câu truy vấn |
| Test | `node:test` (có sẵn trong Node) | Không thêm dependency cho việc vốn đã có công cụ sẵn |
| Deploy | VPS Ubuntu 22 + Nginx + PM2 + Let's Encrypt | Gom một máy, ít điểm hỏng |

Các thư viện cố ý **không** dùng: ORM, thư viện validate (tự viết), `dotenv` (Node ≥ 20.6 có `--env-file`), thư viện HTTP client phía server (`fetch` có sẵn).

## Chạy local

Cần: Node ≥ 20, Docker (hoặc MySQL cài sẵn).

```bash
# 1. Dựng MySQL
docker run -d --name mini-reading-tracker-mysql \
  -e MYSQL_ROOT_PASSWORD='<mật khẩu>' \
  -e MYSQL_DATABASE=reading_tracker \
  -p 127.0.0.1:3412:3306 \
  mysql:8.4

# 2. Backend
cd backend
cp .env.example .env     # điền mật khẩu DB vừa đặt
npm install
npm run db:migrate
npm run db:seed
npm run dev              # http://localhost:3000

# 3. Frontend (terminal khác)
cd frontend
npm install
npm run dev              # http://localhost:5173
```

Mở http://localhost:5173.

## Kiến trúc

```mermaid
graph LR
  U[Trình duyệt] -->|/api/*| N[Nginx]
  N -->|file tĩnh| D[Vue build]
  N -->|proxy| E[Express<br/>PM2]
  E --> M[(MySQL)]
  E -->|HTTPS| O[Open Library API]
```

Frontend **không bao giờ** gọi thẳng Open Library — kể cả ảnh bìa cũng đi qua `/api/covers/:coverId`. Nhờ vậy trình duyệt chỉ nói chuyện với một origin duy nhất, không cần cấu hình CORS, và backend là nơi duy nhất biết về Open Library.

### Sơ đồ database

```mermaid
erDiagram
    shelf_books {
        int id PK
        varchar work_key UK "định danh Open Library, vd /works/OL27482W"
        varchar title
        varchar author "NULL - truyện dân gian không có tác giả"
        int cover_id "NULL - Open Library hay thiếu bìa"
        smallint first_publish_year "NULL"
        int total_pages "NULL - endpoint works không trả về"
        int current_page "mặc định 0"
        enum status "want_to_read | reading | read"
        tinyint rating "NULL hoặc 1-5"
        text note "NULL"
        datetime started_at "NULL tới khi chuyển sang đang đọc"
        datetime finished_at "NULL tới khi chuyển sang đã đọc"
        datetime created_at
    }
```

Chỉ một bảng, vì app dành cho một người dùng và không có quan hệ nào cần tách. Lý do chi tiết cho từng quyết định (vì sao `work_key` mang ràng buộc `UNIQUE`, vì sao tác giả không tách bảng, vì sao bốn cột cho phép `NULL`) nằm ở phần Giả định & Quyết định thiết kế bên dưới.

## Danh sách API

| Method | Path | Mô tả | Lỗi có thể trả |
|---|---|---|---|
| GET | `/api/health` | Kiểm tra server sống | — |
| GET | `/api/books/search?q=&page=` | Tìm sách, kèm cờ `inShelf` cho từng kết quả | 400, 502 |
| GET | `/api/books/:workId` | Chi tiết một tác phẩm | 404, 502 |
| GET | `/api/covers/:coverId?size=S\|M\|L` | Proxy ảnh bìa | 400, 404, 502 |
| POST | `/api/shelf` | Thêm sách vào tủ | 400, **409 nếu trùng** |
| GET | `/api/shelf?status=` | Danh sách sách trong tủ, lọc theo trạng thái | 400 |
| GET | `/api/shelf/stats` | Thống kê: tổng, đang đọc, đã đọc | — |
| PATCH | `/api/shelf/:id` | Cập nhật tiến độ, trạng thái, sao, ghi chú | 400, 404 |
| DELETE | `/api/shelf/:id` | Xoá khỏi tủ | 404 |

Mọi lỗi dùng chung một hình dạng:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ",
    "details": [{ "field": "rating", "message": "Rating phải là số nguyên 1-5 hoặc null" }]
  }
}
```

`details` chỉ xuất hiện với lỗi validate. Lỗi hệ thống (500) không lộ chi tiết ra ngoài.

## Quy tắc nghiệp vụ

1. Không thêm trùng sách — ràng buộc `UNIQUE` trên `work_key`, API trả **409**.
2. `0 ≤ current_page ≤ total_pages` (khi biết tổng số trang).
3. `rating` là số nguyên 1–5 hoặc để trống.
4. `current_page == total_pages` → tự chuyển sang *Đã đọc*.
5. Chuyển sang *Đang đọc* lần đầu → ghi `started_at`; chuyển sang *Đã đọc* → ghi `finished_at`.
6. Toàn bộ validate nằm ở backend.

## Deploy

<!-- TODO: điền sau khi deploy xong -->

Cấu hình mẫu nằm trong `deploy/`:
- `deploy/nginx.conf.example` — Nginx phục vụ file tĩnh + proxy `/api`
- `deploy/deploy.sh` — kéo code, chạy migration, build frontend, nạp lại PM2
- `backend/ecosystem.config.js` — cấu hình PM2

## Giả định, hạn chế và hướng cải thiện


## Chạy test

```bash
cd backend && npm test
```
