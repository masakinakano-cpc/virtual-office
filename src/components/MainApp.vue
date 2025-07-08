<template>
  <ErrorBoundary
    :log-errors="true"
    :show-error-details="false"
    @retry="handleErrorRetry"
  >
    <div class="main-app">
    <!-- デスクトップナビゲーション -->
    <ModernNavigation
      v-if="currentView !== 'threejs-office'"
      :current-view="currentView"
      :user-name="userName"
      :notifications="notifications"
      @view-change="handleViewChange"
      @logout="handleLogout"
      class="desktop-only"
    />

    <!-- モバイルナビゲーション -->
    <MobileNavigation
      :current-view="currentView"
      :user-name="userName"
      :user-color="connectedUsers[0]?.color || '#6366f1'"
      :user-status="'online'"
      :is-audio-enabled="true"
      :is-video-enabled="false"
      :is-chat-open="false"
      :notifications="notifications"
      @view-change="handleViewChange"
      @audio-toggle="handleAudioToggle"
      @video-toggle="handleVideoToggle"
      @chat-toggle="handleChatToggle"
      @settings-toggle="toggleSettings"
      @logout="handleLogout"
      @start-video-call="handleStartVideoCall"
      @share-screen="handleShareScreen"
      @open-whiteboard="handleOpenWhiteboard"
      @notification-click="handleNotificationClick"
      class="mobile-only"
    />

    <!-- メインコンテンツ -->
    <div class="main-content">
      <!-- 3D バーチャルオフィス -->
      <div v-if="currentView === 'threejs-office'" class="view-container">
        <ThreeJSOfficeSpace
          :connected-users="connectedUsers"
          :avatar-position="avatarPosition"
          @position-update="handlePositionUpdate"
          @user-interaction="handleUserInteraction"
        />
      </div>

      <!-- 従来の2D オフィス -->
      <div v-else-if="currentView === 'virtual-office'" class="view-container">
        <VirtualOfficeSpace />
      </div>

      <!-- チャットシステム -->
      <div v-else-if="currentView === 'chat'" class="view-container">
        <ChatSystem />
      </div>

      <!-- 設定パネル -->
      <div v-else-if="currentView === 'settings'" class="view-container">
        <SettingsPanel :is-open="currentView === 'settings'" @close="currentView = 'virtual-office'" />
      </div>

      <!-- オフィスカスタマイザー -->
      <div v-else-if="currentView === 'customizer'" class="view-container">
        <OfficeCustomizer />
      </div>

      <!-- ソーシャルハブ -->
      <div v-else-if="currentView === 'social'" class="view-container">
        <SocialHub />
      </div>

      <!-- アクセシビリティパネル -->
      <div v-else-if="currentView === 'accessibility'" class="view-container">
        <AccessibilityPanel :is-visible="currentView === 'accessibility'" @close="currentView = 'virtual-office'" />
      </div>

      <!-- 認証モーダル -->
      <div v-else-if="currentView === 'auth'" class="view-container">
        <AuthModal :show-modal="true" />
      </div>

      <!-- デフォルトビュー -->
      <div v-else class="view-container">
        <VirtualOfficeSpace />
      </div>
    </div>

    <!-- 近接ビデオ通話システム -->
    <ProximityVideoCall
      v-if="currentView === 'threejs-office' || currentView === 'virtual-office'"
      :current-position="avatarPosition"
      :connected-users="connectedUsers"
      :call-radius="150"
      :auto-join-enabled="true"
      :show-call-range="showCallRange"
      @call-started="handleCallStarted"
      @call-ended="handleCallEnded"
    />

    <!-- 衝突判定システム -->
    <CollisionSystem
      v-if="currentView === 'threejs-office'"
      :current-position="avatarPosition"
      :avatar-size="60"
      :space-width="1000"
      :space-height="600"
      :show-debug="showCollisionDebug"
      :show-visualization="showCollisionVisualization"
      @collision="handleCollision"
      @position-corrected="handlePositionCorrected"
    />

    <!-- 3D空間用のコントロール -->
    <div v-if="currentView === 'threejs-office'" class="threejs-controls">
      <button @click="switchTo2D" class="control-btn">
        <span class="btn-icon">🔄</span>
        2D表示に切り替え
      </button>
      <button @click="toggleCallRange" class="control-btn" :class="{ active: showCallRange }">
        <span class="btn-icon">📞</span>
        通話範囲表示
      </button>
      <button @click="toggleCollisionDebug" class="control-btn" :class="{ active: showCollisionDebug }">
        <span class="btn-icon">🔲</span>
        衝突判定デバッグ
      </button>
      <button @click="toggleSettings" class="control-btn" :class="{ active: showSettings }">
        <span class="btn-icon">⚙️</span>
        設定
      </button>
    </div>

    <!-- クリエイティブインタラクション -->
    <CreativeInteractions
      v-if="showCreativeEffects"
      @effect-triggered="handleEffectTriggered"
    />

    <!-- 通知システム -->
    <div v-if="notifications.length > 0" class="notifications-container">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="notification"
        :class="notification.type"
        @click="dismissNotification(notification.id)"
      >
        <div class="notification-icon">
          {{ getNotificationIcon(notification.type) }}
        </div>
        <div class="notification-content">
          <div class="notification-title">{{ notification.title }}</div>
          <div class="notification-message">{{ notification.message }}</div>
        </div>
        <button class="notification-close" @click.stop="dismissNotification(notification.id)">
          ×
        </button>
      </div>
    </div>

    <!-- ローディング画面 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p>{{ loadingMessage }}</p>
      </div>
    </div>
    </div>
  </ErrorBoundary>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

