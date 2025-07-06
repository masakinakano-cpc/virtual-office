<template>
  <div class="quill-editor">
    <div class="toolbar">
      <button @click="formatText('bold')" :class="{ active: isActive('bold') }">
        <strong>B</strong>
      </button>
      <button @click="formatText('italic')" :class="{ active: isActive('italic') }">
        <em>I</em>
      </button>
      <button @click="formatText('underline')" :class="{ active: isActive('underline') }">
        <u>U</u>
      </button>
      <div class="separator"></div>
      <button @click="formatBlock('h1')">H1</button>
      <button @click="formatBlock('h2')">H2</button>
      <button @click="formatBlock('p')">P</button>
      <div class="separator"></div>
      <button @click="insertList('ul')">• List</button>
      <button @click="insertList('ol')">1. List</button>
    </div>

    <div
      ref="editorRef"
      class="editor-content"
      contenteditable="true"
      @input="handleInput"
      @keydown="handleKeydown"
      @focus="handleFocus"
      @blur="handleBlur"
      v-html="modelValue"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

// Props
interface Props {
  modelValue: string
  options?: {
    theme?: string
    modules?: any
    placeholder?: string
    readOnly?: boolean
  }
}

const props = withDefaults(defineProps<Props>(), {
  options: () => ({
    theme: 'snow',
    placeholder: 'Enter your text here...',
    readOnly: false
  })
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [value: string]
}>()

// Reactive state
const editorRef = ref<HTMLElement>()
const isFocused = ref(false)

// Methods
const handleInput = () => {
  if (editorRef.value) {
    const content = editorRef.value.innerHTML
    emit('update:modelValue', content)
    emit('change', content)
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  // Handle keyboard shortcuts
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 'b':
        event.preventDefault()
        formatText('bold')
        break
      case 'i':
        event.preventDefault()
        formatText('italic')
        break
      case 'u':
        event.preventDefault()
        formatText('underline')
        break
    }
  }
}

const handleFocus = () => {
  isFocused.value = true
}

const handleBlur = () => {
  isFocused.value = false
}

const formatText = (command: string) => {
  document.execCommand(command, false)
  handleInput()
}

const formatBlock = (tag: string) => {
  document.execCommand('formatBlock', false, tag)
  handleInput()
}

const insertList = (listType: 'ul' | 'ol') => {
  const command = listType === 'ul' ? 'insertUnorderedList' : 'insertOrderedList'
  document.execCommand(command, false)
  handleInput()
}

const isActive = (command: string): boolean => {
  return document.queryCommandState(command)
}

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (editorRef.value && editorRef.value.innerHTML !== newValue) {
    editorRef.value.innerHTML = newValue
  }
})

onMounted(() => {
  if (editorRef.value && props.modelValue) {
    editorRef.value.innerHTML = props.modelValue
  }
})
</script>

<style scoped>
.quill-editor {
  border: 1px solid #ccc;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.toolbar {
  display: flex;
  align-items: center;
  padding: 8px;
  border-bottom: 1px solid #ccc;
  background-color: #f8f9fa;
  gap: 4px;
}

.toolbar button {
  padding: 6px 12px;
  border: 1px solid transparent;
  background: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.toolbar button:hover {
  background-color: #e9ecef;
  border-color: #dee2e6;
}

.toolbar button.active {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}

.separator {
  width: 1px;
  height: 20px;
  background-color: #dee2e6;
  margin: 0 4px;
}

.editor-content {
  flex: 1;
  padding: 12px;
  outline: none;
  overflow-y: auto;
  min-height: 150px;
  line-height: 1.6;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

.editor-content:empty:before {
  content: attr(data-placeholder);
  color: #999;
  font-style: italic;
}

/* Rich text formatting styles */
.editor-content h1 {
  font-size: 2em;
  font-weight: bold;
  margin: 0.5em 0;
}

.editor-content h2 {
  font-size: 1.5em;
  font-weight: bold;
  margin: 0.5em 0;
}

.editor-content h3 {
  font-size: 1.17em;
  font-weight: bold;
  margin: 0.5em 0;
}

.editor-content p {
  margin: 0.5em 0;
}

.editor-content ul, .editor-content ol {
  margin: 0.5em 0;
  padding-left: 1.5em;
}

.editor-content li {
  margin: 0.25em 0;
}

.editor-content strong {
  font-weight: bold;
}

.editor-content em {
  font-style: italic;
}

.editor-content u {
  text-decoration: underline;
}
</style>
