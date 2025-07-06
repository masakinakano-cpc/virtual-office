<template>
  <div class="layout-templates">
    <div class="templates-header">
      <h2 class="templates-title">📐 レイアウトテンプレート</h2>
      <p class="templates-description">
        プリセットレイアウトから選択するか、カスタムレイアウトを作成してください
      </p>
    </div>

    <div class="templates-grid">
      <div
        v-for="template in layoutTemplates"
        :key="template.id"
        class="template-card"
        :class="{ selected: selectedTemplate === template.id }"
        @click="selectTemplate(template)"
      >
        <div class="template-preview">
          <div class="preview-workspace">
            <div
              v-for="item in template.previewItems"
              :key="item.id"
              class="preview-item"
              :style="{
                left: (item.position.x / 10) + 'px',
                top: (item.position.y / 10) + 'px',
                transform: `rotate(${item.rotation || 0}deg)`
              }"
            >
              {{ item.icon }}
            </div>
          </div>
        </div>

        <div class="template-info">
          <h3 class="template-name">{{ template.name }}</h3>
          <p class="template-description">{{ template.description }}</p>

          <div class="template-stats">
            <span class="stat">
              <span class="stat-icon">🪑</span>
              {{ template.itemCount }}個
            </span>
            <span class="stat">
              <span class="stat-icon">👥</span>
              {{ template.capacity }}人
            </span>
            <span class="stat">
              <span class="stat-icon">📏</span>
              {{ template.size }}
            </span>
          </div>

          <div class="template-tags">
            <span
              v-for="tag in template.tags"
              :key="tag"
              class="template-tag"
            >
              {{ tag }}
            </span>
          </div>
        </div>

        <div class="template-actions">
          <button
            class="btn-preview"
            @click.stop="previewTemplate(template)"
          >
            👁️ プレビュー
          </button>
          <button
            class="btn-apply"
            @click.stop="applyTemplate(template)"
          >
            ✨ 適用
          </button>
        </div>
      </div>
    </div>

    <!-- カスタムテンプレート作成 -->
    <div class="custom-template-section">
      <h3 class="section-title">🎨 カスタムテンプレート</h3>

      <div class="custom-template-form">
        <div class="form-group">
          <label>テンプレート名</label>
          <input
            v-model="customTemplate.name"
            type="text"
            placeholder="マイカスタムレイアウト"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label>説明</label>
          <textarea
            v-model="customTemplate.description"
            placeholder="このレイアウトの説明を入力してください"
            class="form-textarea"
          ></textarea>
        </div>

        <div class="form-group">
          <label>タグ (カンマ区切り)</label>
          <input
            v-model="customTemplate.tagsInput"
            type="text"
            placeholder="オープン, クリエイティブ, 会議"
            class="form-input"
          />
        </div>

        <div class="form-actions">
          <button
            class="btn-secondary"
            @click="saveCurrentAsTemplate"
          >
            💾 現在のレイアウトをテンプレート化
          </button>
          <button
            class="btn-creative"
            @click="createCustomTemplate"
          >
            ✨ カスタムテンプレート作成
          </button>
        </div>
      </div>
    </div>

    <!-- 保存済みテンプレート -->
    <div class="saved-templates-section">
      <h3 class="section-title">💾 保存済みテンプレート</h3>

      <div class="saved-templates-grid">
        <div
          v-for="template in savedTemplates"
          :key="template.id"
          class="saved-template-card"
        >
          <div class="saved-template-info">
            <h4 class="saved-template-name">{{ template.name }}</h4>
            <p class="saved-template-date">
              {{ template.createdAt ? formatDate(template.createdAt) : '不明' }}
            </p>
          </div>

          <div class="saved-template-actions">
            <button
              class="btn-small"
              @click="loadTemplate(template)"
            >
              📂 読み込み
            </button>
            <button
              class="btn-small"
              @click="editTemplate(template)"
            >
              ✏️ 編集
            </button>
            <button
              class="btn-small danger"
              @click="deleteTemplate(template.id)"
            >
              🗑️ 削除
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- プレビューモーダル -->
    <div v-if="previewingTemplate" class="preview-modal">
      <div class="preview-modal-content">
        <div class="preview-modal-header">
          <h3>{{ previewingTemplate.name }} - プレビュー</h3>
          <button class="close-btn" @click="closePreview">✕</button>
        </div>

        <div class="preview-modal-body">
          <div class="large-preview">
            <div
              v-for="item in previewingTemplate.items"
              :key="item.id"
              class="large-preview-item"
              :style="{
                left: (item.position.x / 2) + 'px',
                top: (item.position.y / 2) + 'px',
                transform: `rotate(${item.rotation || 0}deg)`,
                fontSize: '1.5rem'
              }"
            >
              {{ item.icon }}
            </div>
          </div>
        </div>

        <div class="preview-modal-footer">
          <button class="btn-secondary" @click="closePreview">
            キャンセル
          </button>
          <button class="btn-creative" @click="applyPreviewedTemplate">
            ✨ このレイアウトを適用
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

