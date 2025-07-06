<template>
  <div class="office-settings">
    <div class="settings-header">
      <h2 class="settings-title">⚙️ オフィス設定</h2>
      <button class="close-btn" @click="$emit('close')">✕</button>
    </div>

    <div class="settings-content">
      <!-- タブナビゲーション -->
      <div class="settings-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.icon }} {{ tab.label }}
        </button>
      </div>

      <!-- 一般設定 -->
      <div v-show="activeTab === 'general'" class="settings-section">
        <h3>🏢 一般設定</h3>

        <div class="setting-group">
          <label>オフィス名</label>
          <input
            v-model="settings.officeName"
            type="text"
            placeholder="カジュアル・クリエイティブオフィス"
            class="setting-input"
          />
        </div>

        <div class="setting-group">
          <label>テーマカラー</label>
          <div class="color-picker-group">
            <div
              v-for="color in colorPresets"
              :key="color.name"
              class="color-option"
              :class="{ selected: settings.themeColor === color.value }"
              :style="{ backgroundColor: color.value }"
              @click="settings.themeColor = color.value"
            >
              <span class="color-name">{{ color.name }}</span>
            </div>
          </div>
        </div>

        <div class="setting-group">
          <label>表示モード</label>
          <select v-model="settings.viewMode" class="setting-select">
            <option value="isometric">アイソメトリック</option>
            <option value="top">トップビュー</option>
            <option value="auto">自動切り替え</option>
          </select>
        </div>

        <div class="setting-group">
          <label class="checkbox-label">
            <input
              v-model="settings.showGrid"
              type="checkbox"
              class="setting-checkbox"
            />
            グリッド表示
          </label>
        </div>

        <div class="setting-group">
          <label class="checkbox-label">
            <input
              v-model="settings.showNames"
              type="checkbox"
              class="setting-checkbox"
            />
            ユーザー名表示
          </label>
        </div>
      </div>

      <!-- 音響設定 -->
      <div v-show="activeTab === 'audio'" class="settings-section">
        <h3>🔊 音響設定</h3>

        <div class="setting-group">
          <label>マスター音量</label>
          <div class="volume-control">
            <input
              v-model="settings.masterVolume"
              type="range"
              min="0"
              max="100"
              class="volume-slider"
            />
            <span class="volume-value">{{ settings.masterVolume }}%</span>
          </div>
        </div>

        <div class="setting-group">
          <label>環境音音量</label>
          <div class="volume-control">
            <input
              v-model="settings.ambientVolume"
              type="range"
              min="0"
              max="100"
              class="volume-slider"
            />
            <span class="volume-value">{{ settings.ambientVolume }}%</span>
          </div>
        </div>

        <div class="setting-group">
          <label>通知音音量</label>
          <div class="volume-control">
            <input
              v-model="settings.notificationVolume"
              type="range"
              min="0"
              max="100"
              class="volume-slider"
            />
            <span class="volume-value">{{ settings.notificationVolume }}%</span>
          </div>
        </div>

        <div class="setting-group">
          <label>空間音響の範囲</label>
          <div class="volume-control">
            <input
              v-model="settings.spatialRange"
              type="range"
              min="100"
              max="1000"
              step="50"
              class="volume-slider"
            />
            <span class="volume-value">{{ settings.spatialRange }}px</span>
          </div>
        </div>

        <div class="setting-group">
          <label class="checkbox-label">
            <input
              v-model="settings.enableSpatialAudio"
              type="checkbox"
              class="setting-checkbox"
            />
            3D空間音響を有効にする
          </label>
        </div>

        <div class="setting-group">
          <label class="checkbox-label">
            <input
              v-model="settings.enableAmbientSounds"
              type="checkbox"
              class="setting-checkbox"
            />
            環境音を有効にする
          </label>
        </div>
      </div>

      <!-- レイアウト設定 -->
      <div v-show="activeTab === 'layout'" class="settings-section">
        <h3>🏗️ レイアウト設定</h3>

        <div class="setting-group">
          <label>プリセットレイアウト</label>
          <div class="layout-presets">
            <div
              v-for="preset in layoutPresets"
              :key="preset.id"
              class="layout-preset"
              :class="{ selected: selectedPreset === preset.id }"
              @click="selectLayoutPreset(preset.id)"
            >
              <div class="preset-preview">
                <div class="preset-icon">{{ preset.icon }}</div>
              </div>
              <div class="preset-info">
                <h4>{{ preset.name }}</h4>
                <p>{{ preset.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="setting-group">
          <label>カスタムレイアウト</label>
          <div class="custom-layout-controls">
            <button class="btn-secondary" @click="enableEditMode">
              ✏️ 編集モード
            </button>
            <button class="btn-secondary" @click="saveCurrentLayout">
              💾 現在のレイアウトを保存
            </button>
            <button class="btn-secondary" @click="resetToDefault">
              🔄 デフォルトに戻す
            </button>
          </div>
        </div>

        <div class="setting-group">
          <label>保存済みレイアウト</label>
          <div class="saved-layouts">
            <div
              v-for="layout in savedLayouts"
              :key="layout.id"
              class="saved-layout"
            >
              <span class="layout-name">{{ layout.name }}</span>
              <div class="layout-actions">
                <button class="btn-small" @click="loadLayout(layout.id)">読み込み</button>
                <button class="btn-small danger" @click="deleteLayout(layout.id)">削除</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- アバター設定 -->
      <div v-show="activeTab === 'avatar'" class="settings-section">
        <h3>👤 アバター設定</h3>

        <div class="setting-group">
          <label>デフォルトアバター</label>
          <div class="avatar-selector">
            <div
              v-for="avatar in availableAvatars"
              :key="avatar"
              class="avatar-option"
              :class="{ selected: settings.defaultAvatar === avatar }"
              @click="settings.defaultAvatar = avatar"
            >
              {{ avatar }}
            </div>
          </div>
        </div>

        <div class="setting-group">
          <label>表示名</label>
          <input
            v-model="settings.displayName"
            type="text"
            placeholder="あなたの名前"
            class="setting-input"
          />
        </div>

        <div class="setting-group">
          <label>ステータスメッセージ</label>
          <input
            v-model="settings.statusMessage"
            type="text"
            placeholder="今日も頑張りましょう！"
            class="setting-input"
          />
        </div>

        <div class="setting-group">
          <label>アバターサイズ</label>
          <select v-model="settings.avatarSize" class="setting-select">
            <option value="small">小</option>
            <option value="medium">中</option>
            <option value="large">大</option>
          </select>
        </div>

        <div class="setting-group">
          <label class="checkbox-label">
            <input
              v-model="settings.showAvatarShadow"
              type="checkbox"
              class="setting-checkbox"
            />
            アバターに影をつける
          </label>
        </div>
      </div>

      <!-- アクセシビリティ設定 -->
      <div v-show="activeTab === 'accessibility'" class="settings-section">
        <h3>♿ アクセシビリティ</h3>

        <div class="setting-group">
          <label>アニメーション</label>
          <select v-model="settings.animationLevel" class="setting-select">
            <option value="full">すべて有効</option>
            <option value="reduced">控えめ</option>
            <option value="none">無効</option>
          </select>
        </div>

        <div class="setting-group">
          <label>フォントサイズ</label>
          <select v-model="settings.fontSize" class="setting-select">
            <option value="small">小</option>
            <option value="medium">中</option>
            <option value="large">大</option>
            <option value="extra-large">特大</option>
          </select>
        </div>

        <div class="setting-group">
          <label class="checkbox-label">
            <input
              v-model="settings.highContrast"
              type="checkbox"
              class="setting-checkbox"
            />
            高コントラストモード
          </label>
        </div>

        <div class="setting-group">
          <label class="checkbox-label">
            <input
              v-model="settings.screenReaderSupport"
              type="checkbox"
              class="setting-checkbox"
            />
            スクリーンリーダー対応
          </label>
        </div>

        <div class="setting-group">
          <label class="checkbox-label">
            <input
              v-model="settings.keyboardNavigation"
              type="checkbox"
              class="setting-checkbox"
            />
            キーボードナビゲーション
          </label>
        </div>
      </div>
    </div>

    <!-- 設定の保存・リセット -->
    <div class="settings-footer">
      <button class="btn-secondary" @click="resetSettings">
        🔄 リセット
      </button>
      <div class="footer-actions">
        <button class="btn-secondary" @click="$emit('close')">
          キャンセル
        </button>
        <button class="btn-creative" @click="saveSettings">
          💾 保存
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'

interface OfficeSettings {
  // 一般設定
  officeName: string
  themeColor: string
  viewMode: 'isometric' | 'top' | 'auto'
  showGrid: boolean
  showNames: boolean

  // 音響設定
  masterVolume: number
  ambientVolume: number
  notificationVolume: number
  spatialRange: number
  enableSpatialAudio: boolean
  enableAmbientSounds: boolean

  // アバター設定
  defaultAvatar: string
  displayName: string
  statusMessage: string
  avatarSize: 'small' | 'medium' | 'large'
  showAvatarShadow: boolean

  // アクセシビリティ
  animationLevel: 'full' | 'reduced' | 'none'
  fontSize: 'small' | 'medium' | 'large' | 'extra-large'
  highContrast: boolean
  screenReaderSupport: boolean
  keyboardNavigation: boolean
}

interface LayoutPreset {
  id: string
  name: string
  description: string
  icon: string
}

interface SavedLayout {
  id: string
  name: string
  data: any
  createdAt: Date
}

// イベント定義
const emit = defineEmits<{
  close: []
  settingsChanged: [settings: OfficeSettings]
  layoutChanged: [layoutId: string]
  editModeToggled: [enabled: boolean]
}>()

// タブ管理
const activeTab = ref('general')
const tabs = [
  { id: 'general', label: '一般', icon: '🏢' },
  { id: 'audio', label: '音響', icon: '🔊' },
  { id: 'layout', label: 'レイアウト', icon: '🏗️' },
  { id: 'avatar', label: 'アバター', icon: '👤' },
  { id: 'accessibility', label: 'アクセシビリティ', icon: '♿' }
]

// 設定データ
const settings = reactive<OfficeSettings>({
  // 一般設定
  officeName: 'カジュアル・クリエイティブオフィス',
  themeColor: '#ff6b6b',
  viewMode: 'isometric',
  showGrid: false,
  showNames: true,

  // 音響設定
  masterVolume: 70,
  ambientVolume: 50,
  notificationVolume: 80,
  spatialRange: 500,
  enableSpatialAudio: true,
  enableAmbientSounds: true,

  // アバター設定
  defaultAvatar: '😊',
  displayName: '',
  statusMessage: '今日も頑張りましょう！',
  avatarSize: 'medium',
  showAvatarShadow: true,

  // アクセシビリティ
  animationLevel: 'full',
  fontSize: 'medium',
  highContrast: false,
  screenReaderSupport: false,
  keyboardNavigation: true
})

// カラープリセット
const colorPresets = [
  { name: 'レッド', value: '#ff6b6b' },
  { name: 'ブルー', value: '#4ecdc4' },
  { name: 'イエロー', value: '#ffe66d' },
  { name: 'グリーン', value: '#a8e6cf' },
  { name: 'パープル', value: '#6c5ce7' },
  { name: 'ピンク', value: '#fd79a8' }
]

// アバターオプション
const availableAvatars = ['😊', '😎', '🤓', '😄', '🙂', '😌', '🤗', '😋', '🤔', '😴', '👨‍💻', '👩‍💻', '🧑‍🎨', '👨‍🏫', '👩‍🏫']

// レイアウトプリセット
const layoutPresets: LayoutPreset[] = [
  {
    id: 'open-office',
    name: 'オープンオフィス',
    description: '開放的で協力的な空間',
    icon: '🏢'
  },
  {
    id: 'creative-studio',
    name: 'クリエイティブスタジオ',
    description: '創造性を重視したレイアウト',
    icon: '🎨'
  },
  {
    id: 'meeting-focused',
    name: '会議重視',
    description: '会議室を中心とした構成',
    icon: '🤝'
  },
  {
    id: 'quiet-workspace',
    name: '静かな作業空間',
    description: '集中作業に適した環境',
    icon: '🤫'
  },
  {
    id: 'hybrid-space',
    name: 'ハイブリッド空間',
    description: 'リモートとオフィスの融合',
    icon: '🌐'
  }
]

// 保存済みレイアウト
const savedLayouts = ref<SavedLayout[]>([
  {
    id: '1',
    name: 'マイレイアウト1',
    data: {},
    createdAt: new Date()
  }
])

const selectedPreset = ref('open-office')

// メソッド
const selectLayoutPreset = (presetId: string) => {
  selectedPreset.value = presetId
  emit('layoutChanged', presetId)
}

const enableEditMode = () => {
  emit('editModeToggled', true)
  emit('close')
}

const saveCurrentLayout = () => {
  const layoutName = prompt('レイアウト名を入力してください:')
  if (layoutName) {
    const newLayout: SavedLayout = {
      id: Date.now().toString(),
      name: layoutName,
      data: {}, // 実際のレイアウトデータ
      createdAt: new Date()
    }
    savedLayouts.value.push(newLayout)
    console.log('レイアウトを保存しました:', layoutName)
  }
}

const loadLayout = (layoutId: string) => {
  const layout = savedLayouts.value.find(l => l.id === layoutId)
  if (layout) {
    console.log('レイアウトを読み込みました:', layout.name)
    emit('layoutChanged', layoutId)
  }
}

const deleteLayout = (layoutId: string) => {
  if (confirm('このレイアウトを削除しますか？')) {
    savedLayouts.value = savedLayouts.value.filter(l => l.id !== layoutId)
    console.log('レイアウトを削除しました')
  }
}

const resetToDefault = () => {
  if (confirm('デフォルトレイアウトに戻しますか？')) {
    emit('layoutChanged', 'default')
    console.log('デフォルトレイアウトに戻しました')
  }
}

const saveSettings = () => {
  // ローカルストレージに保存
  localStorage.setItem('officeSettings', JSON.stringify(settings))
  emit('settingsChanged', { ...settings })
  console.log('設定を保存しました')
  emit('close')
}

const resetSettings = () => {
  if (confirm('設定をリセットしますか？')) {
    // デフォルト値に戻す
    Object.assign(settings, {
      officeName: 'カジュアル・クリエイティブオフィス',
      themeColor: '#ff6b6b',
      viewMode: 'isometric',
      showGrid: false,
      showNames: true,
      masterVolume: 70,
      ambientVolume: 50,
      notificationVolume: 80,
      spatialRange: 500,
      enableSpatialAudio: true,
      enableAmbientSounds: true,
      defaultAvatar: '😊',
      displayName: '',
      statusMessage: '今日も頑張りましょう！',
      avatarSize: 'medium',
      showAvatarShadow: true,
      animationLevel: 'full',
      fontSize: 'medium',
      highContrast: false,
      screenReaderSupport: false,
      keyboardNavigation: true
    })
    console.log('設定をリセットしました')
  }
}

const loadSettings = () => {
  const saved = localStorage.getItem('officeSettings')
  if (saved) {
    try {
      const savedSettings = JSON.parse(saved)
      Object.assign(settings, savedSettings)
      console.log('保存された設定を読み込みました')
    } catch (error) {
      console.error('設定の読み込みに失敗しました:', error)
    }
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.office-settings {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-4);
}

.office-settings > div {
  background: white;
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-xl);
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-6);
  background: var(--bg-creative);
  color: white;
}

.settings-title {
  font-size: var(--text-2xl);
  font-weight: 600;
  margin: 0;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  font-size: var(--text-lg);
  transition: var(--transition-normal);
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-6);
}

