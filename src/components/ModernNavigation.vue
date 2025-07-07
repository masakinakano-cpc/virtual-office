<template>
  <div class="modern-navigation">
    <!-- メインナビゲーションヘッダー -->
    <header class="nav-header" :class="{ 'nav-scrolled': isScrolled }">
      <div class="nav-container">
        <!-- ロゴ・ブランド -->
        <div class="nav-brand">
          <div class="brand-logo">🏢</div>
          <span class="brand-text">Virtual Office</span>
        </div>

        <!-- デスクトップナビゲーション -->
        <nav class="nav-desktop" v-if="!isMobile">
          <div class="nav-menu">
            <a
              v-for="item in mainNavItems"
              :key="item.id"
              href="#"
              class="nav-link"
              :class="{ 'active': activeNav === item.id }"
              @click="setActiveNav(item.id)"
            >
              <span class="nav-icon">{{ item.icon }}</span>
              <span class="nav-label">{{ item.label }}</span>
              <span v-if="item.badge" class="nav-badge">{{ item.badge }}</span>
            </a>
          </div>
        </nav>

        <!-- ユーザーメニュー -->
        <div class="nav-user" v-if="!isMobile">
          <button
            class="user-notifications"
            @click="toggleNotifications"
            :class="{ 'has-notifications': unreadCount > 0 }"
          >
            <span class="notification-icon">🔔</span>
            <span v-if="unreadCount > 0" class="notification-badge">{{ unreadCount }}</span>
          </button>

          <div class="user-profile" @click="toggleUserMenu">
            <img
              :src="user.avatar || '/default-avatar.png'"
              :alt="user.name"
              class="user-avatar"
            >
            <div class="user-info">
              <span class="user-name">{{ user.name }}</span>
              <span class="user-status">{{ user.status }}</span>
            </div>
            <span class="dropdown-arrow">▼</span>
          </div>
        </div>

        <!-- モバイルメニューボタン -->
        <button
          v-if="isMobile"
          class="mobile-menu-btn"
          @click="toggleMobileMenu"
          :class="{ 'active': showMobileMenu }"
        >
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
        </button>
      </div>

      <!-- 通知ドロップダウン -->
      <div
        v-if="showNotifications"
        class="notifications-dropdown"
        @click.stop
      >
        <div class="notifications-header">
          <h3>通知</h3>
          <button @click="markAllAsRead" class="mark-all-read">すべて既読</button>
        </div>
        <div class="notifications-list">
          <div
            v-for="notification in notifications"
            :key="notification.id"
            class="notification-item"
            :class="{ 'unread': !notification.read }"
          >
            <div class="notification-icon">{{ notification.icon }}</div>
            <div class="notification-content">
              <p class="notification-text">{{ notification.message }}</p>
              <span class="notification-time">{{ formatTime(notification.timestamp) }}</span>
            </div>
          </div>
        </div>
        <div class="notifications-footer">
          <a href="#" class="view-all-link">すべての通知を表示</a>
        </div>
      </div>

      <!-- ユーザーメニュードロップダウン -->
      <div
        v-if="showUserMenu"
        class="user-menu-dropdown"
        @click.stop
      >
        <div class="user-menu-header">
          <img :src="user.avatar" :alt="user.name" class="menu-avatar">
          <div class="menu-user-info">
            <span class="menu-user-name">{{ user.name }}</span>
            <span class="menu-user-email">{{ user.email }}</span>
          </div>
        </div>
        <div class="user-menu-items">
          <a
            v-for="item in userMenuItems"
            :key="item.id"
            href="#"
            class="user-menu-item"
            @click="handleUserMenuClick(item.action)"
          >
            <span class="menu-item-icon">{{ item.icon }}</span>
            <span class="menu-item-label">{{ item.label }}</span>
          </a>
        </div>
        <div class="user-menu-footer">
          <button class="logout-btn" @click="handleLogout">
            <span>🚪</span> ログアウト
          </button>
        </div>
      </div>
    </header>

    <!-- モバイルメニュー -->
    <div
      v-if="isMobile && showMobileMenu"
      class="mobile-menu-overlay"
      @click="closeMobileMenu"
    >
      <nav class="mobile-menu" @click.stop>
        <div class="mobile-menu-header">
          <div class="mobile-brand">
            <div class="brand-logo">🏢</div>
            <span class="brand-text">Virtual Office</span>
          </div>
          <button class="mobile-close-btn" @click="closeMobileMenu">✕</button>
        </div>

        <div class="mobile-user-info">
          <img :src="user.avatar" :alt="user.name" class="mobile-avatar">
          <div class="mobile-user-details">
            <span class="mobile-user-name">{{ user.name }}</span>
            <span class="mobile-user-status">{{ user.status }}</span>
          </div>
        </div>

        <div class="mobile-nav-items">
          <a
            v-for="item in mainNavItems"
            :key="item.id"
            href="#"
            class="mobile-nav-item"
            :class="{ 'active': activeNav === item.id }"
            @click="setActiveNav(item.id)"
          >
            <span class="mobile-nav-icon">{{ item.icon }}</span>
            <span class="mobile-nav-label">{{ item.label }}</span>
            <span v-if="item.badge" class="mobile-nav-badge">{{ item.badge }}</span>
          </a>
        </div>

        <div class="mobile-menu-footer">
          <div class="mobile-user-actions">
            <button class="mobile-action-btn">⚙️ 設定</button>
            <button class="mobile-action-btn">❓ ヘルプ</button>
            <button class="mobile-logout-btn" @click="handleLogout">🚪 ログアウト</button>
          </div>
        </div>
      </nav>
    </div>

    <!-- サブナビゲーション -->
    <div v-if="showSubNav" class="sub-navigation">
      <div class="sub-nav-container">
        <nav class="sub-nav-menu">
          <a
            v-for="item in currentSubNavItems"
            :key="item.id"
            href="#"
            class="sub-nav-item"
            :class="{ 'active': activeSubNav === item.id }"
            @click="setActiveSubNav(item.id)"
          >
            {{ item.label }}
          </a>
        </nav>
      </div>
    </div>

    <!-- ナビゲーション進捗インジケーター -->
    <div class="nav-progress" v-if="showProgress">
      <div class="progress-bar" :style="{ width: progressWidth + '%' }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'

