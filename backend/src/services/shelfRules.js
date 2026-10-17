const STATUSES = ['want_to_read', 'reading', 'read']

// Khi chưa biết tổng số trang thì không có gì để so, nên cần một trần tuyệt
// đối. Cuốn tiểu thuyết dài nhất từng in khoảng 4.200 trang, lấy 100.000 là
// rộng gấp hơn hai mươi lần mà vẫn cách rất xa trần 2.147.483.647 của cột INT
// — quá trần đó MySQL ném lỗi, biến một con số vô lý thành lỗi 500.
const MAX_PAGES = 100000

// Áp các quy tắc nghiệp vụ lên một bản ghi, trả về những cột cần UPDATE.
// Hàm thuần: không chạm DB, không biết Express — nhận dữ liệu, trả dữ liệu.
//
//   fields.x === undefined  → không đụng tới cột đó
//   fields.x === null       → xoá giá trị trong cột đó
function applyChanges(book, changes) {
  const errors = []

  const rating = readRating(changes, errors)
  const status = readStatus(changes, errors)
  const page = readPage(changes, errors)

  let nextStatus = status ?? book.status
  let nextTotal = book.total_pages
  let nextPage = page ?? book.current_page

  // Quy tắc 5: đánh dấu đã đọc khi chưa biết tổng số trang thì lấy số trang
  // hiện tại làm tổng. Không có số trang nào để lấy thì chặn, vì gán 0 sẽ tạo
  // ra một cuốn sách dày 0 trang.
  if (nextStatus === 'read' && nextTotal == null) {
    if (nextPage > 0) {
      nextTotal = nextPage
    } else {
      errors.push({ field: 'totalPages', message: 'Cần nhập số trang đã đọc trước khi đánh dấu đã đọc' })
    }
  }

  // Quy tắc 1
  if (page !== undefined && nextTotal != null && page > nextTotal) {
    errors.push({ field: 'currentPage', message: `Số trang đang đọc không được vượt quá ${nextTotal}` })
  }

  // Nói "đã đọc xong" nhưng lại gửi kèm số trang chưa tới cuối là tự mâu thuẫn.
  // Báo lỗi thay vì âm thầm nâng số trang lên cho khớp — không tự sửa dữ liệu
  // người dùng gửi lên.
  if (status === 'read' && page !== undefined && nextTotal != null && page < nextTotal) {
    errors.push({ field: 'currentPage', message: `Đã đọc xong thì số trang phải là ${nextTotal}` })
  }

  if (status === 'want_to_read' && page !== undefined && page > 0) {
    errors.push({ field: 'currentPage', message: 'Muốn đọc thì số trang phải là 0' })
  }

  if (status === undefined && page !== undefined) {
    nextStatus = deriveStatus(book, nextPage, nextTotal)
  }

  // Quy tắc 11, ngược với quy tắc 10. Giữ lại số trang cũ thì tủ hiện ra cuốn
  // "chưa đọc" mà tiến độ 100%. Rating giữ nguyên: nó nói về cuốn sách.
  // Chạy trước quy tắc 3 để cuốn đang 444/444 lùi về "muốn đọc" được.
  if (nextStatus === 'want_to_read') {
    nextPage = 0
  }

  // Quy tắc 3: vừa nhập số trang chạm tới trang cuối là đã đọc xong, kể cả khi
  // request nói rõ trạng thái khác. Chỉ xét khi request có gửi số trang — đổi
  // mỗi trạng thái (đọc lại cuốn cũ) thì không phải là vừa đọc tới trang cuối.
  if (page !== undefined && nextTotal != null && nextPage === nextTotal) {
    nextStatus = 'read'
  }

  // Quy tắc 10: đã đọc xong thì tiến độ phải là 100%, không để hiện 0%.
  if (nextStatus === 'read' && nextTotal != null) {
    nextPage = nextTotal
  }

  const fields = {}
  if ('rating' in changes) fields.rating = rating
  if ('note' in changes) fields.note = changes.note
  if (nextPage !== book.current_page) fields.current_page = nextPage
  if (nextTotal !== book.total_pages) fields.total_pages = nextTotal
  if (nextStatus !== book.status) {
    fields.status = nextStatus
    Object.assign(fields, timestampsFor(book, nextStatus))
  }

  return { fields, errors }
}

function readRating(changes, errors) {
  if (!('rating' in changes)) return undefined
  const value = changes.rating
  if (value === null) return null
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    errors.push({ field: 'rating', message: 'Đánh giá phải là số nguyên từ 1 đến 5, hoặc để trống' })
    return undefined
  }
  return value
}

function readStatus(changes, errors) {
  if (!('status' in changes)) return undefined
  if (!STATUSES.includes(changes.status)) {
    errors.push({ field: 'status', message: `Trạng thái phải là một trong ${STATUSES.join(', ')}` })
    return undefined
  }
  return changes.status
}

function readPage(changes, errors) {
  if (!('currentPage' in changes)) return undefined
  const value = changes.currentPage
  if (!Number.isInteger(value) || value < 0) {
    errors.push({ field: 'currentPage', message: 'Số trang đang đọc phải là số nguyên không âm' })
    return undefined
  }
  if (value > MAX_PAGES) {
    errors.push({ field: 'currentPage', message: `Số trang đang đọc không được vượt quá ${MAX_PAGES}` })
    return undefined
  }
  return value
}

// Quy tắc 3, 7, 8 — số trang quyết định trạng thái theo cả hai chiều.
// Không biết tổng số trang thì không suy ra được gì, giữ nguyên trạng thái.
function deriveStatus(book, nextPage, total) {
  if (total != null && nextPage === total) return 'read'
  if (total != null && book.status === 'read' && nextPage < total) return 'reading'
  if (book.status === 'want_to_read' && nextPage > 0) return 'reading'
  return book.status
}

// Quy tắc 4, 6, 9 — mốc thời gian mô tả trạng thái hiện tại, trạng thái đổi
// thì mốc đi theo. Chỉ gọi khi trạng thái thực sự thay đổi.
function timestampsFor(book, nextStatus) {
  const now = new Date()

  if (nextStatus === 'reading') {
    return {
      // "lần đầu" nghĩa là chưa từng có mốc bắt đầu — quay lại đọc tiếp thì giữ mốc cũ
      ...(book.started_at ? {} : { started_at: now }),
      ...(book.status === 'read' ? { finished_at: null } : {}),
    }
  }

  if (nextStatus === 'read') {
    return { finished_at: now }
  }

  return { started_at: null, finished_at: null }
}

module.exports = { applyChanges, STATUSES, MAX_PAGES }
