<template>
  <div class="virtual-backgrounds">
    <div class="backgrounds-header">
      <h2>🎨 バーチャル背景</h2>
      <div class="header-controls">
        <button @click="showUploadModal = true" class="btn-primary">📤 アップロード</button>
        <button @click="showSettings = true" class="btn-secondary">⚙️ 設定</button>
      </div>
    </div>

    <!-- カテゴリタブ -->
    <div class="category-tabs">
      <button
        v-for="category in categories"
        :key="category.id"
        @click="activeCategory = category.id"
        :class="{ active: activeCategory === category.id }"
        class="category-tab"
      >
        {{ category.icon }} {{ category.name }}
      </button>
    </div>

    <!-- 背景グリッド -->
    <div class="backgrounds-grid">
      <div
        v-for="background in filteredBackgrounds"
        :key="background.id"
        :class="{ selected: selectedBackground?.id === background.id }"
        class="background-item"
        @click="selectBackground(background)"
      >
        <div class="background-preview" :style="{ backgroundImage: `url(${background.thumbnail})` }">
          <div v-if="background.animated" class="animated-indicator">🎬</div>
          <div v-if="background.premium" class="premium-indicator">💎</div>
        </div>
        <div class="background-info">
          <div class="background-name">{{ background.name }}</div>
          <div class="background-category">{{ background.category }}</div>
        </div>
        <div class="background-actions">
          <button @click.stop="previewBackground(background)" class="action-btn">👁️</button>
          <button @click.stop="favoriteBackground(background)" class="action-btn">
            {{ background.favorited ? '❤️' : '🤍' }}
          </button>
        </div>
      </div>
    </div>

    <!-- プレビューモーダル -->
    <div v-if="previewingBackground" class="preview-modal">
      <div class="preview-content">
        <div class="preview-header">
          <h3>{{ previewingBackground.name }} - プレビュー</h3>
          <button @click="closePreview" class="close-btn">✕</button>
        </div>
        <div class="preview-body">
          <div class="preview-workspace" :style="{ backgroundImage: `url(${previewingBackground.url})` }">
            <div class="preview-avatar">😊</div>
            <div class="preview-furniture">🗃️</div>
          </div>
        </div>
        <div class="preview-footer">
          <button @click="closePreview" class="btn-secondary">キャンセル</button>
          <button @click="applyBackground(previewingBackground)" class="btn-primary">適用</button>
        </div>
      </div>
    </div>

    <!-- アップロードモーダル -->
    <div v-if="showUploadModal" class="upload-modal">
      <div class="upload-content">
        <div class="upload-header">
          <h3>📤 カスタム背景をアップロード</h3>
          <button @click="showUploadModal = false" class="close-btn">✕</button>
        </div>
        <div class="upload-body">
          <div class="upload-zone" @drop="handleDrop" @dragover="handleDragOver">
            <input ref="fileInput" type="file" accept="image/*,video/*" @change="handleFileSelect" style="display: none" />
            <div class="upload-icon">📁</div>
            <div class="upload-text">
              <p>ファイルをドラッグ&ドロップまたは</p>
              <button @click="() => fileInput?.click()" class="btn-primary">ファイルを選択</button>
            </div>
            <div class="upload-formats">対応形式: JPG, PNG, GIF, MP4, WebM</div>
          </div>

          <div v-if="uploadingFile" class="upload-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
            </div>
            <div class="progress-text">{{ uploadProgress }}% アップロード中...</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 設定モーダル -->
    <div v-if="showSettings" class="settings-modal">
      <div class="settings-content">
        <div class="settings-header">
          <h3>⚙️ 背景設定</h3>
          <button @click="showSettings = false" class="close-btn">✕</button>
        </div>
        <div class="settings-body">
          <div class="setting-group">
            <label>背景の不透明度</label>
            <input v-model="backgroundSettings.opacity" type="range" min="0" max="100" class="slider" />
            <span>{{ backgroundSettings.opacity }}%</span>
          </div>

          <div class="setting-group">
            <label>ブラー効果</label>
            <input v-model="backgroundSettings.blur" type="range" min="0" max="20" class="slider" />
            <span>{{ backgroundSettings.blur }}px</span>
          </div>

          <div class="setting-group">
            <label>明度調整</label>
            <input v-model="backgroundSettings.brightness" type="range" min="50" max="150" class="slider" />
            <span>{{ backgroundSettings.brightness }}%</span>
          </div>

          <div class="setting-group">
            <label class="checkbox-label">
              <input v-model="backgroundSettings.autoChange" type="checkbox" />
              時間帯に応じて自動変更
            </label>
          </div>

          <div class="setting-group">
            <label class="checkbox-label">
              <input v-model="backgroundSettings.seasonalThemes" type="checkbox" />
              季節テーマを有効にする
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- 現在の背景コントロール -->
    <div class="current-background-control">
      <div class="current-background-info">
        <div class="current-thumbnail" :style="{ backgroundImage: `url(${currentBackground?.thumbnail})` }"></div>
        <div class="current-details">
          <div class="current-name">{{ currentBackground?.name || 'デフォルト' }}</div>
          <div class="current-category">{{ currentBackground?.category || '標準' }}</div>
        </div>
      </div>
      <div class="current-controls">
        <button @click="toggleBackground" class="control-btn">
          {{ backgroundEnabled ? '🔴 無効化' : '🟢 有効化' }}
        </button>
        <button @click="resetBackground" class="control-btn">🔄 リセット</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface VirtualBackground {
  id: string
  name: string
  category: string
  url: string
  thumbnail: string
  animated: boolean
  premium: boolean
  favorited: boolean
  tags: string[]
  author?: string
  description?: string
}

