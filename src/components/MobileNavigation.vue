<template>
  <div class="mobile-navigation">
    <!-- モバイルヘッダー -->
    <header class="mobile-header">
      <div class="header-content">
        <!-- ブランドロゴ -->
        <div class="brand">
          <div class="logo">
            <span class="logo-icon">🏢</span>
            <span class="logo-text">Virtual Office</span>
          </div>
        </div>

        <!-- ヘッダーアクション -->
        <div class="header-actions">
          <!-- 通知ボタン -->
          <button @click="toggleNotifications" class="action-btn notification-btn" :class="{ active: showNotifications }">
            <span class="btn-icon">🔔</span>
            <span v-if="notificationCount > 0" class="notification-badge">{{ notificationCount }}</span>
          </button>

          <!-- メニューボタン -->
          <button @click="toggleMenu" class="action-btn menu-btn" :class="{ active: showMenu }">
            <span class="hamburger" :class="{ active: showMenu }">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>
      </div>
    </header>

    <!-- モバイルメニュー -->
    <nav class="mobile-menu" :class="{ active: showMenu }" @click="closeMenu">
      <div class="menu-content" @click.stop>
        <!-- ユーザープロフィール -->
        <div class="user-profile">
          <div class="profile-avatar">
            <div class="avatar" :style="{ backgroundColor: userColor }">
              {{ userName.charAt(0) }}
            </div>
            <div class="status-indicator" :class="userStatus"></div>
          </div>
          <div class="profile-info">
            <h3 class="profile-name">{{ userName }}</h3>
            <p class="profile-status">{{ getStatusText(userStatus) }}</p>
          </div>
        </div>

        <!-- メニューアイテム -->
        <div class="menu-items">
          <button
            v-for="item in menuItems"
            :key="item.id"
            @click="selectMenuItem(item)"
            class="menu-item"
            :class="{ active: currentView === item.id }"
          >
            <span class="item-icon">{{ item.icon }}</span>
            <span class="item-label">{{ item.label }}</span>
            <span v-if="item.badge" class="item-badge">{{ item.badge }}</span>
          </button>
        </div>

        <!-- クイックアクション -->
        <div class="quick-actions">
          <h4 class="section-title">クイックアクション</h4>
          <div class="action-grid">
            <button @click="toggleAudio" class="quick-action" :class="{ active: isAudioEnabled }">
              <span class="action-icon">{{ isAudioEnabled ? '🎤' : '🔇' }}</span>
              <span class="action-label">音声</span>
            </button>
            <button @click="toggleVideo" class="quick-action" :class="{ active: isVideoEnabled }">
              <span class="action-icon">{{ isVideoEnabled ? '📹' : '📷' }}</span>
              <span class="action-label">ビデオ</span>
            </button>
            <button @click="toggleChat" class="quick-action" :class="{ active: isChatOpen }">
              <span class="action-icon">💬</span>
              <span class="action-label">チャット</span>
            </button>
            <button @click="toggleSettings" class="quick-action">
              <span class="action-icon">⚙️</span>
              <span class="action-label">設定</span>
            </button>
          </div>
        </div>

        <!-- ログアウト -->
        <div class="menu-footer">
          <button @click="logout" class="logout-btn">
            <span class="btn-icon">🚪</span>
            <span class="btn-text">ログアウト</span>
          </button>
        </div>
      </div>
    </nav>

    <!-- 通知パネル -->
    <div class="notification-panel" :class="{ active: showNotifications }" @click="closeNotifications">
      <div class="panel-content" @click.stop>
        <div class="panel-header">
          <h3>通知</h3>
          <button @click="closeNotifications" class="close-btn">✕</button>
        </div>
        <div class="notification-list">
          <div
            v-for="notification in notifications"
            :key="notification.id"
            class="notification-item"
            :class="notification.type"
            @click="handleNotificationClick(notification)"
          >
            <div class="notification-icon">
              {{ getNotificationIcon(notification.type) }}
            </div>
            <div class="notification-content">
              <h4 class="notification-title">{{ notification.title }}</h4>
              <p class="notification-message">{{ notification.message }}</p>
              <span class="notification-time">{{ formatTime(notification.timestamp) }}</span>
            </div>
          </div>
          <div v-if="notifications.length === 0" class="empty-state">
            <span class="empty-icon">🔔</span>
            <p class="empty-text">通知はありません</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ボトムナビゲーション -->
    <nav class="bottom-navigation">
      <button
        v-for="item in bottomNavItems"
        :key="item.id"
        @click="selectBottomNavItem(item)"
        class="bottom-nav-item"
        :class="{ active: currentView === item.id }"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span class="nav-label">{{ item.label }}</span>
        <span v-if="item.badge" class="nav-badge">{{ item.badge }}</span>
      </button>
    </nav>

    <!-- フローティングアクションボタン -->
    <div class="floating-actions">
      <button @click="toggleFab" class="fab-main" :class="{ active: showFab }">
        <span class="fab-icon">{{ showFab ? '✕' : '➕' }}</span>
      </button>
      <div class="fab-menu" :class="{ active: showFab }">
        <button @click="startVideoCall" class="fab-item">
          <span class="fab-icon">📞</span>
          <span class="fab-label">通話開始</span>
        </button>
        <button @click="shareScreen" class="fab-item">
          <span class="fab-icon">📺</span>
          <span class="fab-label">画面共有</span>
        </button>
        <button @click="openWhiteboard" class="fab-item">
          <span class="fab-icon">📝</span>
          <span class="fab-label">ホワイトボード</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

