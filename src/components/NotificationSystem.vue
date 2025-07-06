<template>
  <div class="notification-system">
    <!-- 通知センター -->
    <div v-if="showNotificationCenter" class="notification-center">
      <div class="notification-header">
        <h3>🔔 通知センター</h3>
        <div class="notification-actions">
          <button @click="markAllAsRead" class="btn-text">全て既読</button>
          <button @click="clearAll" class="btn-text">全て削除</button>
          <button @click="showNotificationCenter = false" class="close-btn">✕</button>
        </div>
      </div>

      <div class="notification-filters">
        <button
          v-for="filter in filters"
          :key="filter.id"
          @click="activeFilter = filter.id"
          :class="{ active: activeFilter === filter.id }"
          class="filter-btn"
        >
          {{ filter.icon }} {{ filter.label }}
        </button>
      </div>

      <div class="notification-list">
        <div
          v-for="notification in filteredNotifications"
          :key="notification.id"
          :class="{ unread: !notification.read }"
          class="notification-item"
          @click="handleNotificationClick(notification)"
        >
          <div class="notification-icon">{{ notification.icon }}</div>
          <div class="notification-content">
            <div class="notification-title">{{ notification.title }}</div>
            <div class="notification-message">{{ notification.message }}</div>
            <div class="notification-time">{{ formatTime(notification.timestamp) }}</div>
          </div>
          <div class="notification-badge" v-if="!notification.read"></div>
        </div>
      </div>
    </div>

    <!-- トースト通知 -->
    <div class="toast-container">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="[`toast-${toast.type}`, { 'toast-entering': toast.entering }]"
        class="toast"
      >
        <div class="toast-icon">{{ getToastIcon(toast.type) }}</div>
        <div class="toast-content">
          <div class="toast-title">{{ toast.title }}</div>
          <div class="toast-message">{{ toast.message }}</div>
        </div>
        <button @click="dismissToast(toast.id)" class="toast-close">✕</button>
      </div>
    </div>

    <!-- 通知設定 -->
    <div v-if="showSettings" class="notification-settings">
      <div class="settings-header">
        <h3>⚙️ 通知設定</h3>
        <button @click="showSettings = false" class="close-btn">✕</button>
      </div>

      <div class="settings-content">
        <div class="setting-group">
          <label>
            <input v-model="settings.enabled" type="checkbox" />
            通知を有効にする
          </label>
        </div>

        <div class="setting-group">
          <label>
            <input v-model="settings.sound" type="checkbox" />
            通知音を再生
          </label>
        </div>

        <div class="setting-group">
          <label>
            <input v-model="settings.desktop" type="checkbox" />
            デスクトップ通知
          </label>
        </div>

        <div class="setting-group">
          <label>通知の表示時間</label>
          <select v-model="settings.duration">
            <option value="3000">3秒</option>
            <option value="5000">5秒</option>
            <option value="10000">10秒</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  icon: string
  timestamp: Date
  read: boolean
  category: string
  action?: () => void
}

interface Toast {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  entering: boolean
}

const showNotificationCenter = ref(false)
const showSettings = ref(false)
const activeFilter = ref('all')
const notifications = ref<Notification[]>([])
const toasts = ref<Toast[]>([])

const settings = ref({
  enabled: true,
  sound: true,
  desktop: true,
  duration: 5000
})

const filters = [
  { id: 'all', label: '全て', icon: '📋' },
  { id: 'meeting', label: '会議', icon: '📅' },
  { id: 'chat', label: 'チャット', icon: '💬' },
  { id: 'system', label: 'システム', icon: '⚙️' }
]

const filteredNotifications = computed(() => {
  if (activeFilter.value === 'all') {
    return notifications.value
  }
  return notifications.value.filter(n => n.category === activeFilter.value)
})

const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
  const newNotification: Notification = {
    ...notification,
    id: Date.now().toString(),
    timestamp: new Date(),
    read: false
  }

  notifications.value.unshift(newNotification)

  // トースト表示
  showToast({
    title: notification.title,
    message: notification.message,
    type: notification.type
  })

  // デスクトップ通知
  if (settings.value.desktop && 'Notification' in window) {
    new Notification(notification.title, {
      body: notification.message,
      icon: '/favicon.ico'
    })
  }

  // 通知音
  if (settings.value.sound) {
    playNotificationSound(notification.type)
  }
}

const showToast = (toast: Omit<Toast, 'id' | 'entering'>) => {
  const newToast: Toast = {
    ...toast,
    id: Date.now().toString(),
    entering: true
  }

  toasts.value.push(newToast)

  setTimeout(() => {
    newToast.entering = false
  }, 100)

  setTimeout(() => {
    dismissToast(newToast.id)
  }, settings.value.duration)
}