interface BackgroundCategory {
  id: string
  name: string
  icon: string
}

interface BackgroundSettings {
  opacity: number
  blur: number
  brightness: number
  autoChange: boolean
  seasonalThemes: boolean
}

const activeCategory = ref('all')
const selectedBackground = ref<VirtualBackground | null>(null)
const currentBackground = ref<VirtualBackground | null>(null)
const previewingBackground = ref<VirtualBackground | null>(null)
const showUploadModal = ref(false)
const showSettings = ref(false)
const backgroundEnabled = ref(true)
const uploadingFile = ref(false)
const uploadProgress = ref(0)
const fileInput = ref<HTMLInputElement>()

const backgroundSettings = ref<BackgroundSettings>({
  opacity: 100,
  blur: 0,
  brightness: 100,
  autoChange: false,
  seasonalThemes: true
})

const categories: BackgroundCategory[] = [
  { id: 'all', name: '全て', icon: '🌍' },
  { id: 'office', name: 'オフィス', icon: '🏢' },
  { id: 'nature', name: '自然', icon: '🌿' },
  { id: 'city', name: '都市', icon: '🏙️' },
  { id: 'abstract', name: '抽象', icon: '🎨' },
  { id: 'seasonal', name: '季節', icon: '🍂' },
  { id: 'custom', name: 'カスタム', icon: '📁' },
  { id: 'animated', name: 'アニメ', icon: '🎬' }
]