interface NavItem {
  id: string
  label: string
  icon: string
  badge?: number
  subItems?: NavItem[]
}

interface User {
  name: string
  email: string
  avatar: string
  status: string
}

interface Notification {
  id: string
  icon: string
  message: string
  timestamp: Date
  read: boolean
}

// リアクティブデータ
const activeNav = ref('dashboard')
const activeSubNav = ref('')
const showNotifications = ref(false)
const showUserMenu = ref(false)
const showMobileMenu = ref(false)
const isScrolled = ref(false)
const isMobile = ref(window.innerWidth <= 768)
const unreadCount = ref(3)
const showProgress = ref(false)
const progressWidth = ref(0)

const user = reactive<User>({
  name: '田中太郎',
  email: 'tanaka@example.com',
  avatar: '👤',
  status: 'オンライン'
})

const mainNavItems = reactive<NavItem[]>([
  { id: 'dashboard', label: 'ダッシュボード', icon: '📊' },
  { id: 'workspace', label: 'ワークスペース', icon: '🏢' },
  { id: 'meetings', label: 'ミーティング', icon: '📹', badge: 2 },
  { id: 'chat', label: 'チャット', icon: '💬', badge: 5 },
  { id: 'files', label: 'ファイル', icon: '📁' },
  { id: 'analytics', label: '分析', icon: '📈' },
  { id: 'settings', label: '設定', icon: '⚙️' }
])

const userMenuItems = reactive([
  { id: 'profile', label: 'プロフィール', icon: '👤', action: 'profile' },
  { id: 'preferences', label: '設定', icon: '⚙️', action: 'preferences' },
  { id: 'help', label: 'ヘルプ', icon: '❓', action: 'help' }
])

const notifications = reactive<Notification[]>([
  {
    id: '1',
    icon: '📧',
    message: '新しいメッセージが届きました',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    read: false
  },
  {
    id: '2',
    icon: '📅',
    message: '明日のミーティングのリマインダー',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    read: false
  },
  {
    id: '3',
    icon: '🎉',
    message: 'プロジェクトが完了しました',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: true
  }
])

