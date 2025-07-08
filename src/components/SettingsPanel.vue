<template>
  <div class="settings-panel" :class="{ 'panel-open': isOpen }">
    <!-- 設定パネルオーバーレイ -->
    <div v-if="isOpen" class="settings-overlay" @click="closeSettings"></div>

    <!-- 設定パネル -->
    <div class="settings-container">
      <!-- 設定ヘッダー -->
      <div class="settings-header">
        <div class="header-content">
          <h2>⚙️ 設定</h2>
          <button @click="closeSettings" class="close-btn">
            <span class="close-icon">✕</span>
          </button>
        </div>
      </div>

      <!-- 設定タブ -->
      <div class="settings-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-label">{{ tab.label }}</span>
        </button>
      </div>

      <!-- 設定コンテンツ -->
      <div class="settings-content">
        <!-- 一般設定 -->
        <div v-if="activeTab === 'general'" class="settings-section">
          <h3>🔧 一般設定</h3>

          <div class="setting-group">
            <label class="setting-label">ユーザー名</label>
            <input v-model="settings.userName" class="setting-input" type="text" />
          </div>

          <div class="setting-group">
            <label class="setting-label">言語</label>
            <select v-model="settings.language" class="setting-select">
              <option value="ja">日本語</option>
              <option value="en">English</option>
              <option value="ko">한국어</option>
              <option value="zh">中文</option>
            </select>
          </div>

          <div class="setting-group">
            <label class="setting-label">テーマ</label>
            <div class="theme-options">
              <button
                v-for="theme in themes"
                :key="theme.id"
                @click="settings.theme = theme.id"
                class="theme-btn"
                :class="{ active: settings.theme === theme.id }"
              >
                <div class="theme-preview" :style="{ background: theme.color }"></div>
                <span class="theme-name">{{ theme.name }}</span>
              </button>
            </div>
          </div>

          <div class="setting-group">
            <label class="setting-checkbox">
              <input v-model="settings.notifications" type="checkbox" />
              <span class="checkbox-label">通知を有効にする</span>
            </label>
          </div>

          <div class="setting-group">
            <label class="setting-checkbox">
              <input v-model="settings.autoSave" type="checkbox" />
              <span class="checkbox-label">自動保存を有効にする</span>
            </label>
          </div>
        </div>

        <!-- 表示設定 -->
        <div v-if="activeTab === 'display'" class="settings-section">
          <h3>🎨 表示設定</h3>

          <div class="setting-group">
            <label class="setting-label">表示モード</label>
            <div class="radio-group">
              <label class="radio-option">
                <input v-model="settings.displayMode" type="radio" value="2d" />
                <span class="radio-label">2D表示</span>
              </label>
              <label class="radio-option">
                <input v-model="settings.displayMode" type="radio" value="3d" />
                <span class="radio-label">3D表示</span>
              </label>
            </div>
          </div>

          <div class="setting-group">
            <label class="setting-label">画質設定</label>
            <select v-model="settings.quality" class="setting-select">
              <option value="low">低画質</option>
              <option value="medium">標準画質</option>
              <option value="high">高画質</option>
              <option value="ultra">最高画質</option>
            </select>
          </div>

          <div class="setting-group">
            <label class="setting-label">フレームレート</label>
            <div class="slider-container">
              <input
                v-model="settings.frameRate"
                type="range"
                min="30"
                max="120"
                step="10"
                class="setting-slider"
              />
              <span class="slider-value">{{ settings.frameRate }}fps</span>
            </div>
          </div>

          <div class="setting-group">
            <label class="setting-checkbox">
              <input v-model="settings.showFPS" type="checkbox" />
              <span class="checkbox-label">FPSを表示</span>
            </label>
          </div>

          <div class="setting-group">
            <label class="setting-checkbox">
              <input v-model="settings.showDebugInfo" type="checkbox" />
              <span class="checkbox-label">デバッグ情報を表示</span>
            </label>
          </div>
        </div>

        <!-- 音声・ビデオ設定 -->
        <div v-if="activeTab === 'audio'" class="settings-section">
          <h3>🎵 音声・ビデオ設定</h3>

          <div class="setting-group">
            <label class="setting-label">マイク</label>
            <select v-model="settings.microphoneId" class="setting-select">
              <option value="">デフォルト</option>
              <option v-for="device in audioDevices.microphones" :key="device.deviceId" :value="device.deviceId">
                {{ device.label }}
              </option>
            </select>
          </div>

          <div class="setting-group">
            <label class="setting-label">スピーカー</label>
            <select v-model="settings.speakerId" class="setting-select">
              <option value="">デフォルト</option>
              <option v-for="device in audioDevices.speakers" :key="device.deviceId" :value="device.deviceId">
                {{ device.label }}
              </option>
            </select>
          </div>

          <div class="setting-group">
            <label class="setting-label">カメラ</label>
            <select v-model="settings.cameraId" class="setting-select">
              <option value="">デフォルト</option>
              <option v-for="device in audioDevices.cameras" :key="device.deviceId" :value="device.deviceId">
                {{ device.label }}
              </option>
            </select>
          </div>

          <div class="setting-group">
            <label class="setting-label">音量</label>
            <div class="slider-container">
              <input
                v-model="settings.volume"
                type="range"
                min="0"
                max="100"
                class="setting-slider"
              />
              <span class="slider-value">{{ settings.volume }}%</span>
            </div>
          </div>

          <div class="setting-group">
            <label class="setting-checkbox">
              <input v-model="settings.noiseSuppression" type="checkbox" />
              <span class="checkbox-label">ノイズ抑制を有効にする</span>
            </label>
          </div>

          <div class="setting-group">
            <label class="setting-checkbox">
              <input v-model="settings.echoCancellation" type="checkbox" />
              <span class="checkbox-label">エコーキャンセレーションを有効にする</span>
            </label>
          </div>

          <div class="setting-group">
            <label class="setting-checkbox">
              <input v-model="settings.autoGainControl" type="checkbox" />
              <span class="checkbox-label">自動ゲイン制御を有効にする</span>
            </label>
          </div>
        </div>

        <!-- キーボード設定 -->
        <div v-if="activeTab === 'keyboard'" class="settings-section">
          <h3>⌨️ キーボード設定</h3>

          <div class="setting-group">
            <label class="setting-label">移動キー</label>
            <div class="key-bindings">
              <div class="key-binding">
                <span class="key-label">上移動</span>
                <button class="key-btn" @click="captureKey('moveUp')">
                  {{ settings.keyBindings.moveUp }}
                </button>
              </div>
              <div class="key-binding">
                <span class="key-label">下移動</span>
                <button class="key-btn" @click="captureKey('moveDown')">
                  {{ settings.keyBindings.moveDown }}
                </button>
              </div>
              <div class="key-binding">
                <span class="key-label">左移動</span>
                <button class="key-btn" @click="captureKey('moveLeft')">
                  {{ settings.keyBindings.moveLeft }}
                </button>
              </div>
              <div class="key-binding">
                <span class="key-label">右移動</span>
                <button class="key-btn" @click="captureKey('moveRight')">
                  {{ settings.keyBindings.moveRight }}
                </button>
              </div>
            </div>
          </div>

          <div class="setting-group">
            <label class="setting-label">ショートカットキー</label>
            <div class="key-bindings">
              <div class="key-binding">
                <span class="key-label">チャット開く</span>
                <button class="key-btn" @click="captureKey('toggleChat')">
                  {{ settings.keyBindings.toggleChat }}
                </button>
              </div>
              <div class="key-binding">
                <span class="key-label">ミュート切り替え</span>
                <button class="key-btn" @click="captureKey('toggleMute')">
                  {{ settings.keyBindings.toggleMute }}
                </button>
              </div>
              <div class="key-binding">
                <span class="key-label">ビデオ切り替え</span>
                <button class="key-btn" @click="captureKey('toggleVideo')">
                  {{ settings.keyBindings.toggleVideo }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- プライバシー設定 -->
        <div v-if="activeTab === 'privacy'" class="settings-section">
          <h3>🔒 プライバシー設定</h3>

          <div class="setting-group">
            <label class="setting-checkbox">
              <input v-model="settings.shareLocation" type="checkbox" />
              <span class="checkbox-label">位置情報を共有する</span>
            </label>
          </div>

          <div class="setting-group">
            <label class="setting-checkbox">
              <input v-model="settings.shareStatus" type="checkbox" />
              <span class="checkbox-label">ステータスを共有する</span>
            </label>
          </div>

          <div class="setting-group">
            <label class="setting-checkbox">
              <input v-model="settings.allowDirectMessages" type="checkbox" />
              <span class="checkbox-label">ダイレクトメッセージを許可する</span>
            </label>
          </div>

          <div class="setting-group">
            <label class="setting-checkbox">
              <input v-model="settings.recordMeetings" type="checkbox" />
              <span class="checkbox-label">会議の録画を許可する</span>
            </label>
          </div>

          <div class="setting-group">
            <label class="setting-label">データ保存期間</label>
            <select v-model="settings.dataRetention" class="setting-select">
              <option value="7">7日間</option>
              <option value="30">30日間</option>
              <option value="90">90日間</option>
              <option value="365">1年間</option>
              <option value="forever">永続</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 設定フッター -->
      <div class="settings-footer">
        <button @click="resetSettings" class="reset-btn">
          <span class="btn-icon">🔄</span>
          <span class="btn-text">リセット</span>
        </button>
        <div class="action-buttons">
          <button @click="closeSettings" class="cancel-btn">
            <span class="btn-text">キャンセル</span>
          </button>
          <button @click="saveSettings" class="save-btn">
            <span class="btn-icon">💾</span>
            <span class="btn-text">保存</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

// 型定義
interface Settings {
  userName: string
  language: string
  theme: string
  notifications: boolean
  autoSave: boolean
  displayMode: string
  quality: string
  frameRate: number
  showFPS: boolean
  showDebugInfo: boolean
  microphoneId: string
  speakerId: string
  cameraId: string
  volume: number
  noiseSuppression: boolean
  echoCancellation: boolean
  autoGainControl: boolean
  keyBindings: {
    moveUp: string
    moveDown: string
    moveLeft: string
    moveRight: string
    toggleChat: string
    toggleMute: string
    toggleVideo: string
  }
  shareLocation: boolean
  shareStatus: boolean
  allowDirectMessages: boolean
  recordMeetings: boolean
  dataRetention: string
}

interface AudioDevice {
  deviceId: string
  label: string
  kind: string
}

interface AudioDevices {
  microphones: AudioDevice[]
  speakers: AudioDevice[]
  cameras: AudioDevice[]
}

// Props
interface Props {
  isOpen: boolean
}

defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  settingsChanged: [settings: Settings]
}>()

