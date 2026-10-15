<template>
  <div class="page">
    <!-- Ô tìm kiếm -->
    <form
      class="searchbar sheet"
      @submit.prevent="submit"
    >
      <span
        class="tape"
        aria-hidden="true"
      ></span>
      <input
        v-model="keyword"
        type="search"
        class="field"
        placeholder="Tên sách hoặc tác giả…"
        aria-label="Từ khoá tìm sách"
      />
      <button
        class="btn btn--primary"
        type="submit"
      >
        Tìm kiếm
      </button>

      <SearchScopes v-model="field" :keyword="keyword" class="scopes-row" />
    </form>

    <!-- Đang tải / Lỗi / Không có kết quả / Lưới kết quả. -->
    <p
      v-if="loading"
      class="hand state"
    >
      Đang tìm ...
    </p>

    <!-- Người dùng gõ sai thì nhắc nhẹ; hệ thống hỏng mới báo đỏ kèm nút thử lại -->
    <p
      v-else-if="error && errorIsInput"
      class="hand state"
    >
      {{ error }}
    </p>

    <div
      v-else-if="error"
      class="state sheet error"
    >
      <p>{{ error }}</p>
      <button
        class="btn"
        @click="load"
      >
        Thử lại
      </button>
    </div>

    <p
      v-else-if="searched && books.length === 0"
      class="hand state"
    >
      Không có kết quả phù hợp với tìm kiếm của bạn “{{ route.query.q }}”.
    </p>

    <div
      v-else-if="books.length"
      class="grid"
    >
      <article
        v-for="b in books"
        :key="b.workKey"
        class="card sheet"
      >
        <RouterLink
          :to="linkTo(b)"
          class="cover-link"
        >
          <BookCover
            :cover-id="b.coverId"
            :title="b.title"
          />
        </RouterLink>

        <h3 class="title">
          <RouterLink :to="linkTo(b)">{{ b.title }}</RouterLink>
        </h3>
        <p class="meta">{{ b.author ?? "Không rõ tác giả" }}</p>
        <p class="meta faint num">{{ b.firstPublishYear ?? "—" }}</p>

        <span
          v-if="b.inShelf"
          class="badge"
          >Đã thêm</span
        >
        <button
          v-else
          class="btn add"
          :disabled="adding === b.workKey"
          @click="add(b)"
        >
          {{ adding === b.workKey ? "Đang thêm…" : "+ Thêm vào tủ" }}
        </button>
      </article>
    </div>

    <div
      v-else
      class="welcome"
    >
      <p class="hand state lead">
        Vui lòng nhập tên sách hoặc tác giả vào ô Tìm kiếm.
      </p>

      <p class="hand or">Hoặc thử một trong số này:</p>
      <div class="sugs">
        <button
          v-for="s in SUGGESTIONS"
          :key="s"
          type="button"
          class="sug"
          @click="pick(s)"
        >
          {{ s }}
        </button>
      </div>

      <section
        v-if="stats"
        class="shelf sheet"
      >
        <span
          class="tape tape--sage"
          aria-hidden="true"
        ></span>
        <h2 class="hand">Tủ sách của bạn</h2>

        <dl
          v-if="stats.total > 0"
          class="counts"
        >
          <div>
            <dd class="num">{{ stats.reading }}</dd>
            <dt>Đang đọc</dt>
          </div>
          <div>
            <dd class="num">{{ stats.wantToRead }}</dd>
            <dt>Muốn đọc</dt>
          </div>
          <div>
            <dd class="num">{{ stats.read }}</dd>
            <dt>Đã đọc</dt>
          </div>
        </dl>
        <p
          v-else
          class="hand empty"
        >
          Tủ sách còn trống — tìm một cuốn rồi bấm “+ Thêm vào tủ”.
        </p>

        <RouterLink
          to="/shelf"
          class="btn open"
          >Mở tủ sách →</RouterLink
        >
      </section>
    </div>

    <nav
      v-if="books.length"
      class="pager"
    >
      <button
        class="btn"
        :disabled="page <= 1"
        @click="goTo(page - 1)"
      >
        ← Trước
      </button>
      <span class="num">Trang {{ page }} / {{ totalPages }}</span>
      <button
        class="btn"
        :disabled="page >= totalPages"
        @click="goTo(page + 1)"
      >
        Sau →
      </button>
    </nav>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import { searchBooks, addToShelf, getShelfStats } from "../api";