const backgrounds = ref<VirtualBackground[]>([
  // オフィス系
  {
    id: 'office1',
    name: 'モダンオフィス',
    category: 'office',
    url: '/backgrounds/modern-office.jpg',
    thumbnail: '/backgrounds/thumbs/modern-office.jpg',
    animated: false,
    premium: false,
    favorited: false,
    tags: ['モダン', 'ミニマル', 'プロフェッショナル'],
    description: '洗練されたモダンなオフィス空間'
  },
  {
    id: 'office2',
    name: 'クリエイティブスタジオ',
    category: 'office',
    url: '/backgrounds/creative-studio.jpg',
    thumbnail: '/backgrounds/thumbs/creative-studio.jpg',
    animated: false,
    premium: false,
    favorited: false,
    tags: ['クリエイティブ', 'カラフル', 'インスピレーション']
  },
  {
    id: 'office3',
    name: 'ホームオフィス',
    category: 'office',
    url: '/backgrounds/home-office.jpg',
    thumbnail: '/backgrounds/thumbs/home-office.jpg',
    animated: false,
    premium: false,
    favorited: false,
    tags: ['ホーム', '快適', 'リラックス']
  },

  // 自然系
  {
    id: 'nature1',
    name: '森の中のオフィス',
    category: 'nature',
    url: '/backgrounds/forest-office.jpg',
    thumbnail: '/backgrounds/thumbs/forest-office.jpg',
    animated: false,
    premium: false,
    favorited: false,
    tags: ['森', '緑', '自然', 'リフレッシュ']
  },
  {
    id: 'nature2',
    name: '海辺のワークスペース',
    category: 'nature',
    url: '/backgrounds/beach-workspace.jpg',
    thumbnail: '/backgrounds/thumbs/beach-workspace.jpg',
    animated: false,
    premium: true,
    favorited: false,
    tags: ['海', 'ビーチ', 'リゾート']
  },
  {
    id: 'nature3',
    name: '山頂のオフィス',
    category: 'nature',
    url: '/backgrounds/mountain-office.jpg',
    thumbnail: '/backgrounds/thumbs/mountain-office.jpg',
    animated: false,
    premium: true,
    favorited: false,
    tags: ['山', '景色', 'インスピレーション']
  },

  // 都市系
  {
    id: 'city1',
    name: '東京スカイライン',
    category: 'city',
    url: '/backgrounds/tokyo-skyline.jpg',
    thumbnail: '/backgrounds/thumbs/tokyo-skyline.jpg',
    animated: false,
    premium: false,
    favorited: false,
    tags: ['東京', '夜景', '都市']
  },
  {
    id: 'city2',
    name: 'ニューヨークオフィス',
    category: 'city',
    url: '/backgrounds/nyc-office.jpg',
    thumbnail: '/backgrounds/thumbs/nyc-office.jpg',
    animated: false,
    premium: true,
    favorited: false,
    tags: ['ニューヨーク', '高層ビル', 'ビジネス']
  },

  // 抽象系
  {
    id: 'abstract1',
    name: 'グラデーションブルー',
    category: 'abstract',
    url: '/backgrounds/gradient-blue.jpg',
    thumbnail: '/backgrounds/thumbs/gradient-blue.jpg',
    animated: false,
    premium: false,
    favorited: false,
    tags: ['ブルー', 'グラデーション', 'シンプル']
  },
  {
    id: 'abstract2',
    name: '幾何学パターン',
    category: 'abstract',
    url: '/backgrounds/geometric-pattern.jpg',
    thumbnail: '/backgrounds/thumbs/geometric-pattern.jpg',
    animated: false,
    premium: false,
    favorited: false,
    tags: ['幾何学', 'パターン', 'モダン']
  },

  // 季節系
  {
    id: 'seasonal1',
    name: '春の桜オフィス',
    category: 'seasonal',
    url: '/backgrounds/spring-sakura.jpg',
    thumbnail: '/backgrounds/thumbs/spring-sakura.jpg',
    animated: false,
    premium: false,
    favorited: false,
    tags: ['春', '桜', '日本', 'ピンク']
  },
  {
    id: 'seasonal2',
    name: '夏のビーチオフィス',
    category: 'seasonal',
    url: '/backgrounds/summer-beach.jpg',
    thumbnail: '/backgrounds/thumbs/summer-beach.jpg',
    animated: false,
    premium: false,
    favorited: false,
    tags: ['夏', 'ビーチ', 'ブルー', '爽やか']
  },
  {
    id: 'seasonal3',
    name: '秋の紅葉オフィス',
    category: 'seasonal',
    url: '/backgrounds/autumn-leaves.jpg',
    thumbnail: '/backgrounds/thumbs/autumn-leaves.jpg',
    animated: false,
    premium: false,
    favorited: false,
    tags: ['秋', '紅葉', 'オレンジ', '温かい']
  },
  {
    id: 'seasonal4',
    name: '冬の雪景色オフィス',
    category: 'seasonal',
    url: '/backgrounds/winter-snow.jpg',
    thumbnail: '/backgrounds/thumbs/winter-snow.jpg',
    animated: false,
    premium: false,
    favorited: false,
    tags: ['冬', '雪', 'ホワイト', '静寂']
  },

  // アニメーション系
  {
    id: 'animated1',
    name: '流れる雲',
    category: 'animated',
    url: '/backgrounds/floating-clouds.mp4',
    thumbnail: '/backgrounds/thumbs/floating-clouds.jpg',
    animated: true,
    premium: true,
    favorited: false,
    tags: ['雲', 'アニメーション', '空', '動的']
  },
  {
    id: 'animated2',
    name: '波打つ海',
    category: 'animated',
    url: '/backgrounds/ocean-waves.mp4',
    thumbnail: '/backgrounds/thumbs/ocean-waves.jpg',
    animated: true,
    premium: true,
    favorited: false,
    tags: ['海', '波', 'アニメーション', 'リラックス']
  }
])

