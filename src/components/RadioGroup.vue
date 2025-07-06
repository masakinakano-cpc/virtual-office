<template>
  <div
    :class="[
      'flex',
      {
        'flex-col': !row,
        'flex-row flex-wrap': row,
        'gap-2': !row,
        'gap-4': row
      },
      containerClasses
    ]"
    role="radiogroup"
    :aria-labelledby="ariaLabelledBy"
    :aria-describedby="ariaDescribedBy"
    ref="radioGroupRef"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, provide, ref, useId, watch, nextTick } from 'vue'

export interface RadioGroupProps {
  /** 現在の値 */
  value?: string | number | boolean
  /** デフォルト値 */
  defaultValue?: string | number | boolean
  /** name属性 */
  name?: string
  /** 横並びレイアウト */
  row?: boolean
  /** 無効状態 */
  disabled?: boolean
  /** 必須 */
  required?: boolean
  /** エラー状態 */
  error?: boolean
  /** aria-labelledby */
  ariaLabelledBy?: string
  /** aria-describedby */
  ariaDescribedBy?: string
  /** カスタムクラス */
  containerClass?: string
}

export interface RadioGroupEmits {
  (event: 'change', value: string | number | boolean): void
  (event: 'update:value', value: string | number | boolean): void
}

const props = withDefaults(defineProps<RadioGroupProps>(), {
  row: false,
  disabled: false,
  required: false,
  error: false
})

const emit = defineEmits<RadioGroupEmits>()

const radioGroupRef = ref<HTMLElement>()
const internalValue = ref<string | number | boolean>(props.defaultValue || '')
const generatedName = useId()

const containerClasses = computed(() => {
  const classes = []

  if (props.containerClass) {
    classes.push(props.containerClass)
  }

  if (props.error) {
    classes.push('text-red-600')
  }

  return classes
})

const currentValue = computed({
  get() {
    return props.value !== undefined ? props.value : internalValue.value
  },
  set(newValue: string | number | boolean) {
    if (props.value === undefined) {
      internalValue.value = newValue
    }
    emit('update:value', newValue)
    emit('change', newValue)
  }
})

const groupName = computed(() => {
  return props.name || `radio-group-${generatedName}`
})

// Radioコンポーネントに提供するコンテキスト
const radioGroupContext = computed(() => ({
  name: groupName.value,
  value: currentValue.value,
  onChange: (value: string | number | boolean) => {
    currentValue.value = value
  },
  disabled: props.disabled,
  required: props.required,
  error: props.error
}))

provide('radioGroup', radioGroupContext)

// フォーカス管理
const focus = () => {
  nextTick(() => {
    if (radioGroupRef.value) {
      // 選択されているラジオボタンにフォーカス
      let targetRadio = radioGroupRef.value.querySelector('input[type="radio"]:checked:not(:disabled)') as HTMLInputElement

      // 選択されているものがない場合は最初の有効なラジオボタンにフォーカス
      if (!targetRadio) {
        targetRadio = radioGroupRef.value.querySelector('input[type="radio"]:not(:disabled)') as HTMLInputElement
      }

      if (targetRadio) {
        targetRadio.focus()
      }
    }
  })
}

// 値の変更を監視
watch(() => props.value, (newValue) => {
  if (newValue !== undefined) {
    internalValue.value = newValue
  }
})

defineExpose({
  focus
})
</script>

<style scoped>
/* エラー状態のスタイル */
.text-red-600 :deep(label) {
  color: rgb(220 38 38);
}

.text-red-600 :deep(.border-gray-400) {
  border-color: rgb(220 38 38);
}

/* 無効状態のスタイル */
.disabled :deep(label) {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
