<template>
  <div class="mobile-enhancements">
    <!-- モバイル専用ヘッダー -->
    <div v-if="isMobile" class="mobile-header">
      <div class="mobile-header-content">
        <button class="mobile-menu-toggle" @click="toggleMobileMenu">
          <span class="hamburger-icon">☰</span>
        </button>
        <h1 class="mobile-title">{{ currentPageTitle }}</h1>
        <div class="mobile-actions">
          <button class="mobile-action-btn" @click="toggleSearch">
            <span>🔍</span>
          </button>
          <button class="mobile-action-btn" @click="toggleNotifications">
            <span>🔔</span>
            <span v-if="notificationCount > 0" class="notification-count">{{ notificationCount }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- モバイル検索バー -->
    <div v-if="isMobile && showSearch" class="mobile-search-overlay">
      <div class="mobile-search-container">
        <div class="search-input-wrapper">
          <input
            type="text"
            v-model="searchQuery"
            class="mobile-search-input"
            placeholder="検索..."
            @input="performSearch"
            ref="searchInput"
          >
          <button class="search-clear-btn" @click="clearSearch" v-if="searchQuery">
            <span>✕</span>
          </button>
        </div>
        <button class="search-close-btn" @click="toggleSearch">
          キャンセル
        </button>
      </div>
      <div class="search-results" v-if="searchResults.length > 0">
        <div
          v-for="result in searchResults"
          :key="result.id"
          class="search-result-item"
          @click="selectSearchResult(result)"
        >
          <div class="result-icon">{{ result.icon }}</div>
          <div class="result-content">
            <div class="result-title">{{ result.title }}</div>
            <div class="result-description">{{ result.description }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- スワイプナビゲーション -->
    <div v-if="isMobile" class="swipe-navigation"
         @touchstart="handleTouchStart"
         @touchmove="handleTouchMove"
         @touchend="handleTouchEnd">

      <!-- タブインジケーター -->
      <div class="tab-indicators">
        <div
          v-for="(tab, index) in tabs"
          :key="tab.id"
          class="tab-indicator"
          :class="{ 'active': currentTabIndex === index }"
          @click="switchToTab(index)"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-label">{{ tab.label }}</span>
        </div>
      </div>

      <!-- スワイプ可能なコンテンツ -->
      <div class="swipe-content" :style="{ transform: `translateX(${swipeOffset}px)` }">
        <div
          v-for="(tab, index) in tabs"
          :key="tab.id"
          class="swipe-panel"
          :class="{ 'active': currentTabIndex === index }"
        >
          <component :is="tab.component" v-bind="tab.props" />
        </div>
      </div>
    </div>

    <!-- プルトゥリフレッシュ -->
    <div v-if="isMobile && enablePullToRefresh" class="pull-to-refresh"
         @touchstart="handlePullStart"
         @touchmove="handlePullMove"
         @touchend="handlePullEnd">
      <div class="pull-indicator" :style="{ transform: `translateY(${pullDistance}px)` }">
        <div class="pull-icon" :class="{ 'spinning': isRefreshing }">
          {{ isRefreshing ? '🔄' : '⬇️' }}
        </div>
        <div class="pull-text">
          {{ pullText }}
        </div>
      </div>
    </div>

    <!-- モバイル専用フローティングボタン -->
    <div v-if="isMobile" class="mobile-fab-container">
      <div class="fab-group" :class="{ 'expanded': fabExpanded }">
        <!-- サブアクション -->
        <button
          v-for="action in fabActions"
          :key="action.id"
          class="fab-sub-action"
          @click="handleFabAction(action)"
          :title="action.label"
        >
          <span>{{ action.icon }}</span>
        </button>

        <!-- メインFAB -->
        <button
          class="fab-main-mobile"
          @click="toggleFab"
          :class="{ 'active': fabExpanded }"
        >
          <span>{{ fabExpanded ? '✕' : '⚡' }}</span>
        </button>
      </div>
    </div>

    <!-- ボトムシート -->
    <div v-if="isMobile && showBottomSheet" class="bottom-sheet-overlay" @click="closeBottomSheet">
      <div class="bottom-sheet" @click.stop>
        <div class="bottom-sheet-handle"></div>
        <div class="bottom-sheet-header">
          <h3>{{ bottomSheetTitle }}</h3>
          <button class="close-bottom-sheet" @click="closeBottomSheet">✕</button>
        </div>
        <div class="bottom-sheet-content">
          <component :is="bottomSheetComponent" v-bind="bottomSheetProps" />
        </div>
      </div>
    </div>

    <!-- タッチジェスチャーヘルプ -->
    <div v-if="isMobile && showGestureHelp" class="gesture-help-overlay" @click="hideGestureHelp">
      <div class="gesture-help-content">
        <h3>タッチジェスチャー</h3>
        <div class="gesture-list">
          <div class="gesture-item">
            <div class="gesture-icon">👆</div>
            <div class="gesture-description">
              <strong>タップ</strong><br>
              選択・実行
            </div>
          </div>
          <div class="gesture-item">
            <div class="gesture-icon">👈👉</div>
            <div class="gesture-description">
              <strong>スワイプ</strong><br>
              ページ切り替え
            </div>
          </div>
          <div class="gesture-item">
            <div class="gesture-icon">👆👆</div>
            <div class="gesture-description">
              <strong>ダブルタップ</strong><br>
              ズーム
            </div>
          </div>
          <div class="gesture-item">
            <div class="gesture-icon">🤏</div>
            <div class="gesture-description">
              <strong>ピンチ</strong><br>
              拡大・縮小
            </div>
          </div>
          <div class="gesture-item">
            <div class="gesture-icon">⬇️</div>
            <div class="gesture-description">
              <strong>プルダウン</strong><br>
              更新
            </div>
          </div>
          <div class="gesture-item">
            <div class="gesture-icon">👆📱</div>
            <div class="gesture-description">
              <strong>長押し</strong><br>
              コンテキストメニュー
            </div>
          </div>
        </div>
        <button class="btn btn-primary" @click="hideGestureHelp">
          理解しました
        </button>
      </div>
    </div>

    <!-- 音声入力 -->
    <div v-if="isMobile && showVoiceInput" class="voice-input-overlay">
      <div class="voice-input-content">
        <div class="voice-animation" :class="{ 'listening': isListening }">
          <div class="voice-wave"></div>
          <div class="voice-wave"></div>
          <div class="voice-wave"></div>
        </div>
        <h3>{{ isListening ? '聞いています...' : '音声入力' }}</h3>
        <p>{{ voiceInputText || 'マイクボタンを押して話してください' }}</p>
        <div class="voice-controls">
          <button
            class="voice-btn"
            @click="toggleVoiceInput"
            :class="{ 'active': isListening }"
          >
            <span>{{ isListening ? '⏹️' : '🎤' }}</span>
          </button>
          <button class="voice-close-btn" @click="closeVoiceInput">
            キャンセル
          </button>
        </div>
      </div>
    </div>

    <!-- ハプティックフィードバック設定 -->
    <div v-if="isMobile" class="haptic-settings" v-show="showHapticSettings">
      <div class="haptic-content">
        <h3>触覚フィードバック設定</h3>
        <div class="haptic-options">
          <label class="haptic-option">
            <input type="checkbox" v-model="hapticEnabled" @change="updateHapticSettings">
            <span class="haptic-label">触覚フィードバックを有効にする</span>
          </label>
          <div v-if="hapticEnabled" class="haptic-intensity">
            <label>強度</label>
            <input
              type="range"
              min="1"
              max="3"
              v-model="hapticIntensity"
              @change="updateHapticSettings"
              class="haptic-slider"
            >
            <div class="intensity-labels">
              <span>弱</span>
              <span>中</span>
              <span>強</span>
            </div>
          </div>
          <button class="btn btn-secondary" @click="testHaptic">
            フィードバックをテスト
          </button>
        </div>
      </div>
    </div>

    <!-- アクセシビリティ支援 -->
    <div v-if="isMobile && accessibilityMode" class="accessibility-overlay">
      <div class="accessibility-controls">
        <button class="accessibility-btn" @click="increaseFontSize">
          <span>🔍+</span>
          <span>文字を大きく</span>
        </button>
        <button class="accessibility-btn" @click="decreaseFontSize">
          <span>🔍-</span>
          <span>文字を小さく</span>
        </button>
        <button class="accessibility-btn" @click="toggleHighContrast">
          <span>🎨</span>
          <span>高コントラスト</span>
        </button>
        <button class="accessibility-btn" @click="toggleScreenReader">
          <span>🔊</span>
          <span>音声読み上げ</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'

interface Tab {
  id: string
  label: string
  icon: string
  component: string
  props?: any
}

interface SearchResult {
  id: string
  title: string
  description: string
  icon: string
  type: string
}

interface FabAction {
  id: string
  label: string
  icon: string
  action: string
}

// リアクティブデータ
const isMobile = ref(window.innerWidth <= 768)
const showMobileMenu = ref(false)
const showSearch = ref(false)
const showBottomSheet = ref(false)
const showGestureHelp = ref(false)
const showVoiceInput = ref(false)
const showHapticSettings = ref(false)
const accessibilityMode = ref(false)

const searchQuery = ref('')
const searchInput = ref<HTMLInputElement>()
const currentPageTitle = ref('バーチャルオフィス')
const notificationCount = ref(3)

// スワイプナビゲーション
const currentTabIndex = ref(0)
const swipeOffset = ref(0)
const swipeStartX = ref(0)
const swipeStartY = ref(0)
const isSwipingHorizontal = ref(false)

// プルトゥリフレッシュ
const enablePullToRefresh = ref(true)
const pullDistance = ref(0)
const pullStartY = ref(0)
const isRefreshing = ref(false)
const pullThreshold = 80

// FAB
const fabExpanded = ref(false)

// ボトムシート
const bottomSheetTitle = ref('')
const bottomSheetComponent = ref('')
const bottomSheetProps = ref({})

// 音声入力
const isListening = ref(false)
const voiceInputText = ref('')

// ハプティック
const hapticEnabled = ref(true)
const hapticIntensity = ref(2)

// フォントサイズ
const currentFontSize = ref(16)

const tabs = reactive<Tab[]>([
  { id: 'workspace', label: 'ワークスペース', icon: '🏢', component: 'VirtualOfficeSpace' },
  { id: 'chat', label: 'チャット', icon: '💬', component: 'RealTimeCollaboration' },
  { id: 'meetings', label: 'ミーティング', icon: '📹', component: 'MeetingScheduler' },
  { id: 'files', label: 'ファイル', icon: '📁', component: 'FileManager' },
  { id: 'settings', label: '設定', icon: '⚙️', component: 'OfficeSettings' }
])

const fabActions = reactive<FabAction[]>([
  { id: 'voice', label: '音声入力', icon: '🎤', action: 'voice' },
  { id: 'camera', label: 'カメラ', icon: '📷', action: 'camera' },
  { id: 'share', label: '共有', icon: '📤', action: 'share' },
  { id: 'help', label: 'ヘルプ', icon: '❓', action: 'help' }
])

const searchResults = reactive<SearchResult[]>([])

// 計算プロパティ
const pullText = computed(() => {
  if (isRefreshing.value) return '更新中...'
  if (pullDistance.value > pullThreshold) return '離して更新'
  return '下に引いて更新'
})

// メソッド
const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value
  triggerHaptic('light')
}

const toggleSearch = () => {
  showSearch.value = !showSearch.value
  if (showSearch.value) {
    nextTick(() => {
      searchInput.value?.focus()
    })
  } else {
    searchQuery.value = ''
    searchResults.splice(0)
  }
  triggerHaptic('light')
}

const toggleNotifications = () => {
  // 通知パネルを開く
  openBottomSheet('通知', 'NotificationPanel', {})
  triggerHaptic('medium')
}

const clearSearch = () => {
  searchQuery.value = ''
  searchResults.splice(0)
}

const performSearch = () => {
  if (!searchQuery.value) {
    searchResults.splice(0)
    return
  }

  // 模擬検索結果
  const mockResults: SearchResult[] = [
    { id: '1', title: 'ワークスペース設定', description: 'オフィスレイアウトをカスタマイズ', icon: '🏢', type: 'setting' },
    { id: '2', title: 'チーム会議', description: '今日の予定されたミーティング', icon: '📹', type: 'meeting' },
    { id: '3', title: 'プロジェクトファイル', description: '共有ドキュメントとリソース', icon: '📁', type: 'file' },
    { id: '4', title: 'AIアシスタント', description: '生産性向上のためのAIサポート', icon: '🤖', type: 'tool' }
  ]

  searchResults.splice(0)
  searchResults.push(...mockResults.filter(result =>
    result.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    result.description.toLowerCase().includes(searchQuery.value.toLowerCase())
  ))
}

const selectSearchResult = (result: SearchResult) => {
  console.log('検索結果選択:', result)
  toggleSearch()
  triggerHaptic('medium')
}

// スワイプナビゲーション
const switchToTab = (index: number) => {
  currentTabIndex.value = index
  swipeOffset.value = -index * window.innerWidth
  triggerHaptic('light')
}

const handleTouchStart = (event: TouchEvent) => {
  swipeStartX.value = event.touches[0].clientX
  swipeStartY.value = event.touches[0].clientY
  isSwipingHorizontal.value = false
}

const handleTouchMove = (event: TouchEvent) => {
  const currentX = event.touches[0].clientX
  const currentY = event.touches[0].clientY
  const deltaX = currentX - swipeStartX.value
  const deltaY = currentY - swipeStartY.value

  if (!isSwipingHorizontal.value && Math.abs(deltaX) > Math.abs(deltaY)) {
    isSwipingHorizontal.value = true
  }

  if (isSwipingHorizontal.value) {
    event.preventDefault()
    const baseOffset = -currentTabIndex.value * window.innerWidth
    swipeOffset.value = baseOffset + deltaX
  }
}

const handleTouchEnd = (event: TouchEvent) => {
  if (!isSwipingHorizontal.value) return

  const deltaX = event.changedTouches[0].clientX - swipeStartX.value
  const threshold = window.innerWidth * 0.3

  if (Math.abs(deltaX) > threshold) {
    if (deltaX > 0 && currentTabIndex.value > 0) {
      switchToTab(currentTabIndex.value - 1)
    } else if (deltaX < 0 && currentTabIndex.value < tabs.length - 1) {
      switchToTab(currentTabIndex.value + 1)
    } else {
      switchToTab(currentTabIndex.value)
    }
  } else {
    switchToTab(currentTabIndex.value)
  }

  triggerHaptic('medium')
}

// プルトゥリフレッシュ
const handlePullStart = (event: TouchEvent) => {
  pullStartY.value = event.touches[0].clientY
}

const handlePullMove = (event: TouchEvent) => {
  const currentY = event.touches[0].clientY
  const deltaY = currentY - pullStartY.value

  if (deltaY > 0 && window.scrollY === 0) {
    event.preventDefault()
    pullDistance.value = Math.min(deltaY * 0.5, pullThreshold * 1.5)
  }
}

const handlePullEnd = () => {
  if (pullDistance.value > pullThreshold) {
    performRefresh()
  } else {
    pullDistance.value = 0
  }
}

const performRefresh = async () => {
  isRefreshing.value = true
  triggerHaptic('heavy')

  // 模擬的な更新処理
  await new Promise(resolve => setTimeout(resolve, 2000))

  isRefreshing.value = false
  pullDistance.value = 0

  // 成功フィードバック
  triggerHaptic('success')
}

// FAB
const toggleFab = () => {
  fabExpanded.value = !fabExpanded.value
  triggerHaptic('light')
}

const handleFabAction = (action: FabAction) => {
  console.log('FABアクション:', action)

  switch (action.action) {
    case 'voice':
      showVoiceInput.value = true
      break
    case 'camera':
      // カメラ機能
      break
    case 'share':
      // 共有機能
      break
    case 'help':
      showGestureHelp.value = true
      break
  }

  fabExpanded.value = false
  triggerHaptic('medium')
}

// ボトムシート
const openBottomSheet = (title: string, component: string, props: any = {}) => {
  bottomSheetTitle.value = title
  bottomSheetComponent.value = component
  bottomSheetProps.value = props
  showBottomSheet.value = true
  triggerHaptic('light')
}

const closeBottomSheet = () => {
  showBottomSheet.value = false
  triggerHaptic('light')
}

// 音声入力
const toggleVoiceInput = () => {
  isListening.value = !isListening.value

  if (isListening.value) {
    startVoiceRecognition()
  } else {
    stopVoiceRecognition()
  }

  triggerHaptic('medium')
}

const startVoiceRecognition = () => {
  // Web Speech API実装
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.lang = 'ja-JP'
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onresult = (event: any) => {
      voiceInputText.value = event.results[0][0].transcript
    }

    recognition.onend = () => {
      isListening.value = false
    }

    recognition.start()
  }
}