// 計算プロパティ
const showSubNav = computed(() => {
  return currentSubNavItems.value.length > 0
})

const currentSubNavItems = computed(() => {
  const currentItem = mainNavItems.find(item => item.id === activeNav.value)
  return currentItem?.subItems || []
})

// メソッド
const setActiveNav = (navId: string) => {
  activeNav.value = navId
  activeSubNav.value = ''
  if (isMobile.value) {
    closeMobileMenu()
  }

  // プログレス表示のシミュレーション
  showProgress.value = true
  progressWidth.value = 0

  const interval = setInterval(() => {
    progressWidth.value += 20
    if (progressWidth.value >= 100) {
      clearInterval(interval)
      setTimeout(() => {
        showProgress.value = false
        progressWidth.value = 0
      }, 200)
    }
  }, 50)
}

const setActiveSubNav = (subNavId: string) => {
  activeSubNav.value = subNavId
}

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value
  showUserMenu.value = false
}

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
  showNotifications.value = false
}

const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value
}

const closeMobileMenu = () => {
  showMobileMenu.value = false
}

const markAllAsRead = () => {
  notifications.forEach(notification => {
    notification.read = true
  })
  unreadCount.value = 0
}

const handleUserMenuClick = (action: string) => {
  console.log('ユーザーメニューアクション:', action)
  showUserMenu.value = false
}

const handleLogout = () => {
  console.log('ログアウト')
  showUserMenu.value = false
  showMobileMenu.value = false
}

const formatTime = (timestamp: Date): string => {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)

  if (minutes < 1) return 'たった今'
  if (minutes < 60) return `${minutes}分前`
  if (hours < 24) return `${hours}時間前`
  return timestamp.toLocaleDateString()
}

const handleScroll = () => {
  isScrolled.value = window.scrollY > 50
}

const handleResize = () => {
  isMobile.value = window.innerWidth <= 768
  if (!isMobile.value) {
    showMobileMenu.value = false
  }
}

const handleClickOutside = (event: Event) => {
  const target = event.target as Element
  if (!target.closest('.notifications-dropdown') && !target.closest('.user-notifications')) {
    showNotifications.value = false
  }
  if (!target.closest('.user-menu-dropdown') && !target.closest('.user-profile')) {
    showUserMenu.value = false
  }
}

// ライフサイクル
onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  window.addEventListener('resize', handleResize)
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.modern-navigation {
  position: relative;
  z-index: var(--z-fixed);
}

/* メインヘッダー */
.nav-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-color);
  transition: all var(--transition-normal);
  z-index: var(--z-fixed);
}

.nav-header.nav-scrolled {
  background: rgba(255, 255, 255, 0.98);
  box-shadow: var(--shadow-md);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-3) var(--spacing-4);
}

/* ブランド */
.nav-brand {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  text-decoration: none;
  color: var(--text-primary);
}

.brand-logo {
  font-size: var(--text-2xl);
  animation: float 3s ease-in-out infinite;
}

.brand-text {
  font-size: var(--text-xl);
  font-weight: var(--font-weight-bold);
  background: var(--bg-creative);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* デスクトップナビゲーション */
.nav-desktop {
  flex: 1;
  display: flex;
  justify-content: center;
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--radius-lg);
  text-decoration: none;
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-normal);
  position: relative;
}

.nav-link:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  transform: translateY(-1px);
}

.nav-link.active {
  background: var(--color-primary);
  color: var(--text-inverse);
  box-shadow: var(--shadow-md);
}

.nav-icon {
  font-size: var(--text-lg);
}

.nav-label {
  font-size: var(--text-sm);
  white-space: nowrap;
}

.nav-badge {
  background: var(--color-error);
  color: var(--text-inverse);
  font-size: var(--text-xs);
  padding: var(--spacing-1);
  border-radius: var(--radius-full);
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-bold);
}

/* ユーザーメニュー */
.nav-user {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.user-notifications {
  position: relative;
  background: none;
  border: none;
  padding: var(--spacing-2);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition-normal);
}

.user-notifications:hover {
  background: var(--bg-tertiary);
}

