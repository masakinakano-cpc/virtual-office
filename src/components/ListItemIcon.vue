<template>
  <div
    :class="[
      'flex-shrink-0 inline-flex items-center justify-center',
      'text-gray-600',
      {
        'mr-4': !disableGutters,
        'mr-0': disableGutters,
        'min-w-[56px]': !dense,
        'min-w-[40px]': dense
      }
    ]"
  >
    <component
      :is="iconComponent"
      :class="iconClasses"
      v-if="icon"
    />
    <slot v-else />
  </div>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'

export interface ListItemIconProps {
  /** アイコンコンポーネント */
  icon?: Component | string
  /** ガターを無効にする */
  disableGutters?: boolean
  /** 密度 */
  dense?: boolean
  /** カスタムアイコンクラス */
  iconClass?: string
}

const props = withDefaults(defineProps<ListItemIconProps>(), {
  disableGutters: false,
  dense: false
})

const iconComponent = computed(() => {
  if (typeof props.icon === 'string') {
    return 'i'
  }
  return props.icon
})

const iconClasses = computed(() => {
  const classes = ['w-6 h-6']

  if (props.iconClass) {
    classes.push(props.iconClass)
  }

  return classes
})
</script>