import BookCover from "../components/BookCover.vue";
import SearchScopes from "../components/SearchScopes.vue";

const PER_PAGE = 20;

const route = useRoute();
const router = useRouter();

const keyword = ref(route.query.q ?? "");
const field = ref(route.query.field ?? "all");
const books = ref([]);
const total = ref(0);
const loading = ref(false);
const error = ref("");
const errorIsInput = ref(false);
const searched = ref(false);
const adding = ref(null);
const stats = ref(null);

const SUGGESTIONS = [
  "Tolkien",
  "Nhà giả kim",
  "Clean Code",
  "Murakami",
  "lập trình",
  "trinh thám",
];

const page = computed(() => Number(route.query.page) || 1);
const totalPages = computed(() =>
  Math.max(1, Math.ceil(total.value / PER_PAGE)),
);

// Màn 2 không lấy được số trang từ Open Library, nên truyền kèm từ đây.
// Kèm chỗ đang đứng để nút quay lại ở Màn 2 về đúng trang kết quả.
function linkTo(book) {
  return {
    path: `/books/${book.workKey}`,
    query: {
      totalPages: book.totalPages ?? "",
      q: route.query.q,
      page: route.query.page,
      field: route.query.field ?? "all",
    },
  };
}

function submit() {
  router.replace({
    query: { q: keyword.value.trim(), page: 1, field: field.value },
  });
}

function pick(goiY) {
  keyword.value = goiY;
  submit();
}

// /shelf/stats không trả want_to_read; ba trạng thái phủ hết tủ nên suy ra được.
async function loadStats() {
  try {
    const d = await getShelfStats();
    stats.value = {
      total: d.total,
      reading: d.reading,
      read: d.read,
      wantToRead: d.total - d.reading - d.read,
    };
  } catch {
    // Khối này chỉ để trang trí màn hình chờ — hỏng thì ẩn đi, không báo lỗi.
    stats.value = null;
  }
}

function goTo(p) {
  // Đổi trang phải giữ nguyên cách tìm, nếu không sang trang 2 là mất lựa chọn
  router.replace({
    query: { q: route.query.q, page: p, field: route.query.field ?? "all" },
  });
}

async function load() {
  const q = route.query.q?.trim();
  if (!q) {
    books.value = [];
    total.value = 0;
    searched.value = false;
    error.value = "";
    return;
  }

  // Từ khoá không có lấy một chữ hay số nào thì không đáng gọi API
  if (!/[\p{L}\p{N}]/u.test(q)) {
    books.value = [];
    total.value = 0;
    searched.value = false;
    errorIsInput.value = true;
    error.value = "Từ khoá cần có ít nhất một chữ hoặc số.";
    return;
  }

  loading.value = true;
  error.value = "";
  errorIsInput.value = false;
  try {
    const data = await searchBooks(q, page.value, route.query.field ?? 'all');
    books.value = data.books;
    total.value = data.total;
    searched.value = true;
  } catch (err) {
    error.value = err.message;
    errorIsInput.value = err.status === 400;
    books.value = [];
  } finally {
    loading.value = false;
  }
}

async function add(book) {
  adding.value = book.workKey;
  try {
    await addToShelf({
      workKey: book.workKey,
      title: book.title,
      author: book.author,
      coverId: book.coverId,
      firstPublishYear: book.firstPublishYear,
      totalPages: book.totalPages,
      status: "want_to_read",
    });
    book.inShelf = true;
  } catch (err) {
    // Sách đã có trong tủ từ trước — kết quả cuối cùng vẫn là "đã thêm",
    // không có gì để người dùng phải sửa nên không coi là lỗi.
    if (err.status === 409) book.inShelf = true;
    else error.value = err.message;
  } finally {
    adding.value = null;
  }
  loadStats();
}

