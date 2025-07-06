<template>
  <div class="mobile-optimization">
    <!-- モバイル専用ヘッダー -->
    <div v-if="isMobile" class="mobile-header">
      <div class="mobile-header-content">
        <button class="mobile-menu-btn" @click="toggleMobileMenu">
          <span class="hamburger-icon">☰</span>
        </button>
        <h1 class="mobile-title">{{ currentPageTitle }}</h1>
        <div class="mobile-actions">
          <button class="mobile-action-btn" @click="showNotifications = true">
            <span class="notification-icon">🔔</span>
            <span v-if="unreadNotifications > 0" class="notification-badge">{{ unreadNotifications }}</span>
          </button>
          <button class="mobile-action-btn" @click="showUserMenu = true">
            <span class="user-avatar">{{ userAvatar }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- モバイルメニュー -->
    <div v-if="isMobile && showMobileMenu" class="mobile-menu-overlay" @click="toggleMobileMenu">
      <div class="mobile-menu" @click.stop>
        <div class="mobile-menu-header">
          <h2>メニュー</h2>
          <button class="close-btn" @click="toggleMobileMenu">✕</button>
        </div>
        <div class="mobile-menu-content">
          <div
            v-for="item in menuItems"
            :key="item.id"
            class="mobile-menu-item"
            @click="navigateToPage(item.id)"
          >
            <span class="menu-icon">{{ item.icon }}</span>
            <span class="menu-label">{{ item.label }}</span>
            <span v-if="item.badge" class="menu-badge">{{ item.badge }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- タッチ操作ガイド -->
    <div v-if="isMobile && showTouchGuide" class="touch-guide">
      <div class="touch-guide-content">
        <h3>タッチ操作ガイド</h3>
        <div class="touch-instructions">
          <div class="touch-instruction">
            <span class="gesture-icon">👆</span>
            <span class="gesture-text">タップ: 選択・実行</span>
          </div>
          <div class="touch-instruction">
            <span class="gesture-icon">👆👆</span>
            <span class="gesture-text">ダブルタップ: 詳細表示</span>
          </div>
          <div class="touch-instruction">
            <span class="gesture-icon">👇</span>
            <span class="gesture-text">長押し: メニュー表示</span>
          </div>
          <div class="touch-instruction">
            <span class="gesture-icon">🤏</span>
            <span class="gesture-text">ピンチ: ズーム</span>
          </div>
          <div class="touch-instruction">
            <span class="gesture-icon">👈</span>
            <span class="gesture-text">スワイプ: ページ移動</span>
          </div>
        </div>
        <button class="btn-primary" @click="hideTouchGuide">理解しました</button>
      </div>
    </div>

    <!-- モバイル専用フローティングアクションボタン -->
    <div v-if="isMobile" class="mobile-fab-container">
      <div class="fab-menu" :class="{ expanded: fabExpanded }">
        <button
          v-for="action in fabActions"
          :key="action.id"
          class="fab-action"
          :style="{ transform: `translateY(${fabExpanded ? action.offset : 0}px)` }"
          @click="handleFabAction(action.id)"
        >
          <span class="fab-icon">{{ action.icon }}</span>
        </button>
      </div>
      <button class="fab-main" @click="toggleFab">
        <span class="fab-main-icon">{{ fabExpanded ? '✕' : '➕' }}</span>
      </button>
    </div>

    <!-- スワイプナビゲーション -->
    <div
      v-if="isMobile"
      class="swipe-container"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    >
      <div class="swipe-indicator" :style="{ transform: `translateX(${swipeOffset}px)` }">
        <div class="swipe-arrow left">← 前のページ</div>
        <div class="swipe-arrow right">次のページ →</div>
      </div>
    </div>

    <!-- プルトゥリフレッシュ -->
    <div v-if="isMobile" class="pull-to-refresh" :class="{ active: pullToRefreshActive }">
      <div class="pull-indicator" :style="{ transform: `translateY(${pullOffset}px)` }">
        <div class="pull-icon" :class="{ spinning: refreshing }">🔄</div>
        <div class="pull-text">
          {{ refreshing ? 'リフレッシュ中...' : pullOffset > 50 ? '離してリフレッシュ' : '下に引いてリフレッシュ' }}
        </div>
      </div>
    </div>

    <!-- バイブレーション設定 -->
    <div v-if="isMobile" class="vibration-settings">
      <div class="setting-group">
        <label class="setting-label">
          <input v-model="vibrationEnabled" type="checkbox" @change="updateVibrationSettings" />
          バイブレーション通知
        </label>
      </div>
      <div class="setting-group">
        <label class="setting-label">
          <input v-model="hapticsEnabled" type="checkbox" @change="updateHapticsSettings" />
          触覚フィードバック
        </label>
      </div>
    </div>

    <!-- 画面向き検知 -->
    <div v-if="isMobile && orientationWarning" class="orientation-warning">
      <div class="orientation-message">
        <span class="orientation-icon">📱</span>
        <p>より良い体験のため、画面を回転してください</p>
        <button class="btn-secondary" @click="dismissOrientationWarning">OK</button>
      </div>
    </div>

    <!-- オフライン状態表示 -->
    <div v-if="!isOnline" class="offline-banner">
      <span class="offline-icon">📡</span>
      <span class="offline-text">オフライン中 - 接続を確認してください</span>
    </div>

    <!-- インストールプロンプト -->
    <div v-if="showInstallPrompt" class="install-prompt">
      <div class="install-content">
        <div class="install-icon">📱</div>
        <div class="install-text">
          <h3>アプリをインストール</h3>
          <p>ホーム画面に追加してより便利に使用できます</p>
        </div>
        <div class="install-actions">
          <button class="btn-secondary" @click="dismissInstallPrompt">後で</button>
          <button class="btn-primary" @click="installApp">インストール</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface MenuItem {
  id: string
  label: string
  icon: string
  badge?: number
}

interface FabAction {
  id: string
  icon: string
  offset: number
}

// レスポンシブ検知
const isMobile = ref(false)
const isTablet = ref(false)
const screenWidth = ref(0)
const screenHeight = ref(0)
const orientation = ref<'portrait' | 'landscape'>('portrait')

// モバイルメニュー
const showMobileMenu = ref(false)
const currentPageTitle = ref('バーチャルオフィス')
const unreadNotifications = ref(3)
const userAvatar = ref('😊')
const showUserMenu = ref(false)
const showNotifications = ref(false)

// タッチ操作
const showTouchGuide = ref(false)
const touchStartX = ref(0)
const touchStartY = ref(0)
const swipeOffset = ref(0)
const pullOffset = ref(0)
const pullToRefreshActive = ref(false)
const refreshing = ref(false)

// FAB (Floating Action Button)
const fabExpanded = ref(false)
const fabActions: FabAction[] = [
  { id: 'add-furniture', icon: '🪑', offset: -60 },
  { id: 'save-layout', icon: '💾', offset: -120 },
  { id: 'share', icon: '📤', offset: -180 },
  { id: 'settings', icon: '⚙️', offset: -240 }
]

// システム設定
const vibrationEnabled = ref(true)
const hapticsEnabled = ref(true)
const orientationWarning = ref(false)
const isOnline = ref(navigator.onLine)
const showInstallPrompt = ref(false)

// PWA
let deferredPrompt: any = null

// メニューアイテム
const menuItems: MenuItem[] = [
  { id: 'home', label: 'ホーム', icon: '🏠' },
  { id: 'office', label: 'オフィス', icon: '🏢' },
  { id: 'customizer', label: 'カスタマイザー', icon: '🎨' },
  { id: 'templates', label: 'テンプレート', icon: '📐' },
  { id: 'meetings', label: '会議', icon: '📅', badge: 2 },
  { id: 'chat', label: 'チャット', icon: '💬', badge: 5 },
  { id: 'analytics', label: '分析', icon: '📊' },
  { id: 'settings', label: '設定', icon: '⚙️' }
]

// メソッド
const checkDevice = () => {
  screenWidth.value = window.innerWidth
  screenHeight.value = window.innerHeight
  isMobile.value = window.innerWidth <= 768
  isTablet.value = window.innerWidth > 768 && window.innerWidth <= 1024
  orientation.value = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'

  // 画面向き警告
  if (isMobile.value && orientation.value === 'landscape' && screenHeight.value < 500) {
    orientationWarning.value = true
  }
}

const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value
  if (vibrationEnabled.value) {
    navigator.vibrate?.(50)
  }
}

const navigateToPage = (pageId: string) => {
  currentPageTitle.value = menuItems.find(item => item.id === pageId)?.label || 'バーチャルオフィス'
  showMobileMenu.value = false
  console.log('ページ遷移:', pageId)

  if (hapticsEnabled.value) {
    navigator.vibrate?.(30)
  }
}

const toggleFab = () => {
  fabExpanded.value = !fabExpanded.value
  if (vibrationEnabled.value) {
    navigator.vibrate?.(40)
  }
}

const handleFabAction = (actionId: string) => {
  console.log('FABアクション:', actionId)
  fabExpanded.value = false

  if (hapticsEnabled.value) {
    navigator.vibrate?.(50)
  }
}

// タッチイベント処理
const handleTouchStart = (event: TouchEvent) => {
  touchStartX.value = event.touches[0].clientX
  touchStartY.value = event.touches[0].clientY
}

const handleTouchMove = (event: TouchEvent) => {
  const touchX = event.touches[0].clientX
  const touchY = event.touches[0].clientY
  const deltaX = touchX - touchStartX.value
  const deltaY = touchY - touchStartY.value

  // 水平スワイプ
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    swipeOffset.value = deltaX * 0.3
  }

  // プルトゥリフレッシュ
  if (deltaY > 0 && touchStartY.value < 100) {
    pullOffset.value = Math.min(deltaY * 0.5, 100)
    pullToRefreshActive.value = pullOffset.value > 50
  }
}

