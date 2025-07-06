<template>
  <div
    :class="[
      'flex-shrink-0 inline-flex items-center justify-center',
      {
        'mr-4': !disableGutters,
        'mr-0': disableGutters,
        'min-w-[56px]': !dense,
        'min-w-[40px]': dense
      }
    ]"
  >
    <div
      :class="[
        'rounded-full overflow-hidden bg-gray-300 flex items-center justify-center',
        {
          'w-10 h-10': !dense,
          'w-8 h-8': dense
        }
      ]"
    >
      <img
        v-if="src"
        :src="src"
        :alt="alt"
        :class="[
          'w-full h-full object-cover',
          imageClass
        ]"
        @error="handleImageError"
      />
      <div
        v-else-if="initials"
        :class="[
          'text-white font-medium select-none',
          {
            'text-sm': dense,
            'text-base': !dense
          }
        ]"
        :style="{ backgroundColor: avatarColor }"
      >
        {{ initials }}
      </div>
      <slot v-else />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

export interface ListItemAvatarProps {
  /** アバター画像のURL */
  src?: string
  /** 画像のalt属性 */
  alt?: string
  /** イニシャル */
  initials?: string
  /** ガターを無効にする */
  disableGutters?: boolean
  /** 密度 */
  dense?: boolean
  /** カスタム画像クラス */
  imageClass?: string
  /** アバターの背景色 */
  avatarColor?: string
}

export interface ListItemAvatarEmits {
  (event: 'error', payload: Event): void
}

withDefaults(defineProps<ListItemAvatarProps>(), {
  disableGutters: false,
  dense: false,
  avatarColor: '#6b7280'
})

const emit = defineEmits<ListItemAvatarEmits>()

const imageError = ref(false)

const handleImageError = (event: Event) => {
  imageError.value = true
  emit('error', event)
}

// イニシャルを生成するヘルパー関数
// const generateInitials = (name: string): string => {
//   return name
//     .split(' ')
//     .map(word => word.charAt(0))
//     .join('')
//     .toUpperCase()
//     .slice(0, 2)
// }

// ランダムな色を生成
// const generateAvatarColor = (text: string): string => {
//   const colors = [
//     '#ef4444', '#f97316', '#eab308', '#22c55e',
//     '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
//   ]
//   const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
//   return colors[hash % colors.length]
// }
</script>
