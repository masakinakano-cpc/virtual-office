<template>
  <component
    :is="rootComponent"
    :class="[
      'flex justify-start items-center relative w-full box-border text-left',
      'transition-colors duration-200 ease-in-out',
      rootClasses,
      {
        'focus:outline-none focus:bg-gray-100': button,
        'cursor-pointer': button && !disabled,
        'cursor-not-allowed opacity-40': disabled,
        'bg-blue-50 text-blue-700': selected && !disabled,
        'bg-gray-100': selected && disabled,
        'border-b border-gray-200 bg-clip-padding': divider,
        'hover:bg-gray-50': button && !disabled && !selected,
        'hover:bg-blue-100': button && !disabled && selected
      }
    ]"
    :disabled="disabled"
    :tabindex="button ? (disabled ? -1 : 0) : undefined"
    @click="handleClick"
    @keydown="handleKeydown"
    @focus="handleFocus"
    @blur="handleBlur"
    ref="rootRef"
    :role="button ? 'button' : undefined"
    :aria-selected="button ? selected : undefined"
    :aria-disabled="disabled"
  >
    <slot />

    <!-- Secondary Action -->
    <div
      v-if="hasSecondaryAction"
      :class="[
        'absolute right-4 top-1/2 transform -translate-y-1/2',
        {
          'right-0': disableGutters
        }
      ]"
    >
      <slot name="secondary-action" />
    </div>
  </component>
</template>

<script setup lang="ts">
import { computed, ref, useSlots, nextTick, onMounted } from 'vue'

export interface ListItemProps {
  /** アライメント */
  alignItems?: 'center' | 'flex-start'
  /** 自動フォーカス */
  autoFocus?: boolean
  /** ボタンとして機能させるか */
  button?: boolean
  /** コンポーネントタイプ */
  component?: string
  /** 密度 */
  dense?: boolean
  /** 無効状態 */
  disabled?: boolean
  /** ガターを無効にする */
  disableGutters?: boolean
  /** パディングを無効にする */
  disablePadding?: boolean
  /** 区切り線 */
  divider?: boolean
  /** フォーカス時のクラス名 */
  focusVisibleClassName?: string
  /** 選択状態 */
  selected?: boolean
  /** セカンダリアクション */
  secondaryAction?: boolean
}

export interface ListItemEmits {
  (event: 'click', payload: MouseEvent): void
  (event: 'focus', payload: FocusEvent): void
  (event: 'blur', payload: FocusEvent): void
  (event: 'keydown', payload: KeyboardEvent): void
}

const props = withDefaults(defineProps<ListItemProps>(), {
  alignItems: 'center',
  autoFocus: false,
  button: false,
  component: 'li',
  dense: false,
  disabled: false,
  disableGutters: false,
  disablePadding: false,
  divider: false,
  selected: false,
  secondaryAction: false
})

const emit = defineEmits<ListItemEmits>()

const slots = useSlots()
const rootRef = ref<HTMLElement>()
const focused = ref(false)

const hasSecondaryAction = computed(() => {
  return props.secondaryAction || !!slots['secondary-action']
})

const rootComponent = computed(() => {
  if (props.button) {
    return props.component === 'li' ? 'div' : props.component
  }
  return props.component
})

const rootClasses = computed(() => {
  const classes = []

  // Padding
  if (!props.disablePadding) {
    if (props.dense) {
      classes.push('py-1')
    } else {
      classes.push('py-2')
    }

    if (!props.disableGutters) {
      classes.push('px-4')
    }

    if (hasSecondaryAction.value) {
      classes.push('pr-12')
    }
  }

  // Alignment
  if (props.alignItems === 'flex-start') {
    classes.push('items-start')
  } else {
    classes.push('items-center')
  }

  // Focus visible
  if (focused.value && props.focusVisibleClassName) {
    classes.push(props.focusVisibleClassName)
  }

  return classes
})

const handleClick = (event: MouseEvent) => {
  if (!props.disabled) {
    emit('click', event)
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (props.button && !props.disabled) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true
      })
      emit('click', clickEvent)
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
      rootRef.value?.focus()
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

/* 選択状態のホバー効果 */
.selected-hover {
  background-color: rgba(59, 130, 246, 0.1);
}

/* 無効状態のスタイル */
.disabled {
  pointer-events: none;
  opacity: 0.6;
}
</style>