interface Position {
  x: number
  y: number
}

interface LayoutItem {
  id: string
  name: string
  icon: string
  position: Position
  rotation?: number
  size?: string
  category: string
}

interface LayoutTemplate {
  id: string
  name: string
  description: string
  items: LayoutItem[]
  previewItems: LayoutItem[]
  itemCount: number
  capacity: number
  size: string
  tags: string[]
  category: string
  isCustom?: boolean
  createdAt?: Date
}

interface CustomTemplate {
  name: string
  description: string
  tagsInput: string
}

// イベント定義
const emit = defineEmits<{
  templateSelected: [template: LayoutTemplate]
  templateApplied: [template: LayoutTemplate]
}>()

// 状態管理
const selectedTemplate = ref<string | null>(null)
const previewingTemplate = ref<LayoutTemplate | null>(null)
const savedTemplates = ref<LayoutTemplate[]>([])

const customTemplate = reactive<CustomTemplate>({
  name: '',
  description: '',
  tagsInput: ''
})

// プリセットレイアウトテンプレート
const layoutTemplates: LayoutTemplate[] = [
  {
    id: 'open-office',
    name: 'オープンオフィス',
    description: '開放的で協力的な作業空間。チームワークを重視したレイアウト',
    category: 'collaborative',
    itemCount: 12,
    capacity: 8,
    size: '大',
    tags: ['オープン', 'チームワーク', '協力'],
    previewItems: [
      { id: 'desk1', name: 'デスク', icon: '🗃️', position: { x: 100, y: 100 }, category: 'furniture' },
      { id: 'desk2', name: 'デスク', icon: '🗃️', position: { x: 200, y: 100 }, category: 'furniture' },
      { id: 'desk3', name: 'デスク', icon: '🗃️', position: { x: 300, y: 100 }, category: 'furniture' },
      { id: 'desk4', name: 'デスク', icon: '🗃️', position: { x: 100, y: 200 }, category: 'furniture' },
      { id: 'desk5', name: 'デスク', icon: '🗃️', position: { x: 200, y: 200 }, category: 'furniture' },
      { id: 'desk6', name: 'デスク', icon: '🗃️', position: { x: 300, y: 200 }, category: 'furniture' },
      { id: 'meeting', name: '会議テーブル', icon: '🟫', position: { x: 450, y: 150 }, category: 'furniture' },
      { id: 'plant1', name: '植物', icon: '🌱', position: { x: 50, y: 50 }, category: 'decoration' },
      { id: 'plant2', name: '植物', icon: '🌱', position: { x: 400, y: 50 }, category: 'decoration' },
    ],
    items: [
      { id: 'desk1', name: 'デスク', icon: '🗃️', position: { x: 200, y: 200 }, category: 'furniture' },
      { id: 'desk2', name: 'デスク', icon: '🗃️', position: { x: 400, y: 200 }, category: 'furniture' },
      { id: 'desk3', name: 'デスク', icon: '🗃️', position: { x: 600, y: 200 }, category: 'furniture' },
      { id: 'desk4', name: 'デスク', icon: '🗃️', position: { x: 200, y: 400 }, category: 'furniture' },
      { id: 'desk5', name: 'デスク', icon: '🗃️', position: { x: 400, y: 400 }, category: 'furniture' },
      { id: 'desk6', name: 'デスク', icon: '🗃️', position: { x: 600, y: 400 }, category: 'furniture' },
      { id: 'meeting', name: '会議テーブル', icon: '🟫', position: { x: 900, y: 300 }, category: 'furniture' },
      { id: 'plant1', name: '植物', icon: '🌱', position: { x: 100, y: 100 }, category: 'decoration' },
      { id: 'plant2', name: '植物', icon: '🌱', position: { x: 800, y: 100 }, category: 'decoration' },
      { id: 'chair1', name: 'チェア', icon: '🪑', position: { x: 200, y: 240 }, category: 'furniture' },
      { id: 'chair2', name: 'チェア', icon: '🪑', position: { x: 400, y: 240 }, category: 'furniture' },
      { id: 'chair3', name: 'チェア', icon: '🪑', position: { x: 600, y: 240 }, category: 'furniture' },
    ]
  },
  {
    id: 'creative-studio',
    name: 'クリエイティブスタジオ',
    description: '創造性を刺激するフレキシブルな空間。アートとデザインワークに最適',
    category: 'creative',
    itemCount: 10,
    capacity: 6,
    size: '中',
    tags: ['クリエイティブ', 'アート', 'デザイン', 'フレキシブル'],
    previewItems: [
      { id: 'round1', name: '丸テーブル', icon: '⭕', position: { x: 150, y: 150 }, category: 'furniture' },
      { id: 'round2', name: '丸テーブル', icon: '⭕', position: { x: 350, y: 150 }, category: 'furniture' },
      { id: 'sofa', name: 'ソファ', icon: '🛋️', position: { x: 250, y: 300 }, category: 'furniture' },
      { id: 'whiteboard', name: 'ホワイトボード', icon: '⬜', position: { x: 50, y: 100 }, category: 'equipment' },
      { id: 'plant1', name: '植物', icon: '🌸', position: { x: 400, y: 50 }, category: 'decoration' },
      { id: 'plant2', name: '植物', icon: '🌱', position: { x: 100, y: 350 }, category: 'decoration' },
    ],
    items: [
      { id: 'round1', name: '丸テーブル', icon: '⭕', position: { x: 300, y: 300 }, category: 'furniture' },
      { id: 'round2', name: '丸テーブル', icon: '⭕', position: { x: 700, y: 300 }, category: 'furniture' },
      { id: 'sofa', name: 'ソファ', icon: '🛋️', position: { x: 500, y: 600 }, category: 'furniture' },
      { id: 'whiteboard', name: 'ホワイトボード', icon: '⬜', position: { x: 100, y: 200 }, category: 'equipment' },
      { id: 'plant1', name: '植物', icon: '🌸', position: { x: 800, y: 100 }, category: 'decoration' },
      { id: 'plant2', name: '植物', icon: '🌱', position: { x: 200, y: 700 }, category: 'decoration' },
      { id: 'chair1', name: 'チェア', icon: '🪑', position: { x: 280, y: 330 }, category: 'furniture' },
      { id: 'chair2', name: 'チェア', icon: '🪑', position: { x: 320, y: 330 }, category: 'furniture' },
      { id: 'chair3', name: 'チェア', icon: '🪑', position: { x: 680, y: 330 }, category: 'furniture' },
      { id: 'chair4', name: 'チェア', icon: '🪑', position: { x: 720, y: 330 }, category: 'furniture' },
    ]
  },
  {
    id: 'meeting-focused',
    name: '会議重視レイアウト',
    description: '大小様々な会議に対応できる多機能な会議空間',
    category: 'meeting',
    itemCount: 15,
    capacity: 12,
    size: '大',
    tags: ['会議', 'プレゼン', 'ディスカッション'],
    previewItems: [
      { id: 'big-table', name: '大会議テーブル', icon: '🟫', position: { x: 200, y: 150 }, category: 'furniture' },
      { id: 'small-table', name: '小会議テーブル', icon: '🟤', position: { x: 400, y: 100 }, category: 'furniture' },
      { id: 'whiteboard1', name: 'ホワイトボード', icon: '⬜', position: { x: 100, y: 50 }, category: 'equipment' },
      { id: 'whiteboard2', name: 'ホワイトボード', icon: '⬜', position: { x: 350, y: 50 }, category: 'equipment' },
      { id: 'monitor', name: 'モニター', icon: '🖥️', position: { x: 250, y: 50 }, category: 'equipment' },
    ],
    items: [
      { id: 'big-table', name: '大会議テーブル', icon: '🟫', position: { x: 400, y: 300 }, category: 'furniture' },
      { id: 'small-table', name: '小会議テーブル', icon: '🟤', position: { x: 800, y: 200 }, category: 'furniture' },
      { id: 'whiteboard1', name: 'ホワイトボード', icon: '⬜', position: { x: 200, y: 100 }, category: 'equipment' },
      { id: 'whiteboard2', name: 'ホワイトボード', icon: '⬜', position: { x: 700, y: 100 }, category: 'equipment' },
      { id: 'monitor', name: 'モニター', icon: '🖥️', position: { x: 500, y: 100 }, category: 'equipment' },
      { id: 'chair1', name: 'チェア', icon: '🪑', position: { x: 350, y: 280 }, category: 'furniture' },
      { id: 'chair2', name: 'チェア', icon: '🪑', position: { x: 400, y: 280 }, category: 'furniture' },
      { id: 'chair3', name: 'チェア', icon: '🪑', position: { x: 450, y: 280 }, category: 'furniture' },
      { id: 'chair4', name: 'チェア', icon: '🪑', position: { x: 350, y: 320 }, category: 'furniture' },
      { id: 'chair5', name: 'チェア', icon: '🪑', position: { x: 400, y: 320 }, category: 'furniture' },
      { id: 'chair6', name: 'チェア', icon: '🪑', position: { x: 450, y: 320 }, category: 'furniture' },
      { id: 'chair7', name: 'チェア', icon: '🪑', position: { x: 780, y: 180 }, category: 'furniture' },
      { id: 'chair8', name: 'チェア', icon: '🪑', position: { x: 820, y: 180 }, category: 'furniture' },
      { id: 'chair9', name: 'チェア', icon: '🪑', position: { x: 780, y: 220 }, category: 'furniture' },
      { id: 'chair10', name: 'チェア', icon: '🪑', position: { x: 820, y: 220 }, category: 'furniture' },
    ]
  },
  {
    id: 'quiet-workspace',
    name: '静かな作業空間',
    description: '集中作業に最適な静寂な環境。個人作業やリサーチに適している',
    category: 'focus',
    itemCount: 8,
    capacity: 4,
    size: '小',
    tags: ['集中', '静寂', '個人作業', 'リサーチ'],
    previewItems: [
      { id: 'desk1', name: 'デスク', icon: '🗃️', position: { x: 100, y: 100 }, category: 'furniture' },
      { id: 'desk2', name: 'デスク', icon: '🗃️', position: { x: 300, y: 100 }, category: 'furniture' },
      { id: 'bookshelf', name: '本棚', icon: '📚', position: { x: 50, y: 200 }, category: 'storage' },
      { id: 'plant', name: '植物', icon: '🌱', position: { x: 400, y: 200 }, category: 'decoration' },
      { id: 'lamp', name: 'ランプ', icon: '💡', position: { x: 200, y: 50 }, category: 'decoration' },
    ],
    items: [
      { id: 'desk1', name: 'デスク', icon: '🗃️', position: { x: 200, y: 200 }, category: 'furniture' },
      { id: 'desk2', name: 'デスク', icon: '🗃️', position: { x: 600, y: 200 }, category: 'furniture' },
      { id: 'bookshelf', name: '本棚', icon: '📚', position: { x: 100, y: 400 }, category: 'storage' },
      { id: 'plant', name: '植物', icon: '🌱', position: { x: 800, y: 400 }, category: 'decoration' },
      { id: 'lamp', name: 'ランプ', icon: '💡', position: { x: 400, y: 100 }, category: 'decoration' },
      { id: 'chair1', name: 'チェア', icon: '🪑', position: { x: 200, y: 240 }, category: 'furniture' },
      { id: 'chair2', name: 'チェア', icon: '🪑', position: { x: 600, y: 240 }, category: 'furniture' },
      { id: 'monitor', name: 'モニター', icon: '🖥️', position: { x: 200, y: 180 }, category: 'equipment' },
    ]
  },
  {
    id: 'hybrid-space',
    name: 'ハイブリッド空間',
    description: 'リモートワークとオフィスワークの融合。多様な働き方に対応',
    category: 'hybrid',
    itemCount: 14,
    capacity: 10,
    size: '大',
    tags: ['ハイブリッド', 'リモート', '多様性', 'フレキシブル'],
    previewItems: [
      { id: 'desk1', name: 'デスク', icon: '🗃️', position: { x: 100, y: 100 }, category: 'furniture' },
      { id: 'desk2', name: 'デスク', icon: '🗃️', position: { x: 300, y: 100 }, category: 'furniture' },
      { id: 'sofa', name: 'ソファ', icon: '🛋️', position: { x: 200, y: 250 }, category: 'furniture' },
      { id: 'round-table', name: '丸テーブル', icon: '⭕', position: { x: 400, y: 200 }, category: 'furniture' },
      { id: 'monitor', name: 'モニター', icon: '🖥️', position: { x: 150, y: 50 }, category: 'equipment' },
      { id: 'plant', name: '植物', icon: '🌳', position: { x: 50, y: 300 }, category: 'decoration' },
    ],
    items: [
      { id: 'desk1', name: 'デスク', icon: '🗃️', position: { x: 200, y: 200 }, category: 'furniture' },
      { id: 'desk2', name: 'デスク', icon: '🗃️', position: { x: 600, y: 200 }, category: 'furniture' },
      { id: 'sofa', name: 'ソファ', icon: '🛋️', position: { x: 400, y: 500 }, category: 'furniture' },
      { id: 'round-table', name: '丸テーブル', icon: '⭕', position: { x: 800, y: 400 }, category: 'furniture' },
      { id: 'monitor1', name: 'モニター', icon: '🖥️', position: { x: 300, y: 100 }, category: 'equipment' },
      { id: 'monitor2', name: 'モニター', icon: '🖥️', position: { x: 700, y: 100 }, category: 'equipment' },
      { id: 'plant', name: '植物', icon: '🌳', position: { x: 100, y: 600 }, category: 'decoration' },
      { id: 'chair1', name: 'チェア', icon: '🪑', position: { x: 200, y: 240 }, category: 'furniture' },
      { id: 'chair2', name: 'チェア', icon: '🪑', position: { x: 600, y: 240 }, category: 'furniture' },
      { id: 'chair3', name: 'チェア', icon: '🪑', position: { x: 780, y: 380 }, category: 'furniture' },
      { id: 'chair4', name: 'チェア', icon: '🪑', position: { x: 820, y: 380 }, category: 'furniture' },
      { id: 'chair5', name: 'チェア', icon: '🪑', position: { x: 780, y: 420 }, category: 'furniture' },
      { id: 'chair6', name: 'チェア', icon: '🪑', position: { x: 820, y: 420 }, category: 'furniture' },
      { id: 'coffee-table', name: 'コーヒーテーブル', icon: '🟤', position: { x: 400, y: 550 }, category: 'furniture' },
    ]
  }
]

