import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

// Mọi lỗi từ backend đều theo một hình dạng: { error: { code, message, details } }.
// Chuyển nó thành Error có sẵn code/details để màn hình chỉ việc đọc, không phải
// tự lần vào err.response.data ở từng chỗ gọi.
client.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const payload = err.response?.data?.error
    // details[] mang câu cụ thể cho từng ô nhập ("cần ít nhất 3 ký tự"), còn
    // message chỉ là câu tóm tắt ("Dữ liệu không hợp lệ"). Hiện câu cụ thể hơn.
    const chiTiet = payload?.details?.[0]?.message
    const normalised = new Error(chiTiet || payload?.message || 'Không kết nối được máy chủ')
    normalised.code = payload?.code || 'NETWORK_ERROR'
    normalised.details = payload?.details || []
    normalised.status = err.response?.status || 0
    return Promise.reject(normalised)
  },
)

export const searchBooks = (q, page = 1, field = 'all') =>
  client.get('/books/search', { params: { q, page, field } })

export const getBook = (workId) => client.get(`/books/${workId}`)

export const getShelf = (status) => client.get('/shelf', { params: status ? { status } : {} })

export const getShelfStats = () => client.get('/shelf/stats')

export const addToShelf = (book) => client.post('/shelf', book)

export const updateShelfItem = (id, changes) => client.patch(`/shelf/${id}`, changes)

export const removeFromShelf = (id) => client.delete(`/shelf/${id}`)

export const coverUrl = (coverId, size = 'M') =>
  coverId ? `/api/covers/${coverId}?size=${size}` : null