// リアクティブ状態
const activeTab = ref('general')
const capturingKey = ref<string | null>(null)
const audioDevices = ref<AudioDevices>({
  microphones: [],
  speakers: [],
  cameras: []
})

// タブ設定
const tabs = [
  { id: 'general', label: '一般', icon: '🔧' },
  { id: 'display', label: '表示', icon: '🎨' },
  { id: 'audio', label: '音声・ビデオ', icon: '🎵' },
  { id: 'keyboard', label: 'キーボード', icon: '⌨️' },
  { id: 'privacy', label: 'プライバシー', icon: '🔒' }
]

// テーマ設定
const themes = [
  { id: 'light', name: 'ライト', color: '#ffffff' },
  { id: 'dark', name: 'ダーク', color: '#1f2937' },
  { id: 'creative', name: 'クリエイティブ', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 'nature', name: 'ナチュラル', color: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)' }
]

// デフォルト設定
const defaultSettings: Settings = {
  userName: 'ユーザー',
  language: 'ja',
  theme: 'creative',
  notifications: true,
  autoSave: true,
  displayMode: '3d',
  quality: 'high',
  frameRate: 60,
  showFPS: false,
  showDebugInfo: false,
  microphoneId: '',
  speakerId: '',
  cameraId: '',
  volume: 70,
  noiseSuppression: true,
  echoCancellation: true,
  autoGainControl: true,
  keyBindings: {
    moveUp: 'W',
    moveDown: 'S',
    moveLeft: 'A',
    moveRight: 'D',
    toggleChat: 'C',
    toggleMute: 'M',
    toggleVideo: 'V'
  },
  shareLocation: true,
  shareStatus: true,
  allowDirectMessages: true,
  recordMeetings: false,
  dataRetention: '30'
}

