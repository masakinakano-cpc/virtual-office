<template>
  <div
    :class="[
      'flex items-center justify-center w-full',
      containerClasses,
      {
        'py-8': size === 'large',
        'py-6': size === 'medium',
        'py-4': size === 'small',
        'py-2': size === 'mini'
      }
    ]"
  >
    <!-- スピナー -->
    <div
      v-if="type === 'spinner'"
      :class="[
        'animate-spin rounded-full border-solid border-t-transparent',
        spinnerClasses
      ]"
      :style="{ borderWidth: borderWidth }"
    >
    </div>

    <!-- ドット -->
    <div
      v-else-if="type === 'dots'"
      :class="[
        'flex items-center gap-1',
        dotsContainerClasses
      ]"
    >
      <div
        v-for="i in 3"
        :key="i"
        :class="[
          'rounded-full bg-current animate-pulse',
          dotClasses
        ]"
        :style="{ animationDelay: `${(i - 1) * 0.2}s` }"
      ></div>
    </div>

    <!-- バー -->
    <div
      v-else-if="type === 'bars'"
      :class="[
        'flex items-center gap-1',
        barsContainerClasses
      ]"
    >
      <div
        v-for="i in 3"
        :key="i"
        :class="[
          'bg-current animate-pulse',
          barClasses
        ]"
        :style="{ animationDelay: `${(i - 1) * 0.15}s` }"
      ></div>
    </div>

    <!-- プログレスバー -->
    <div
      v-else-if="type === 'progress'"
      :class="[
        'w-full bg-gray-200 rounded-full overflow-hidden',
        progressContainerClasses
      ]"
    >
      <div
        :class="[
          'h-full bg-current transition-all duration-300 ease-out',
          progressBarClasses,
          {
            'animate-pulse': indeterminate
          }
        ]"
        :style="{
          width: indeterminate ? '100%' : `${progress}%`,
          animationDuration: indeterminate ? '2s' : undefined
        }"
      ></div>
    </div>

    <!-- カスタムローダー -->
    <div
      v-else-if="type === 'custom'"
      :class="customClasses"
    >
      <slot name="loader" />
    </div>

    <!-- テキスト付きローダー -->
    <div
      v-else
      :class="[
        'flex flex-col items-center gap-3',
        textLoaderClasses
      ]"
    >
      <div
        :class="[
          'animate-spin rounded-full border-solid border-t-transparent',
          spinnerClasses
        ]"
        :style="{ borderWidth: borderWidth }"
      >
      </div>
      <div
        v-if="text"
        :class="[
          'text-center font-medium',
          textClasses
        ]"
      >
        {{ text }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface LoadingStateProps {
  /** ローディングタイプ */
  type?: 'spinner' | 'dots' | 'bars' | 'progress' | 'text' | 'custom'
  /** サイズ */
  size?: 'mini' | 'small' | 'medium' | 'large'
  /** カラー */
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'gray'
  /** ローディングテキスト */
  text?: string
  /** プログレスバーの進捗（0-100） */
  progress?: number
  /** 不確定プログレス */
  indeterminate?: boolean
  /** カスタムコンテナクラス */
  containerClass?: string
  /** カスタムローダークラス */
  loaderClass?: string
  /** 全画面表示 */
  overlay?: boolean
  /** 背景色（オーバーレイ時） */
  overlayColor?: string
}

const props = withDefaults(defineProps<LoadingStateProps>(), {
  type: 'spinner',
  size: 'medium',
  color: 'primary',
  progress: 0,
  indeterminate: false,
  overlay: false,
  overlayColor: 'rgba(255, 255, 255, 0.8)'
})

const containerClasses = computed(() => {
  const classes = []

  if (props.containerClass) {
    classes.push(props.containerClass)
  }

  if (props.overlay) {
    classes.push(
      'fixed inset-0 z-50 backdrop-blur-sm',
      'bg-white/80 dark:bg-gray-900/80'
    )
  }

  return classes
})

const colorClasses = computed(() => {
  switch (props.color) {
    case 'primary':
      return 'text-blue-600 border-blue-600'
    case 'secondary':
      return 'text-gray-600 border-gray-600'
    case 'success':
      return 'text-green-600 border-green-600'
    case 'warning':
      return 'text-yellow-600 border-yellow-600'
    case 'error':
      return 'text-red-600 border-red-600'
    case 'info':
      return 'text-cyan-600 border-cyan-600'
    case 'gray':
      return 'text-gray-400 border-gray-400'
    default:
      return 'text-blue-600 border-blue-600'
  }
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'mini':
      return {
        spinner: 'w-4 h-4',
        dot: 'w-1 h-1',
        bar: 'w-1 h-3',
        progress: 'h-1',
        text: 'text-xs',
        border: '1px'
      }
    case 'small':
      return {
        spinner: 'w-6 h-6',
        dot: 'w-1.5 h-1.5',
        bar: 'w-1.5 h-4',
        progress: 'h-2',
        text: 'text-sm',
        border: '2px'
      }
    case 'medium':
      return {
        spinner: 'w-8 h-8',
        dot: 'w-2 h-2',
        bar: 'w-2 h-6',
        progress: 'h-3',
        text: 'text-base',
        border: '2px'
      }
    case 'large':
      return {
        spinner: 'w-12 h-12',
        dot: 'w-3 h-3',
        bar: 'w-3 h-8',
        progress: 'h-4',
        text: 'text-lg',
        border: '3px'
      }
    default:
      return {
        spinner: 'w-8 h-8',
        dot: 'w-2 h-2',
        bar: 'w-2 h-6',
        progress: 'h-3',
        text: 'text-base',
        border: '2px'
      }
  }
})