.user-notifications.has-notifications .notification-icon {
  animation: wiggle 2s ease-in-out infinite;
}

.notification-icon {
  font-size: var(--text-xl);
}

.notification-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: var(--color-error);
  color: var(--text-inverse);
  font-size: var(--text-xs);
  padding: var(--spacing-1);
  border-radius: var(--radius-full);
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-bold);
}

.user-profile {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition-normal);
}

.user-profile:hover {
  background: var(--bg-tertiary);
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--border-color);
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.user-status {
  font-size: var(--text-xs);
  color: var(--color-success);
}

.dropdown-arrow {
  font-size: var(--text-xs);
  color: var(--text-muted);
  transition: var(--transition-normal);
}

/* モバイルメニューボタン */
.mobile-menu-btn {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--spacing-2);
  border-radius: var(--radius-md);
  transition: var(--transition-normal);
}

.mobile-menu-btn:hover {
  background: var(--bg-tertiary);
}

.hamburger-line {
  width: 24px;
  height: 2px;
  background: var(--text-primary);
  margin: 2px 0;
  transition: var(--transition-normal);
  border-radius: 1px;
}

.mobile-menu-btn.active .hamburger-line:nth-child(1) {
  transform: rotate(45deg) translate(5px, 5px);
}

.mobile-menu-btn.active .hamburger-line:nth-child(2) {
  opacity: 0;
}

.mobile-menu-btn.active .hamburger-line:nth-child(3) {
  transform: rotate(-45deg) translate(7px, -6px);
}

/* ドロップダウンメニュー */
.notifications-dropdown,
.user-menu-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  min-width: 320px;
  max-height: 400px;
  overflow: hidden;
  animation: slideInDown 0.2s ease-out;
}

.notifications-header,
.user-menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-4);
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.notifications-header h3 {
  margin: 0;
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
}

.mark-all-read {
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: var(--text-sm);
  cursor: pointer;
  font-weight: var(--font-weight-medium);
}

.notifications-list {
  max-height: 300px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  gap: var(--spacing-3);
  padding: var(--spacing-3);
  border-bottom: 1px solid var(--border-color-light);
  transition: var(--transition-normal);
}

.notification-item:hover {
  background: var(--bg-secondary);
}

.notification-item.unread {
  background: rgba(99, 102, 241, 0.05);
  border-left: 3px solid var(--color-primary);
}

.notification-icon {
  font-size: var(--text-lg);
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
}

.notification-text {
  margin: 0 0 var(--spacing-1) 0;
  font-size: var(--text-sm);
  color: var(--text-primary);
}

.notification-time {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.notifications-footer {
  padding: var(--spacing-3);
  text-align: center;
  background: var(--bg-secondary);
}

.view-all-link {
  color: var(--color-primary);
  text-decoration: none;
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
}

/* ユーザーメニュー */
.menu-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.menu-user-info {
  display: flex;
  flex-direction: column;
}

.menu-user-name {
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.menu-user-email {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.user-menu-items {
  padding: var(--spacing-2) 0;
}

.user-menu-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  text-decoration: none;
  color: var(--text-primary);
  transition: var(--transition-normal);
}

.user-menu-item:hover {
  background: var(--bg-secondary);
}

.menu-item-icon {
  font-size: var(--text-lg);
  width: 24px;
  text-align: center;
}

.menu-item-label {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
}

.user-menu-footer {
  padding: var(--spacing-3);
  border-top: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2);
  background: var(--color-error);
  color: var(--text-inverse);
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-weight: var(--font-weight-medium);
  transition: var(--transition-normal);
}

.logout-btn:hover {
  background: var(--color-error);
  transform: translateY(-1px);
}

/* モバイルメニュー */
.mobile-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  z-index: var(--z-modal);
  animation: fadeIn 0.2s ease-out;
}

.mobile-menu {
  position: fixed;
  top: 0;
  left: 0;
  width: 300px;
  height: 100%;
  background: var(--bg-primary);
  box-shadow: var(--shadow-xl);
  display: flex;
  flex-direction: column;
  animation: slideInLeft 0.3s ease-out;
}