// 現在の設定
const settings = ref<Settings>({ ...defaultSettings })

// メソッド
const closeSettings = () => {
  emit('close')
}

const saveSettings = () => {
  // ローカルストレージに保存
  localStorage.setItem('virtualOfficeSettings', JSON.stringify(settings.value))

  // 設定変更を通知
  emit('settingsChanged', settings.value)

  // 設定パネルを閉じる
  closeSettings()
}

const resetSettings = () => {
  if (confirm('設定をリセットしますか？すべての設定がデフォルト値に戻ります。')) {
    settings.value = { ...defaultSettings }
  }
}

const captureKey = (action: string) => {
  capturingKey.value = action

  const handleKeyPress = (event: KeyboardEvent) => {
    event.preventDefault()
    event.stopPropagation()

    if (capturingKey.value) {
      settings.value.keyBindings[capturingKey.value as keyof typeof settings.value.keyBindings] = event.key.toUpperCase()
      capturingKey.value = null
    }

    document.removeEventListener('keydown', handleKeyPress)
  }

  document.addEventListener('keydown', handleKeyPress)

  // 10秒後にタイムアウト
  setTimeout(() => {
    if (capturingKey.value === action) {
      capturingKey.value = null
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, 10000)
}

const loadAudioDevices = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()

    audioDevices.value = {
      microphones: devices.filter(device => device.kind === 'audioinput'),
      speakers: devices.filter(device => device.kind === 'audiooutput'),
      cameras: devices.filter(device => device.kind === 'videoinput')
    }
  } catch (error) {
    console.error('オーディオデバイスの取得に失敗しました:', error)
  }
}

