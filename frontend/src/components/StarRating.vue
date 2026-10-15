<template>
  <div class="stars" :class="{ 'stars--readonly': readonly }" role="group" :aria-label="label">
    <button
      v-for="n in 5"
      :key="n"
      type="button"
      class="star"
      :class="{ 'star--on': n <= (hover || modelValue || 0) }"
      :disabled="readonly"
      :aria-label="`Chấm ${n} sao`"
      :aria-pressed="n === modelValue"
      @click="pick(n)"
      @mouseenter="hover = readonly ? 0 : n"
      @mouseleave="hover = 0"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <!-- Ngôi sao vẽ hơi lệch cho ra nét tay, không dùng icon đối xứng hoàn hảo -->
        <path
          d="M12.3 2.4 L15 9.1 L22.1 9.4 L16.4 13.6 L18.3 20.6 L12.1 16.7 L5.7 20.4 L7.9 13.5 L2.3 9.1 L9.5 9.0 Z"
        />
      </svg>
    </button>

    <button
      v-if="!readonly && modelValue"
      type="button"
      class="clear"
      aria-label="Bỏ chấm sao"
      @click="pick(null)"
    >
      xoá
    </button>

    <span v-if="readonly && !modelValue" class="faint none">chưa chấm</span>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  modelValue: { type: Number, default: null },
  readonly: { type: Boolean, default: false },
  label: { type: String, default: 'Đánh giá' },
})

const emit = defineEmits(['update:modelValue'])
const hover = ref(0)

// Bấm lại đúng ngôi sao đang chọn thì bỏ chọn — đỡ phải tìm nút xoá
function pick(n) {
  emit('update:modelValue', n === props.modelValue ? null : n)
  hover.value = 0
}
</script>

<style scoped>
.stars {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.star {
  padding: 1px;
  border: none;
  background: none;
  line-height: 0;
  border-radius: 3px;
}

.star svg {
  width: 21px;
  height: 21px;
}

.star path {
  fill: none;
  stroke: var(--ink-faint);
  stroke-width: 1.7;
  stroke-linejoin: round;
  transition: fill 0.12s, stroke 0.12s;
}

.star--on path {
  fill: var(--sticky-yellow);
  stroke: var(--sticky-yellow-dark);
}

/* Mỗi ngôi sao nghiêng một góc khác nhau — vẽ tay thì không cái nào thẳng hàng */
.star:nth-child(1) svg { transform: rotate(-4deg); }
.star:nth-child(2) svg { transform: rotate(3deg); }
.star:nth-child(3) svg { transform: rotate(-2deg); }
.star:nth-child(4) svg { transform: rotate(5deg); }
.star:nth-child(5) svg { transform: rotate(-3deg); }

.stars:not(.stars--readonly) .star:hover svg {
  transform: scale(1.14);
}

.clear {
  margin-left: 7px;
  padding: 0 4px;
  border: none;
  background: none;
  font-size: 13px;
  color: var(--ink-faint);
  text-decoration: underline;
}

.clear:hover {
  color: var(--brick);
}

.none {
  font-size: 13px;
  margin-left: 4px;
}

.stars--readonly .star {
  cursor: default;
}
</style>
