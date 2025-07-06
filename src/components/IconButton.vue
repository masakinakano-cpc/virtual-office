<template>
  <button
    :class="[
      'inline-flex items-center justify-center border-0 transition-all duration-150 ease-in-out focus:outline-none',
      sizeClasses,
      skinClasses,
      {
        'pointer-events-none cursor-not-allowed': disabled,
        'scale-95': pressed
      }
    ]"
    :disabled="disabled"
    @mousedown="pressed = true"
    @mouseup="pressed = false"
    @mouseleave="pressed = false"
    @click="handleClick"
    :aria-label="ariaLabel"
    :aria-pressed="isPressed"
    :type="type"
  >
    <component
      :is="iconComponent"
      :class="[
        'transition-colors duration-150',
        iconSizeClasses
      ]"
      v-if="icon"
    />
    <slot v-else />
  </button>
</template>

<script setup lang="ts">
import { computed, ref, type Component } from 'vue'

export interface IconButtonProps {
  /** アイコンコンポーネント */
  icon?: Component | string
  /** サイズバリアント */
  sizeVariant?: 'small' | 'regular' | number
  /** スキンバリアント */
  skin?: 'notice' | 'info' | 'normal' | 'normalWithBackground' | 'normalWithHover' | 'active' | 'send' | 'primary' | 'secondary'
  /** 無効状態 */
  disabled?: boolean
  /** アクセシビリティ用ラベル */
  ariaLabel?: string
  /** 押下状態（外部制御用） */
  isPressed?: boolean
  /** ボタンタイプ */
  type?: 'button' | 'submit' | 'reset'
}

export interface IconButtonEmits {
  (event: 'click', payload: MouseEvent): void
}

const props = withDefaults(defineProps<IconButtonProps>(), {
  sizeVariant: 'regular',
  skin: 'normal',
  disabled: false,
  isPressed: false,
  type: 'button'
})

const emit = defineEmits<IconButtonEmits>()

const pressed = ref(false)

const iconComponent = computed(() => {
  if (typeof props.icon === 'string') {
    return 'i'
  }
  return props.icon
})

const sizeClasses = computed(() => {
  if (typeof props.sizeVariant === 'number') {
    return {
      width: `${props.sizeVariant}px`,
      height: `${props.sizeVariant}px`
    }
  }

  switch (props.sizeVariant) {
    case 'small':
      return 'w-[26px] h-[26px] p-[5px]'
    case 'regular':
    default:
      return 'w-[44px] h-[44px] p-2'
  }
})

const iconSizeClasses = computed(() => {
  if (typeof props.sizeVariant === 'number') {
    return {
      width: `${Math.round(props.sizeVariant * 0.6)}px`,
      height: `${Math.round(props.sizeVariant * 0.6)}px`
    }
  }

  switch (props.sizeVariant) {
    case 'small':
      return 'w-4 h-4'
    case 'regular':
    default:
      return 'w-7 h-7'
  }
})

const skinClasses = computed(() => {
  const baseClasses = 'rounded-lg'

  if (props.disabled) {
    switch (props.skin) {
      case 'notice':
        return `${baseClasses} bg-red-50 text-red-500`
      case 'info':
        return `${baseClasses} bg-blue-50 text-blue-600`
      case 'normal':
        return `${baseClasses} bg-transparent text-gray-400`
      case 'normalWithBackground':
        return `${baseClasses} bg-gray-200 text-black`
      case 'normalWithHover':
        return `${baseClasses} bg-transparent text-black`
      case 'active':
        return `${baseClasses} bg-blue-50 text-blue-600`
      case 'send':
        return `${baseClasses} bg-gray-400 text-white`
      case 'primary':
        return `${baseClasses} bg-gray-400 text-white`
      case 'secondary':
        return `${baseClasses} bg-gray-100 text-black`
      default:
        return `${baseClasses} bg-transparent text-gray-400`
    }
  }

  switch (props.skin) {
    case 'notice':
      return `${baseClasses} bg-red-50 text-red-500 hover:bg-red-100 active:bg-red-200`
    case 'info':
      return `${baseClasses} bg-blue-50 text-blue-600 hover:bg-blue-100 active:bg-blue-200`
    case 'normal':
      return `${baseClasses} bg-transparent text-black hover:bg-gray-50 active:bg-gray-100`
    case 'normalWithBackground':
      return `${baseClasses} bg-gray-200 text-black hover:bg-gray-300 active:bg-gray-400`
    case 'normalWithHover':
      return `${baseClasses} bg-transparent text-black hover:bg-gray-100 active:bg-gray-200`
    case 'active':
      return `${baseClasses} bg-blue-50 text-blue-600 hover:bg-blue-100 active:bg-blue-200`
    case 'send':
      return `${baseClasses} bg-black text-white hover:bg-gray-800 active:bg-gray-900`
    case 'primary':
      return `${baseClasses} bg-purple-100 text-purple-600 hover:bg-purple-200 active:bg-purple-300`
    case 'secondary':
      return `${baseClasses} bg-gray-100 text-black hover:bg-gray-200 active:bg-gray-300`
    default:
      return `${baseClasses} bg-transparent text-black hover:bg-gray-50 active:bg-gray-100`
  }
})

const handleClick = (event: MouseEvent) => {
  if (!props.disabled) {
    emit('click', event)
  }
}
</script>

<style scoped>
button[style*="width"][style*="height"] {
  width: var(--width);
  height: var(--height);
}

button[style*="width"][style*="height"] .icon {
  width: var(--icon-width);
  height: var(--icon-height);
}
</style>
