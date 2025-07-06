<template>
  <div
    v-if="open"
    :class="[
      'fixed inset-0 z-50',
      {
        'bg-black bg-opacity-25': overlay
      }
    ]"
    @click="handleOverlayClick"
  >
    <div
      :class="[
        'absolute bg-white rounded-lg shadow-lg border border-gray-200',
        'min-w-[112px] max-w-[280px] max-h-[calc(100vh-96px)]',
        'overflow-y-auto py-2',
        menuClasses
      ]"
      :style="menuPosition"
      @click.stop
      ref="menuRef"
      role="menu"
      :aria-labelledby="ariaLabelledBy"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted, onUnmounted } from 'vue'

export interface MenuProps {
  /** メニューの表示状態 */
  open?: boolean
  /** アンカー要素 */
  anchorEl?: HTMLElement | null
  /** 水平方向の位置 */
  anchorOriginHorizontal?: 'left' | 'center' | 'right'
  /** 垂直方向の位置 */
  anchorOriginVertical?: 'top' | 'center' | 'bottom'
  /** 変換水平方向の位置 */
  transformOriginHorizontal?: 'left' | 'center' | 'right'
  /** 変換垂直方向の位置 */
  transformOriginVertical?: 'top' | 'center' | 'bottom'
  /** オーバーレイ表示 */
  overlay?: boolean
  /** 自動フォーカス */
  autoFocus?: boolean
  /** 密度の高いレイアウト */
  dense?: boolean
  /** カスタムクラス */
  menuClass?: string
  /** aria-labelledby */
  ariaLabelledBy?: string
  /** 最大幅 */
  maxWidth?: string | number
  /** 最大高さ */
  maxHeight?: string | number
}

export interface MenuEmits {
  (event: 'close', reason?: 'backdropClick' | 'escapeKeyDown'): void
  (event: 'opened'): void
  (event: 'closed'): void
}

const props = withDefaults(defineProps<MenuProps>(), {
  open: false,
  anchorOriginHorizontal: 'left',
  anchorOriginVertical: 'bottom',
  transformOriginHorizontal: 'left',
  transformOriginVertical: 'top',
  overlay: true,
  autoFocus: true,
  dense: false
})

const emit = defineEmits<MenuEmits>()

const menuRef = ref<HTMLElement>()

const menuClasses = computed(() => {
  const classes = []

  if (props.menuClass) {
    classes.push(props.menuClass)
  }

  if (props.dense) {
    classes.push('py-1')
  }

  return classes
})

const menuPosition = computed(() => {
  if (!props.anchorEl) {
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    }
  }

  const rect = props.anchorEl.getBoundingClientRect()
  const style: Record<string, string> = {}

  // 垂直方向の位置計算
  switch (props.anchorOriginVertical) {
    case 'top':
      style.top = `${rect.top}px`
      break
    case 'center':
      style.top = `${rect.top + rect.height / 2}px`
      break
    case 'bottom':
    default:
      style.top = `${rect.bottom}px`
      break
  }

  // 水平方向の位置計算
  switch (props.anchorOriginHorizontal) {
    case 'left':
      style.left = `${rect.left}px`
      break
    case 'center':
      style.left = `${rect.left + rect.width / 2}px`
      break
    case 'right':
      style.left = `${rect.right}px`
      break
  }

  // 変換原点の設定
  const transformX = props.transformOriginHorizontal === 'left' ? '0%' :
                   props.transformOriginHorizontal === 'center' ? '-50%' : '-100%'
  const transformY = props.transformOriginVertical === 'top' ? '0%' :
                   props.transformOriginVertical === 'center' ? '-50%' : '-100%'

  style.transform = `translate(${transformX}, ${transformY})`

  // 最大幅・高さの設定
  if (props.maxWidth) {
    style.maxWidth = typeof props.maxWidth === 'number' ? `${props.maxWidth}px` : props.maxWidth
  }
  if (props.maxHeight) {
    style.maxHeight = typeof props.maxHeight === 'number' ? `${props.maxHeight}px` : props.maxHeight
  }

  return style
})

const handleOverlayClick = () => {
  emit('close', 'backdropClick')
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    emit('close', 'escapeKeyDown')
  }
}

watch(() => props.open, (newOpen) => {
  if (newOpen) {
    nextTick(() => {
      if (props.autoFocus && menuRef.value) {
        const firstMenuItem = menuRef.value.querySelector('[role="menuitem"]:not([disabled])') as HTMLElement
        if (firstMenuItem) {
          firstMenuItem.focus()
        }
      }
      emit('opened')
    })
  } else {
    emit('closed')
  }
})

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
/* アニメーション */
.menu-enter-active,
.menu-leave-active {
  transition: all 0.2s ease;
}

.menu-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.menu-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* スクロールバーのスタイリング */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