.settings-tabs {
  display: flex;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-6);
  border-bottom: 2px solid var(--color-gray-200);
}

.tab-btn {
  background: none;
  border: none;
  padding: var(--spacing-3) var(--spacing-4);
  cursor: pointer;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  transition: var(--transition-normal);
  font-weight: 500;
  color: var(--color-gray-600);
}

.tab-btn:hover {
  background: var(--color-gray-100);
}

.tab-btn.active {
  background: var(--color-primary);
  color: white;
  font-weight: 600;
}

.settings-section {
  animation: fadeIn 0.3s ease-in-out;
}

.settings-section h3 {
  color: var(--color-primary);
  margin-bottom: var(--spacing-4);
  font-size: var(--text-xl);
}

.setting-group {
  margin-bottom: var(--spacing-6);
}

.setting-group label {
  display: block;
  margin-bottom: var(--spacing-2);
  font-weight: 600;
  color: var(--color-gray-700);
}

.setting-input,
.setting-select {
  width: 100%;
  padding: var(--spacing-3);
  border: 2px solid var(--color-gray-300);
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  transition: var(--transition-normal);
}

.setting-input:focus,
.setting-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.1);
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: var(--spacing-2);
  cursor: pointer;
}

.setting-checkbox {
  width: auto !important;
  margin: 0 !important;
}

