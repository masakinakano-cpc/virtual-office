<template>
  <div
    :class="[
      'flex-1 min-w-0',
      {
        'my-1': !disableTypography,
        'my-0': disableTypography
      }
    ]"
  >
    <!-- Primary Text -->
    <component
      :is="primaryTypographyComponent"
      :class="[
        'block',
        primaryTextClasses,
        {
          'text-gray-900 text-base font-medium leading-6': !disableTypography,
          'truncate': noWrap
        }
      ]"
      v-if="primary || $slots.primary"
    >
      <slot name="primary">{{ primary }}</slot>
    </component>

    <!-- Secondary Text -->
    <component
      :is="secondaryTypographyComponent"
      :class="[
        'block',
        secondaryTextClasses,
        {
          'text-gray-600 text-sm leading-5 mt-1': !disableTypography,
          'truncate': noWrap
        }
      ]"
      v-if="secondary || $slots.secondary"
    >
      <slot name="secondary">{{ secondary }}</slot>
    </component>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface ListItemTextProps {
  /** プライマリテキスト */
  primary?: string
  /** セカンダリテキスト */
  secondary?: string
  /** タイポグラフィを無効にする */
  disableTypography?: boolean
  /** インセット */
  inset?: boolean
  /** テキストの折り返しを無効にする */
  noWrap?: boolean
  /** プライマリテキストのコンポーネント */
  primaryTypographyProps?: Record<string, any>
  /** セカンダリテキストのコンポーネント */
  secondaryTypographyProps?: Record<string, any>
}

const props = withDefaults(defineProps<ListItemTextProps>(), {
  disableTypography: false,
  inset: false,
  noWrap: false
})

const primaryTypographyComponent = computed(() => {
  return props.disableTypography ? 'span' : 'p'
})

const secondaryTypographyComponent = computed(() => {
  return props.disableTypography ? 'span' : 'p'
})

const primaryTextClasses = computed(() => {
  const classes = []

  if (props.inset) {
    classes.push('pl-14')
  }

  return classes
})

const secondaryTextClasses = computed(() => {
  const classes = []

  if (props.inset) {
    classes.push('pl-14')
  }

  return classes
})
</script>
