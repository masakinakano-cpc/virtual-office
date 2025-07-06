<template>
  <label
    :class="[
      'inline-flex items-center cursor-pointer relative',
      {
        'cursor-not-allowed opacity-60': disabled
      }
    ]"
  >
    <span
      :class="[
        'relative flex items-center justify-center',
        'transition-all duration-200 ease-in-out',
        radioClasses
      ]"
    >
      <!-- 外側の円（未選択状態） -->
      <span
        :class="[
          'absolute inset-0 rounded-full border-2 transition-all duration-200',
          borderClasses
        ]"
      ></span>

      <!-- 内側の円（選択状態） -->
      <span
        :class="[
          'absolute rounded-full transition-all duration-200 ease-in-out',
          dotClasses,
          {
            'scale-0': !checked,
            'scale-100': checked
          }
        ]"
      ></span>

      <!-- 実際のinput要素 -->
      <input
        type="radio"
        :name="name"
        :value="value"
        :checked="checked"
        :disabled="disabled"
        :required="required"
        :aria-describedby="ariaDescribedBy"
        :aria-labelledby="ariaLabelledBy"
        class="absolute opacity-0 w-0 h-0"
        @change="handleChange"
        @focus="handleFocus"
        @blur="handleBlur"
        ref="radioRef"
      />

      <!-- リップル効果 -->
      <span
        v-if="!disableRipple && (focused || hovered)"
        :class="[
          'absolute inset-0 rounded-full opacity-10 transition-all duration-200',
          rippleClasses
        ]"
      ></span>
    </span>

    <!-- ラベル -->
    <span
      v-if="label || $slots.default"
      :class="[
        'ml-2 select-none transition-colors duration-200',
        labelClasses
      ]"
    >
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<script setup lang="ts">
import { computed, ref, inject } from 'vue'

export interface RadioProps {
  /** 値 */
  value?: string | number | boolean
  /** ラベル */
  label?: string
  /** 選択状態 */
  checked?: boolean
  /** 無効状態 */
  disabled?: boolean
  /** 必須 */
  required?: boolean
  /** name属性 */
  name?: string
  /** サイズ */
  size?: 'small' | 'medium' | 'large'
  /** カラー */
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
  /** リップル効果を無効にする */
  disableRipple?: boolean
  /** aria-describedby */
  ariaDescribedBy?: string
  /** aria-labelledby */
  ariaLabelledBy?: string
}

export interface RadioEmits {
  (event: 'change', value: string | number | boolean): void
  (event: 'focus', focusEvent: FocusEvent): void
  (event: 'blur', blurEvent: FocusEvent): void
}

const props = withDefaults(defineProps<RadioProps>(), {
  size: 'medium',
  color: 'primary',
  disableRipple: false,
  checked: false,
  disabled: false,
  required: false
})

const emit = defineEmits<RadioEmits>()

// RadioGroupからの注入
const radioGroup = inject<{
  name?: string
  value?: string | number | boolean
  onChange?: (value: string | number | boolean) => void
}>('radioGroup', {})

const radioRef = ref<HTMLInputElement>()
const focused = ref(false)
const hovered = ref(false)

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'small':
      return 'w-5 h-5'
    case 'medium':
      return 'w-6 h-6'
    case 'large':
      return 'w-7 h-7'
    default:
      return 'w-6 h-6'
  }
})

const dotSize = computed(() => {
  switch (props.size) {
    case 'small':
      return 'w-2 h-2'
    case 'medium':
      return 'w-2.5 h-2.5'
    case 'large':
      return 'w-3 h-3'
    default:
      return 'w-2.5 h-2.5'
  }
})

const colorClasses = computed(() => {
  if (props.disabled) {
    return {
      border: 'border-gray-300',
      dot: 'bg-gray-400',
      ripple: 'bg-gray-400',
      text: 'text-gray-400'
    }
  }

  switch (props.color) {
    case 'primary':
      return {
        border: checked.value ? 'border-blue-600' : 'border-gray-400',
        dot: 'bg-blue-600',
        ripple: 'bg-blue-600',
        text: 'text-gray-900'
      }
    case 'secondary':
      return {
        border: checked.value ? 'border-gray-600' : 'border-gray-400',
        dot: 'bg-gray-600',
        ripple: 'bg-gray-600',
        text: 'text-gray-900'
      }
    case 'success':
      return {
        border: checked.value ? 'border-green-600' : 'border-gray-400',
        dot: 'bg-green-600',
        ripple: 'bg-green-600',
        text: 'text-gray-900'
      }
    case 'warning':
      return {
        border: checked.value ? 'border-yellow-600' : 'border-gray-400',
        dot: 'bg-yellow-600',
        ripple: 'bg-yellow-600',
        text: 'text-gray-900'
      }
    case 'error':
      return {
        border: checked.value ? 'border-red-600' : 'border-gray-400',
        dot: 'bg-red-600',
        ripple: 'bg-red-600',
        text: 'text-gray-900'
      }
    case 'info':
      return {
        border: checked.value ? 'border-cyan-600' : 'border-gray-400',
        dot: 'bg-cyan-600',
        ripple: 'bg-cyan-600',
        text: 'text-gray-900'
      }
    default:
      return {
        border: checked.value ? 'border-blue-600' : 'border-gray-400',
        dot: 'bg-blue-600',
        ripple: 'bg-blue-600',
        text: 'text-gray-900'
      }
  }
})

const radioClasses = computed(() => [
  sizeClasses.value
])

const borderClasses = computed(() => [
  colorClasses.value.border
])

const dotClasses = computed(() => [
  dotSize.value,
  colorClasses.value.dot
])

const rippleClasses = computed(() => [
  colorClasses.value.ripple
])

const labelClasses = computed(() => [
  colorClasses.value.text
])

const checked = computed(() => {
  if (radioGroup.value !== undefined && props.value !== undefined) {
    return radioGroup.value === props.value
  }
  return props.checked
})

const name = computed(() => {
  return radioGroup.name || props.name
})

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = props.value !== undefined ? props.value : target.value

  if (radioGroup.onChange) {
    radioGroup.onChange(value)
  }

  emit('change', value)
}

const handleFocus = (event: FocusEvent) => {
  focused.value = true
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  focused.value = false
  emit('blur', event)
}

// 外部からのフォーカス制御
const focus = () => {
  radioRef.value?.focus()
}

defineExpose({
  focus
})
</script>

<style scoped>
/* ホバー効果 */
.cursor-pointer:hover span:first-child {
  @apply bg-opacity-5;
}

/* フォーカス効果 */
input:focus + span {
  @apply ring-2 ring-offset-2 ring-blue-500;
}

/* アニメーション */
.scale-0 {
  transform: scale(0);
}

.scale-100 {
  transform: scale(1);
}

/* 無効状態でのホバー無効化 */
.cursor-not-allowed:hover span:first-child {
  @apply bg-transparent;
}
</style>