// メソッド
const selectTemplate = (template: LayoutTemplate) => {
  selectedTemplate.value = template.id
  emit('templateSelected', template)
}

const previewTemplate = (template: LayoutTemplate) => {
  previewingTemplate.value = template
}

const closePreview = () => {
  previewingTemplate.value = null
}

const applyTemplate = (template: LayoutTemplate) => {
  emit('templateApplied', template)
  console.log('テンプレートを適用しました:', template.name)
}

const applyPreviewedTemplate = () => {
  if (previewingTemplate.value) {
    applyTemplate(previewingTemplate.value)
    closePreview()
  }
}

const saveCurrentAsTemplate = () => {
  if (!customTemplate.name.trim()) {
    alert('テンプレート名を入力してください')
    return
  }

  // 現在のレイアウトを取得（実際の実装では親コンポーネントから取得）
  const currentLayout: LayoutTemplate = {
    id: `custom_${Date.now()}`,
    name: customTemplate.name,
    description: customTemplate.description,
    items: [], // 実際の実装では現在のアイテムを取得
    previewItems: [], // 実際の実装では現在のアイテムを取得
    itemCount: 0,
    capacity: 0,
    size: '中',
    tags: customTemplate.tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag),
    category: 'custom',
    isCustom: true,
    createdAt: new Date()
  }

  savedTemplates.value.push(currentLayout)

  // ローカルストレージに保存
  localStorage.setItem('savedTemplates', JSON.stringify(savedTemplates.value))

  // フォームをリセット
  customTemplate.name = ''
  customTemplate.description = ''
  customTemplate.tagsInput = ''

  console.log('カスタムテンプレートを保存しました:', currentLayout.name)
  alert('カスタムテンプレートを保存しました！')
}