const stopVoiceRecognition = () => {
  // 音声認識停止
}

const closeVoiceInput = () => {
  showVoiceInput.value = false
  isListening.value = false
  voiceInputText.value = ''
}

// ハプティックフィードバック
const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' = 'light') => {
  if (!hapticEnabled.value || !navigator.vibrate) return

  const patterns = {
    light: [10],
    medium: [50],
    heavy: [100],
    success: [50, 50, 50]
  }

  navigator.vibrate(patterns[type])
}

const updateHapticSettings = () => {
  // ハプティック設定の保存
  localStorage.setItem('hapticEnabled', hapticEnabled.value.toString())
  localStorage.setItem('hapticIntensity', hapticIntensity.value.toString())
}

const testHaptic = () => {
  triggerHaptic('medium')
}

// アクセシビリティ
const increaseFontSize = () => {
  currentFontSize.value = Math.min(currentFontSize.value + 2, 24)
  updateFontSize()
  triggerHaptic('light')
}

const decreaseFontSize = () => {
  currentFontSize.value = Math.max(currentFontSize.value - 2, 12)
  updateFontSize()
  triggerHaptic('light')
}

const updateFontSize = () => {
  document.documentElement.style.fontSize = `${currentFontSize.value}px`
}

const toggleHighContrast = () => {
  document.body.classList.toggle('high-contrast')
  triggerHaptic('medium')
}