// ライフサイクル
onMounted(() => {
  // 保存された設定を読み込み
  const savedSettings = localStorage.getItem('virtualOfficeSettings')
  if (savedSettings) {
    try {
      settings.value = { ...defaultSettings, ...JSON.parse(savedSettings) }
    } catch (error) {
      console.error('設定の読み込みに失敗しました:', error)
    }
  }

  // オーディオデバイスを読み込み
  loadAudioDevices()
})

// 設定変更の監視
watch(settings, (newSettings) => {
  // リアルタイムで一部の設定を適用
  if (newSettings.theme) {
    document.documentElement.setAttribute('data-theme', newSettings.theme)
  }
}, { deep: true })
</script>

<style scoped>
.settings-panel {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
}

.settings-panel.panel-open {
  opacity: 1;
  visibility: visible;
}

.settings-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.settings-container {
  position: relative;
  width: 90%;
  max-width: 800px;
  height: 90%;
  max-height: 700px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform: scale(0.9);
  transition: transform 0.3s ease;
}

.panel-open .settings-container {
  transform: scale(1);
}

.settings-header {
  padding: 24px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: white;
  font-size: 18px;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.settings-tabs {
  display: flex;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  overflow-x: auto;
}

.tab-btn {
  flex: 1;
  padding: 16px;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  transition: all 0.2s ease;
  border-bottom: 2px solid transparent;
}

.tab-btn:hover {
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
}

.tab-btn.active {
  color: #6366f1;
  border-bottom-color: #6366f1;
  background: rgba(99, 102, 241, 0.1);
}

.tab-icon {
  font-size: 16px;
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.settings-section h3 {
  margin: 0 0 24px 0;
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
}

.setting-group {
  margin-bottom: 24px;
}

.setting-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #374151;
  font-size: 14px;
}

.setting-input,
.setting-select {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s ease;
}

.setting-input:focus,
.setting-select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.theme-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.theme-btn {
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.theme-btn:hover {
  border-color: #6366f1;
}

.theme-btn.active {
  border-color: #6366f1;
  background: rgba(99, 102, 241, 0.1);
}

.theme-preview {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

.theme-name {
  font-size: 14px;
  font-weight: 500;
}

.setting-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.setting-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #6366f1;
}

.checkbox-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.radio-group {
  display: flex;
  gap: 16px;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.radio-option input[type="radio"] {
  width: 18px;
  height: 18px;
  accent-color: #6366f1;
}

.radio-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.setting-slider {
  flex: 1;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  outline: none;
  accent-color: #6366f1;
}

.slider-value {
  font-size: 14px;
  font-weight: 500;
  color: #6366f1;
  min-width: 60px;
  text-align: right;
}

.key-bindings {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.key-binding {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.key-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.key-btn {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #6366f1;
  transition: all 0.2s ease;
  min-width: 40px;
}

.key-btn:hover {
  border-color: #6366f1;
  background: rgba(99, 102, 241, 0.1);
}

.settings-footer {
  padding: 24px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.reset-btn {
  padding: 12px 16px;
  border: 1px solid #ef4444;
  border-radius: 8px;
  background: white;
  color: #ef4444;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.reset-btn:hover {
  background: #ef4444;
  color: white;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.cancel-btn {
  padding: 12px 20px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  color: #374151;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.save-btn {
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  background: #6366f1;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.save-btn:hover {
  background: #5855eb;
  transform: translateY(-1px);
}

.btn-icon {
  font-size: 16px;
}

.btn-text {
  font-size: 14px;
}

/* スクロールバーのスタイル */
.settings-content::-webkit-scrollbar {
  width: 8px;
}

.settings-content::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.settings-content::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.settings-content::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* レスポンシブデザイン */
@media (max-width: 768px) {
  .settings-container {
    width: 95%;
    height: 95%;
  }

  .settings-tabs {
    flex-wrap: wrap;
  }

  .tab-btn {
    flex: none;
    min-width: 120px;
  }

  .theme-options {
    grid-template-columns: repeat(2, 1fr);
  }

  .key-bindings {
    grid-template-columns: 1fr;
  }

  .settings-footer {
    flex-direction: column;
    gap: 16px;
  }

  .action-buttons {
    width: 100%;
    justify-content: center;
  }
}
</style>