const filteredBackgrounds = computed(() => {
  if (activeCategory.value === 'all') {
    return backgrounds.value
  }
  return backgrounds.value.filter(bg => bg.category === activeCategory.value)
})

const selectBackground = (background: VirtualBackground) => {
  selectedBackground.value = background
}

const previewBackground = (background: VirtualBackground) => {
  previewingBackground.value = background
}

const closePreview = () => {
  previewingBackground.value = null
}

const applyBackground = (background: VirtualBackground) => {
  currentBackground.value = background
  backgroundEnabled.value = true
  closePreview()

  // 実際の背景適用処理
  applyBackgroundToWorkspace(background)

  console.log('背景を適用しました:', background.name)
}

const applyBackgroundToWorkspace = (background: VirtualBackground) => {
  // 実際の実装では、CSSやCanvasを使用して背景を適用
  const workspaceElement = document.querySelector('.office-workspace')
  if (workspaceElement) {
    const element = workspaceElement as HTMLElement
    element.style.backgroundImage = `url(${background.url})`
    element.style.backgroundSize = 'cover'
    element.style.backgroundPosition = 'center'
    element.style.opacity = (backgroundSettings.value.opacity / 100).toString()

    if (backgroundSettings.value.blur > 0) {
      element.style.filter = `blur(${backgroundSettings.value.blur}px) brightness(${backgroundSettings.value.brightness}%)`
    } else {
      element.style.filter = `brightness(${backgroundSettings.value.brightness}%)`
    }
  }
}

const favoriteBackground = (background: VirtualBackground) => {
  background.favorited = !background.favorited

  // ローカルストレージに保存
  const favorites = JSON.parse(localStorage.getItem('favoriteBackgrounds') || '[]')
  if (background.favorited) {
    favorites.push(background.id)
  } else {
    const index = favorites.indexOf(background.id)
    if (index > -1) {
      favorites.splice(index, 1)
    }
  }
  localStorage.setItem('favoriteBackgrounds', JSON.stringify(favorites))
}

const toggleBackground = () => {
  backgroundEnabled.value = !backgroundEnabled.value

  const workspaceElement = document.querySelector('.office-workspace')
  if (workspaceElement) {
    const element = workspaceElement as HTMLElement
    if (backgroundEnabled.value && currentBackground.value) {
      applyBackgroundToWorkspace(currentBackground.value)
    } else {
      element.style.backgroundImage = 'none'
      element.style.filter = 'none'
    }
  }
}

const resetBackground = () => {
  currentBackground.value = null
  backgroundEnabled.value = false

  const workspaceElement = document.querySelector('.office-workspace')
  if (workspaceElement) {
    const element = workspaceElement as HTMLElement
    element.style.backgroundImage = 'none'
    element.style.filter = 'none'
    element.style.opacity = '1'
  }
}

// ファイルアップロード関連
const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    handleFileUpload(files[0])
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    handleFileUpload(files[0])
  }
}

const handleFileUpload = async (file: File) => {
  if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
    alert('画像または動画ファイルを選択してください')
    return
  }

  uploadingFile.value = true
  uploadProgress.value = 0

  // ファイルアップロードのシミュレーション
  const interval = setInterval(() => {
    uploadProgress.value += 10
    if (uploadProgress.value >= 100) {
      clearInterval(interval)
      completeUpload(file)
    }
  }, 200)
}

const completeUpload = (file: File) => {
  // ファイルURLの生成（実際の実装ではサーバーにアップロード）
  const fileUrl = URL.createObjectURL(file)

  const newBackground: VirtualBackground = {
    id: `custom_${Date.now()}`,
    name: file.name.split('.')[0],
    category: 'custom',
    url: fileUrl,
    thumbnail: fileUrl,
    animated: file.type.startsWith('video/'),
    premium: false,
    favorited: false,
    tags: ['カスタム', 'アップロード'],
    author: 'あなた'
  }

  backgrounds.value.unshift(newBackground)

  uploadingFile.value = false
  uploadProgress.value = 0
  showUploadModal.value = false

  console.log('カスタム背景をアップロードしました:', newBackground.name)
}

