<template>
  <div v-if="scopes.length > 1" class="scopes">
    <span class="lead hand">Tìm theo:</span>
    <button
      v-for="s in scopes"
      :key="s.value"
      type="button"
      class="chip"
      :class="{ 'chip--on': s.value === modelValue }"
      @click="emit('update:modelValue', s.value)"
    >
      {{ s.label }}
    </button>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: 'all' },
  keyword: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

const ALL = { value: 'all', label: 'Tất cả' }
const TITLE = { value: 'title', label: 'Tên sách' }

// Gợi ý đổi theo thứ vừa gõ — chỉ nhận dạng chuỗi, không gọi API nên không chờ.
const scopes = computed(() => {
  const k = props.keyword.trim()
  if (!k) return []

  const digits = k.replace(/\D/g, '')
  const onlyDigits = /^[\d\s-]+$/.test(k)

  if (onlyDigits && (digits.length === 10 || digits.length === 13)) {
    return [{ value: 'isbn', label: 'ISBN' }, ALL]
  }

  if (onlyDigits && /^\d{4}$/.test(digits) && +digits >= 1000 && +digits <= 2100) {
    return [
      ALL,
      { value: 'first_publish_year', label: 'Năm xuất bản' },
      { value: 'publish_year', label: 'Năm tái bản' },
      TITLE,
    ]
  }

  return [ALL, TITLE, { value: 'author', label: 'Tác giả' }, { value: 'subject', label: 'Chủ đề' }]
})

// Gõ lại thành kiểu khác (chữ → số) thì lựa chọn cũ có thể không còn trong
// danh sách; đưa về mục đầu tiên thay vì giữ một giá trị không hiện ra đâu cả.
watch(scopes, (list) => {
  if (list.length && !list.some((s) => s.value === props.modelValue)) {
    emit('update:modelValue', list[0].value)
  }
})
</script>

<style scoped>
.scopes {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-wrap: wrap;
}

.lead {
  font-size: 17px;
  color: var(--ink-faint);
}

.chip {
  padding: 3px 11px;
  border: 1.5px solid var(--ink-faint);
  border-radius: 12px;
  background: transparent;
  color: var(--ink-soft);
  font-size: 13px;
  transition: background 0.12s, border-color 0.12s, color 0.12s;
}

.chip:hover {
  border-color: var(--ink);
  color: var(--ink);
}

.chip--on {
  background: var(--sticky-yellow);
  border-color: var(--ink);
  color: var(--ink);
  font-weight: 500;
}
</style>
