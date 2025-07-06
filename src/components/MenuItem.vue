<template>
  <component
    :is="component"
    :class="[
      'flex justify-start items-center relative no-underline box-border whitespace-nowrap',
      'transition-colors duration-200 ease-in-out',
      baseClasses,
      sizeClasses,
      stateClasses,
      {
        'cursor-pointer': !disabled,
        'cursor-not-allowed opacity-40': disabled,
        'focus:outline-none': true
      }
    ]"
    :role="role"
    :tabindex="computedTabIndex"
    :disabled="disabled"
    @click="handleClick"
    @keydown="handleKeydown"
    @focus="handleFocus"
    @blur="handleBlur"
    ref="menuItemRef"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, onMounted } from 'vue'

export interface MenuItemProps {
  /** 自動フォーカス */
  autoFocus?: boolean
  /** コンポーネントタイプ */
  component?: string
  /** 密度の高いレイアウト */
  dense?: boolean
  /** 区切り線 */
  divider?: boolean
  /** ガターを無効にする */
  disableGutters?: boolean
  /** 無効状態 */
  disabled?: boolean
  /** フォーカス時のクラス名 */
  focusVisibleClassName?: string
  /** ロール */
  role?: string
  /** タブインデックス */
  tabIndex?: number
  /** 選択状態 */
  selected?: boolean
  /** クリック時の値 */
  value?: any
}

export interface MenuItemEmits {
  (event: 'click', payload: { event: MouseEvent; value?: any }): void
  (event: 'focus', payload: FocusEvent): void
  (event: 'blur', payload: FocusEvent): void
  (event: 'keydown', payload: KeyboardEvent): void
}

const props = withDefaults(defineProps<MenuItemProps>(), {
  autoFocus: false,
  component: 'li',
  dense: false,
  divider: false,
  disableGutters: false,
  disabled: false,
  role: 'menuitem',
  selected: false
})

const emit = defineEmits<MenuItemEmits>()

const menuItemRef = ref<HTMLElement>()
const focused = ref(false)

const baseClasses = computed(() => {
  const classes = []

  // パディング
  if (!props.disableGutters) {
    classes.push('px-4')
  }

  // 区切り線
  if (props.divider) {
    classes.push('border-b border-gray-200 bg-clip-padding')
  }

  return classes
})

const sizeClasses = computed(() => {
  if (props.dense) {
    return [
      'min-h-[32px] py-1',
      'text-sm leading-5'
    ]
  } else {
    return [
      'min-h-[48px] py-1.5',
      'text-base leading-6'
    ]
  }
})

const stateClasses = computed(() => {
  const classes = []

  if (props.disabled) {
    classes.push('text-gray-400')
  } else {
    classes.push('text-gray-900')

    // ホバー効果
    classes.push('hover:bg-gray-100')

    // 選択状態
    if (props.selected) {
      classes.push('bg-blue-50 text-blue-700')
      classes.push('hover:bg-blue-100')
    }

    // フォーカス状態
    if (focused.value) {
      if (props.selected) {
        classes.push('bg-blue-100')
      } else {
        classes.push('bg-gray-100')
      }
    }
  }

  // フォーカス可視化クラス
  if (focused.value && props.focusVisibleClassName) {
    classes.push(props.focusVisibleClassName)
  }

  return classes
})

const computedTabIndex = computed(() => {
  if (props.disabled) {
    return -1
  }
  return props.tabIndex !== undefined ? props.tabIndex : -1
})

const handleClick = (event: MouseEvent) => {
  if (!props.disabled) {
    emit('click', { event, value: props.value })
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!props.disabled) {
    // Enter または Space キーでクリックをトリガー
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true
      })
      handleClick(clickEvent)
    }
  }
  emit('keydown', event)
}

const handleFocus = (event: FocusEvent) => {
  focused.value = true
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  focused.value = false
  emit('blur', event)
}

onMounted(() => {
  if (props.autoFocus) {
    nextTick(() => {
      menuItemRef.value?.focus()
    })
  }
})
</script>

<style scoped>
/* カスタムフォーカススタイル */
.focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* 選択状態のホバー効果の調整 */
.selected-hover {
  background-color: rgba(59, 130, 246, 0.1);
}

/* メディアクエリ対応 */
@media (hover: none) {
  .hover\:bg-gray-100:hover {
    background-color: transparent;
  }

  .hover\:bg-blue-100:hover {
    background-color: rgb(219 234 254);
  }
}

/* 密度の高いレイアウトでのアイコンサイズ調整 */
.dense-icon :deep(svg) {
  font-size: 1.25rem;
}
</style>