// 季節テーマの自動変更
const updateSeasonalTheme = () => {
  if (!backgroundSettings.value.seasonalThemes) return

  const now = new Date()
  const month = now.getMonth() + 1

  let seasonalBackground: VirtualBackground | undefined

  if (month >= 3 && month <= 5) {
    // 春
    seasonalBackground = backgrounds.value.find(bg => bg.id === 'seasonal1')
  } else if (month >= 6 && month <= 8) {
    // 夏
    seasonalBackground = backgrounds.value.find(bg => bg.id === 'seasonal2')
  } else if (month >= 9 && month <= 11) {
    // 秋
    seasonalBackground = backgrounds.value.find(bg => bg.id === 'seasonal3')
  } else {
    // 冬
    seasonalBackground = backgrounds.value.find(bg => bg.id === 'seasonal4')
  }

  if (seasonalBackground && (!currentBackground.value || currentBackground.value.category !== 'seasonal')) {
    applyBackground(seasonalBackground)
  }
}

// 時間帯による自動変更
const updateTimeBasedTheme = () => {
  if (!backgroundSettings.value.autoChange) return

  const now = new Date()
  const hour = now.getHours()

  let timeBasedBackground: VirtualBackground | undefined

  if (hour >= 6 && hour < 12) {
    // 朝
    timeBasedBackground = backgrounds.value.find(bg => bg.tags.includes('爽やか'))
  } else if (hour >= 12 && hour < 18) {
    // 昼
    timeBasedBackground = backgrounds.value.find(bg => bg.tags.includes('プロフェッショナル'))
  } else if (hour >= 18 && hour < 22) {
    // 夕方
    timeBasedBackground = backgrounds.value.find(bg => bg.tags.includes('温かい'))
  } else {
    // 夜
    timeBasedBackground = backgrounds.value.find(bg => bg.tags.includes('夜景'))
  }

  if (timeBasedBackground) {
    applyBackground(timeBasedBackground)
  }
}

// 初期化
onMounted(() => {
  // お気に入りの読み込み
  const favorites = JSON.parse(localStorage.getItem('favoriteBackgrounds') || '[]')
  backgrounds.value.forEach(bg => {
    bg.favorited = favorites.includes(bg.id)
  })

  // 設定の読み込み
  const savedSettings = localStorage.getItem('backgroundSettings')
  if (savedSettings) {
    Object.assign(backgroundSettings.value, JSON.parse(savedSettings))
  }

  // 季節テーマの初期適用
  updateSeasonalTheme()

  // 定期的な更新（1時間ごと）
  setInterval(() => {
    updateSeasonalTheme()
    updateTimeBasedTheme()
  }, 60 * 60 * 1000)
})

// エクスポート
defineExpose({
  selectBackground,
  applyBackground,
  resetBackground,
  toggleBackground
})
</script>

<style scoped>
.virtual-backgrounds {
  padding: var(--spacing-6);
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
}

.backgrounds-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-6);
}

.backgrounds-header h2 {
  color: var(--color-primary);
  margin: 0;
}

.header-controls {
  display: flex;
  gap: var(--spacing-3);
}

.category-tabs {
  display: flex;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-6);
  overflow-x: auto;
  padding-bottom: var(--spacing-2);
}

.category-tab {
  background: var(--color-gray-200);
  color: var(--color-gray-700);
  border: none;
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: var(--transition-normal);
  white-space: nowrap;
  font-weight: 500;
}

.category-tab:hover {
  background: var(--color-gray-300);
}

.category-tab.active {
  background: var(--color-primary);
  color: white;
}

.backgrounds-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-8);
}

.background-item {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  cursor: pointer;
  transition: var(--transition-normal);
  overflow: hidden;
  border: 2px solid transparent;
}

.background-item:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}

.background-item.selected {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.2);
}

.background-preview {
  height: 120px;
  background-size: cover;
  background-position: center;
  position: relative;
  background-color: var(--color-gray-200);
}

.animated-indicator,
.premium-indicator {
  position: absolute;
  top: var(--spacing-2);
  right: var(--spacing-2);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
}

.premium-indicator {
  top: var(--spacing-2);
  left: var(--spacing-2);
  right: auto;
}

.background-info {
  padding: var(--spacing-3);
}

