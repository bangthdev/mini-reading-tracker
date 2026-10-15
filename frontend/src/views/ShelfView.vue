<template>
  <div class="page">
    <!-- Thống kê: số do backend tự đếm (SUM theo status), không đếm ở đây -->
    <section
      v-if="stats"
      class="stats sheet"
      aria-label="Thống kê tủ sách"
    >
      <span
        class="tape tape--sage"
        aria-hidden="true"
      ></span>
      <p class="stat">Tổng số sách <b class="num">{{ stats.total }}</b></p>
      <p class="stat">Đang đọc <b class="num">{{ stats.reading }}</b></p>
      <p class="stat">Đã đọc xong <b class="num">{{ stats.read }}</b></p>
    </section>

    <div
      class="tabs"
      role="tablist"
      aria-label="Lọc theo trạng thái đọc"
    >
      <button
        v-for="s in STATUSES"
        :key="s"
        class="tab"
        :class="{ 'tab--on': tab === s }"
        role="tab"
        :aria-selected="tab === s"
        @click="tab = s"
      >
        {{ STATUS_LABEL[s] }} ({{ countOf(s) }})
      </button>
    </div>

    <p
      v-if="loading"
      class="hand state"
    >
      Đang mở tủ sách ...
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
      v-else-if="books.length === 0"
      class="hand state"
    >
      Tủ sách còn trống.
      <RouterLink to="/">Tìm cuốn đầu tiên</RouterLink> đi.
    </p>

    <p
      v-else-if="shown.length === 0"
      class="hand state"
    >
      Chưa có cuốn nào ở “{{ STATUS_LABEL[tab] }}”.
    </p>

    <div
      v-else
      class="grid"
      role="tabpanel"
    >
      <article
        v-for="b in shown"
        :key="b.id"
        class="card sheet"
      >
        <span
          class="tape"
          aria-hidden="true"
        ></span>

        <div class="head">
          <div class="cover-slot">
            <RouterLink
              :to="detailLink(b)"
              class="cover-link"
            >
              <BookCover
                :cover-id="b.cover_id"
                :title="b.title"
                size="S"
              />
            </RouterLink>
          </div>
          <div class="ident">
            <h3 class="title">
              <RouterLink :to="detailLink(b)">{{ b.title }}</RouterLink>
            </h3>
            <p class="meta">{{ b.author ?? "Không rõ tác giả" }}</p>
            <span
              v-if="b.status === 'read'"
              class="stamp"
            >ĐÃ ĐỌC XONG</span>
          </div>
        </div>

        <!-- Không biết tổng số trang thì không có phần trăm nào để vẽ -->
        <div
          v-if="b.total_pages != null"
          class="progress"
        >
          <div class="track">
            <div
              class="fill"
              :style="{ width: percentOf(b) + '%' }"
            ></div>
          </div>
          <p class="progress-text num">
            {{ b.current_page }}/{{ b.total_pages }} trang · {{ percentOf(b) }}%
          </p>
        </div>
        <p
          v-else
          class="unknown hand"
        >
          Đã đọc đến trang {{ b.current_page }} · chưa rõ tổng số trang
        </p>

        <!-- Chế độ xem -->
        <template v-if="editing !== b.id">
          <StarRating
            v-if="b.status === 'read'"
            :model-value="b.rating"
            readonly
            label="Đánh giá đã chấm"
          />
          <p
            v-if="b.note"
            class="note hand"
          >
            {{ b.note }}
          </p>

          <div class="actions">
            <button
              class="btn"
              @click="startEdit(b)"
            >
              ✏️ Sửa
            </button>
            <button
              class="btn btn--danger"
              @click="askDelete(b)"
            >
              🗑️ Xoá
            </button>
          </div>
        </template>

        <!-- Chế độ sửa -->
        <!-- novalidate: trình duyệt chặn trước thì câu lỗi tiếng Anh của nó
             hiện ra thay cho câu tiếng Việt backend đã có sẵn -->
        <form
          v-else
          class="edit"
          novalidate
          @submit.prevent="save(b)"
        >
          <label class="row">
            <span>Đã đọc đến trang</span>
            <input
              v-model.number="form.currentPage"
              class="field num page-input"
              type="number"
              min="0"
              :max="b.total_pages ?? undefined"
            />
          </label>

          <label class="row">
            <span>Trạng thái</span>
            <select
              v-model="form.status"
              class="field"
            >
              <option
                v-for="s in STATUSES"
                :key="s"
                :value="s"
              >
                {{ STATUS_LABEL[s] }}
              </option>
            </select>
          </label>

          <!-- Chấm sao cho sách chưa đọc xong thì không có ý nghĩa gì -->
          <label
            v-if="form.status === 'read'"
            class="row"
          >
            <span>Đánh giá</span>
            <StarRating v-model="form.rating" />
          </label>

          <label class="row row--stack">
            <span>Ghi chú</span>
            <textarea
              v-model="form.note"
              class="field"
              rows="2"
            ></textarea>
          </label>

          <p
            v-if="saveError"
            class="save-error"
          >
            {{ saveError }}
          </p>

          <div class="actions">
            <button
              class="btn btn--primary"
              type="submit"
              :disabled="saving"
            >
              {{ saving ? "Đang lưu…" : "Lưu" }}
            </button>
            <button
              class="btn"
              type="button"
              :disabled="saving"
              @click="editing = null"
            >
              Huỷ
            </button>
          </div>
        </form>
      </article>
    </div>

    <!-- Một hộp thoại dùng cho mọi việc cần xác nhận, việc nào thì nằm trong pending -->
    <ConfirmModal
      :open="pending !== null"
      :title="pending?.title ?? ''"
      :message="pending?.message ?? ''"
      :confirm-label="pending?.confirmLabel ?? 'Xoá'"
      @confirm="runPending"
      @cancel="pending = null"
    />
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { RouterLink } from "vue-router";
import {
  getShelf,
  getShelfStats,
  updateShelfItem,
  removeFromShelf,
} from "../api";
import { buildChanges, erasesMilestones } from "../shelfChanges";
import BookCover from "../components/BookCover.vue";
import StarRating from "../components/StarRating.vue";
import ConfirmModal from "../components/ConfirmModal.vue";