const createCustomTemplate = () => {
  console.log('カスタムテンプレート作成機能を開始')
  // 実際の実装では、カスタムテンプレート作成モードに入る
}

const loadTemplate = (template: LayoutTemplate) => {
  applyTemplate(template)
}

const editTemplate = (template: LayoutTemplate) => {
  customTemplate.name = template.name
  customTemplate.description = template.description
  customTemplate.tagsInput = template.tags.join(', ')
  console.log('テンプレートを編集モードにしました:', template.name)
}

const deleteTemplate = (templateId: string) => {
  if (confirm('このテンプレートを削除しますか？')) {
    savedTemplates.value = savedTemplates.value.filter(t => t.id !== templateId)
    localStorage.setItem('savedTemplates', JSON.stringify(savedTemplates.value))
    console.log('テンプレートを削除しました')
  }
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

// 保存済みテンプレートの読み込み
const loadSavedTemplates = () => {
  const saved = localStorage.getItem('savedTemplates')
  if (saved) {
    try {
      savedTemplates.value = JSON.parse(saved)
    } catch (error) {
      console.error('保存済みテンプレートの読み込みに失敗しました:', error)
    }
  }
}

// 初期化
loadSavedTemplates()
</script>

<style scoped>
.layout-templates {
  padding: var(--spacing-6);
  background: var(--bg-secondary);
  border-radius: var(--radius-xl);
}

.templates-header {
  text-align: center;
  margin-bottom: var(--spacing-8);
}

.templates-title {
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: var(--spacing-2);
}

.templates-description {
  color: var(--color-gray-600);
  font-size: var(--text-lg);
  max-width: 600px;
  margin: 0 auto;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: var(--spacing-6);
  margin-bottom: var(--spacing-8);
}

.template-card {
  background: white;
  border-radius: var(--radius-xl);
  padding: var(--spacing-6);
  box-shadow: var(--shadow-lg);
  transition: var(--transition-normal);
  cursor: pointer;
  border: 3px solid transparent;
}

.template-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}