// コンポーネントのインポート
import ErrorBoundary from './ErrorBoundary.vue'
import ThreeJSOfficeSpace from './ThreeJSOfficeSpace.vue'
import CollisionSystem from './CollisionSystem.vue'
import ProximityVideoCall from './ProximityVideoCall.vue'
import ModernNavigation from './ModernNavigation.vue'
import MobileNavigation from './MobileNavigation.vue'
import VirtualOfficeSpace from './VirtualOfficeSpace.vue'
import ChatSystem from './ChatSystem.vue'
import SettingsPanel from './SettingsPanel.vue'
import OfficeCustomizer from './OfficeCustomizer.vue'
import SocialHub from './SocialHub.vue'
import AccessibilityPanel from './AccessibilityPanel.vue'
import AuthModal from './AuthModal.vue'
import CreativeInteractions from './CreativeInteractions.vue'
import OviceIcon from './OviceIcon.vue'

// 型定義
interface User {
  id: string
  nickname: string
  position: { x: number; y: number }
  color: string
  isActive: boolean
  isAudioEnabled: boolean
  isVideoEnabled: boolean
  isSpeaking: boolean
}

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
}

// Router
const router = useRouter()

// 状態管理
const currentView = ref('virtual-office') // デフォルトを2D表示に
const userName = ref('ユーザー')
const isLoading = ref(false)
const loadingMessage = ref('')
const showCreativeEffects = ref(true)
const showSettings = ref(false)

// アバターと位置情報
const avatarPosition = ref({ x: 500, y: 300 })
const connectedUsers = ref<User[]>([
  {
    id: 'user-1',
    nickname: 'テストユーザー1',
    position: { x: 200, y: 200 },
    color: '#ff6b6b',
    isActive: true,
    isAudioEnabled: true,
    isVideoEnabled: false,
    isSpeaking: false
  },
  {
    id: 'user-2',
    nickname: 'テストユーザー2',
    position: { x: 800, y: 400 },
    color: '#4ecdc4',
    isActive: true,
    isAudioEnabled: true,
    isVideoEnabled: true,
    isSpeaking: true
  },
  {
    id: 'user-3',
    nickname: 'テストユーザー3',
    position: { x: 300, y: 500 },
    color: '#45b7d1',
    isActive: true,
    isAudioEnabled: false,
    isVideoEnabled: false,
    isSpeaking: false
  }
])

