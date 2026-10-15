// Chỉ gửi lên những field người dùng thực sự đổi.
//
// Gửi kèm field không đổi là tự tạo lỗi: PATCH một cuốn 310 trang với
// { status: 'read', currentPage: 180 } bị backend trả 400 vì hai thứ mâu thuẫn
// nhau. Bỏ currentPage ra thì backend tự nâng lên 310 theo quy tắc 10.
export function buildChanges(book, form) {
  const changes = {}

  if (form.status !== book.status) changes.status = form.status
  if (form.currentPage !== book.current_page) changes.currentPage = form.currentPage
  if (form.rating !== book.rating) changes.rating = form.rating
  // note trong DB là null khi chưa ghi gì, còn ô nhập luôn trả về chuỗi —
  // không quy về cùng một dạng thì mở form rồi bấm Lưu cũng tính là có sửa.
  if (form.note !== (book.note ?? '')) changes.note = form.note

  return changes
}

// Chuyển về "Muốn đọc" xoá cả started_at lẫn finished_at — mất dữ liệu nên
// phải hỏi trước. Cuốn chưa từng có mốc nào thì không có gì để mất.
export function erasesMilestones(book, changes) {
  return changes.status === 'want_to_read' && Boolean(book.started_at || book.finished_at)
}