// Đổi cách tìm thì tìm lại ngay — không bắt người dùng bấm nút lần nữa
watch(field, (v) => {
  // Chỉ tìm lại khi người dùng đổi cách tìm cho ĐÚNG từ khoá đang hiển thị.
  // Lúc họ gõ từ khoá mới, bộ gợi ý đổi nhóm và tự đặt lại field — nếu tìm
  // lại ở đây thì sẽ gọi API cho từ khoá cũ, hoàn toàn vô ích.
  if (!route.query.q || keyword.value.trim() !== route.query.q) return;
  if (v === (route.query.field ?? "all")) return;
  router.replace({ query: { q: route.query.q, page: 1, field: v } });
})

// Theo dõi query để Back/Forward của trình duyệt cũng tải lại đúng
watch(() => route.query, load, { immediate: true, deep: true });
loadStats();
</script>

<style scoped>
.welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding-top: 10px;
}

.welcome .lead {
  margin: 0;
}

.or {
  margin: 0;
  font-size: 17px;
  color: var(--ink-faint);
}

.sugs {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
}

.sug {
  padding: 4px 13px;
  border: 1.5px solid var(--ink-faint);
  border-radius: 12px;
  background: transparent;
  color: var(--ink-soft);
  font-size: 13.5px;
  transition: background 0.12s, border-color 0.12s, color 0.12s;
}
.sug:hover {
  background: var(--sticky-yellow);
  border-color: var(--ink);
  color: var(--ink);
}

.shelf {
  position: relative;
  margin-top: 30px;
  padding: 24px 34px 22px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  transform: rotate(-0.4deg);
}

.shelf .tape {
  top: -13px;
  left: 50%;
  margin-left: -32px;
  transform: rotate(2deg);
}

.shelf h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 400;
  color: var(--ink-soft);
}

.counts {
  display: flex;
  gap: 34px;
  margin: 0;
  text-align: center;
}
.counts dd {
  margin: 0;
  font-size: 27px;
  font-weight: 600;
}
.counts dt {
  font-size: 12px;
  color: var(--ink-faint);
}

.empty {
  margin: 0;
  max-width: 34ch;
  text-align: center;
  font-size: 17px;
  color: var(--ink-soft);
}

.open {
  text-decoration: none;
}

.page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.searchbar {
  position: relative;
  display: flex;
  gap: 12px 12px;
  align-items: center;
  flex-wrap: wrap;
  padding: 18px 20px 16px;
  transform: rotate(0.3deg);
}

.scopes-row {
  flex-basis: 100%;
}

.searchbar .tape {
  top: -13px;
  right: 40px;
  transform: rotate(4deg);
}

.searchbar .field {
  flex: 1;
  font-size: 16px;
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

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(168px, 1fr));
  gap: 18px;
}

/* Mỗi cuốn là một mẩu giấy, xoay lệch nhau cho ra vẻ dán tay */
.card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 14px 16px;
}
.card:nth-child(3n) {
  transform: rotate(0.5deg);
}
.card:nth-child(3n + 1) {
  transform: rotate(-0.6deg);
}

.cover-link {
  display: block;
  line-height: 0;
  /* Gạch chân do thẻ <a> vẽ ra thì phần tử con không huỷ được — phải tắt ở đây */
  text-decoration: none;
}

.title {
  font-size: 15px;
  line-height: 1.35;
}

.title a {
  text-decoration: none;
}

.title a:hover {
  text-decoration: underline;
}

.meta {
  margin: 0;
  font-size: 13px;
  color: var(--ink-soft);
  line-height: 1.4;
}

.add {
  margin-top: auto;
  justify-content: center;
  font-size: 13px;
}

.badge {
  margin-top: auto;
  align-self: flex-start;
  padding: 4px 10px;
  background: var(--sticky-mint);
  border: 1.5px solid var(--sticky-mint-dark);
  border-radius: 3px;
  font-size: 13px;
  font-weight: 500;
  transform: rotate(-1.5deg);
}

.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

@media (max-width: 560px) {
  .searchbar {
    transform: none;
    flex-wrap: wrap;
  }
  .grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }
  .card {
    transform: none !important;
  }
}
</style>
