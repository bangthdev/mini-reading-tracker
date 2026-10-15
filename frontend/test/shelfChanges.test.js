import test from 'node:test'
import assert from 'node:assert/strict'
import { buildChanges, erasesMilestones } from '../src/shelfChanges.js'

const book = {
  status: 'reading',
  current_page: 180,
  total_pages: 310,
  rating: null,
  note: null,
  started_at: '2026-10-01 09:00:00',
  finished_at: null,
}

const formOf = (overrides) => ({
  status: book.status,
  currentPage: book.current_page,
  rating: book.rating,
  note: '',
  ...overrides,
})

test('không đổi gì thì không gửi field nào', () => {
  assert.deepEqual(buildChanges(book, formOf({})), {})
})

test('note null trong DB và ô nhập rỗng là cùng một thứ', () => {
  assert.deepEqual(buildChanges({ ...book, note: null }, formOf({ note: '' })), {})
})

test('xoá ghi chú cũ thì gửi chuỗi rỗng, không bỏ qua', () => {
  assert.deepEqual(buildChanges({ ...book, note: 'cũ' }, formOf({ note: '' })), { note: '' })
})

// Đây là lý do hàm này tồn tại: gửi kèm currentPage cũ sẽ bị 400.
test('đánh dấu đã đọc mà không sửa số trang thì chỉ gửi status', () => {
  assert.deepEqual(buildChanges(book, formOf({ status: 'read' })), { status: 'read' })
})

test('bỏ chấm sao thì gửi rating null chứ không bỏ qua', () => {
  assert.deepEqual(buildChanges({ ...book, rating: 4 }, formOf({ rating: null })), { rating: null })
})

test('sửa nhiều thứ cùng lúc thì gửi hết trong một lần', () => {
  assert.deepEqual(
    buildChanges(book, formOf({ currentPage: 250, note: 'đọc chậm' })),
    { currentPage: 250, note: 'đọc chậm' },
  )
})

test('cuốn đã có mốc, chuyển về muốn đọc thì phải hỏi', () => {
  assert.equal(erasesMilestones(book, { status: 'want_to_read' }), true)
})

test('cuốn chưa từng có mốc nào thì không cần hỏi', () => {
  const chuaDoc = { ...book, started_at: null, finished_at: null }
  assert.equal(erasesMilestones(chuaDoc, { status: 'want_to_read' }), false)
})

test('đổi sang trạng thái khác không xoá mốc nào', () => {
  assert.equal(erasesMilestones(book, { status: 'read' }), false)
})
