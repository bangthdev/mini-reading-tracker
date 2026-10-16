const test = require('node:test')
const assert = require('node:assert')
const app = require('../src/app')

// Các test này chỉ chạm vào nhánh validate, vốn trả lỗi trước khi gọi DB,
// nên `npm test` không cần MySQL đang chạy. Các nhánh có chạm DB (thêm thành
// công, 409 trùng sách, thống kê) được kiểm thủ công — xem docs/test-checklist.md.
function withServer(fn) {
  return async () => {
    const server = app.listen(0)
    try {
      await fn(`http://localhost:${server.address().port}`)
    } finally {
      server.close()
    }
  }
}

function post(base, body) {
  return fetch(`${base}/api/shelf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

test('POST /api/shelf rejects a malformed workKey', withServer(async (base) => {
  const res = await post(base, { workKey: 'not-a-key', title: 'Sách' })
  const body = await res.json()

  assert.strictEqual(res.status, 400)
  assert.strictEqual(body.error.details[0].field, 'workKey')
}))

test('POST /api/shelf rejects a blank title', withServer(async (base) => {
  for (const title of [undefined, '', '   ']) {
    const res = await post(base, { workKey: 'OL27482W', title })
    const body = await res.json()

    assert.strictEqual(res.status, 400)
    assert.ok(body.error.details.some((d) => d.field === 'title'))
  }
}))

test('POST /api/shelf rejects a status outside the enum', withServer(async (base) => {
  const res = await post(base, { workKey: 'OL27482W', title: 'Sách', status: 'finished' })
  const body = await res.json()

  assert.strictEqual(res.status, 400)
  assert.strictEqual(body.error.details[0].field, 'status')
}))

test('GET /api/shelf rejects an unknown status filter', withServer(async (base) => {
  const res = await fetch(`${base}/api/shelf?status=xxx`)
  const body = await res.json()

  assert.strictEqual(res.status, 400)
  assert.strictEqual(body.error.details[0].field, 'status')
}))

test('DELETE /api/shelf/:id rejects a non-positive-integer id', withServer(async (base) => {
  for (const id of ['abc', '0', '-3', '1.5']) {
    const res = await fetch(`${base}/api/shelf/${id}`, { method: 'DELETE' })
    const body = await res.json()

    assert.strictEqual(res.status, 400, `id=${id} should be rejected`)
    assert.strictEqual(body.error.details[0].field, 'id')
  }
}))

test('POST /api/shelf rejects a negative totalPages', withServer(async (base) => {
  const res = await post(base, { workKey: 'OL1W', title: 'Sách', totalPages: -5 })
  const body = await res.json()

  assert.strictEqual(res.status, 400)
  assert.deepStrictEqual(
    body.error.details.map((d) => d.field),
    ['totalPages'],
  )
}))

test('POST /api/shelf rejects a zero totalPages', withServer(async (base) => {
  const res = await post(base, { workKey: 'OL1W', title: 'Sách', totalPages: 0 })

  assert.strictEqual(res.status, 400)
}))

test('a body that is not JSON is the caller mistake, not a server error', withServer(async (base) => {
  const res = await fetch(`${base}/api/shelf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"workKey":',
  })
  const body = await res.json()

  assert.strictEqual(res.status, 400)
  assert.strictEqual(body.error.code, 'INVALID_JSON')
}))

test('an unknown endpoint answers in the shared error shape', withServer(async (base) => {
  const res = await fetch(`${base}/api/khong-co-that`)
  const body = await res.json()

  assert.strictEqual(res.status, 404)
  assert.strictEqual(body.error.code, 'NOT_FOUND')
}))