const toggleScreenReader = () => {
  // スクリーンリーダー対応
  triggerHaptic('medium')
}

const hideGestureHelp = () => {
  showGestureHelp.value = false
  localStorage.setItem('gestureHelpShown', 'true')
}

// リサイズハンドラー
const handleResize = () => {
  isMobile.value = window.innerWidth <= 768
  if (!isMobile.value) {
    showMobileMenu.value = false
    showSearch.value = false
    showBottomSheet.value = false
  }
}

// ライフサイクル
onMounted(() => {
  window.addEventListener('resize', handleResize)

  // 初回訪問時のジェスチャーヘルプ表示
  if (!localStorage.getItem('gestureHelpShown')) {
    setTimeout(() => {
      showGestureHelp.value = true
    }, 2000)
  }

  // 保存された設定の読み込み
  const savedHaptic = localStorage.getItem('hapticEnabled')
  if (savedHaptic !== null) {
    hapticEnabled.value = savedHaptic === 'true'
  }

  const savedIntensity = localStorage.getItem('hapticIntensity')
  if (savedIntensity !== null) {
    hapticIntensity.value = parseInt(savedIntensity)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.mobile-enhancements {
  position: relative;
}

/* モバイルヘッダー */
.mobile-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: var(--bg-creative);
  color: white;
  z-index: var(--z-fixed);
  box-shadow: var(--shadow-md);
}

.mobile-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-3) var(--spacing-4);
  height: 60px;
}