const handleTouchEnd = () => {
  // スワイプ判定
  if (Math.abs(swipeOffset.value) > 100) {
    if (swipeOffset.value > 0) {
      console.log('右スワイプ: 前のページ')
    } else {
      console.log('左スワイプ: 次のページ')
    }
  }

  // プルトゥリフレッシュ実行
  if (pullToRefreshActive.value) {
    performRefresh()
  }

  // リセット
  swipeOffset.value = 0
  pullOffset.value = 0
  pullToRefreshActive.value = false
}

const performRefresh = async () => {
  refreshing.value = true
  if (vibrationEnabled.value) {
    vibrateFeedback()
  }

  // 実際のリフレッシュ処理
  await new Promise(resolve => setTimeout(resolve, 2000))

  refreshing.value = false
  console.log('リフレッシュ完了')
}

const hideTouchGuide = () => {
  showTouchGuide.value = false
  localStorage.setItem('touchGuideShown', 'true')
}

const dismissOrientationWarning = () => {
  orientationWarning.value = false
}

const updateVibrationSettings = () => {
  localStorage.setItem('vibrationEnabled', vibrationEnabled.value.toString())
}

const updateHapticsSettings = () => {
  localStorage.setItem('hapticsEnabled', hapticsEnabled.value.toString())
}

