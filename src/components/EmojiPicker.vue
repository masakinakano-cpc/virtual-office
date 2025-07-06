<template>
  <div class="emoji-picker" v-if="isOpen">
    <div class="emoji-picker-overlay" @click="close"></div>
    <div class="emoji-picker-content">
      <!-- ヘッダー -->
      <div class="emoji-picker-header">
        <h3 class="emoji-picker-title">絵文字を選択</h3>
        <button @click="close" class="emoji-picker-close">×</button>
      </div>

      <!-- 検索バー -->
      <div class="emoji-picker-search">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="絵文字を検索..."
          class="emoji-search-input"
        />
      </div>

      <!-- スキントーン選択 -->
      <div class="emoji-picker-skin-tones" v-if="showSkinTones">
        <div class="skin-tone-label">スキントーン:</div>
        <div class="skin-tone-options">
          <button
            @click="selectedSkinTone = ''"
            :class="{ active: selectedSkinTone === '' }"
            class="skin-tone-btn default"
          >
            👋
          </button>
          <button
            v-for="tone in skinTones"
            :key="tone.code"
            @click="selectedSkinTone = tone.code"
            :class="{ active: selectedSkinTone === tone.code }"
            class="skin-tone-btn"
          >
            {{ convertToUnicode('1F44B-' + tone.code) }}
          </button>
        </div>
      </div>

      <!-- カテゴリータブ -->
      <div class="emoji-picker-categories">
        <button
          v-for="category in categories"
          :key="category"
          @click="selectedCategory = category"
          :class="{ active: selectedCategory === category }"
          class="category-btn"
        >
          {{ getCategoryIcon(category) }}
          <span class="category-name">{{ category }}</span>
        </button>
      </div>

      <!-- 絵文字グリッド -->
      <div class="emoji-picker-grid">
        <button
          v-for="emoji in searchEmojis"
          :key="emoji.code"
          @click="selectEmoji(emoji)"
          class="emoji-btn"
          :title="emoji.name"
        >
          {{ emojiToText(emoji) }}
        </button>
      </div>

      <!-- 空の状態 -->
      <div v-if="searchEmojis.length === 0" class="emoji-picker-empty">
        <p>絵文字が見つかりません</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useEmojiSystem, type EmojiData } from '@/composables/useEmojiSystem'

interface Props {
  isOpen: boolean
  showSkinTones?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'select', emoji: string): void
}

withDefaults(defineProps<Props>(), {
  showSkinTones: true
})

const emit = defineEmits<Emits>()

const {
  searchQuery,
  selectedCategory,
  selectedSkinTone,
  searchEmojis,
  categories,
  skinTones,
  convertToUnicode,
  emojiToText
} = useEmojiSystem()

// カテゴリーアイコンを取得
const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    'Smileys & Emotion': '😀',
    'People & Body': '👋',
    'Activities': '⚽',
    'Objects': '💻',
    'Animals & Nature': '🐶',
    'Food & Drink': '🍎',
    'Travel & Places': '🚗',
    'Symbols': '❤️',
    'Flags': '🏳️'
  }
  return icons[category] || '📁'
}

// 絵文字選択
const selectEmoji = (emoji: EmojiData) => {
  const emojiText = emojiToText(emoji)
  emit('select', emojiText)
}

// 閉じる
const close = () => {
  emit('close')
}

// 検索クエリがある場合はカテゴリーを無効化
// const isSearchMode = computed(() => searchQuery.value.length > 0)

// 検索時はカテゴリーをリセット
watch(searchQuery, (newQuery) => {
  if (newQuery && selectedCategory.value) {
    // 検索モードではカテゴリーフィルターを無効化
  }
})
</script>

<style scoped>
.emoji-picker {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.emoji-picker-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.emoji-picker-content {
  position: relative;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  width: 400px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.emoji-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.emoji-picker-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.emoji-picker-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.emoji-picker-close:hover {
  background: #f3f4f6;
  color: #374151;
}

.emoji-picker-search {
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.emoji-search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.emoji-search-input:focus {
  border-color: #3b82f6;
}

.emoji-picker-skin-tones {
  padding: 12px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.skin-tone-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
}

.skin-tone-options {
  display: flex;
  gap: 4px;
}

.skin-tone-btn {
  background: none;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}

.skin-tone-btn:hover {
  background: #f3f4f6;
}

.skin-tone-btn.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.skin-tone-btn.default.active {
  background: #f3f4f6;
  border-color: #6b7280;
  color: #374151;
}

.emoji-picker-categories {
  display: flex;
  overflow-x: auto;
  padding: 8px 20px;
  border-bottom: 1px solid #e5e7eb;
  gap: 4px;
}

.category-btn {
  background: none;
  border: none;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  font-size: 14px;
  transition: all 0.2s;
}

.category-btn:hover {
  background: #f3f4f6;
}

.category-btn.active {
  background: #3b82f6;
  color: white;
}

.category-name {
  font-size: 12px;
}

.emoji-picker-grid {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
  gap: 4px;
  max-height: 300px;
}

.emoji-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  border-radius: 6px;
  font-size: 20px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
}

.emoji-btn:hover {
  background: #f3f4f6;
  transform: scale(1.1);
}

.emoji-picker-empty {
  padding: 40px 20px;
  text-align: center;
  color: #6b7280;
}

.emoji-picker-empty p {
  margin: 0;
  font-size: 14px;
}

/* スクロールバーのスタイル */
.emoji-picker-categories::-webkit-scrollbar,
.emoji-picker-grid::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

.emoji-picker-categories::-webkit-scrollbar-track,
.emoji-picker-grid::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.emoji-picker-categories::-webkit-scrollbar-thumb,
.emoji-picker-grid::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.emoji-picker-categories::-webkit-scrollbar-thumb:hover,
.emoji-picker-grid::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
