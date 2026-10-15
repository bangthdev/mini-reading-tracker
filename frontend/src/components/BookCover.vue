<template>
  <!-- Ảnh thật. Tải lỗi thì chuyển sang bìa tự vẽ, không để ảnh vỡ. -->
  <img
    v-if="coverId != null && !failed"
    :src="coverUrl(coverId, size)"
    :alt="`Bìa sách ${title}`"
    class="cover"
    loading="lazy"
    @error="failed = true"
  />

  <!-- Bìa tự vẽ: tên sách viết tay trên nền giấy, như sách bọc lại dán nhãn -->
  <div v-else class="cover cover--drawn" role="img" :aria-label="`Bìa sách ${title}`">
    <span class="label hand">{{ title }}</span>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { coverUrl } from '../api'

const props = defineProps({
  coverId: { type: Number, default: null },
  title: { type: String, required: true },
  size: { type: String, default: 'M' },
})

const failed = ref(false)

// Dùng lại component cho cuốn khác thì phải quên lỗi cũ đi
watch(() => props.coverId, () => { failed.value = false })
</script>

<style scoped>
.cover {
  width: 100%;
  aspect-ratio: 2 / 3;
  border-radius: 2px;
  box-shadow: 0 2px 5px rgba(60, 45, 20, 0.25);
}

img.cover {
  object-fit: cover;
  display: block;
}

.cover--drawn {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  padding: 14px 12px;
  text-align: center;
  background-color: var(--paper-dark);
  /* Vân giấy thô, cho khác hẳn ảnh bìa in */
  background-image:
    repeating-linear-gradient(94deg, rgba(255, 255, 255, 0.5) 0 2px, transparent 2px 6px),
    repeating-linear-gradient(6deg, rgba(120, 90, 50, 0.05) 0 3px, transparent 3px 8px);
  border: 1.5px solid var(--ink-faint);
}

.label {
  font-size: 17px;
  line-height: 1.25;
  color: var(--ink);
  /* Tên quá dài thì cắt, không đẩy vỡ khung */
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

</style>