// 型定義
interface MenuItem {
  id: string
  label: string
  icon: string
  badge?: string
}

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
}

// Props
interface Props {
  currentView: string
  userName: string
  userColor: string
  userStatus: 'online' | 'busy' | 'away' | 'offline'
  isAudioEnabled: boolean
  isVideoEnabled: boolean
  isChatOpen: boolean
  notifications: Notification[]
}

const props = withDefaults(defineProps<Props>(), {
  currentView: 'threejs-office',
  userName: 'ユーザー',
  userColor: '#6366f1',
  userStatus: 'online',
  isAudioEnabled: true,
  isVideoEnabled: false,
  isChatOpen: false,
  notifications: () => []
})

// Emits
const emit = defineEmits<{
  viewChange: [view: string]
  audioToggle: []
  videoToggle: []
  chatToggle: []
  settingsToggle: []
  logout: []
  startVideoCall: []
  shareScreen: []
  openWhiteboard: []
  notificationClick: [notification: Notification]
}>()

// リアクティブ状態
const showMenu = ref(false)
const showNotifications = ref(false)
const showFab = ref(false)

// 通知カウント
const notificationCount = computed(() => props.notifications.length)

// メニューアイテム
const menuItems: MenuItem[] = [
  { id: 'threejs-office', label: '3Dオフィス', icon: '🏢' },
  { id: 'virtual-office', label: '2Dオフィス', icon: '🏠' },
  { id: 'whiteboard', label: 'ホワイトボード', icon: '📝' },
  { id: 'social', label: 'ソーシャル', icon: '👥' },
  { id: 'customizer', label: 'カスタマイズ', icon: '🎨' },
  { id: 'analytics', label: '分析', icon: '📊' }
]

// ボトムナビゲーション
const bottomNavItems: MenuItem[] = [
  { id: 'threejs-office', label: 'ホーム', icon: '🏢' },
  { id: 'chat', label: 'チャット', icon: '💬', badge: props.notifications.filter(n => n.type === 'info').length.toString() },
  { id: 'video-call', label: '通話', icon: '📞' },
  { id: 'social', label: 'ソーシャル', icon: '👥' },
  { id: 'profile', label: 'プロフィール', icon: '👤' }
]

// メソッド
const toggleMenu = () => {
  showMenu.value = !showMenu.value
  if (showMenu.value) {
    showNotifications.value = false
    showFab.value = false
  }
}