const STATUSES = ["want_to_read", "reading", "read"];
const STATUS_LABEL = {
  want_to_read: "Muốn đọc",
  reading: "Đang đọc",
  read: "Đã đọc",
};

const books = ref([]);
const stats = ref(null);
const tab = ref("reading");
const loading = ref(false);
const error = ref("");

const editing = ref(null);
const form = ref({});
const saving = ref(false);
const saveError = ref("");

const pending = ref(null);

const shown = computed(() => books.value.filter((b) => b.status === tab.value));

// Endpoint chi tiết không trả số trang nên phải truyền kèm.
// from=shelf để nút quay lại bên đó trả về tủ.
function detailLink(book) {
  return {
    path: `/books/${book.work_key}`,
    query: { totalPages: book.total_pages ?? "", from: "shelf" },
  };
}

function countOf(status) {
  return books.value.filter((b) => b.status === status).length;
}

// total_pages = 0 không nên tồn tại (quy tắc chặn), nhưng chia cho 0 thì ra
// Infinity và thanh tiến độ vỡ — chặn ở đây rẻ hơn là đi tin vào dữ liệu.
function percentOf(book) {
  if (!book.total_pages) return 0;
  return Math.round((book.current_page / book.total_pages) * 100);
}

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const [list, counts] = await Promise.all([getShelf(), getShelfStats()]);
    books.value = list;
    stats.value = counts;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

function startEdit(book) {
  editing.value = book.id;
  saveError.value = "";
  form.value = {
    currentPage: book.current_page,
    status: book.status,
    rating: book.rating,
    note: book.note ?? "",
  };
}

async function save(book) {
  const changes = buildChanges(book, form.value);
  if (Object.keys(changes).length === 0) {
    editing.value = null;
    return;
  }

  if (erasesMilestones(book, changes)) {
    pending.value = {
      title: "Chuyển về “Muốn đọc”?",
      message: `“${book.title}” sẽ mất mốc bắt đầu đọc và mốc đọc xong.`,
      confirmLabel: "Chuyển",
      run: () => submit(book, changes),
    };
    return;
  }

  await submit(book, changes);
}

async function submit(book, changes) {
  saving.value = true;
  saveError.value = "";
  try {
    // Backend trả về bản ghi sau khi đã áp quy tắc nghiệp vụ — số trang và
    // trạng thái nó tự suy ra có thể khác những gì vừa gửi lên, nên lấy
    // nguyên bản ghi đó thay vì tự đoán kết quả ở frontend.
    const updated = await updateShelfItem(book.id, changes);
    books.value[books.value.indexOf(book)] = updated;
    editing.value = null;
    if (updated.status !== book.status) stats.value = await getShelfStats();
  } catch (err) {
    saveError.value = err.message;
  } finally {
    saving.value = false;
  }
}

function askDelete(book) {
  pending.value = {
    title: "Xoá khỏi tủ sách?",
    message: `“${book.title}” sẽ mất tiến độ đọc, đánh giá và ghi chú. Sách thì tìm lại rồi thêm vào tủ được.`,
    confirmLabel: "Xoá",
    run: () => remove(book),
  };
}

async function remove(book) {
  try {
    await removeFromShelf(book.id);
    books.value.splice(books.value.indexOf(book), 1);
    stats.value = await getShelfStats();
  } catch (err) {
    error.value = err.message;
  }
}