.mobile-menu-toggle {
  background: none;
  border: none;
  color: white;
  font-size: var(--text-xl);
  cursor: pointer;
  padding: var(--spacing-2);
  border-radius: var(--radius-md);
  transition: var(--transition-normal);
}

.mobile-menu-toggle:hover {
  background: rgba(255, 255, 255, 0.1);
}

.mobile-title {
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
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
  font-size: var(--text-lg);
  cursor: pointer;
  padding: var(--spacing-2);
  border-radius: var(--radius-md);
  transition: var(--transition-normal);
}

.mobile-action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.notification-count {
  position: absolute;
  top: 0;
  right: 0;
  background: var(--color-error);
  color: white;
  font-size: var(--text-xs);
  padding: var(--spacing-1);
  border-radius: 50%;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-bold);
}

/* モバイル検索 */
.mobile-search-overlay {
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-primary);
  z-index: var(--z-modal);
  animation: slideInDown 0.3s ease-out;
}

.mobile-search-container {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  border-bottom: 1px solid var(--border-color);
}

.search-input-wrapper {
  flex: 1;
  position: relative;
}

.mobile-search-input {
  width: 100%;
  padding: var(--spacing-3) var(--spacing-4);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-full);
  font-size: var(--text-base);
  background: var(--bg-secondary);
}