.template-card.selected {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.2);
}

.template-preview {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: var(--radius-lg);
  height: 200px;
  margin-bottom: var(--spacing-4);
  position: relative;
  overflow: hidden;
}

.preview-workspace {
  position: relative;
  width: 100%;
  height: 100%;
}

.preview-item {
  position: absolute;
  font-size: 1rem;
  transition: var(--transition-normal);
}

.template-info {
  margin-bottom: var(--spacing-4);
}

.template-name {
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-gray-800);
  margin-bottom: var(--spacing-2);
}

.template-description {
  color: var(--color-gray-600);
  font-size: var(--text-sm);
  line-height: 1.5;
  margin-bottom: var(--spacing-3);
}

.template-stats {
  display: flex;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-3);
}

.stat {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  font-size: var(--text-sm);
  color: var(--color-gray-600);
}

.stat-icon {
  font-size: 1rem;
}

.template-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-4);
}

.template-tag {
  background: rgba(255, 107, 107, 0.1);
  color: var(--color-primary);
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 500;
}

.template-actions {
  display: flex;
  gap: var(--spacing-2);
}

.btn-preview,
.btn-apply {
  flex: 1;
  padding: var(--spacing-2) var(--spacing-3);
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition-normal);
  font-weight: 500;
  font-size: var(--text-sm);
}

