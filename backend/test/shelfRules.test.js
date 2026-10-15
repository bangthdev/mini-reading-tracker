const test = require('node:test')
const assert = require('node:assert')
const { applyChanges } = require('../src/services/shelfRules')

// Bản ghi mẫu đọc từ DB. Ghi đè từng field trong mỗi ca test.
function book(overrides = {}) {
  return {
    status: 'want_to_read',
    current_page: 0,
    total_pages: 310,
    started_at: null,
    finished_at: null,
    rating: null,
    note: null,
    ...overrides,
  }
}

function fieldsOf(result) {
  assert.deepStrictEqual(result.errors, [], 'không được có lỗi validate')
  return result.fields
}

function errorFields(result) {
  return result.errors.map((e) => e.field)
}

// ───────────────────────── Quy tắc 1: current_page hợp lệ

test('từ chối current_page âm', () => {
  const r = applyChanges(book(), { currentPage: -1 })
  assert.deepStrictEqual(errorFields(r), ['currentPage'])
})

test('từ chối current_page không phải số nguyên', () => {
  for (const v of ['abc', 1.5, null, {}]) {
    const r = applyChanges(book(), { currentPage: v })
    assert.deepStrictEqual(errorFields(r), ['currentPage'], `giá trị ${JSON.stringify(v)} phải bị từ chối`)
  }
})

test('từ chối current_page vượt quá total_pages', () => {
  const r = applyChanges(book({ total_pages: 310 }), { currentPage: 311 })
  assert.deepStrictEqual(errorFields(r), ['currentPage'])
})

test('cho phép current_page bất kỳ khi chưa biết total_pages', () => {
  const f = fieldsOf(applyChanges(book({ total_pages: null }), { currentPage: 9999 }))
  assert.strictEqual(f.current_page, 9999)
})

// ───────────────────────── Quy tắc 2: rating

test('từ chối rating ngoài khoảng 1-5 hoặc sai kiểu', () => {
  for (const v of [0, 6, 3.5, '3', -1]) {
    const r = applyChanges(book(), { rating: v })
    assert.deepStrictEqual(errorFields(r), ['rating'], `rating ${JSON.stringify(v)} phải bị từ chối`)
  }
})

test('chấp nhận rating 1-5 và null', () => {
  for (const v of [1, 3, 5, null]) {
    const f = fieldsOf(applyChanges(book(), { rating: v }))
    assert.strictEqual(f.rating, v)
  }
})

test('cho phép chấm sao ở mọi trạng thái, kể cả chưa đọc xong', () => {
  const f = fieldsOf(applyChanges(book({ status: 'reading', current_page: 100 }), { rating: 4 }))
  assert.strictEqual(f.rating, 4)
  assert.strictEqual(f.status, undefined, 'chấm sao không được làm đổi trạng thái')
})

// ───────────────────────── Quy tắc 3: đọc đủ số trang thì tự xong

test('current_page bằng total_pages thì tự chuyển sang read và ghi finished_at', () => {
  const f = fieldsOf(applyChanges(book({ status: 'reading', current_page: 300, started_at: new Date('2026-10-01') }), { currentPage: 310 }))
  assert.strictEqual(f.status, 'read')
  assert.ok(f.finished_at instanceof Date)
})

test('không tự chuyển sang read khi chưa biết total_pages', () => {
  const f = fieldsOf(applyChanges(book({ status: 'reading', total_pages: null }), { currentPage: 500 }))
  assert.strictEqual(f.status, undefined)
  assert.strictEqual(f.finished_at, undefined)
})

// ───────────────────────── Quy tắc 4: mốc thời gian theo cú chuyển trạng thái

test('vào reading lần đầu thì ghi started_at', () => {
  const f = fieldsOf(applyChanges(book({ status: 'want_to_read' }), { status: 'reading' }))
  assert.ok(f.started_at instanceof Date)
})

test('quay lại reading không ghi đè started_at cũ', () => {
  const cu = new Date('2026-09-01')
  const f = fieldsOf(applyChanges(book({ status: 'read', current_page: 310, started_at: cu, finished_at: new Date() }), { status: 'reading' }))
  assert.strictEqual(f.started_at, undefined, 'không được đụng tới started_at đã có')
})

test('vào read thì ghi finished_at', () => {
  const f = fieldsOf(applyChanges(book({ status: 'reading', current_page: 100 }), { status: 'read' }))
  assert.ok(f.finished_at instanceof Date)
})

// ───────────────────────── Quy tắc 5: total_pages null + đánh dấu đã đọc

test('đánh dấu read khi chưa biết total_pages thì lấy current_page làm tổng', () => {
  const f = fieldsOf(applyChanges(book({ status: 'reading', total_pages: null, current_page: 200 }), { status: 'read' }))
  assert.strictEqual(f.total_pages, 200)
  assert.strictEqual(f.status, 'read')
})

test('chặn đánh dấu read khi chưa biết total_pages và cũng chưa nhập số trang', () => {
  const r = applyChanges(book({ status: 'want_to_read', total_pages: null, current_page: 0 }), { status: 'read' })
  assert.deepStrictEqual(errorFields(r), ['totalPages'])
})

test('đánh dấu read kèm số trang trong cùng một request thì chấp nhận', () => {
  const f = fieldsOf(applyChanges(book({ total_pages: null, current_page: 0 }), { status: 'read', currentPage: 180 }))
  assert.strictEqual(f.total_pages, 180)
  assert.strictEqual(f.current_page, 180)
})