// 通話とコリジョン設定
const showCallRange = ref(false)
const showCollisionDebug = ref(false)
const showCollisionVisualization = ref(false)

// 通知システム
const notifications = ref<Notification[]>([])

// 通知の追加
const addNotification = (type: Notification['type'], title: string, message: string) => {
  const notification: Notification = {
    id: `notification-${Date.now()}`,
    type,
    title,
    message,
    timestamp: new Date()
  }

  notifications.value.push(notification)

  // 5秒後に自動削除
  setTimeout(() => {
    dismissNotification(notification.id)
  }, 5000)
}

// 通知の削除
const dismissNotification = (id: string) => {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index > -1) {
    notifications.value.splice(index, 1)
  }
}

// 通知アイコンの取得
const getNotificationIcon = (type: Notification['type']): string => {
  const icons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  }
  return icons[type] || 'ℹ️'
}

// イベントハンドラー
const handleViewChange = (view: string) => {
  currentView.value = view
  addNotification('info', 'ビュー変更', `${view}に切り替えました`)
}

const handleLogout = () => {
  // ログアウト処理
  router.push('/login')
}

const handlePositionUpdate = (position: { x: number; y: number }) => {
  avatarPosition.value = position
}

const handleUserInteraction = (userId: string) => {
  const user = connectedUsers.value.find(u => u.id === userId)
  if (user) {
    addNotification('info', 'ユーザーインタラクション', `${user.nickname}とインタラクションしました`)
  }
}

const handleCallStarted = (call: any) => {
  addNotification('success', '通話開始', `${call.type}通話が開始されました`)
}

const handleCallEnded = (_callId: string) => {
  addNotification('info', '通話終了', '通話が終了しました')
}

const handleCollision = (result: any) => {
  if (result.isColliding) {
    console.log('衝突検知:', result.collisionObject?.name)
  }
}

const handlePositionCorrected = (position: { x: number; y: number }) => {
  avatarPosition.value = position
}

const handleEffectTriggered = (effect: string) => {
  addNotification('success', 'エフェクト発動', `${effect}エフェクトが発動しました`)
}

// コントロール関数
const switchTo2D = () => {
  currentView.value = 'virtual-office'
  addNotification('info', '表示切り替え', '2D表示に切り替えました')
}

const toggleCallRange = () => {
  showCallRange.value = !showCallRange.value
  addNotification('info', '通話範囲表示', showCallRange.value ? '有効' : '無効')
}

const toggleCollisionDebug = () => {
  showCollisionDebug.value = !showCollisionDebug.value
  showCollisionVisualization.value = !showCollisionVisualization.value
  addNotification('info', '衝突判定デバッグ', showCollisionDebug.value ? '有効' : '無効')
}

const toggleSettings = () => {
  showSettings.value = !showSettings.value
}

// モバイルナビゲーション用のハンドラー
const handleAudioToggle = () => {
  // 音声の有効/無効を切り替え
  addNotification('info', '音声設定', '音声を切り替えました')
}

const handleVideoToggle = () => {
  // ビデオの有効/無効を切り替え
  addNotification('info', 'ビデオ設定', 'ビデオを切り替えました')
}

const handleChatToggle = () => {
  // チャットの表示/非表示を切り替え
  currentView.value = currentView.value === 'chat' ? 'virtual-office' : 'chat'
  addNotification('info', 'チャット', 'チャットを切り替えました')
}

const handleStartVideoCall = () => {
  // ビデオ通話を開始
  addNotification('success', 'ビデオ通話', 'ビデオ通話を開始しました')
}

const handleShareScreen = () => {
  // 画面共有を開始
  addNotification('info', '画面共有', '画面共有を開始しました')
}

