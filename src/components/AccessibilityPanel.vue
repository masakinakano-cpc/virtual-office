<template>
  <div class="accessibility-panel" :class="{ 'panel-visible': isVisible }">
    <div class="panel-header">
      <h3>♿ アクセシビリティ</h3>
      <button @click="$emit('close')" class="close-btn">✕</button>
    </div>

    <div class="panel-content">
      <!-- 視覚的アクセシビリティ -->
      <div class="accessibility-section">
        <h4>👁️ 視覚的アクセシビリティ</h4>

        <div class="setting-item">
          <label class="setting-label">
            <input v-model="settings.highContrast" type="checkbox" />
            <span>ハイコントラストモード</span>
          </label>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            <input v-model="settings.largeText" type="checkbox" />
            <span>大きな文字</span>
          </label>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            <input v-model="settings.reducedMotion" type="checkbox" />
            <span>アニメーションを減らす</span>
          </label>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            <input v-model="settings.colorBlindSupport" type="checkbox" />
            <span>色覚サポート</span>
          </label>
        </div>
      </div>

      <!-- 聴覚的アクセシビリティ -->
      <div class="accessibility-section">
        <h4>🔊 聴覚的アクセシビリティ</h4>

        <div class="setting-item">
          <label class="setting-label">
            <input v-model="settings.visualCues" type="checkbox" />
            <span>視覚的音声キュー</span>
          </label>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            <input v-model="settings.captions" type="checkbox" />
            <span>字幕表示</span>
          </label>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            <input v-model="settings.soundAlerts" type="checkbox" />
            <span>音声アラート</span>
          </label>
        </div>
      </div>

      <!-- 運動的アクセシビリティ -->
      <div class="accessibility-section">
        <h4>🖐️ 運動的アクセシビリティ</h4>

        <div class="setting-item">
          <label class="setting-label">
            <input v-model="settings.keyboardNavigation" type="checkbox" />
            <span>キーボードナビゲーション</span>
          </label>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            <input v-model="settings.voiceControl" type="checkbox" />
            <span>音声コントロール</span>
          </label>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            <input v-model="settings.stickyKeys" type="checkbox" />
            <span>固定キー</span>
          </label>
        </div>
      </div>

      <!-- 認知的アクセシビリティ -->
      <div class="accessibility-section">
        <h4>🧠 認知的アクセシビリティ</h4>

        <div class="setting-item">
          <label class="setting-label">
            <input v-model="settings.simplifiedUI" type="checkbox" />
            <span>シンプルなUI</span>
          </label>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            <input v-model="settings.focusIndicator" type="checkbox" />
            <span>フォーカスインジケーター</span>
          </label>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            <input v-model="settings.readingGuide" type="checkbox" />
            <span>読み上げガイド</span>
          </label>
        </div>
      </div>
    </div>

    <div class="panel-footer">
      <button @click="resetSettings" class="reset-btn">リセット</button>
      <button @click="saveSettings" class="save-btn">保存</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

interface AccessibilitySettings {
  highContrast: boolean
  largeText: boolean
  reducedMotion: boolean
  colorBlindSupport: boolean
  visualCues: boolean
  captions: boolean
  soundAlerts: boolean
  keyboardNavigation: boolean
  voiceControl: boolean
  stickyKeys: boolean
  simplifiedUI: boolean
  focusIndicator: boolean
  readingGuide: boolean
}

interface Props {
  isVisible: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  close: []
  settingsChanged: [settings: AccessibilitySettings]
}>()

const settings = ref<AccessibilitySettings>({
  highContrast: false,
  largeText: false,
  reducedMotion: false,
  colorBlindSupport: false,
  visualCues: false,
  captions: false,
  soundAlerts: true,
  keyboardNavigation: true,
  voiceControl: false,
  stickyKeys: false,
  simplifiedUI: false,
  focusIndicator: true,
  readingGuide: false
})

const saveSettings = () => {
  localStorage.setItem('accessibilitySettings', JSON.stringify(settings.value))
  emit('settingsChanged', settings.value)
  applySettings()
}

const resetSettings = () => {
  settings.value = {
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    colorBlindSupport: false,
    visualCues: false,
    captions: false,
    soundAlerts: true,
    keyboardNavigation: true,
    voiceControl: false,
    stickyKeys: false,
    simplifiedUI: false,
    focusIndicator: true,
    readingGuide: false
  }
  applySettings()
}

const applySettings = () => {
  const root = document.documentElement

  // ハイコントラスト
  if (settings.value.highContrast) {
    root.classList.add('high-contrast')
  } else {
    root.classList.remove('high-contrast')
  }

  // 大きな文字
  if (settings.value.largeText) {
    root.classList.add('large-text')
  } else {
    root.classList.remove('large-text')
  }

  // アニメーション削減
  if (settings.value.reducedMotion) {
    root.classList.add('reduced-motion')
  } else {
    root.classList.remove('reduced-motion')
  }

  // 色覚サポート
  if (settings.value.colorBlindSupport) {
    root.classList.add('color-blind-support')
  } else {
    root.classList.remove('color-blind-support')
  }

  // シンプルなUI
  if (settings.value.simplifiedUI) {
    root.classList.add('simplified-ui')
  } else {
    root.classList.remove('simplified-ui')
  }

  // フォーカスインジケーター
  if (settings.value.focusIndicator) {
    root.classList.add('focus-indicator')
  } else {
    root.classList.remove('focus-indicator')
  }
}

watch(settings, applySettings, { deep: true })

onMounted(() => {
  const saved = localStorage.getItem('accessibilitySettings')
  if (saved) {
    settings.value = JSON.parse(saved)
  }
  applySettings()
})
</script>

<style scoped>
.accessibility-panel {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 320px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  z-index: 1000;
  transform: translateX(100%);
  transition: transform 0.3s ease;
}

.accessibility-panel.panel-visible {
  transform: translateX(0);
}

.panel-header {
  padding: 16px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 12px 12px 0 0;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.panel-content {
  padding: 16px;
  max-height: 400px;
  overflow-y: auto;
}

.accessibility-section {
  margin-bottom: 20px;
}

.accessibility-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.setting-item {
  margin-bottom: 12px;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
}

.setting-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #6366f1;
}

.panel-footer {
  padding: 16px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.reset-btn,
.save-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.reset-btn {
  background: #f3f4f6;
  color: #374151;
}

.reset-btn:hover {
  background: #e5e7eb;
}

.save-btn {
  background: #6366f1;
  color: white;
}

.save-btn:hover {
  background: #5855eb;
}

/* グローバルアクセシビリティスタイル */
:global(.high-contrast) {
  filter: contrast(150%);
}

:global(.large-text) {
  font-size: 120% !important;
}

:global(.reduced-motion) * {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
}

:global(.color-blind-support) {
  filter: saturate(120%) brightness(110%);
}

:global(.simplified-ui) .decorative-element {
  display: none !important;
}

:global(.focus-indicator) *:focus {
  outline: 3px solid #6366f1 !important;
  outline-offset: 2px !important;
}
</style>
