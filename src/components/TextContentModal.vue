<template>
  <div class="text-content-modal">
    <!-- Modal Overlay -->
    <div
      v-if="open"
      class="modal-overlay"
      @click="handleOverlayClick"
    >
      <!-- Modal Content -->
      <div
        class="modal-content"
        @click.stop
      >
        <!-- Modal Header -->
        <div class="modal-header">
          <button
            class="close-button"
            @click="handleClose"
            data-testid="close_button"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="modal-body">
          <RichTextDisplay :html-content="htmlContent" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import RichTextDisplay from './RichTextDisplay.vue'

// Props
interface Props {
  open: boolean
  htmlContent: string
  container?: HTMLElement
}

defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
}>()

// Methods
const handleClose = () => {
  emit('close')
}

const handleOverlayClick = () => {
  emit('close')
}
</script>

<style scoped>
.text-content-modal {
  position: relative;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  border-radius: 8px;
  border: 2px solid #000;
  height: 40vh;
  max-width: 500px;
  width: 100%;
  background-color: white;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  max-height: 80vh;
}

.modal-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 12px 16px 8px;
  border-bottom: 1px solid #e0e0e0;
}

.close-button {
  padding: 8px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  background-color: #f5f5f5;
}

.modal-body {
  flex: 1;
  overflow: auto;
  padding: 0;
}

/* Ensure rich text display fills the modal body */
.modal-body :deep(.rich-text-display) {
  height: 100%;
}

.modal-body :deep(.ql-container) {
  height: 100%;
}

.modal-body :deep(.ql-editor) {
  height: 100%;
  padding: 16px;
}
</style>
