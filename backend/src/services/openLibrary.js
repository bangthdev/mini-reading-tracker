const AppError = require('../errors/AppError')

const TIMEOUT_MS = 8000
const RETRY_DELAY_MS = 400
const BASE_URL = 'https://openlibrary.org'
const COVERS_URL = 'https://covers.openlibrary.org'
const SEARCH_FIELDS = 'key,title,author_name,cover_i,first_publish_year,number_of_pages_median'

function upstreamError() {
  return new AppError(502, 'UPSTREAM_ERROR', 'Không lấy được dữ liệu từ Open Library')
}

// Open Library thỉnh thoảng trả 5xx cho đúng request vừa thành công — đã đo:
// cùng một URL gọi 8 lần thì 2 lần trả 500. Thử lại đúng một lần cho nhóm lỗi
// tạm thời (5xx, mạng, hết giờ chờ); lỗi 4xx thì không thử lại vì gọi lại cũng
// hỏng y như vậy.
async function fetchWithTimeout(url) {
  try {
    return await fetchOnce(url)
  } catch (err) {
    if (err instanceof AppError && err.statusCode < 500) throw err
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
    return fetchOnce(url)
  }
}

async function fetchOnce(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(url, { signal: controller.signal })
    if (res.status === 404) {
      throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy dữ liệu trên Open Library')
    }
    // 4xx nghĩa là câu truy vấn của ta sai, không phải Open Library hỏng — ví dụ
    // gõ "??" hay "*" làm vỡ cú pháp tìm kiếm của họ. Trả 400 để người dùng biết
    // phải sửa từ khoá, thay vì báo nhầm là dịch vụ ngoài đang lỗi.
    if (res.status >= 400 && res.status < 500) {
      throw new AppError(400, 'INVALID_QUERY', 'Từ khoá tìm kiếm không hợp lệ, thử bỏ các ký tự đặc biệt', [
        { field: 'q', message: 'Từ khoá chứa ký tự Open Library không hiểu' },
      ])
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

// Mỗi cách tìm map sang một tham số khác của Open Library. Tham số riêng
// (title=, author=) cho kết quả sát hơn hẳn q=title:... — đã đo: gõ "2002"
// với q= ra sách năm 1990, với title= ra đúng sách có "2002" trong tên.
const SEARCH_FIELD_PARAM = {
  // Open Library từ chối q= ngắn hơn 3 ký tự ("Query too short") trong khi
  // title=/author= lại không — bắt người dùng gánh sự khác biệt đó thì vô lý,
  // vì "Tất cả" lẽ ra phải rộng nhất. Bọc nháy kép làm chuỗi đủ dài mà không
  // đổi kết quả: đã đo "ab" và `"ab"` đều ra 48.213 cuốn.
  all: (value) => ({ q: value.length < 3 ? `"${value}"` : value }),
  title: (value) => ({ title: value }),
  author: (value) => ({ author: value }),
  subject: (value) => ({ subject: value }),
  isbn: (value) => ({ isbn: value }),
  first_publish_year: (value) => ({ q: `first_publish_year:${value}` }),
  publish_year: (value) => ({ q: `publish_year:${value}` }),
}

const SEARCH_FIELDS_ALLOWED = Object.keys(SEARCH_FIELD_PARAM)

async function searchBooks(q, page, field = 'all') {
  const build = SEARCH_FIELD_PARAM[field] ?? SEARCH_FIELD_PARAM.all
  const params = new URLSearchParams({
    ...build(q),
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

// works/{id}.json không có số trang, chỉ bộ tìm kiếm mới có
// number_of_pages_median. Hỏi thẳng theo work key để Màn 2 tự lấy được, không
// phải trông chờ bên gọi truyền kèm qua URL.
async function getPageCount(workId) {
  const params = new URLSearchParams({
    q: `key:/works/${workId}`,
    fields: 'number_of_pages_median',
    limit: '1',
  })
  const data = await fetchJson(`${BASE_URL}/search.json?${params}`)
  return data.docs?.[0]?.number_of_pages_median ?? null
}

module.exports = { searchBooks, getWork, getAuthor, getPageCount, fetchCover, SEARCH_FIELDS_ALLOWED }