// ───────────────────────── Quy tắc 6: read → reading

test('chuyển read về reading thì xoá finished_at, giữ started_at', () => {
  const cu = new Date('2026-09-01')
  const f = fieldsOf(applyChanges(book({ status: 'read', current_page: 310, started_at: cu, finished_at: new Date() }), { status: 'reading' }))
  assert.strictEqual(f.finished_at, null)
  assert.strictEqual(f.started_at, undefined)
})

// ───────────────────────── Quy tắc 7: giảm số trang khi đang read

test('giảm current_page dưới total_pages khi đang read thì tự về reading', () => {
  const f = fieldsOf(applyChanges(book({ status: 'read', current_page: 310, started_at: new Date('2026-09-01'), finished_at: new Date() }), { currentPage: 200 }))
  assert.strictEqual(f.status, 'reading')
  assert.strictEqual(f.finished_at, null)
  assert.strictEqual(f.started_at, undefined, 'giữ nguyên mốc bắt đầu')
})

// ───────────────────────── Quy tắc 8: tăng số trang khi đang want_to_read

test('tăng current_page lên quá 0 khi đang want_to_read thì tự sang reading', () => {
  const f = fieldsOf(applyChanges(book({ status: 'want_to_read', current_page: 0 }), { currentPage: 50 }))
  assert.strictEqual(f.status, 'reading')
  assert.ok(f.started_at instanceof Date)
})

test('sửa current_page về 0 thì không đổi trạng thái', () => {
  const f = fieldsOf(applyChanges(book({ status: 'reading', current_page: 50, started_at: new Date() }), { currentPage: 0 }))
  assert.strictEqual(f.current_page, 0)
  assert.strictEqual(f.status, undefined)
})

// ───────────────────────── Quy tắc 9: read → want_to_read

test('chuyển read về want_to_read thì xoá cả hai mốc', () => {
  const f = fieldsOf(applyChanges(book({ status: 'read', current_page: 310, started_at: new Date('2026-09-01'), finished_at: new Date() }), { status: 'want_to_read' }))
  assert.strictEqual(f.started_at, null)
  assert.strictEqual(f.finished_at, null)
})

test('chuyển read về want_to_read thì số trang về 0, giữ nguyên đánh giá', () => {
  const f = fieldsOf(applyChanges(book({ status: 'read', current_page: 310, total_pages: 310, rating: 5, started_at: new Date('2026-09-01'), finished_at: new Date() }), { status: 'want_to_read' }))
  assert.strictEqual(f.current_page, 0, 'sách chưa đọc không được hiện 100%')
  assert.ok(!('rating' in f), 'đánh giá là nhận xét về sách, không đi theo tiến độ')
})

test('chuyển reading về want_to_read cũng đưa số trang về 0', () => {
  const f = fieldsOf(applyChanges(book({ status: 'reading', current_page: 120, started_at: new Date('2026-09-01') }), { status: 'want_to_read' }))
  assert.strictEqual(f.current_page, 0)
})

test('từ chối chuyển về want_to_read kèm số trang khác 0', () => {
  const r = applyChanges(book({ status: 'reading', current_page: 120 }), { status: 'want_to_read', currentPage: 50 })
  assert.deepStrictEqual(errorFields(r), ['currentPage'])
})

// ───────────────────────── Quy tắc 10: đánh dấu read thì số trang nhảy lên đủ

test('đánh dấu read khi mới đọc dở thì current_page nhảy lên bằng total_pages', () => {
  const f = fieldsOf(applyChanges(book({ status: 'want_to_read', current_page: 0, total_pages: 310 }), { status: 'read' }))
  assert.strictEqual(f.current_page, 310, 'sách đã đọc xong không được hiện 0%')
})

test('từ chối đánh dấu read kèm số trang chưa đủ', () => {
  const r = applyChanges(book({ status: 'reading', current_page: 100, total_pages: 443 }), { status: 'read', currentPage: 200 })
  assert.deepStrictEqual(errorFields(r), ['currentPage'])
})

test('chấp nhận đánh dấu read kèm đúng số trang cuối', () => {
  const f = fieldsOf(applyChanges(book({ status: 'reading', current_page: 100, total_pages: 443 }), { status: 'read', currentPage: 443 }))
  assert.strictEqual(f.status, 'read')
  assert.strictEqual(f.current_page, 443)
})

// ───────────────────────── Validate status và trường không đổi

test('từ chối status ngoài danh sách', () => {
  const r = applyChanges(book(), { status: 'finished' })
  assert.deepStrictEqual(errorFields(r), ['status'])
})

test('không trả về field nào khi request rỗng', () => {
  const f = fieldsOf(applyChanges(book(), {}))
  assert.deepStrictEqual(f, {})
})

test('note được ghi nguyên văn, kể cả chuỗi rỗng', () => {
  assert.strictEqual(fieldsOf(applyChanges(book(), { note: 'hay' })).note, 'hay')
  assert.strictEqual(fieldsOf(applyChanges(book(), { note: '' })).note, '')
})

test('gom đủ mọi lỗi trong một lần, không dừng ở lỗi đầu tiên', () => {
  const r = applyChanges(book(), { currentPage: -5, rating: 9, status: 'xxx' })
  assert.deepStrictEqual(errorFields(r).sort(), ['currentPage', 'rating', 'status'])
})
