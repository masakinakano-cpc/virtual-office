<template>
  <div class="text-image-content">
    <!-- Main Container -->
    <div
      :style="containerStyle"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <!-- Image Display -->
      <img
        :src="src"
        :style="imageStyle"
        @click="handleClick"
        data-testid="text_content"
        alt=""
      />
    </div>

    <!-- Text Content Modal -->
    <TextContentModal
      :open="isModalOpen"
      :container="modalContainer"
      :html-content="htmlContent"
      @close="closeModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import TextContentModal from './TextContentModal.vue'

// Props
interface Props {
  x: number
  y: number
  width: number
  height: number
  src: string
  htmlContent: string
  modalContainer?: HTMLElement
  container?: HTMLElement
  skewX?: number
  skewY?: number
}

const props = withDefaults(defineProps<Props>(), {
  skewX: 0,
  skewY: 0
})

// Emits
const emit = defineEmits<{
  click: [event: MouseEvent]
  setIsHovered: [isHovered: boolean]
}>()

// Reactive state
const isModalOpen = ref(false)

// Computed properties
const containerStyle = computed(() => ({
  position: 'absolute' as const,
  left: `${props.x}px`,
  top: `${props.y}px`,
  width: `${props.width}px`,
  height: `${props.height}px`,
  transform: `skewX(${props.skewX}deg) skewY(${props.skewY}deg)`
}))

const imageStyle = computed(() => ({
  width: '100%',
  height: '100%',
  cursor: 'pointer',
  objectFit: 'cover' as const,
  borderRadius: '8px',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
}))

// Methods
const handleMouseEnter = () => {
  emit('setIsHovered', true)
  updateContainerZIndex('2')
}

const handleMouseLeave = () => {
  emit('setIsHovered', false)
  updateContainerZIndex('0')
}

const handleClick = (event: MouseEvent) => {
  isModalOpen.value = true
  emit('click', event)
  emit('setIsHovered', false)
  updateContainerZIndex('0')
}

const closeModal = () => {
  isModalOpen.value = false
}

const updateContainerZIndex = (zIndex: string) => {
  if (props.container) {
    props.container.style.zIndex = zIndex
  }
}
</script>

<style scoped>
.text-image-content {
  position: relative;
}

.text-image-content img:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