.mobile-search-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.search-clear-btn {
  position: absolute;
  right: var(--spacing-2);
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: var(--spacing-1);
}

.search-close-btn {
  background: none;
  border: none;
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  padding: var(--spacing-2);
}

.search-results {
  padding: var(--spacing-2);
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition-normal);
}

.search-result-item:hover {
  background: var(--bg-secondary);
}

.result-icon {
  font-size: var(--text-xl);
  width: 40px;
  text-align: center;
}

.result-content {
  flex: 1;
}

.result-title {
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-bottom: var(--spacing-1);
}

.result-description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

/* スワイプナビゲーション */
.swipe-navigation {
  position: relative;
  height: 100vh;
  overflow: hidden;
}

.tab-indicators {
  display: flex;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 60px;
  z-index: var(--z-sticky);
}

.tab-indicator {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-2);
  cursor: pointer;
  transition: var(--transition-normal);
  border-bottom: 2px solid transparent;
}

.tab-indicator.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.tab-icon {
  font-size: var(--text-lg);
  margin-bottom: var(--spacing-1);
}

.tab-label {
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
}

.swipe-content {
  display: flex;
  width: 500vw;
  height: calc(100vh - 120px);
  transition: transform 0.3s ease-out;
}

.swipe-panel {
  width: 100vw;
  height: 100%;
  overflow-y: auto;
  padding: var(--spacing-4);
}