.mobile-menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-4);
  background: var(--bg-creative);
  color: var(--text-inverse);
}

.mobile-brand {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.mobile-close-btn {
  background: rgba(255, 255, 255, 0.2);
  color: var(--text-inverse);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  font-size: var(--text-lg);
  transition: var(--transition-normal);
}

.mobile-close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.mobile-user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  border-bottom: 1px solid var(--border-color);
}

.mobile-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.mobile-user-details {
  display: flex;
  flex-direction: column;
}

.mobile-user-name {
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.mobile-user-status {
  font-size: var(--text-sm);
  color: var(--color-success);
}

.mobile-nav-items {
  flex: 1;
  padding: var(--spacing-2) 0;
  overflow-y: auto;
}

.mobile-nav-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  text-decoration: none;
  color: var(--text-primary);
  transition: var(--transition-normal);
  border-left: 3px solid transparent;
}

.mobile-nav-item:hover {
  background: var(--bg-secondary);
}

.mobile-nav-item.active {
  background: rgba(99, 102, 241, 0.1);
  border-left-color: var(--color-primary);
  color: var(--color-primary);
}

.mobile-nav-icon {
  font-size: var(--text-xl);
  width: 24px;
  text-align: center;
}

.mobile-nav-label {
  font-weight: var(--font-weight-medium);
  flex: 1;
}

.mobile-nav-badge {
  background: var(--color-error);
  color: var(--text-inverse);
  font-size: var(--text-xs);
  padding: var(--spacing-1);
  border-radius: var(--radius-full);
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-bold);
}

.mobile-menu-footer {
  padding: var(--spacing-4);
  border-top: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.mobile-user-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.mobile-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition-normal);
}

.mobile-action-btn:hover {
  background: var(--bg-tertiary);
}

.mobile-logout-btn {
  background: var(--color-error);
  color: var(--text-inverse);
  border: none;
}

.mobile-logout-btn:hover {
  background: var(--color-error);
  transform: translateY(-1px);
}

/* サブナビゲーション */
.sub-navigation {
  position: fixed;
  top: 73px;
  left: 0;
  right: 0;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  z-index: calc(var(--z-fixed) - 1);
}

.sub-nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-4);
}

.sub-nav-menu {
  display: flex;
  gap: var(--spacing-1);
  overflow-x: auto;
  padding: var(--spacing-2) 0;
}

.sub-nav-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--radius-lg);
  text-decoration: none;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
  transition: var(--transition-normal);
}

.sub-nav-item:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.sub-nav-item.active {
  background: var(--color-primary);
  color: var(--text-inverse);
}

/* プログレスインジケーター */
.nav-progress {
  position: fixed;
  top: 72px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--bg-tertiary);
  z-index: calc(var(--z-fixed) + 1);
}

.nav-progress .progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
  transition: width 0.1s ease;
}

/* レスポンシブ対応 */
@media (max-width: 1024px) {
  .nav-container {
    padding: var(--spacing-3);
  }

  .nav-menu {
    gap: 0;
  }

  .nav-link {
    padding: var(--spacing-2);
  }

  .nav-label {
    display: none;
  }
}

@media (max-width: 768px) {
  .mobile-menu {
    width: 280px;
  }

  .notifications-dropdown,
  .user-menu-dropdown {
    min-width: 280px;
    right: var(--spacing-4);
  }
}

@media (max-width: 480px) {
  .mobile-menu {
    width: 100%;
  }

  .notifications-dropdown,
  .user-menu-dropdown {
    left: var(--spacing-4);
    right: var(--spacing-4);
    min-width: auto;
  }
}

/* ダークモード対応 */
@media (prefers-color-scheme: dark) {
  .nav-header {
    background: rgba(15, 23, 42, 0.95);
    border-bottom-color: var(--border-color);
  }

  .nav-header.nav-scrolled {
    background: rgba(15, 23, 42, 0.98);
  }

  .notifications-dropdown,
  .user-menu-dropdown,
  .mobile-menu {
    background: var(--bg-secondary);
    border-color: var(--border-color);
  }

  .sub-navigation {
    background: var(--bg-secondary);
    border-bottom-color: var(--border-color);
  }
}
</style>
