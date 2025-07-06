<template>
  <div class="image-content">
    <!-- Main Image Container -->
    <div
      :style="containerStyle"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <!-- Image or Placeholder -->
      <img
        v-if="src"
        :src="src"
        :style="imageStyle"
        @click="handleClick"
        data-testid="image_content"
        alt=""
      />

      <!-- Placeholder when no image -->
      <div
        v-else
        class="image-placeholder"
        :style="placeholderStyle"
      >
        <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>

      <!-- Click Animation -->
      <transition
        name="click-animation"
        @enter="onAnimationEnter"
        @leave="onAnimationLeave"
      >
        <img
          v-if="showAnimation && animationOnClick"
          :src="animationOnClick.src"
          class="click-animation-image"
          :style="animationImageStyle"
        />
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

// Props
interface Props {
  container?: HTMLElement
  x: number
  y: number
  width: number
  height: number
  src?: string
  cursor?: string
  animationOnClick?: {
    src: string
    duration: number
  }
  skewX?: number
  skewY?: number
}

const props = withDefaults(defineProps<Props>(), {
  cursor: 'pointer',
  skewX: 0,
  skewY: 0
})

// Emits
const emit = defineEmits<{
  click: [event: MouseEvent]
  setIsHovered: [isHovered: boolean]
}>()

// Reactive state
const showAnimation = ref(false)
const animationTimeout = ref<ReturnType<typeof setTimeout>>()

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
  cursor: props.cursor,
  objectFit: 'cover' as const,
  borderRadius: '8px'
}))

const placeholderStyle = computed(() => ({
  width: '100%',
  height: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#F0EEF2',
  opacity: 0.6,
  borderRadius: '8px'
}))

const animationImageStyle = computed(() => ({
  position: 'absolute' as const,
  left: '50%',
  top: '50%',
  transform: 'translate(-50%, -50%)',
  zIndex: 10
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
  if (props.animationOnClick) {
    showClickAnimation()
  }
  emit('click', event)
}

const showClickAnimation = () => {
  if (!props.animationOnClick) return

  // Clear any existing timeout
  if (animationTimeout.value) {
    clearTimeout(animationTimeout.value)
  }

  showAnimation.value = true

  // Hide animation after duration
  animationTimeout.value = setTimeout(() => {
    showAnimation.value = false
  }, props.animationOnClick.duration || 500)
}

const updateContainerZIndex = (zIndex: string) => {
  if (props.container) {
    props.container.style.zIndex = zIndex
  }
}

const onAnimationEnter = (_el: Element) => {
  // Animation enter logic
}

const onAnimationLeave = (_el: Element) => {
  // Animation leave logic
}

// Cleanup on unmount
watch(() => showAnimation.value, (newValue) => {
  if (!newValue && animationTimeout.value) {
    clearTimeout(animationTimeout.value)
    animationTimeout.value = undefined
  }
})
</script>

<style scoped>
.image-content {
  position: relative;
}

.image-placeholder {
  border: 2px dashed #d1d5db;
}

.click-animation-image {
  pointer-events: none;
}

/* Click Animation Transitions */
.click-animation-enter-active {
  transition: all 0.5s ease-out;
}

.click-animation-leave-active {
  transition: all 0.5s ease-in;
}

.click-animation-enter-from {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.5);
}

.click-animation-enter-to {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

.click-animation-leave-from {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

.click-animation-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(1.2);
}
</style>
