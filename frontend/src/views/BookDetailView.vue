<template>
  <div class="page">
    <RouterLink :to="backTo" class="back hand">{{ backLabel }}</RouterLink>

    <p v-if="loading" class="hand state">Đang tải…</p>

    <div v-else-if="error" class="state sheet error">
      <p>{{ error }}</p>
      <button class="btn" @click="load">Thử lại</button>
    </div>

    <article v-else-if="book" class="detail sheet">
      <span class="tape" aria-hidden="true"></span>

      <div class="left">
        <BookCover :cover-id="book.coverId" :title="book.title" size="L" />
      </div>

      <div class="right">
        <h1 class="title">{{ book.title }}</h1>
        <p class="author">{{ book.author ?? 'Không rõ tác giả' }}</p>

        <dl class="facts">
          <div>
            <dt>Năm xuất bản</dt>
            <dd class="num">{{ book.firstPublishYear ?? 'chưa rõ' }}</dd>
          </div>
          <div>
            <dt>Số trang</dt>
            <dd class="num">{{ totalPages ?? 'chưa rõ' }}</dd>
          </div>
        </dl>

        <section v-if="book.description" class="block">
          <h2>Mô tả</h2>
          <p class="desc">{{ book.description }}</p>
        </section>
        <p v-else class="hand none">Cuốn này chưa có mô tả trên Open Library.</p>

        <section v-if="book.subjects.length" class="block">
          <h2>Chủ đề</h2>
          <ul class="subjects">
            <li v-for="s in shownSubjects" :key="s">
              <RouterLink :to="subjectLink(s)" class="subject">{{ s }}</RouterLink>
            </li>
          </ul>
          <button v-if="!showAll && book.subjects.length > SO_CHU_DE" class="more" @click="showAll = true">
            và {{ book.subjects.length - SO_CHU_DE }} chủ đề nữa…
          </button>
        </section>

        <!-- Thêm vào tủ, chọn luôn trạng thái ban đầu -->
        <section class="block add">
          <h2>Thêm vào tủ</h2>

          <p v-if="added" class="done hand">Đã thêm vào tủ với trạng thái “{{ STATUS_LABEL[addedAs] }}”.</p>

          <div v-else class="choices">
            <button
              v-for="s in STATUSES"
              :key="s"
              class="btn"
              :disabled="adding"
              @click="add(s)"
            >
              {{ STATUS_LABEL[s] }}
            </button>
          </div>

          <p v-if="addError" class="add-error">{{ addError }}</p>
        </section>
      </div>
    </article>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { getBook, addToShelf } from '../api'
import BookCover from '../components/BookCover.vue'

// Có cuốn gần trăm chủ đề, hiện hết thì lấn hết trang.
const SO_CHU_DE = 5

const STATUSES = ['want_to_read', 'reading', 'read']
const STATUS_LABEL = {
  want_to_read: 'Muốn đọc',
  reading: 'Đang đọc',
  read: 'Đã đọc',
}

const route = useRoute()

const book = ref(null)
const loading = ref(false)
const error = ref('')
const adding = ref(false)
const added = ref(false)
const addedAs = ref(null)
const addError = ref('')
const showAll = ref(false)

// Open Library không trả số trang ở endpoint chi tiết — Màn 1 truyền kèm qua URL.
const totalPages = computed(() => Number(route.query.totalPages) || null)

// Mở thẳng đường dẫn này (tab mới, dán link) thì không có gì để quay về.
const backTo = computed(() => {
  const { q, page, field, from } = route.query
  if (q) return { path: '/', query: { q, page, field } }
  return from === 'shelf' ? '/shelf' : '/'
})

const backLabel = computed(() =>
  route.query.from === 'shelf' && !route.query.q ? '← quay lại tủ sách' : '← quay lại tìm kiếm',
)

function subjectLink(subject) {
  return { path: '/', query: { q: subject, page: 1, field: 'subject' } }
}