/* プルトゥリフレッシュ */
.pull-to-refresh {
  position: absolute;
  top: -100px;
  left: 0;
  right: 0;
  height: 100px;
  z-index: var(--z-sticky);
}

.pull-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: var(--bg-primary);
  border-radius: 0 0 var(--radius-xl) var(--radius-xl);
  box-shadow: var(--shadow-md);
}

.pull-icon {
  font-size: var(--text-2xl);
  margin-bottom: var(--spacing-2);
  transition: var(--transition-normal);
}

.pull-icon.spinning {
  animation: spin 1s linear infinite;
}

.pull-text {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
}

/* モバイルFAB */
.mobile-fab-container {
  position: fixed;
  bottom: var(--spacing-6);
  right: var(--spacing-4);
  z-index: var(--z-fixed);
}

.fab-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-2);
}

.fab-sub-action {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 2px solid var(--border-color);
  cursor: pointer;
  font-size: var(--text-lg);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-normal);
  opacity: 0;
  transform: scale(0);
}

.fab-group.expanded .fab-sub-action {
  opacity: 1;
  transform: scale(1);
}

.fab-main-mobile {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--bg-creative);
  color: white;
  border: none;
  cursor: pointer;
  font-size: var(--text-xl);
  font-weight: var(--font-weight-bold);
  box-shadow: var(--shadow-xl);
  transition: all var(--transition-normal);
  order: 999;
}

.fab-main-mobile:hover {
  transform: scale(1.1);
}

.fab-main-mobile.active {
  transform: rotate(45deg);
}

/* ボトムシート */
.bottom-sheet-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: var(--z-modal);
  display: flex;
  align-items: flex-end;
  animation: fadeIn 0.3s ease-out;
}

.bottom-sheet {
  background: var(--bg-primary);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  width: 100%;
  max-height: 80vh;
  animation: slideInUp 0.3s ease-out;
}

.bottom-sheet-handle {
  width: 40px;
  height: 4px;
  background: var(--color-gray-300);
  border-radius: 2px;
  margin: var(--spacing-2) auto;
}

.bottom-sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-4);
  border-bottom: 1px solid var(--border-color);
}

.bottom-sheet-header h3 {
  margin: 0;
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
}