.btn-preview {
  background: var(--color-gray-200);
  color: var(--color-gray-700);
}

.btn-preview:hover {
  background: var(--color-gray-300);
}

.btn-apply {
  background: var(--color-primary);
  color: white;
}

.btn-apply:hover {
  background: var(--color-primary-dark);
}

/* カスタムテンプレート */
.custom-template-section,
.saved-templates-section {
  margin-top: var(--spacing-8);
  padding-top: var(--spacing-6);
  border-top: 2px solid var(--color-gray-200);
}

.section-title {
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: var(--spacing-6);
}

.custom-template-form {
  background: white;
  padding: var(--spacing-6);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
}

.form-group {
  margin-bottom: var(--spacing-4);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-2);
  font-weight: 600;
  color: var(--color-gray-700);
}

.form-input,
.form-textarea {
  width: 100%;
  padding: var(--spacing-3);
  border: 2px solid var(--color-gray-300);
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  transition: var(--transition-normal);
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.1);
}

.form-textarea {
  height: 80px;
  resize: vertical;
}

.form-actions {
  display: flex;
  gap: var(--spacing-3);
  flex-wrap: wrap;
}

.btn-secondary {
  background: var(--color-gray-200);
  color: var(--color-gray-700);
  border: none;
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition-normal);
  font-weight: 500;
}