// PWA関連
const installApp = async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    console.log('PWAインストール結果:', outcome)
    deferredPrompt = null
    showInstallPrompt.value = false
  }
}

const dismissInstallPrompt = () => {
  showInstallPrompt.value = false
  localStorage.setItem('installPromptDismissed', 'true')
}

// イベントリスナー
const handleResize = () => {
  checkDevice()
}

const handleOrientationChange = () => {
  setTimeout(checkDevice, 100)
}

const handleOnlineStatusChange = () => {
  isOnline.value = navigator.onLine
}

const handleBeforeInstallPrompt = (event: Event) => {
  event.preventDefault()
  deferredPrompt = event

  // 初回のみ表示
  const dismissed = localStorage.getItem('installPromptDismissed')
  if (!dismissed) {
    showInstallPrompt.value = true
  }
}

const vibrateFeedback = () => {
  if ('vibrate' in navigator) {
    (navigator as any).vibrate([100, 50, 100])
  }
}

// 初期化
onMounted(() => {
  checkDevice()

  // 設定読み込み
  vibrationEnabled.value = localStorage.getItem('vibrationEnabled') !== 'false'
  hapticsEnabled.value = localStorage.getItem('hapticsEnabled') !== 'false'

  // タッチガイド表示判定
  const touchGuideShown = localStorage.getItem('touchGuideShown')
  if (!touchGuideShown && isMobile.value) {
    setTimeout(() => {
      showTouchGuide.value = true
    }, 2000)
  }

  // イベントリスナー登録
  window.addEventListener('resize', handleResize)
  window.addEventListener('orientationchange', handleOrientationChange)
  window.addEventListener('online', handleOnlineStatusChange)
  window.addEventListener('offline', handleOnlineStatusChange)
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('orientationchange', handleOrientationChange)
  window.removeEventListener('online', handleOnlineStatusChange)
  window.removeEventListener('offline', handleOnlineStatusChange)
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
})
</script>