.close-bottom-sheet {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: var(--text-lg);
  cursor: pointer;
  padding: var(--spacing-1);
}

.bottom-sheet-content {
  padding: var(--spacing-4);
  max-height: 60vh;
  overflow-y: auto;
}

/* ジェスチャーヘルプ */
.gesture-help-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-4);
  animation: fadeIn 0.3s ease-out;
}

.gesture-help-content {
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  padding: var(--spacing-6);
  max-width: 400px;
  width: 100%;
  text-align: center;
}

.gesture-help-content h3 {
  margin: 0 0 var(--spacing-4) 0;
  color: var(--color-primary);
  font-size: var(--text-xl);
}

.gesture-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-6);
}

.gesture-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--spacing-3);
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
}

.gesture-icon {
  font-size: var(--text-2xl);
  margin-bottom: var(--spacing-2);
}

.gesture-description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

/* 音声入力 */
.voice-input-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-4);
  animation: fadeIn 0.3s ease-out;
}

.voice-input-content {
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  padding: var(--spacing-6);
  text-align: center;
  min-width: 300px;
}

.voice-animation {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-1);
  margin-bottom: var(--spacing-4);
  height: 60px;
}

.voice-wave {
  width: 4px;
  height: 20px;
  background: var(--color-primary);
  border-radius: 2px;
  animation: voice-wave 1.5s ease-in-out infinite;
}

.voice-wave:nth-child(2) {
  animation-delay: 0.3s;
}

.voice-wave:nth-child(3) {
  animation-delay: 0.6s;
}

.voice-animation.listening .voice-wave {
  animation-play-state: running;
}

.voice-animation:not(.listening) .voice-wave {
  animation-play-state: paused;
}

@keyframes voice-wave {
  0%, 100% { height: 20px; }
  50% { height: 40px; }
}

.voice-controls {
  display: flex;
  gap: var(--spacing-3);
  justify-content: center;
  margin-top: var(--spacing-4);
}

.voice-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  border: none;
  cursor: pointer;
  font-size: var(--text-2xl);
  transition: var(--transition-normal);
}

.voice-btn.active {
  background: var(--color-error);
  animation: pulse-creative 1s infinite;
}

.voice-close-btn {
  background: var(--color-gray-200);
  color: var(--text-primary);
  border: none;
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-weight: var(--font-weight-medium);
}

/* ハプティック設定 */
.haptic-settings {
  position: fixed;
  bottom: 100px;
  right: var(--spacing-4);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-popover);
  animation: slideInUp 0.3s ease-out;
}

.haptic-content {
  padding: var(--spacing-4);
  min-width: 250px;
}

.haptic-content h3 {
  margin: 0 0 var(--spacing-3) 0;
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
}

.haptic-options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.haptic-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  cursor: pointer;
}

.haptic-intensity {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.haptic-slider {
  width: 100%;
}

.intensity-labels {
  display: flex;
  justify-content: space-between;
  font-size: var(--text-xs);
  color: var(--text-muted);
}

/* アクセシビリティ */
.accessibility-overlay {
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  z-index: var(--z-sticky);
  animation: slideInDown 0.3s ease-out;
}

.accessibility-controls {
  display: flex;
  gap: var(--spacing-2);
  padding: var(--spacing-3);
  overflow-x: auto;
}

.accessibility-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-1);
  padding: var(--spacing-2);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-size: var(--text-xs);
  white-space: nowrap;
  min-width: 80px;
  transition: var(--transition-normal);
}

.accessibility-btn:hover {
  background: var(--color-primary);
  color: white;
}

.accessibility-btn span:first-child {
  font-size: var(--text-lg);
}

/* 高コントラストモード */
.high-contrast {
  filter: contrast(150%);
}

/* レスポンシブ対応 */
@media (max-width: 480px) {
  .mobile-header-content {
    padding: var(--spacing-2) var(--spacing-3);
  }

  .mobile-title {
    font-size: var(--text-base);
  }

  .gesture-list {
    grid-template-columns: 1fr;
  }

  .voice-input-content {
    min-width: auto;
    width: 100%;
  }

  .haptic-content {
    min-width: 200px;
  }
}
</style>