const closeMenu = () => {
  showMenu.value = false
}

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) {
    showMenu.value = false
    showFab.value = false
  }
}

const closeNotifications = () => {
  showNotifications.value = false
}

const toggleFab = () => {
  showFab.value = !showFab.value
  if (showFab.value) {
    showMenu.value = false
    showNotifications.value = false
  }
}

const selectMenuItem = (item: MenuItem) => {
  emit('viewChange', item.id)
  closeMenu()
}

const selectBottomNavItem = (item: MenuItem) => {
  emit('viewChange', item.id)
}

const toggleAudio = () => {
  emit('audioToggle')
}

const toggleVideo = () => {
  emit('videoToggle')
}

const toggleChat = () => {
  emit('chatToggle')
}

const toggleSettings = () => {
  emit('settingsToggle')
}

const logout = () => {
  emit('logout')
  closeMenu()
}

const startVideoCall = () => {
  emit('startVideoCall')
  showFab.value = false
}

const shareScreen = () => {
  emit('shareScreen')
  showFab.value = false
}

const openWhiteboard = () => {
  emit('openWhiteboard')
  showFab.value = false
}

const handleNotificationClick = (notification: Notification) => {
  emit('notificationClick', notification)
  closeNotifications()
}

const getStatusText = (status: string) => {
  const statusMap = {
    online: 'オンライン',
    busy: '取り込み中',
    away: '離席中',
    offline: 'オフライン'
  }
  return statusMap[status as keyof typeof statusMap] || 'オンライン'
}

const getNotificationIcon = (type: string) => {
  const iconMap = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  }
  return iconMap[type as keyof typeof iconMap] || 'ℹ️'
}

