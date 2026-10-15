<template>
  <Teleport to="body">
    <div v-if="open" class="backdrop" @click.self="emit('cancel')">
      <div
        ref="panel"
        class="panel sheet"
        role="alertdialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        @keydown.esc="emit('cancel')"
        @keydown.tab="trapFocus"
      >
        <span class="tape" aria-hidden="true"></span>

        <h2 :id="titleId" class="title">{{ title }}</h2>
        <p v-if="message" class="message">{{ message }}</p>

        <div class="actions">
          <button ref="cancelBtn" type="button" class="btn" @click="emit('cancel')">
            {{ cancelLabel }}
          </button>
          <button type="button" class="btn btn--danger" @click="emit('confirm')">
            {{ confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, nextTick, useId } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  message: { type: String, default: '' },
  confirmLabel: { type: String, default: 'Xoá' },
  cancelLabel: { type: String, default: 'Huỷ' },
})

const emit = defineEmits(['confirm', 'cancel'])

const titleId = useId()
const panel = ref(null)
const cancelBtn = ref(null)

// Mở lên thì đưa con trỏ vào nút Huỷ, không phải nút Xoá — bấm Enter theo
// quán tính sẽ không xoá nhầm.
watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return
    await nextTick()
    cancelBtn.value?.focus()
  },
)

// Giữ tiêu điểm bàn phím trong hộp thoại, không cho Tab ra nền phía sau
function trapFocus(event) {
  const focusable = panel.value?.querySelectorAll('button')
  if (!focusable?.length) return

  const first = focusable[0]
  const last = focusable[focusable.length - 1]

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}
</script>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(60, 45, 20, 0.42);
}

.panel {
  position: relative;
  width: min(410px, 100%);
  padding: 26px 24px 20px;
  transform: rotate(-0.6deg);
  box-shadow: var(--shadow-lift);
}

.tape {
  top: -13px;
  left: 50%;
  margin-left: -42px;
  transform: rotate(1.5deg);
}

.title {
  font-size: 19px;
  margin-bottom: 6px;
}

.message {
  margin: 0 0 20px;
  color: var(--ink-soft);
  font-size: 15px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
