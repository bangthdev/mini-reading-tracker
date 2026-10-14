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

test('GET /api/covers/:coverId rejects a non-numeric id', withServer(async (base) => {
  const res = await fetch(`${base}/api/covers/abc`)
  const body = await res.json()

  assert.strictEqual(res.status, 400)
  assert.strictEqual(body.error.code, 'VALIDATION_ERROR')
  assert.strictEqual(body.error.details[0].field, 'coverId')
}))

test('GET /api/covers/:coverId rejects an unsupported size', withServer(async (base) => {
  const res = await fetch(`${base}/api/covers/14627509?size=XXL`)
  const body = await res.json()

  assert.strictEqual(res.status, 400)
  assert.strictEqual(body.error.details[0].field, 'size')
}))

test('GET /api/covers/:coverId proxies the image', withServer(async (base) => {
  const res = await fetch(`${base}/api/covers/14627509`)
  const bytes = await res.arrayBuffer()

  assert.strictEqual(res.status, 200)
  assert.match(res.headers.get('content-type'), /^image\//)
  assert.ok(bytes.byteLength > 1000)
}))
