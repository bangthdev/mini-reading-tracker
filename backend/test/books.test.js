const test = require('node:test')
const assert = require('node:assert')
const app = require('../src/app')

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

test('search rejects an empty query', withServer(async (base) => {
  const res = await fetch(`${base}/api/books/search?q=`)
  const body = await res.json()

  assert.strictEqual(res.status, 400)
  assert.strictEqual(body.error.details[0].field, 'q')
}))

test('search rejects a page that is not a positive integer', withServer(async (base) => {
  for (const page of ['abc', '0', '-1', '1.5']) {
    const res = await fetch(`${base}/api/books/search?q=hobbit&page=${page}`)
    const body = await res.json()

    assert.strictEqual(res.status, 400, `page=${page} should be rejected`)
    assert.strictEqual(body.error.details[0].field, 'page')
  }
}))

test('detail rejects a malformed workId', withServer(async (base) => {
  const res = await fetch(`${base}/api/books/not-a-work-id`)
  const body = await res.json()

  assert.strictEqual(res.status, 400)
  assert.strictEqual(body.error.details[0].field, 'workId')
}))
