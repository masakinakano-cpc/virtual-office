<template>
  <div class="rich-text-editor-modal">
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
        data-testid="modal_content"
      >
        <!-- Modal Header -->
        <div class="modal-header">
          <!-- Editor Mode Toggle -->
          <div v-if="allowSourceMode" class="mode-toggle">
            <button
              :class="['mode-button', { active: !isSourceMode }]"
              @click="setEditorMode(false)"
              data-testid="editor_button"
            >
              Editor
            </button>
            <button
              :class="['mode-button', { active: isSourceMode }]"
              @click="setEditorMode(true)"
              data-testid="source_button"
            >
              Source
            </button>
          </div>

          <!-- Close Button -->
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

        <!-- Editor Content -->
        <div class="editor-content">
          <!-- Source Mode Editor -->
          <textarea
            v-if="isSourceMode"
            v-model="internalValue"
            class="source-editor"
            data-testid="source_editor"
            placeholder="Enter HTML source code..."
          />

          <!-- Visual Editor -->
          <div
            v-else
            class="visual-editor"
          >
            <QuillEditor
              v-model="internalValue"
              :options="editorOptions"
              @change="handleEditorChange"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import QuillEditor from './QuillEditor.vue'

// Props
interface Props {
  open: boolean
  container?: HTMLElement
  value: string
  allowSourceMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  allowSourceMode: false
})

// Emits
const emit = defineEmits<{
  change: [value: string]
  close: []
}>()

// Reactive state
const isSourceMode = ref(false)
const internalValue = ref('')

// Computed properties
const editorOptions = computed(() => ({
  theme: 'snow',
  modules: {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean']
    ]
  },
  placeholder: 'Enter your text here...',
  readOnly: false
}))

// Methods
const setEditorMode = (sourceMode: boolean) => {
  isSourceMode.value = sourceMode
}

const handleEditorChange = (content: string) => {
  internalValue.value = content
  emit('change', content)
}

const handleClose = () => {
  emit('close')
}

const handleOverlayClick = () => {
  emit('close')
}

// Watch for prop changes
watch(() => props.value, (newValue) => {
  internalValue.value = newValue
}, { immediate: true })

watch(() => props.open, (newValue) => {
  if (newValue) {
    internalValue.value = props.value
    isSourceMode.value = false
  }
})

watch(internalValue, (newValue) => {
  emit('change', newValue)
})
</script>

<style scoped>
.rich-text-editor-modal {
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
  background: white;
  width: 100%;
  max-width: 500px;
  height: 40vh;
  min-height: 400px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 0 8px;
}

.mode-toggle {
  display: flex;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.mode-button {
  padding: 8px 16px;
  border: none;
  background-color: #f5f5f5;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
}

.mode-button:hover {
  background-color: #e0e0e0;
}

.mode-button.active {
  background-color: #3b82f6;
  color: white;
}

.close-button {
  padding: 8px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.close-button:hover {
  background-color: #f5f5f5;
}

.editor-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.source-editor {
  flex: 1;
  width: 100%;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  overflow: auto;
  outline: none;
}

.source-editor:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.visual-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Quill editor styles */
:deep(.ql-container) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

:deep(.ql-editor) {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  font-size: 14px;
  line-height: 1.6;
}

:deep(.ql-toolbar) {
  border-top: 1px solid #ccc;
  border-left: 1px solid #ccc;
  border-right: 1px solid #ccc;
  border-bottom: none;
}

:deep(.ql-container) {
  border-left: 1px solid #ccc;
  border-right: 1px solid #ccc;
  border-bottom: 1px solid #ccc;
  border-top: none;
}
</style>
