<template>
  <div class="location-share">
    <!-- 位置情報共有ボタン -->
    <div class="location-share-controls">
      <button
        @click="shareLocation"
        :disabled="!canShare"
        class="share-btn"
        :class="{ active: isSharing }"
      >
        <svg class="share-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        <span>位置を共有</span>
      </button>

      <button
        @click="copyLocationUrl"
        :disabled="!currentLocationUrl"
        class="copy-btn"
        :class="{ copied: isCopied }"
      >
        <svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
        <span>{{ isCopied ? 'コピー済み' : 'URLをコピー' }}</span>
      </button>
    </div>

    <!-- 現在位置表示 -->
    <div v-if="currentUser" class="current-location">
      <div class="location-info">
        <h4>現在の位置</h4>
        <p>座標: ({{ currentUser.x }}, {{ currentUser.y }})</p>
        <p v-if="currentUser.nickname">ユーザー: {{ currentUser.nickname }}</p>
      </div>

      <div v-if="currentLocationUrl" class="location-url">
        <label>共有URL:</label>
        <input
          :value="currentLocationUrl"
          readonly
          class="url-input"
          @click="selectUrl"
          ref="urlInput"
        />
      </div>
    </div>

    <!-- 近くのユーザー -->
    <div v-if="nearbyUsers.length > 0" class="nearby-users">
      <h4>近くのユーザー</h4>
      <div class="user-list">
        <div
          v-for="user in nearbyUsers"
          :key="user.id"
          class="user-item"
          @click="goToUser(user)"
        >
          <div class="user-avatar">
            {{ user.nickname?.[0] || 'U' }}
          </div>
          <div class="user-info">
            <div class="user-name">{{ user.nickname || `User-${user.id.slice(-4)}` }}</div>
            <div class="user-distance">{{ Math.round(calculateDistance(currentUser!, user)) }}px</div>
          </div>
          <button
            @click.stop="shareUserLocation(user)"
            class="share-user-btn"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
              <polyline points="16,6 12,2 8,6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 位置共有メッセージ入力 -->
    <div v-if="showMessageInput" class="message-input-container">
      <div class="message-input-overlay" @click="showMessageInput = false"></div>
      <div class="message-input-content">
        <h4>位置共有メッセージ</h4>
        <textarea
          v-model="shareMessage"
          placeholder="位置と一緒に共有するメッセージを入力..."
          class="message-textarea"
          rows="3"
        ></textarea>
        <div class="message-actions">
          <button @click="showMessageInput = false" class="cancel-btn">キャンセル</button>
          <button @click="confirmShare" class="confirm-btn">共有</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useLocationUrl, type WebRTCUser } from '@/composables/useLocationUrl'

interface Emits {
  (e: 'share', url: string): void
  (e: 'navigate', user: WebRTCUser): void
}

const emit = defineEmits<Emits>()

const {
  currentUser,
  // connectedUsers,
  shareCurrentLocation,
  calculateDistance,
  getNearbyUsers,
  updateUrlWithLocation
} = useLocationUrl()

const isSharing = ref(false)
const isCopied = ref(false)
const showMessageInput = ref(false)
const shareMessage = ref('')
const urlInput = ref<HTMLInputElement>()

// 共有可能かどうか
const canShare = computed(() => {
  return currentUser.value && currentUser.value.x !== undefined && currentUser.value.y !== undefined
})

// 現在位置のURL
const currentLocationUrl = computed(() => {
  return shareCurrentLocation(shareMessage.value || undefined)
})

// 近くのユーザー
const nearbyUsers = computed(() => {
  return getNearbyUsers(150) // 150px以内のユーザー
})

// 位置共有
const shareLocation = async () => {
  if (!canShare.value) return

  showMessageInput.value = true
}

// 共有確認
const confirmShare = async () => {
  if (!currentLocationUrl.value) return

  isSharing.value = true
  showMessageInput.value = false

  try {
    // URLを共有
    emit('share', currentLocationUrl.value)

    // ブラウザのURLも更新
    if (currentUser.value) {
      updateUrlWithLocation(currentUser.value.x, currentUser.value.y)
    }

    // 成功フィードバック
    await copyToClipboard(currentLocationUrl.value)

  } catch (error) {
    console.error('位置共有エラー:', error)
  } finally {
    isSharing.value = false
    shareMessage.value = ''
  }
}

// URLをコピー
const copyLocationUrl = async () => {
  if (!currentLocationUrl.value) return

  try {
    await copyToClipboard(currentLocationUrl.value)
  } catch (error) {
    console.error('コピーエラー:', error)
  }
}

// クリップボードにコピー
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    isCopied.value = true
    setTimeout(() => {
      isCopied.value = false
    }, 2000)
  } catch (error) {
    // フォールバック: input要素を使用
    if (urlInput.value) {
      urlInput.value.value = text
      urlInput.value.select()
      document.execCommand('copy')
      isCopied.value = true
      setTimeout(() => {
        isCopied.value = false
      }, 2000)
    }
  }
}

// URL入力フィールドを選択
const selectUrl = () => {
  if (urlInput.value) {
    urlInput.value.select()
  }
}

// ユーザーの位置に移動
const goToUser = (user: WebRTCUser) => {
  emit('navigate', user)
}

// ユーザーの位置を共有
const shareUserLocation = (user: WebRTCUser) => {
  const url = `${window.location.origin}#@${user.x},${user.y}`
  emit('share', url)
  copyToClipboard(url)
}
</script>

<style scoped>
.location-share {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 20px;
  max-width: 400px;
}

.location-share-controls {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.share-btn,
.copy-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.share-btn {
  background: #3b82f6;
  color: white;
}

.share-btn:hover:not(:disabled) {
  background: #2563eb;
}

.share-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

.share-btn.active {
  background: #10b981;
}

.copy-btn {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.copy-btn:hover:not(:disabled) {
  background: #e5e7eb;
}

.copy-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.copy-btn.copied {
  background: #10b981;
  color: white;
  border-color: #10b981;
}

.share-icon,
.copy-icon {
  width: 18px;
  height: 18px;
}

.current-location {
  margin-bottom: 20px;
}

.location-info {
  margin-bottom: 16px;
}

.location-info h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.location-info p {
  margin: 4px 0;
  font-size: 14px;
  color: #6b7280;
}

.location-url {
  margin-top: 12px;
}

.location-url label {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: 500;
  color: #374151;
}

.url-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 12px;
  font-family: monospace;
  background: #f9fafb;
  color: #6b7280;
  cursor: pointer;
}

.url-input:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
}

.nearby-users h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.user-item:hover {
  background: #f3f4f6;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
}

.user-info {
  flex: 1;
}

.user-name {
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 2px;
}

.user-distance {
  font-size: 12px;
  color: #6b7280;
}

.share-user-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  border-radius: 6px;
  color: #6b7280;
  transition: all 0.2s;
}

.share-user-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.share-user-btn svg {
  width: 16px;
  height: 16px;
}

.message-input-container {
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

.message-input-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.message-input-content {
  position: relative;
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.message-input-content h4 {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.message-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  min-height: 80px;
  outline: none;
  transition: border-color 0.2s;
}

.message-textarea:focus {
  border-color: #3b82f6;
}

.message-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  justify-content: flex-end;
}

.cancel-btn,
.confirm-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: #f3f4f6;
  color: #374151;
}

.cancel-btn:hover {
  background: #e5e7eb;
}

.confirm-btn {
  background: #3b82f6;
  color: white;
}

.confirm-btn:hover {
  background: #2563eb;
}
</style>