const handleOpenWhiteboard = () => {
  // ホワイトボードを開く
  currentView.value = 'whiteboard'
  addNotification('info', 'ホワイトボード', 'ホワイトボードを開きました')
}

const handleNotificationClick = (notification: Notification) => {
  // 通知をクリックした時の処理
  dismissNotification(notification.id)
  addNotification('info', '通知', '通知を確認しました')
}

const handleErrorRetry = () => {
  // エラー時の再試行処理
  console.log('エラーからの復旧を試行しています...')

  // アプリケーション状態をリセット
  isLoading.value = true
  loadingMessage.value = 'システムを復旧中...'

  // 接続をリセット
  connectedUsers.value = []
  avatarPosition.value = { x: 200, y: 200 }

  setTimeout(() => {
    isLoading.value = false
    addNotification('success', '復旧完了', 'システムが正常に復旧しました')
    currentView.value = 'virtual-office'
  }, 2000)
}

// 初期化
onMounted(() => {
  // 初期化処理
  isLoading.value = true
  loadingMessage.value = '3D空間を初期化中...'

  setTimeout(() => {
    isLoading.value = false
    addNotification('success', '初期化完了', '3Dバーチャルオフィスが準備完了しました')
  }, 2000)

  // デモ用の定期的な通知
  setInterval(() => {
    if (Math.random() > 0.7) {
      const messages = [
        'ユーザーが入室しました',
        '新しいメッセージが届きました',
        'システムが更新されました'
      ]
      const randomMessage = messages[Math.floor(Math.random() * messages.length)]
      addNotification('info', 'システム通知', randomMessage)
    }
  }, 10000)
})
</script>

<style scoped>
.main-app {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.main-content {
  width: 100%;
  height: 100%;
  position: relative;
}

.view-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.threejs-controls {
  position: fixed;
  top: var(--spacing-4);
  left: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  z-index: 100;
}

.control-btn {
  background: rgba(255, 255, 255, 0.9);
  border: none;
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-normal);
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  font-size: var(--text-sm);
  font-weight: 500;
  box-shadow: var(--shadow-sm);
  min-width: 140px;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 1);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.control-btn.active {
  background: var(--color-primary);
  color: white;
}

.btn-icon {
  font-size: 1.1em;
}

.notifications-container {
  position: fixed;
  top: var(--spacing-4);
  right: var(--spacing-4);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  max-width: 400px;
}

.notification {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
  box-shadow: var(--shadow-lg);
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-3);
  cursor: pointer;
  transition: var(--transition-normal);
  animation: slideInRight 0.3s ease-out;
}

.notification:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-xl);
}

.notification.info {
  border-left: 4px solid var(--color-blue-500);
}

.notification.success {
  border-left: 4px solid var(--color-green-500);
}

.notification.warning {
  border-left: 4px solid var(--color-yellow-500);
}

.notification.error {
  border-left: 4px solid var(--color-red-500);
}

.notification-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-weight: 600;
  margin-bottom: var(--spacing-1);
  color: var(--color-gray-900);
}

.notification-message {
  font-size: var(--text-sm);
  color: var(--color-gray-600);
  line-height: 1.4;
}

.notification-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: var(--color-gray-400);
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: var(--transition-normal);
}

.notification-close:hover {
  background: var(--color-gray-200);
  color: var(--color-gray-600);
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.loading-content {
  text-align: center;
  color: var(--color-gray-700);
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid var(--color-gray-300);
  border-top: 4px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto var(--spacing-4) auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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

/* レスポンシブデザイン */
@media (max-width: 768px) {
  .threejs-controls {
    flex-direction: row;
    top: auto;
    bottom: var(--spacing-4);
    left: 50%;
    transform: translateX(-50%);
  }

  .control-btn {
    min-width: auto;
    padding: var(--spacing-2);
  }

  .notifications-container {
    left: var(--spacing-2);
    right: var(--spacing-2);
    max-width: none;
  }

  .notification {
    padding: var(--spacing-3);
  }
}
</style>