/* カラーピッカー */
.color-picker-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--spacing-2);
}

.color-option {
  padding: var(--spacing-3);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition-normal);
  border: 2px solid transparent;
  text-align: center;
  color: white;
  font-weight: 600;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.color-option:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.color-option.selected {
  border-color: var(--color-gray-800);
  box-shadow: var(--shadow-xl);
}

/* 音量コントロール */
.volume-control {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.volume-slider {
  flex: 1;
  height: 8px;
  border-radius: var(--radius-full);
  background: var(--color-gray-200);
  outline: none;
  -webkit-appearance: none;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--color-primary);
  cursor: pointer;
  box-shadow: var(--shadow-md);
}

.volume-value {
  min-width: 50px;
  text-align: right;
  font-weight: 600;
  color: var(--color-primary);
}

/* アバターセレクター */
.avatar-selector {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  gap: var(--spacing-2);
}

.avatar-option {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  border: 2px solid var(--color-gray-300);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition-normal);
}

.avatar-option:hover {
  border-color: var(--color-primary);
  transform: scale(1.1);
}

.avatar-option.selected {
  border-color: var(--color-primary);
  background: rgba(255, 107, 107, 0.1);
  box-shadow: var(--shadow-md);
}

/* レイアウトプリセット */
.layout-presets {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-3);
}

