<template>
  <div class="text-static-object">
    <!-- Text Content with Rich Text Editor -->
    <PicketContent
      v-if="type === 'text'"
      :x="x"
      :y="y"
      :width="width"
      :height="height"
      :html-content="htmlContent || ''"
      :allow-edit="allowEdit"
      :allow-source-mode="allowSourceMode"
      :modal-container="modalContainer"
      :style="contentStyle"
      :skew-x="skewX"
      :skew-y="skewY"
      @changed="handleContentChanged"
      @click="handleClick"
      @mouse-enter="handleMouseEnter"
      @mouse-leave="handleMouseLeave"
    />

    <!-- Image Content -->
    <ImageContent
      v-else-if="type === 'image'"
      :container="container"
      :x="x"
      :y="y"
      :width="width"
      :height="height"
      :src="src"
      :cursor="cursor"
      :animation-on-click="animationOnClick"
      :skew-x="skewX"
      :skew-y="skewY"
      @click="handleClick"
      @set-is-hovered="setIsHovered"
    />

    <!-- Text Image Content (Image with Text Overlay) -->
    <TextImageContent
      v-else-if="type === 'text-image'"
      :x="x"
      :y="y"
      :width="width"
      :height="height"
      :src="src || ''"
      :html-content="htmlContent || ''"
      :modal-container="modalContainer"
      :container="container"
      :skew-x="skewX"
      :skew-y="skewY"
      @click="handleClick"
      @set-is-hovered="setIsHovered"
    />

    <!-- Plugin Icon -->
    <PluginIcon
      v-else-if="type === 'plugin'"
      :icon="icon"
      :name="name || ''"
      :style="iconStyle"
      :icon-style="iconImageStyle"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import PicketContent from './PicketContent.vue'
import ImageContent from './ImageContent.vue'
import TextImageContent from './TextImageContent.vue'
import PluginIcon from './PluginIcon.vue'

// Props
interface Props {
  type: 'text' | 'image' | 'text-image' | 'plugin'
  x: number
  y: number
  width: number
  height: number
  htmlContent?: string
  src?: string
  icon?: string
  name?: string
  allowEdit?: boolean
  allowSourceMode?: boolean
  modalContainer?: HTMLElement
  container?: HTMLElement
  cursor?: string
  animationOnClick?: {
    src: string
    duration: number
  }
  skewX?: number
  skewY?: number
  style?: {
    backgroundColor?: string
    borderColor?: string
    boxShadow?: string
  }
  iconStyle?: Record<string, any>
  iconImageStyle?: Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  allowEdit: false,
  allowSourceMode: false,
  cursor: 'pointer',
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
  hoverChange: [isHovered: boolean]
}>()

// Reactive state
const isHovered = ref(false)
// const isEditing = ref(false)

// Computed properties
const contentStyle = computed(() => ({
  backgroundColor: props.style?.backgroundColor || '#ffffff',
  borderColor: props.style?.borderColor || '#e0e0e0',
  boxShadow: props.style?.boxShadow || '0 2px 4px rgba(0,0,0,0.1)'
}))

// Methods
const handleContentChanged = (newContent: string) => {
  emit('changed', newContent)
}

const handleClick = (event: MouseEvent) => {
  emit('click', event)
}

const handleMouseEnter = (event: MouseEvent) => {
  isHovered.value = true
  emit('mouseEnter', event)
  emit('hoverChange', true)
}

const handleMouseLeave = (event: MouseEvent) => {
  isHovered.value = false
  emit('mouseLeave', event)
  emit('hoverChange', false)
}

const setIsHovered = (hovered: boolean) => {
  isHovered.value = hovered
  emit('hoverChange', hovered)
}

// Lifecycle
onMounted(() => {
  // Initialize any necessary setup
})

onUnmounted(() => {
  // Cleanup
})
</script>

<style scoped>
.text-static-object {
  position: relative;
  user-select: none;
}
</style>
