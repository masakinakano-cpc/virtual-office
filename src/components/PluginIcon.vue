<template>
  <div
    class="plugin-icon"
    :style="containerStyle"
  >
    <img
      :src="iconSrc"
      :alt="name"
      :style="imageStyle"
      @error="handleImageError"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// Props
interface Props {
  icon?: string
  name: string
  style?: Record<string, any>
  iconStyle?: Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  style: () => ({}),
  iconStyle: () => ({})
})

// Reactive state
const imageError = ref(false)

// Computed properties
const containerStyle = computed(() => ({
  borderRadius: '50%',
  backgroundColor: '#fff',
  width: '100%',
  height: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'hidden',
  ...props.style
}))

const iconSrc = computed(() => {
  if (imageError.value || !props.icon?.trim()) {
    return '/assets/icon/plugin.svg'
  }
  return props.icon
})

const imageStyle = computed(() => ({
  backgroundColor: '#fff',
  width: '80%',
  height: '80%',
  objectFit: 'contain' as const,
  ...props.iconStyle
}))

// Methods
const handleImageError = () => {
  imageError.value = true
}
</script>

<style scoped>
.plugin-icon {
  position: relative;
}

.plugin-icon img {
  transition: transform 0.2s ease;
}

.plugin-icon:hover img {
  transform: scale(1.1);
}
</style>
