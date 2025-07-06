<template>
  <div class="picket-content">
    <!-- Main Content Container -->
    <div
      :style="containerStyle"
      @mouseover="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <!-- Edit Button (appears on hover) -->
      <div
        v-if="allowEdit && isHovered"
        class="edit-button"
        :style="editButtonStyle"
      >
        <button
          @click="openEditor"
          class="edit-icon-button"
          data-testid="edit_icon"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>

      <!-- Content Display -->
      <div
        class="content-display"
        :style="contentDisplayStyle"
        data-testid="picket_content"
      >
        <RichTextDisplay :html-content="htmlContent" />
      </div>
    </div>

    <!-- Rich Text Editor Modal -->
    <RichTextEditorModal
      :open="isEditorOpen"
      :container="modalContainer"
      :value="editorValue"
      :allow-source-mode="allowSourceMode"
      @change="handleEditorChange"
      @close="closeEditor"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import RichTextDisplay from './RichTextDisplay.vue'
import RichTextEditorModal from './RichTextEditorModal.vue'

// Props
interface Props {
  x: number
  y: number
  width: number
  height: number
  htmlContent: string
  allowEdit?: boolean
  allowSourceMode?: boolean
  modalContainer?: HTMLElement
  style?: {
    backgroundColor?: string
    borderColor?: string
    boxShadow?: string
  }
  skewX?: number
  skewY?: number
}

const props = withDefaults(defineProps<Props>(), {
  allowEdit: false,
  allowSourceMode: false,
  skewX: 0,
  skewY: 0,
  style: () => ({
    backgroundColor: '#ffffff',
    borderColor: '#e0e0e0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  })
})

// Emits
const emit = defineEmits<{
  changed: [content: string]
  click: [event: MouseEvent]
  mouseEnter: [event: MouseEvent]
  mouseLeave: [event: MouseEvent]
}>()

// Reactive state
const isHovered = ref(false)
const isEditorOpen = ref(false)
const editorValue = ref('')

// Computed properties
const containerStyle = computed(() => ({
  position: 'absolute' as const,
  left: `${props.x}px`,
  top: `${props.y}px`,
  width: `${props.width}px`,
  height: `${props.height}px`,
  transform: `skewX(${props.skewX}deg) skewY(${props.skewY}deg)`
}))

const editButtonStyle = computed(() => ({
  display: 'block',
  position: 'absolute' as const,
  top: '0',
  right: '0',
  transform: 'translate(50%, -50%)',
  zIndex: '1'
}))

const contentDisplayStyle = computed(() => ({
  width: '100%',
  height: '100%',
  overflow: 'auto' as const,
  borderRadius: '8px',
  borderStyle: 'solid' as const,
  borderWidth: '1px',
  backgroundColor: props.style?.backgroundColor || '#ffffff',
  borderColor: props.style?.borderColor || '#e0e0e0',
  boxShadow: props.style?.boxShadow || '0 2px 4px rgba(0,0,0,0.1)',
  userSelect: 'text' as const
}))

// Methods
const handleMouseEnter = (event: MouseEvent) => {
  isHovered.value = true
  emit('mouseEnter', event)
}

const handleMouseLeave = (event: MouseEvent) => {
  isHovered.value = false
  emit('mouseLeave', event)
}

const openEditor = () => {
  emit('click', new MouseEvent('click'))
  editorValue.value = props.htmlContent
  isEditorOpen.value = true
}

const closeEditor = () => {
  if (editorValue.value !== props.htmlContent) {
    emit('changed', editorValue.value)
  }
  isEditorOpen.value = false
  isHovered.value = false
}

const handleEditorChange = (newValue: string) => {
  editorValue.value = newValue
}

// Watch for external changes
watch(() => props.htmlContent, (newValue) => {
  if (!isEditorOpen.value) {
    editorValue.value = newValue
  }
})
</script>

<style scoped>
.picket-content {
  position: relative;
}

.edit-button {
  position: absolute;
}

.edit-icon-button {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #ffffff;
  border: none;
  box-shadow: 0 4px 8px rgba(32, 32, 32, 0.16);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.edit-icon-button:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 12px rgba(32, 32, 32, 0.24);
}

.edit-icon-button:active {
  transform: scale(0.95);
}

.content-display {
  position: relative;
}
</style>
