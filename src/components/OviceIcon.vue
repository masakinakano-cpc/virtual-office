<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    :stroke="color"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    :class="['ovice-hand-icon', className]"
    :style="iconStyle"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- 手の指の部分 -->
    <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4" />
    <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v6" />
    <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v7.5" />

    <!-- 親指の部分 -->
    <path d="M6 13.5l4-7.5c.5-.8 1.5-.8 2 0l4 7.5" />

    <!-- 手のひらの部分 -->
    <path d="M18 13v4a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-4" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  size?: number | string
  color?: string
  className?: string
  style?: Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  size: 24,
  color: 'currentColor',
  className: '',
  style: () => ({})
})

const iconStyle = computed(() => ({
  ...props.style,
  cursor: 'pointer',
  transition: 'all 0.2s ease'
}))
</script>

<style scoped>
.ovice-hand-icon {
  display: inline-block;
  vertical-align: middle;
}

.ovice-hand-icon:hover {
  transform: scale(1.1);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}
</style>