const shownSubjects = computed(() =>
  showAll.value ? book.value.subjects : book.value.subjects.slice(0, SO_CHU_DE),
)

async function load() {
  loading.value = true
  error.value = ''
  try {
    book.value = await getBook(route.params.id)
  } catch (err) {
    error.value = err.message
    book.value = null
  } finally {
    loading.value = false
  }
}

async function add(status) {
  adding.value = true
  addError.value = ''
  try {
    await addToShelf({
      workKey: book.value.workKey,
      title: book.value.title,
      author: book.value.author,
      coverId: book.value.coverId,
      firstPublishYear: book.value.firstPublishYear,
      totalPages: totalPages.value,
      status,
    })
    added.value = true
    addedAs.value = status
  } catch (err) {
    if (err.status === 409) addError.value = 'Sách này đã có trong tủ rồi.'
    else addError.value = err.message
  } finally {
    adding.value = false
  }
}

watch(() => route.params.id, load, { immediate: true })
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.back {
  align-self: flex-start;
  font-size: 18px;
  text-decoration: none;
}
.back:hover {
  text-decoration: underline;
}

.state {
  padding: 18px 20px;
  font-size: 19px;
  text-align: center;
}

.error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  border-left: 4px solid var(--brick);
  color: var(--brick);
  font-family: var(--sans);
  font-size: 15px;
}
.error p {
  margin: 0;
}

.detail {
  position: relative;
  display: grid;
  grid-template-columns: 210px 1fr;
  gap: 28px;
  padding: 30px 32px 34px;
  transform: rotate(-0.2deg);
}

.detail .tape {
  top: -13px;
  left: 64px;
  transform: rotate(-3deg);
}

.title {
  font-size: 25px;
  line-height: 1.2;
}

.author {
  margin: 4px 0 0;
  color: var(--ink-soft);
}

.facts {
  display: flex;
  gap: 30px;
  margin: 16px 0 0;
}
.facts dt {
  font-size: 12px;
  color: var(--ink-faint);
}
.facts dd {
  margin: 2px 0 0;
  font-size: 16px;
  font-weight: 500;
}

.block {
  margin-top: 22px;
}
.block h2 {
  font-size: 13px;
  color: var(--ink-faint);
  font-weight: 600;
  letter-spacing: 0.03em;
  margin-bottom: 6px;
}

.desc {
  margin: 0;
  font-size: 15px;
  line-height: 1.65;
  max-width: 62ch;
  white-space: pre-line;
}

.none {
  margin: 20px 0 0;
  font-size: 18px;
}

.subjects {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  list-style: none;
  margin: 0;
  padding: 0;
}
.subject {
  display: block;
  padding: 3px 9px;
  background: var(--paper-dark);
  border: 1px solid var(--ink-faint);
  border-radius: 10px;
  font-size: 12.5px;
  color: var(--ink-soft);
  /* Gạch chân do thẻ <a> vẽ ra thì phần tử con không huỷ được — phải tắt ở đây */
  text-decoration: none;
  transition: background 0.12s, border-color 0.12s, color 0.12s;
}
.subject:hover {
  background: var(--sticky-yellow);
  border-color: var(--ink);
  color: var(--ink);
}

.more {
  margin-top: 8px;
  border: none;
  background: none;
  padding: 0;
  font-size: 13px;
  color: var(--ink-soft);
  text-decoration: underline;
}

.add {
  padding-top: 18px;
  border-top: 1.5px dashed var(--ink-faint);
}

.choices {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.choices .btn:hover:not(:disabled) {
  background: var(--sticky-yellow);
}

.done {
  margin: 0;
  font-size: 19px;
  color: var(--ink);
}

.add-error {
  margin: 10px 0 0;
  font-size: 14px;
  color: var(--brick);
}

@media (max-width: 620px) {
  .detail {
    grid-template-columns: 1fr;
    gap: 18px;
    padding: 24px 18px 28px;
    transform: none;
  }
  .left {
    max-width: 170px;
  }
}
</style>