const spinnerClasses = computed(() => {
  return [
    sizeClasses.value.spinner,
    colorClasses.value,
    props.loaderClass
  ]
})

const dotClasses = computed(() => {
  return [
    sizeClasses.value.dot,
    colorClasses.value
  ]
})

const dotsContainerClasses = computed(() => {
  return [
    colorClasses.value
  ]
})

const barClasses = computed(() => {
  return [
    sizeClasses.value.bar,
    colorClasses.value
  ]
})

const barsContainerClasses = computed(() => {
  return [
    colorClasses.value
  ]
})

const progressContainerClasses = computed(() => {
  return [
    sizeClasses.value.progress
  ]
})

const progressBarClasses = computed(() => {
  return [
    colorClasses.value.replace('border-', 'bg-')
  ]
})

const textClasses = computed(() => {
  return [
    sizeClasses.value.text,
    colorClasses.value.replace('border-', 'text-')
  ]
})

const textLoaderClasses = computed(() => {
  return [
    colorClasses.value
  ]
})

const customClasses = computed(() => {
  return [
    props.loaderClass,
    colorClasses.value
  ]
})

const borderWidth = computed(() => {
  return sizeClasses.value.border
})
</script>

<style scoped>
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-25%);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.animate-bounce {
  animation: bounce 1s infinite;
}

/* ドットアニメーション */
.dots-animation .dot:nth-child(1) {
  animation-delay: 0s;
}

.dots-animation .dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dots-animation .dot:nth-child(3) {
  animation-delay: 0.4s;
}

/* バーアニメーション */
.bars-animation .bar:nth-child(1) {
  animation-delay: 0s;
}

.bars-animation .bar:nth-child(2) {
  animation-delay: 0.15s;
}

.bars-animation .bar:nth-child(3) {
  animation-delay: 0.3s;
}

/* プログレスバーアニメーション */
.progress-indeterminate {
  background: linear-gradient(
    90deg,
    transparent,
    currentColor,
    transparent
  );
  background-size: 200% 100%;
  animation: progress-indeterminate 2s ease-in-out infinite;
}

@keyframes progress-indeterminate {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