const dismissToast = (id: string) => {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index > -1) {
    toasts.value.splice(index, 1)
  }
}

const markAllAsRead = () => {
  notifications.value.forEach(n => n.read = true)
}

const clearAll = () => {
  notifications.value = []
}

const handleNotificationClick = (notification: Notification) => {
  notification.read = true
  if (notification.action) {
    notification.action()
  }
}

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('ja-JP', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const getToastIcon = (type: string) => {
  const icons: Record<string, string> = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  }
  return icons[type] || 'ℹ️'
}

const playNotificationSound = (type: string) => {
  if (!settings.value.sound) return

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    const audioContext = new AudioContextClass()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    const frequencies: Record<string, number> = {
      info: 800,
      success: 600,
      warning: 900,
      error: 400
    }

    oscillator.frequency.value = frequencies[type] || 800
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.5)
  } catch (error) {
    console.warn('音声再生に失敗しました:', error)
  }
}

// 初期化
onMounted(() => {
  // デスクトップ通知の許可を要求
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }

  // サンプル通知を追加
  setTimeout(() => {
    addNotification({
      title: '会議のリマインダー',
      message: '15分後に週次ミーティングが開始されます',
      type: 'info',
      icon: '📅',
      category: 'meeting'
    })
  }, 2000)
})

// 外部から呼び出し可能な関数をエクスポート
defineExpose({
  addNotification,
  showToast,
  showNotificationCenter: () => showNotificationCenter.value = true,
  showSettings: () => showSettings.value = true
})
</script>

<style scoped>
.notification-center {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 400px;
  max-height: 600px;
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  z-index: 1000;
  overflow: hidden;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-4);
  background: var(--bg-creative);
  color: white;
}

.notification-actions {
  display: flex;
  gap: var(--spacing-2);
  align-items: center;
}

.btn-text {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  font-size: var(--text-sm);
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  padding: var(--spacing-1);
}

.notification-filters {
  display: flex;
  padding: var(--spacing-2);
  gap: var(--spacing-1);
  background: var(--color-gray-50);
  border-bottom: 1px solid var(--color-gray-200);
}

.filter-btn {
  background: none;
  border: none;
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-size: var(--text-sm);
  transition: var(--transition-fast);
}

.filter-btn.active {
  background: var(--color-primary);
  color: white;
}

.notification-list {
  max-height: 400px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: var(--spacing-3);
  border-bottom: 1px solid var(--color-gray-100);
  cursor: pointer;
  transition: var(--transition-fast);
  position: relative;
}

.notification-item:hover {
  background: var(--color-gray-50);
}

.notification-item.unread {
  background: rgba(255, 107, 107, 0.05);
}

.notification-icon {
  font-size: 1.5rem;
  margin-right: var(--spacing-3);
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-weight: 600;
  color: var(--color-gray-800);
  margin-bottom: var(--spacing-1);
}

.notification-message {
  color: var(--color-gray-600);
  font-size: var(--text-sm);
  margin-bottom: var(--spacing-1);
}

.notification-time {
  color: var(--color-gray-500);
  font-size: var(--text-xs);
}

.notification-badge {
  width: 8px;
  height: 8px;
  background: var(--color-primary);
  border-radius: 50%;
  position: absolute;
  top: var(--spacing-3);
  right: var(--spacing-3);
}

.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1100;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.toast {
  display: flex;
  align-items: center;
  padding: var(--spacing-3);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  min-width: 300px;
  max-width: 400px;
  animation: slideInRight 0.3s ease-out;
}

.toast-info {
  background: #e3f2fd;
  border-left: 4px solid #2196f3;
}

.toast-success {
  background: #e8f5e8;
  border-left: 4px solid #4caf50;
}

.toast-warning {
  background: #fff3e0;
  border-left: 4px solid #ff9800;
}

.toast-error {
  background: #ffebee;
  border-left: 4px solid #f44336;
}

.toast-icon {
  font-size: 1.2rem;
  margin-right: var(--spacing-3);
}

.toast-content {
  flex: 1;
}

.toast-title {
  font-weight: 600;
  margin-bottom: var(--spacing-1);
}

.toast-message {
  font-size: var(--text-sm);
  color: var(--color-gray-600);
}

.toast-close {
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0.7;
  margin-left: var(--spacing-2);
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .notification-center {
    width: calc(100vw - 40px);
    right: 20px;
    left: 20px;
  }

  .toast {
    width: calc(100vw - 40px);
    right: 20px;
    left: 20px;
  }
}
</style>