.layout-preset {
  display: flex;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  border: 2px solid var(--color-gray-300);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition-normal);
}

.layout-preset:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
}

.layout-preset.selected {
  border-color: var(--color-primary);
  background: rgba(255, 107, 107, 0.1);
}

.preset-preview {
  width: 60px;
  height: 60px;
  background: var(--color-gray-100);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.preset-icon {
  font-size: 2rem;
}

.preset-info h4 {
  margin: 0 0 var(--spacing-1) 0;
  color: var(--color-gray-800);
}

.preset-info p {
  margin: 0;
  color: var(--color-gray-600);
  font-size: var(--text-sm);
}

/* カスタムレイアウトコントロール */
.custom-layout-controls {
  display: flex;
  gap: var(--spacing-2);
  flex-wrap: wrap;
}

.btn-secondary {
  background: var(--color-gray-200);
  color: var(--color-gray-700);
  border: none;
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition-normal);
  font-weight: 500;
}

.btn-secondary:hover {
  background: var(--color-gray-300);
}

.btn-small {
  padding: var(--spacing-1) var(--spacing-2);
  font-size: var(--text-sm);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-normal);
  background: var(--color-gray-200);
  color: var(--color-gray-700);
}

.btn-small:hover {
  background: var(--color-gray-300);
}