<style scoped>
.mobile-optimization {
  position: relative;
  width: 100%;
  height: 100%;
}

/* モバイルヘッダー */
.mobile-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: var(--bg-creative);
  color: white;
  z-index: 1000;
  box-shadow: var(--shadow-lg);
}

.mobile-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-3) var(--spacing-4);
  height: 60px;
}

.mobile-menu-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: var(--spacing-2);
  border-radius: var(--radius-md);
  transition: var(--transition-fast);
}

.mobile-menu-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.mobile-title {
  font-size: var(--text-lg);
  font-weight: 600;
  margin: 0;
  flex: 1;
  text-align: center;
}

.mobile-actions {
  display: flex;
  gap: var(--spacing-2);
}

.mobile-action-btn {
  position: relative;
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  padding: var(--spacing-2);
  border-radius: var(--radius-md);
  transition: var(--transition-fast);
}

.mobile-action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.notification-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: #ff4757;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

/* モバイルメニュー */
.mobile-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1100;
  backdrop-filter: blur(5px);
}

.mobile-menu {
  position: fixed;
  top: 0;
  left: 0;
  width: 280px;
  height: 100%;
  background: white;
  box-shadow: var(--shadow-xl);
  animation: slideInLeft 0.3s ease-out;
}

.mobile-menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-4);
  background: var(--bg-creative);
  color: white;
}

.mobile-menu-header h2 {
  margin: 0;
  font-size: var(--text-xl);
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: var(--spacing-1);
}

.mobile-menu-content {
  padding: var(--spacing-2) 0;
}

.mobile-menu-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-3) var(--spacing-4);
  cursor: pointer;
  transition: var(--transition-fast);
  border-bottom: 1px solid var(--color-gray-100);
}

.mobile-menu-item:hover {
  background: var(--color-gray-50);
}

.menu-icon {
  font-size: 1.2rem;
  margin-right: var(--spacing-3);
  width: 24px;
  text-align: center;
}

.menu-label {
  flex: 1;
  font-weight: 500;
  color: var(--color-gray-800);
}

.menu-badge {
  background: var(--color-primary);
  color: white;
  border-radius: var(--radius-full);
  padding: var(--spacing-1) var(--spacing-2);
  font-size: var(--text-xs);
  font-weight: 600;
  min-width: 20px;
  text-align: center;
}

/* FAB */
.mobile-fab-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}

.fab-menu {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.fab-action {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  border: none;
  cursor: pointer;
  margin-bottom: var(--spacing-2);
  box-shadow: var(--shadow-lg);
  transition: var(--transition-normal);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  opacity: 0;
  transform: scale(0);
}

.fab-menu.expanded .fab-action {
  opacity: 1;
  transform: scale(1);
  transition-delay: 0.1s;
}

.fab-main {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--bg-creative);
  color: white;
  border: none;
  cursor: pointer;
  box-shadow: var(--shadow-xl);
  transition: var(--transition-normal);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 600;
}

.fab-main:hover {
  transform: scale(1.1);
}

/* タッチガイド */
.touch-guide {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-4);
}

.touch-guide-content {
  background: white;
  border-radius: var(--radius-xl);
  padding: var(--spacing-6);
  max-width: 400px;
  width: 100%;
  text-align: center;
}

.touch-guide-content h3 {
  margin: 0 0 var(--spacing-4) 0;
  color: var(--color-primary);
  font-size: var(--text-xl);
}

.touch-instructions {
  margin-bottom: var(--spacing-6);
}

.touch-instruction {
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-3);
  text-align: left;
}

.gesture-icon {
  font-size: 1.5rem;
  margin-right: var(--spacing-3);
  width: 40px;
  text-align: center;
}

.gesture-text {
  color: var(--color-gray-700);
  font-weight: 500;
}