.btn-secondary:hover {
  background: var(--color-gray-300);
}

.btn-creative {
  background: var(--bg-creative);
  color: white;
  border: none;
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition-normal);
  font-weight: 500;
}

.btn-creative:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* 保存済みテンプレート */
.saved-templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-4);
}

.saved-template-card {
  background: white;
  padding: var(--spacing-4);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.saved-template-info {
  flex: 1;
}

.saved-template-name {
  font-weight: 600;
  color: var(--color-gray-800);
  margin-bottom: var(--spacing-1);
}

.saved-template-date {
  font-size: var(--text-sm);
  color: var(--color-gray-500);
  margin: 0;
}

.saved-template-actions {
  display: flex;
  gap: var(--spacing-2);
}

.btn-small {
  padding: var(--spacing-1) var(--spacing-2);
  font-size: var(--text-xs);
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

/* プレビューモーダル */
.preview-modal {
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

.preview-modal-content {
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

.preview-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-6);
  background: var(--bg-creative);
  color: white;
}

.preview-modal-header h3 {
  margin: 0;
  font-size: var(--text-xl);
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

.preview-modal-body {
  flex: 1;
  padding: var(--spacing-6);
  overflow-y: auto;
}

.large-preview {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: var(--radius-lg);
  height: 400px;
  position: relative;
  overflow: hidden;
}

.large-preview-item {
  position: absolute;
  transition: var(--transition-normal);
}

.preview-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
  padding: var(--spacing-4) var(--spacing-6);
  background: var(--color-gray-50);
  border-top: 1px solid var(--color-gray-200);
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
  .templates-grid {
    grid-template-columns: 1fr;
  }

  .template-card {
    padding: var(--spacing-4);
  }

  .template-preview {
    height: 150px;
  }

  .template-actions {
    flex-direction: column;
  }

  .form-actions {
    flex-direction: column;
  }

  .saved-templates-grid {
    grid-template-columns: 1fr;
  }

  .saved-template-card {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-3);
  }

  .saved-template-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
