const AppError = require('../errors/AppError')

const TIMEOUT_MS = 8000
const BASE_URL = 'https://openlibrary.org'
const COVERS_URL = 'https://covers.openlibrary.org'
const SEARCH_FIELDS = 'key,title,author_name,cover_i,first_publish_year,number_of_pages_median'

function upstreamError() {
  return new AppError(502, 'UPSTREAM_ERROR', 'Không lấy được dữ liệu từ Open Library')
}

async function fetchWithTimeout(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(url, { signal: controller.signal })
    if (res.status === 404) {
      throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy dữ liệu trên Open Library')
    }
    if (!res.ok) throw upstreamError()
    return res
  } catch (err) {
    if (err instanceof AppError) throw err
    throw upstreamError()
  } finally {
    clearTimeout(timer)
  }
}

async function fetchJson(url) {
  const res = await fetchWithTimeout(url)
  return res.json()
}

async function searchBooks(q, page) {
  const params = new URLSearchParams({
    q,
    page: String(page),
    limit: '20',
    fields: SEARCH_FIELDS,
  })
  return fetchJson(`${BASE_URL}/search.json?${params}`)
}

async function getWork(workId) {
  return fetchJson(`${BASE_URL}/works/${encodeURIComponent(workId)}.json`)
}

async function getAuthor(authorId) {
  return fetchJson(`${BASE_URL}/authors/${encodeURIComponent(authorId)}.json`)
}

async function fetchCover(coverId, size = 'M') {
  const res = await fetchWithTimeout(`${COVERS_URL}/b/id/${encodeURIComponent(coverId)}-${size}.jpg`)
  return {
    body: Buffer.from(await res.arrayBuffer()),
    contentType: res.headers.get('content-type') || 'image/jpeg',
  }
}

module.exports = { searchBooks, getWork, getAuthor, fetchCover }