async function runPending() {
  const job = pending.value;
  pending.value = null;
  await job?.run();
}

load();
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats {
  position: relative;
  display: flex;
  gap: 10px 22px;
  flex-wrap: wrap;
  padding: 16px 22px;
  transform: rotate(-0.3deg);
}

.stats .tape {
  top: -13px;
  right: 46px;
  transform: rotate(3deg);
}

.stat {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--ink-soft);
}

.stat b {
  margin-left: 5px;
  font-family: var(--hand);
  font-size: 22px;
  color: var(--ink);
}

/* Tab: mép giấy nhô lên như tờ phân trang trong sổ */
.tabs {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  border-bottom: 2px dashed var(--ink-faint);
  padding-bottom: 0;
}

.tab {
  position: relative;
  top: 2px;
  padding: 8px 16px;
  border: 1.5px solid var(--ink-faint);
  border-bottom: none;
  border-radius: 8px 8px 0 0;
  background: var(--paper-dark);
  font-size: 14px;
  font-weight: 500;
  color: var(--ink-soft);
}

.tab--on {
  top: 0;
  background: var(--sticky-mint);
  border-color: var(--sticky-mint-dark);
  color: var(--ink);
  box-shadow: var(--shadow-paper);
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
  grid-template-columns: repeat(auto-fill, minmax(272px, 1fr));
  gap: 26px 20px;
}

.card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px 16px 16px;
}
.card:nth-child(3n) {
  transform: rotate(0.5deg);
}
.card:nth-child(3n + 1) {
  transform: rotate(-0.6deg);
}

.card .tape {
  top: -13px;
  left: 20px;
  width: 70px;
  transform: rotate(-5deg);
}

.head {
  display: flex;
  gap: 12px;
}

.cover-slot {
  width: 62px;
  flex-shrink: 0;
}

.ident {
  min-width: 0;
}

.cover-link {
  display: block;
  line-height: 0;
  /* Gạch chân do thẻ <a> vẽ ra thì phần tử con không huỷ được — phải tắt ở đây */
  text-decoration: none;
}

.title {
  font-size: 15px;
  line-height: 1.3;
}

.title a {
  text-decoration: none;
}
.title a:hover {
  text-decoration: underline;
}

.meta {
  margin: 2px 0 0;
  font-size: 13px;
  color: var(--ink-soft);
}

.stamp {
  display: inline-block;
  margin-top: 7px;
  padding: 1px 6px;
  border: 2px double var(--brick);
  border-radius: 3px;
  color: var(--brick);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  transform: rotate(-4deg);
}

/* Tiến độ vẽ bằng bút highlight: nét không đều, cuối nét hơi lệch */
.track {
  position: relative;
  height: 13px;
  border: 1.5px dashed var(--ink-faint);
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.45);
  overflow: hidden;
}

.fill {
  height: 100%;
  background: linear-gradient(180deg, var(--highlighter), var(--highlighter-edge));
  opacity: 0.8;
  mix-blend-mode: multiply;
  clip-path: polygon(0 0, 97% 0, 100% 30%, 98% 55%, 100% 78%, 96% 100%, 0 100%);
}

.progress-text {
  margin: 6px 0 0;
  font-size: 13px;
  font-weight: 500;
}

.unknown {
  margin: 0;
  padding: 8px 10px;
  border: 1.5px dashed var(--ink-faint);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.5);
  font-size: 17px;
}

/* Ghi chú: mẩu giấy nhớ dán vào, có gấp mép ở góc */
.note {
  position: relative;
  margin: 0;
  padding: 10px 12px;
  background: var(--sticky-yellow);
  border-radius: 2px;
  color: var(--ink);
  font-size: 17px;
  transform: rotate(-0.8deg);
}

.note::after {
  content: "";
  position: absolute;
  right: -4px;
  bottom: -6px;
  width: 18px;
  height: 18px;
  background: inherit;
  filter: brightness(0.9);
  clip-path: polygon(0 0, 100% 100%, 0 100%);
}

.actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
  padding-top: 4px;
}

.edit {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--ink-soft);
}

.row--stack {
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
}

.row .field {
  flex: 1;
  min-width: 0;
}

.page-input {
  max-width: 100px;
  flex: 0 0 auto;
}

.row textarea.field {
  border: 1.5px solid var(--ink-faint);
  border-radius: 3px;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.5);
  font-family: var(--hand);
  font-size: 17px;
  resize: vertical;
}

.save-error {
  margin: 0;
  color: var(--brick);
  font-size: 13px;
}

@media (max-width: 560px) {
  .stats {
    transform: none;
  }
  .grid {
    grid-template-columns: 1fr;
  }
  .card {
    transform: none !important;
  }
}
</style>