const formatTime = (timestamp: Date) => {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}日前`
  if (hours > 0) return `${hours}時間前`
  if (minutes > 0) return `${minutes}分前`
  return '今'
}

// キーボードショートカット
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    showMenu.value = false
    showNotifications.value = false
    showFab.value = false
  }
}

// ライフサイクル
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.mobile-navigation {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  pointer-events: none;
  font-family: var(--font-family-primary);
}

.mobile-navigation > * {
  pointer-events: auto;
}

/* モバイルヘッダー */
.mobile-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border-color);
  z-index: 1010;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-4);
  height: 100%;
}

.brand {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.logo-icon {
  font-size: 24px;
}

.logo-text {
  font-size: var(--text-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.action-btn {
  position: relative;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: var(--radius-lg);
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-normal);
}

.action-btn:hover {
  background: var(--color-gray-100);
}

.action-btn.active {
  background: var(--color-primary);
  color: white;
}

.notification-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: var(--color-error);
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-xs);
  font-weight: var(--font-weight-bold);
}

/* ハンバーガーメニュー */
.hamburger {
  width: 20px;
  height: 20px;
  position: relative;
  cursor: pointer;
}

.hamburger span {
  display: block;
  position: absolute;
  height: 2px;
  width: 100%;
  background: currentColor;
  border-radius: 1px;
  transition: all var(--transition-normal);
}

.hamburger span:nth-child(1) {
  top: 0;
}

.hamburger span:nth-child(2) {
  top: 50%;
  transform: translateY(-50%);
}

.hamburger span:nth-child(3) {
  bottom: 0;
}

.hamburger.active span:nth-child(1) {
  top: 50%;
  transform: translateY(-50%) rotate(45deg);
}

.hamburger.active span:nth-child(2) {
  opacity: 0;
}

.hamburger.active span:nth-child(3) {
  bottom: 50%;
  transform: translateY(50%) rotate(-45deg);
}

/* モバイルメニュー */
.mobile-menu {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 1020;
  opacity: 0;
  visibility: hidden;
  transition: all var(--transition-normal);
}

.mobile-menu.active {
  opacity: 1;
  visibility: visible;
}

.menu-content {
  position: absolute;
  top: 0;
  right: 0;
  width: 320px;
  max-width: 85vw;
  height: 100%;
  background: white;
  transform: translateX(100%);
  transition: transform var(--transition-normal);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.mobile-menu.active .menu-content {
  transform: translateX(0);
}

/* ユーザープロフィール */
.user-profile {
  padding: var(--spacing-6) var(--spacing-4);
  background: var(--bg-creative);
  color: white;
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.profile-avatar {
  position: relative;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: var(--text-xl);
  font-weight: var(--font-weight-bold);
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.status-indicator {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid white;
}

.status-indicator.online {
  background: var(--color-success);
}

.status-indicator.busy {
  background: var(--color-error);
}

.status-indicator.away {
  background: var(--color-warning);
}

.status-indicator.offline {
  background: var(--color-gray-400);
}

.profile-info {
  flex: 1;
}

.profile-name {
  margin: 0;
  font-size: var(--text-lg);
  font-weight: var(--font-weight-bold);
}

.profile-status {
  margin: 0;
  font-size: var(--text-sm);
  opacity: 0.9;
}

/* メニューアイテム */
.menu-items {
  flex: 1;
  padding: var(--spacing-4) 0;
}

.menu-item {
  width: 100%;
  padding: var(--spacing-3) var(--spacing-4);
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  font-size: var(--text-base);
  color: var(--text-primary);
  transition: all var(--transition-normal);
  position: relative;
}

.menu-item:hover {
  background: var(--color-gray-100);
}

.menu-item.active {
  background: rgba(99, 102, 241, 0.1);
  color: var(--color-primary);
}

.menu-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--color-primary);
}

.item-icon {
  font-size: var(--text-xl);
  width: 24px;
  text-align: center;
}

.item-label {
  flex: 1;
  text-align: left;
}

.item-badge {
  background: var(--color-primary);
  color: white;
  border-radius: var(--radius-full);
  padding: var(--spacing-1) var(--spacing-2);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-bold);
}

/* クイックアクション */
.quick-actions {
  padding: var(--spacing-4);
  border-top: 1px solid var(--border-color);
}

.section-title {
  margin: 0 0 var(--spacing-3) 0;
  font-size: var(--text-sm);
  font-weight: var(--font-weight-bold);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-2);
}

.quick-action {
  padding: var(--spacing-3);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  background: white;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-1);
  transition: all var(--transition-normal);
}

.quick-action:hover {
  background: var(--color-gray-50);
  border-color: var(--color-primary);
}

.quick-action.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.action-icon {
  font-size: var(--text-lg);
}

.action-label {
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
}

/* メニューフッター */
.menu-footer {
  padding: var(--spacing-4);
  border-top: 1px solid var(--border-color);
}

.logout-btn {
  width: 100%;
  padding: var(--spacing-3);
  border: 1px solid var(--color-error);
  border-radius: var(--radius-lg);
  background: white;
  color: var(--color-error);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-normal);
}

.logout-btn:hover {
  background: var(--color-error);
  color: white;
}

/* 通知パネル */
.notification-panel {
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 1015;
  opacity: 0;
  visibility: hidden;
  transition: all var(--transition-normal);
}

.notification-panel.active {
  opacity: 1;
  visibility: visible;
}

.panel-content {
  background: white;
  height: 100%;
  transform: translateY(-100%);
  transition: transform var(--transition-normal);
  display: flex;
  flex-direction: column;
}

.notification-panel.active .panel-content {
  transform: translateY(0);
}

.panel-header {
  padding: var(--spacing-4);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-header h3 {
  margin: 0;
  font-size: var(--text-lg);
  font-weight: var(--font-weight-bold);
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: var(--color-gray-100);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-normal);
}

.close-btn:hover {
  background: var(--color-gray-200);
}

.notification-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-2);
}

.notification-item {
  padding: var(--spacing-3);
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-2);
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-3);
  cursor: pointer;
  transition: all var(--transition-normal);
  border: 1px solid var(--border-color);
}

.notification-item:hover {
  background: var(--color-gray-50);
}

.notification-item.info {
  border-left: 4px solid var(--color-info);
}

.notification-item.success {
  border-left: 4px solid var(--color-success);
}

.notification-item.warning {
  border-left: 4px solid var(--color-warning);
}

.notification-item.error {
  border-left: 4px solid var(--color-error);
}

.notification-icon {
  font-size: var(--text-lg);
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
}

.notification-title {
  margin: 0 0 var(--spacing-1) 0;
  font-size: var(--text-sm);
  font-weight: var(--font-weight-bold);
}

.notification-message {
  margin: 0 0 var(--spacing-2) 0;
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: 1.4;
}

.notification-time {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-8) var(--spacing-4);
  color: var(--text-muted);
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: var(--spacing-4);
}

.empty-text {
  margin: 0;
  font-size: var(--text-base);
}

/* ボトムナビゲーション */
.bottom-navigation {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: var(--spacing-2) 0;
  z-index: 1010;
}

.bottom-nav-item {
  flex: 1;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-1);
  padding: var(--spacing-2);
  transition: all var(--transition-normal);
  position: relative;
  color: var(--text-muted);
}

.bottom-nav-item:hover {
  color: var(--color-primary);
}

.bottom-nav-item.active {
  color: var(--color-primary);
}

.nav-icon {
  font-size: var(--text-lg);
}

.nav-label {
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
}

.nav-badge {
  position: absolute;
  top: 4px;
  right: 20%;
  background: var(--color-error);
  color: white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: var(--font-weight-bold);
}

/* フローティングアクションボタン */
.floating-actions {
  position: fixed;
  bottom: 100px;
  right: var(--spacing-4);
  z-index: 1030;
}

.fab-main {
  width: 56px;
  height: 56px;
  border: none;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-lg);
  transition: all var(--transition-normal);
  font-size: var(--text-xl);
}

.fab-main:hover {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-xl);
}

.fab-main.active {
  transform: rotate(45deg);
}

.fab-menu {
  position: absolute;
  bottom: 70px;
  right: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  opacity: 0;
  visibility: hidden;
  transform: translateY(20px);
  transition: all var(--transition-normal);
}

.fab-menu.active {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.fab-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-3);
  border: none;
  border-radius: var(--radius-lg);
  background: white;
  color: var(--text-primary);
  cursor: pointer;
  box-shadow: var(--shadow-md);
  transition: all var(--transition-normal);
  white-space: nowrap;
}

.fab-item:hover {
  background: var(--color-gray-50);
  transform: translateY(-1px);
  box-shadow: var(--shadow-lg);
}

.fab-icon {
  font-size: var(--text-base);
}

.fab-label {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
}

/* スクロールバーのスタイル */
.menu-content::-webkit-scrollbar,
.notification-list::-webkit-scrollbar {
  width: 4px;
}

.menu-content::-webkit-scrollbar-track,
.notification-list::-webkit-scrollbar-track {
  background: var(--color-gray-100);
}

.menu-content::-webkit-scrollbar-thumb,
.notification-list::-webkit-scrollbar-thumb {
  background: var(--color-gray-300);
  border-radius: 2px;
}

/* レスポンシブ調整 */
@media (max-width: 374px) {
  .menu-content {
    width: 100vw;
    max-width: none;
  }

  .bottom-navigation {
    height: 70px;
  }

  .nav-label {
    font-size: 10px;
  }

  .fab-main {
    width: 50px;
    height: 50px;
    font-size: var(--text-lg);
  }
}

/* ダークモード対応 */
@media (prefers-color-scheme: dark) {
  .mobile-header,
  .bottom-navigation {
    background: rgba(15, 23, 42, 0.95);
    border-color: var(--color-gray-700);
  }

  .menu-content,
  .panel-content {
    background: var(--color-gray-900);
    color: var(--color-gray-100);
  }

  .quick-action {
    background: var(--color-gray-800);
    border-color: var(--color-gray-700);
  }

  .fab-item {
    background: var(--color-gray-800);
    color: var(--color-gray-100);
  }
}
</style>