.btn-small.danger {
  background: #ff4757;
  color: white;
}

.btn-small.danger:hover {
  background: #ff3838;
}

/* 保存済みレイアウト */
.saved-layouts {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.saved-layout {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-3);
  background: var(--color-gray-100);
  border-radius: var(--radius-lg);
}

.layout-name {
  font-weight: 500;
  color: var(--color-gray-800);
}

.layout-actions {
  display: flex;
  gap: var(--spacing-2);
}

/* フッター */
.settings-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-4) var(--spacing-6);
  background: var(--color-gray-50);
  border-top: 1px solid var(--color-gray-200);
}

.footer-actions {
  display: flex;
  gap: var(--spacing-3);
}

/* アニメーション */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
  .office-settings {
    padding: var(--spacing-2);
  }

  .settings-tabs {
    flex-wrap: wrap;
  }

  .tab-btn {
    flex: 1;
    min-width: 120px;
  }

  .color-picker-group {
    grid-template-columns: repeat(2, 1fr);
  }

  .layout-presets {
    grid-template-columns: 1fr;
  }

  .custom-layout-controls {
    flex-direction: column;
  }

  .settings-footer {
    flex-direction: column;
    gap: var(--spacing-3);
  }

  .footer-actions {
    width: 100%;
    justify-content: center;
  }
}
</style>