/* スワイプ */
.swipe-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 500;
}

.swipe-indicator {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  display: flex;
  justify-content: space-between;
  padding: 0 var(--spacing-4);
  opacity: 0;
  transition: opacity 0.2s;
}

.swipe-arrow {
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  font-weight: 500;
}

/* プルトゥリフレッシュ */
.pull-to-refresh {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 100px;
  z-index: 600;
  pointer-events: none;
}

.pull-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 0 0 var(--radius-xl) var(--radius-xl);
  transform: translateY(-100px);
  transition: transform 0.3s ease;
}

.pull-icon {
  font-size: 1.5rem;
  margin-bottom: var(--spacing-2);
  transition: transform 0.3s ease;
}

.pull-icon.spinning {
  animation: spin 1s linear infinite;
}

.pull-text {
  font-size: var(--text-sm);
  color: var(--color-gray-600);
  font-weight: 500;
}

/* オフライン表示 */
.offline-banner {
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  background: #ff4757;
  color: white;
  padding: var(--spacing-2) var(--spacing-4);
  text-align: center;
  font-weight: 500;
  z-index: 999;
  animation: slideInDown 0.3s ease-out;
}

.offline-icon {
  margin-right: var(--spacing-2);
}

/* インストールプロンプト */
.install-prompt {
  position: fixed;
  bottom: 20px;
  left: 20px;
  right: 20px;
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  z-index: 1000;
  animation: slideInUp 0.3s ease-out;
}

.install-content {
  display: flex;
  align-items: center;
  padding: var(--spacing-4);
  gap: var(--spacing-3);
}

.install-icon {
  font-size: 2rem;
}

.install-text {
  flex: 1;
}

.install-text h3 {
  margin: 0 0 var(--spacing-1) 0;
  font-size: var(--text-base);
  color: var(--color-gray-800);
}

.install-text p {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-gray-600);
}

.install-actions {
  display: flex;
  gap: var(--spacing-2);
}

.btn-primary,
.btn-secondary {
  padding: var(--spacing-2) var(--spacing-3);
  border: none;
  border-radius: var(--radius-lg);
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-normal);
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-secondary {
  background: var(--color-gray-200);
  color: var(--color-gray-700);
}

/* 画面向き警告 */
.orientation-warning {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-4);
}

.orientation-message {
  background: white;
  border-radius: var(--radius-xl);
  padding: var(--spacing-6);
  text-align: center;
  max-width: 300px;
}

.orientation-icon {
  font-size: 3rem;
  margin-bottom: var(--spacing-3);
}

.orientation-message p {
  margin: 0 0 var(--spacing-4) 0;
  color: var(--color-gray-700);
}

/* バイブレーション設定 */
.vibration-settings {
  padding: var(--spacing-4);
  background: white;
  border-radius: var(--radius-lg);
  margin: var(--spacing-4);
}

.setting-group {
  margin-bottom: var(--spacing-3);
}

.setting-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  cursor: pointer;
  font-weight: 500;
  color: var(--color-gray-700);
}

/* アニメーション */
@keyframes slideInLeft {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes slideInDown {
  from {
    transform: translateY(-100%);
  }
  to {
    transform: translateY(0);
  }
}

@keyframes slideInUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* レスポンシブ対応 */
@media (max-width: 480px) {
  .mobile-header-content {
    padding: var(--spacing-2) var(--spacing-3);
  }

  .mobile-title {
    font-size: var(--text-base);
  }

  .mobile-menu {
    width: 100%;
  }

  .fab-main {
    width: 48px;
    height: 48px;
    font-size: 1.2rem;
  }

  .fab-action {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }

  .install-content {
    flex-direction: column;
    text-align: center;
  }

  .install-actions {
    width: 100%;
  }

  .install-actions button {
    flex: 1;
  }
}

/* ダークモード対応 */
@media (prefers-color-scheme: dark) {
  .mobile-menu,
  .touch-guide-content,
  .install-prompt {
    background: var(--color-gray-900);
    color: white;
  }

  .mobile-menu-item:hover {
    background: var(--color-gray-800);
  }

  .menu-label {
    color: var(--color-gray-200);
  }

  .pull-indicator {
    background: rgba(0, 0, 0, 0.9);
    color: white;
  }
}
</style>