.background-name {
  font-weight: 600;
  color: var(--color-gray-800);
  margin-bottom: var(--spacing-1);
  font-size: var(--text-sm);
}

.background-category {
  color: var(--color-gray-600);
  font-size: var(--text-xs);
  text-transform: capitalize;
}

.background-actions {
  position: absolute;
  top: var(--spacing-2);
  right: var(--spacing-2);
  display: flex;
  gap: var(--spacing-1);
  opacity: 0;
  transition: var(--transition-normal);
}

.background-item:hover .background-actions {
  opacity: 1;
}

.action-btn {
  background: rgba(255, 255, 255, 0.9);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1rem;
  transition: var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: white;
  transform: scale(1.1);
}

.current-background-control {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-4);
  background: var(--color-gray-50);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-gray-200);
}

.current-background-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.current-thumbnail {
  width: 60px;
  height: 40px;
  background-size: cover;
  background-position: center;
  background-color: var(--color-gray-300);
  border-radius: var(--radius-md);
}

.current-name {
  font-weight: 600;
  color: var(--color-gray-800);
}

.current-category {
  color: var(--color-gray-600);
  font-size: var(--text-sm);
}

.current-controls {
  display: flex;
  gap: var(--spacing-2);
}

.control-btn {
  background: var(--color-gray-200);
  color: var(--color-gray-700);
  border: none;
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-weight: 500;
  transition: var(--transition-normal);
}

.control-btn:hover {
  background: var(--color-gray-300);
}

/* モーダルスタイル */
.preview-modal,
.upload-modal,
.settings-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-4);
}

.preview-content,
.upload-content,
.settings-content {
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.preview-header,
.upload-header,
.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-6);
  border-bottom: 1px solid var(--color-gray-200);
}

.preview-body,
.upload-body,
.settings-body {
  padding: var(--spacing-6);
}

.preview-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
  padding: var(--spacing-4) var(--spacing-6);
  border-top: 1px solid var(--color-gray-200);
}

.preview-workspace {
  height: 300px;
  background-size: cover;
  background-position: center;
  border-radius: var(--radius-lg);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-4);
}

.preview-avatar,
.preview-furniture {
  font-size: 3rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.upload-zone {
  border: 2px dashed var(--color-gray-300);
  border-radius: var(--radius-lg);
  padding: var(--spacing-8);
  text-align: center;
  transition: var(--transition-normal);
  cursor: pointer;
}

.upload-zone:hover {
  border-color: var(--color-primary);
  background: rgba(255, 107, 107, 0.05);
}

.upload-icon {
  font-size: 3rem;
  margin-bottom: var(--spacing-4);
}

.upload-text {
  margin-bottom: var(--spacing-4);
}

.upload-text p {
  margin: 0 0 var(--spacing-2) 0;
  color: var(--color-gray-600);
}

.upload-formats {
  color: var(--color-gray-500);
  font-size: var(--text-sm);
}

.upload-progress {
  margin-top: var(--spacing-4);
}

.progress-bar {
  background: var(--color-gray-200);
  height: 8px;
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: var(--spacing-2);
}

.progress-fill {
  background: var(--color-primary);
  height: 100%;
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  color: var(--color-gray-600);
  font-weight: 500;
}

.setting-group {
  margin-bottom: var(--spacing-4);
}

.setting-group label {
  display: block;
  margin-bottom: var(--spacing-2);
  font-weight: 600;
  color: var(--color-gray-700);
}

.slider {
  width: 100%;
  margin-bottom: var(--spacing-2);
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: var(--spacing-2);
  cursor: pointer;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-weight: 500;
  transition: var(--transition-normal);
}

.btn-secondary {
  background: var(--color-gray-200);
  color: var(--color-gray-700);
  border: none;
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-weight: 500;
  transition: var(--transition-normal);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: var(--color-gray-500);
  padding: var(--spacing-1);
}

@media (max-width: 768px) {
  .backgrounds-header {
    flex-direction: column;
    gap: var(--spacing-4);
  }

  .header-controls {
    width: 100%;
    justify-content: center;
  }

  .category-tabs {
    justify-content: flex-start;
  }

  .backgrounds-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: var(--spacing-3);
  }

  .current-background-control {
    flex-direction: column;
    gap: var(--spacing-3);
  }

  .current-controls {
    width: 100%;
    justify-content: center;
  }
}
</style>
