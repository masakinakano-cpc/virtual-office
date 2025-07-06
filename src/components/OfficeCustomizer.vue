<template>
  <div class="office-customizer">
    <div class="customizer-header">
      <h2 class="customizer-title">🏗️ オフィスカスタマイザー</h2>
      <div class="customizer-controls">
        <button class="control-btn" @click="toggleEditMode">
          {{ isEditMode ? '✅ 完了' : '✏️ 編集' }}
        </button>
        <button class="control-btn" @click="saveLayout">
          💾 保存
        </button>
        <button class="control-btn" @click="$emit('openSettings')">
          ⚙️ 設定
        </button>
      </div>
    </div>

    <!-- 家具パレット -->
    <div v-if="isEditMode" class="furniture-palette">
      <h3>🪑 家具パレット</h3>
      <div class="furniture-grid">
        <div
          v-for="furniture in furnitureTypes"
          :key="furniture.id"
          class="furniture-item"
          :draggable="true"
          @dragstart="startDrag($event, furniture)"
          @click="selectFurniture(furniture)"
          :class="{ selected: selectedFurniture?.id === furniture.id }"
        >
          <div class="furniture-icon">{{ furniture.icon }}</div>
          <div class="furniture-name">{{ furniture.name }}</div>
        </div>
      </div>
    </div>

    <!-- メインオフィス空間 -->
    <div
      class="office-workspace"
      :class="{ 'edit-mode': isEditMode }"
      @drop="handleDrop"
      @dragover="handleDragOver"
      @click="handleWorkspaceClick"
      ref="workspaceRef"
    >
      <!-- グリッド表示 -->
      <div v-if="showGrid && isEditMode" class="grid-overlay"></div>

      <!-- 配置された家具 -->
      <div
        v-for="(item, index) in placedItems"
        :key="item.id"
        class="placed-item"
        :class="{
          selected: selectedItem?.id === item.id,
          'edit-mode': isEditMode
        }"
        :style="{
          transform: `translate(${item.position.x}px, ${item.position.y}px) rotate(${item.rotation || 0}deg)`,
          zIndex: item.zIndex || 1
        }"
        @click.stop="selectItem(item)"
        @mousedown="startItemDrag($event, item, index)"
      >
        <div class="item-content" :style="{ fontSize: item.size || '2rem' }">
          {{ item.icon }}
        </div>

        <!-- 編集モード時のコントロール -->
        <div v-if="isEditMode && selectedItem?.id === item.id" class="item-controls">
          <button class="item-control-btn" @click.stop="rotateItem(index)">🔄</button>
          <button class="item-control-btn" @click.stop="resizeItem(index, 'up')">➕</button>
          <button class="item-control-btn" @click.stop="resizeItem(index, 'down')">➖</button>
          <button class="item-control-btn delete" @click.stop="deleteItem(index)">🗑️</button>
        </div>
      </div>

      <!-- ゾーン表示 -->
      <div
        v-for="zone in workspaceZones"
        :key="zone.id"
        class="workspace-zone-overlay"
        :style="{
          left: zone.bounds.x + 'px',
          top: zone.bounds.y + 'px',
          width: zone.bounds.width + 'px',
          height: zone.bounds.height + 'px'
        }"
      >
        <div class="zone-label">{{ zone.name }}</div>
      </div>

      <!-- 選択範囲 -->
      <div
        v-if="selectionBox"
        class="selection-box"
        :style="{
          left: selectionBox.x + 'px',
          top: selectionBox.y + 'px',
          width: selectionBox.width + 'px',
          height: selectionBox.height + 'px'
        }"
      ></div>
    </div>

    <!-- プロパティパネル -->
    <div v-if="isEditMode" class="properties-panel">
      <h3>🔧 プロパティ</h3>

      <div v-if="selectedItem" class="property-section">
        <h4>選択されたアイテム: {{ selectedItem.name }}</h4>

        <div class="property-group">
          <label>位置 X:</label>
          <input
            v-model.number="selectedItem.position.x"
            type="number"
            class="property-input"
            @input="updateItemPosition"
          />
        </div>

        <div class="property-group">
          <label>位置 Y:</label>
          <input
            v-model.number="selectedItem.position.y"
            type="number"
            class="property-input"
            @input="updateItemPosition"
          />
        </div>

        <div class="property-group">
          <label>回転:</label>
          <input
            v-model.number="selectedItem.rotation"
            type="range"
            min="0"
            max="360"
            class="property-slider"
            @input="updateItemRotation"
          />
          <span>{{ selectedItem.rotation || 0 }}°</span>
        </div>

        <div class="property-group">
          <label>サイズ:</label>
          <select v-model="selectedItem.size" class="property-select" @change="updateItemSize">
            <option value="1rem">小</option>
            <option value="1.5rem">中小</option>
            <option value="2rem">中</option>
            <option value="2.5rem">中大</option>
            <option value="3rem">大</option>
          </select>
        </div>

        <div class="property-group">
          <label>レイヤー:</label>
          <input
            v-model.number="selectedItem.zIndex"
            type="number"
            min="1"
            max="100"
            class="property-input"
            @input="updateItemZIndex"
          />
        </div>
      </div>

      <div v-else class="property-section">
        <p>アイテムを選択してプロパティを編集してください</p>
      </div>

      <!-- ワークスペース設定 -->
      <div class="property-section">
        <h4>ワークスペース設定</h4>

        <div class="property-group">
          <label class="checkbox-label">
            <input v-model="showGrid" type="checkbox" />
            グリッド表示
          </label>
        </div>

        <div class="property-group">
          <label>グリッドサイズ:</label>
          <select v-model="gridSize" class="property-select">
            <option value="20">20px</option>
            <option value="40">40px</option>
            <option value="60">60px</option>
          </select>
        </div>

        <div class="property-group">
          <label class="checkbox-label">
            <input v-model="snapToGrid" type="checkbox" />
            グリッドにスナップ
          </label>
        </div>
      </div>

      <!-- アクション -->
      <div class="property-section">
        <h4>アクション</h4>
        <div class="action-buttons">
          <button class="btn-secondary" @click="selectAll">全選択</button>
          <button class="btn-secondary" @click="deselectAll">選択解除</button>
          <button class="btn-secondary" @click="duplicateSelected">複製</button>
          <button class="btn-secondary" @click="deleteSelected">削除</button>
          <button class="btn-secondary" @click="clearWorkspace">全削除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Position {
  x: number
  y: number
}

interface FurnitureType {
  id: string
  name: string
  icon: string
  category: string
  defaultSize: string
}

interface PlacedItem {
  id: string
  name: string
  icon: string
  position: Position
  rotation?: number
  size?: string
  zIndex?: number
  category: string
}

interface WorkspaceZone {
  id: string
  name: string
  bounds: {
    x: number
    y: number
    width: number
    height: number
  }
}

interface SelectionBox {
  x: number
  y: number
  width: number
  height: number
}

// イベント定義
const emit = defineEmits<{
  openSettings: []
  layoutChanged: [items: PlacedItem[]]
}>()

// 状態管理
const isEditMode = ref(false)
const showGrid = ref(true)
const gridSize = ref(40)
const snapToGrid = ref(true)
const workspaceRef = ref<HTMLElement>()

// 家具タイプ
const furnitureTypes: FurnitureType[] = [
  // デスク・チェア
  { id: 'desk', name: 'デスク', icon: '🗃️', category: 'furniture', defaultSize: '2rem' },
  { id: 'chair', name: 'チェア', icon: '🪑', category: 'furniture', defaultSize: '1.5rem' },
  { id: 'office-chair', name: 'オフィスチェア', icon: '💺', category: 'furniture', defaultSize: '1.5rem' },

  // テーブル
  { id: 'meeting-table', name: '会議テーブル', icon: '🟫', category: 'furniture', defaultSize: '3rem' },
  { id: 'round-table', name: '丸テーブル', icon: '⭕', category: 'furniture', defaultSize: '2.5rem' },
  { id: 'coffee-table', name: 'コーヒーテーブル', icon: '🟤', category: 'furniture', defaultSize: '2rem' },

  // 装飾・植物
  { id: 'plant', name: '観葉植物', icon: '🌱', category: 'decoration', defaultSize: '2rem' },
  { id: 'tree', name: '大きな植物', icon: '🌳', category: 'decoration', defaultSize: '3rem' },
  { id: 'flowers', name: '花', icon: '🌸', category: 'decoration', defaultSize: '1.5rem' },

  // 設備
  { id: 'monitor', name: 'モニター', icon: '🖥️', category: 'equipment', defaultSize: '2rem' },
  { id: 'printer', name: 'プリンター', icon: '🖨️', category: 'equipment', defaultSize: '2rem' },
  { id: 'whiteboard', name: 'ホワイトボード', icon: '⬜', category: 'equipment', defaultSize: '3rem' },

  // 収納
  { id: 'bookshelf', name: '本棚', icon: '📚', category: 'storage', defaultSize: '2.5rem' },
  { id: 'cabinet', name: 'キャビネット', icon: '🗄️', category: 'storage', defaultSize: '2rem' },
  { id: 'locker', name: 'ロッカー', icon: '🏪', category: 'storage', defaultSize: '2.5rem' },

  // その他
  { id: 'sofa', name: 'ソファ', icon: '🛋️', category: 'furniture', defaultSize: '3rem' },
  { id: 'lamp', name: 'ランプ', icon: '💡', category: 'decoration', defaultSize: '1.5rem' },
  { id: 'clock', name: '時計', icon: '🕐', category: 'decoration', defaultSize: '1.5rem' },
]

// 配置されたアイテム
const placedItems = ref<PlacedItem[]>([])

// 選択関連
const selectedFurniture = ref<FurnitureType | null>(null)
const selectedItem = ref<PlacedItem | null>(null)
const selectedItems = ref<PlacedItem[]>([])
const selectionBox = ref<SelectionBox | null>(null)

// ワークスペースゾーン
const workspaceZones = ref<WorkspaceZone[]>([
  {
    id: 'meeting-area',
    name: '会議エリア',
    bounds: { x: 100, y: 100, width: 300, height: 200 }
  },
  {
    id: 'work-area',
    name: '作業エリア',
    bounds: { x: 500, y: 150, width: 400, height: 250 }
  },
  {
    id: 'relax-area',
    name: 'リラックスエリア',
    bounds: { x: 200, y: 400, width: 250, height: 150 }
  }
])

// ドラッグ関連
let draggedFurniture: FurnitureType | null = null
let isDraggingItem = false
let dragOffset = { x: 0, y: 0 }
let draggedItemIndex = -1

// メソッド
const toggleEditMode = () => {
  isEditMode.value = !isEditMode.value
  if (!isEditMode.value) {
    selectedItem.value = null
    selectedItems.value = []
  }
}

const selectFurniture = (furniture: FurnitureType) => {
  selectedFurniture.value = furniture
}

const startDrag = (event: DragEvent, furniture: FurnitureType) => {
  draggedFurniture = furniture
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy'
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()

  if (draggedFurniture && workspaceRef.value) {
    const rect = workspaceRef.value.getBoundingClientRect()
    let x = event.clientX - rect.left
    let y = event.clientY - rect.top

    // グリッドスナップ
    if (snapToGrid.value) {
      x = Math.round(x / gridSize.value) * gridSize.value
      y = Math.round(y / gridSize.value) * gridSize.value
    }

    const newItem: PlacedItem = {
      id: `${draggedFurniture.id}_${Date.now()}`,
      name: draggedFurniture.name,
      icon: draggedFurniture.icon,
      position: { x, y },
      rotation: 0,
      size: draggedFurniture.defaultSize,
      zIndex: placedItems.value.length + 1,
      category: draggedFurniture.category
    }

    placedItems.value.push(newItem)
    selectedItem.value = newItem

    emit('layoutChanged', [...placedItems.value])
  }

  draggedFurniture = null
}

const selectItem = (item: PlacedItem) => {
  if (isEditMode.value) {
    selectedItem.value = item
  }
}

const startItemDrag = (event: MouseEvent, item: PlacedItem, index: number) => {
  if (!isEditMode.value) return

  event.preventDefault()
  isDraggingItem = true
  draggedItemIndex = index

  const rect = workspaceRef.value?.getBoundingClientRect()
  if (rect) {
    dragOffset.x = event.clientX - rect.left - item.position.x
    dragOffset.y = event.clientY - rect.top - item.position.y
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDraggingItem && draggedItemIndex >= 0) {
      const rect = workspaceRef.value?.getBoundingClientRect()
      if (rect) {
        let x = e.clientX - rect.left - dragOffset.x
        let y = e.clientY - rect.top - dragOffset.y

        // グリッドスナップ
        if (snapToGrid.value) {
          x = Math.round(x / gridSize.value) * gridSize.value
          y = Math.round(y / gridSize.value) * gridSize.value
        }

        placedItems.value[draggedItemIndex].position = { x, y }
      }
    }
  }

  const handleMouseUp = () => {
    isDraggingItem = false
    draggedItemIndex = -1
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)

    emit('layoutChanged', [...placedItems.value])
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const rotateItem = (index: number) => {
  const item = placedItems.value[index]
  item.rotation = ((item.rotation || 0) + 45) % 360
  emit('layoutChanged', [...placedItems.value])
}

const resizeItem = (index: number, direction: 'up' | 'down') => {
  const item = placedItems.value[index]
  const currentSize = parseFloat(item.size || '2')
  const step = 0.5

  if (direction === 'up') {
    item.size = Math.min(5, currentSize + step) + 'rem'
  } else {
    item.size = Math.max(0.5, currentSize - step) + 'rem'
  }

  emit('layoutChanged', [...placedItems.value])
}

const deleteItem = (index: number) => {
  placedItems.value.splice(index, 1)
  selectedItem.value = null
  emit('layoutChanged', [...placedItems.value])
}

const updateItemPosition = () => {
  if (selectedItem.value) {
    emit('layoutChanged', [...placedItems.value])
  }
}

const updateItemRotation = () => {
  if (selectedItem.value) {
    emit('layoutChanged', [...placedItems.value])
  }
}

const updateItemSize = () => {
  if (selectedItem.value) {
    emit('layoutChanged', [...placedItems.value])
  }
}

const updateItemZIndex = () => {
  if (selectedItem.value) {
    emit('layoutChanged', [...placedItems.value])
  }
}

const selectAll = () => {
  selectedItems.value = [...placedItems.value]
}

const deselectAll = () => {
  selectedItem.value = null
  selectedItems.value = []
}

const duplicateSelected = () => {
  if (selectedItem.value) {
    const newItem: PlacedItem = {
      ...selectedItem.value,
      id: `${selectedItem.value.id}_copy_${Date.now()}`,
      position: {
        x: selectedItem.value.position.x + 20,
        y: selectedItem.value.position.y + 20
      }
    }
    placedItems.value.push(newItem)
    selectedItem.value = newItem
    emit('layoutChanged', [...placedItems.value])
  }
}

const deleteSelected = () => {
  if (selectedItem.value) {
    const index = placedItems.value.findIndex(item => item.id === selectedItem.value!.id)
    if (index >= 0) {
      deleteItem(index)
    }
  }
}

const clearWorkspace = () => {
  if (confirm('すべてのアイテムを削除しますか？')) {
    placedItems.value = []
    selectedItem.value = null
    selectedItems.value = []
    emit('layoutChanged', [])
  }
}

const handleWorkspaceClick = (event: MouseEvent) => {
  if (isEditMode.value && event.target === workspaceRef.value) {
    selectedItem.value = null
  }
}

const saveLayout = () => {
  const layoutName = prompt('レイアウト名を入力してください:')
  if (layoutName) {
    const layoutData = {
      name: layoutName,
      items: [...placedItems.value],
      zones: [...workspaceZones.value],
      settings: {
        gridSize: gridSize.value,
        showGrid: showGrid.value,
        snapToGrid: snapToGrid.value
      }
    }

    // ローカルストレージに保存
    const savedLayouts = JSON.parse(localStorage.getItem('savedLayouts') || '[]')
    savedLayouts.push({
      id: Date.now().toString(),
      ...layoutData,
      createdAt: new Date().toISOString()
    })
    localStorage.setItem('savedLayouts', JSON.stringify(savedLayouts))

    console.log('レイアウトを保存しました:', layoutName)
    alert(`レイアウト "${layoutName}" を保存しました！`)
  }
}

// 初期レイアウトの設定
const initializeDefaultLayout = () => {
  placedItems.value = [
    {
      id: 'desk_1',
      name: 'デスク',
      icon: '🗃️',
      position: { x: 520, y: 200 },
      rotation: 0,
      size: '2rem',
      zIndex: 1,
      category: 'furniture'
    },
    {
      id: 'chair_1',
      name: 'チェア',
      icon: '🪑',
      position: { x: 520, y: 240 },
      rotation: 0,
      size: '1.5rem',
      zIndex: 1,
      category: 'furniture'
    },
    {
      id: 'meeting_table_1',
      name: '会議テーブル',
      icon: '🟫',
      position: { x: 200, y: 150 },
      rotation: 0,
      size: '3rem',
      zIndex: 1,
      category: 'furniture'
    },
    {
      id: 'plant_1',
      name: '観葉植物',
      icon: '🌱',
      position: { x: 300, y: 450 },
      rotation: 0,
      size: '2rem',
      zIndex: 1,
      category: 'decoration'
    }
  ]
}

// 初期化
initializeDefaultLayout()
</script>

<style scoped>
.office-customizer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-secondary);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.customizer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-4);
  background: var(--bg-creative);
  color: white;
}

.customizer-title {
  font-size: var(--text-xl);
  font-weight: 600;
  margin: 0;
}

.customizer-controls {
  display: flex;
  gap: var(--spacing-2);
}

.control-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-normal);
  font-weight: 500;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.furniture-palette {
  background: white;
  padding: var(--spacing-4);
  border-bottom: 2px solid var(--color-gray-200);
  max-height: 200px;
  overflow-y: auto;
}

.furniture-palette h3 {
  margin: 0 0 var(--spacing-3) 0;
  color: var(--color-primary);
}

.furniture-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: var(--spacing-2);
}

.furniture-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-2);
  border: 2px solid var(--color-gray-300);
  border-radius: var(--radius-lg);
  cursor: grab;
  transition: var(--transition-normal);
  background: white;
}

.furniture-item:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.furniture-item.selected {
  border-color: var(--color-primary);
  background: rgba(255, 107, 107, 0.1);
}

.furniture-item:active {
  cursor: grabbing;
}

.furniture-icon {
  font-size: 2rem;
  margin-bottom: var(--spacing-1);
}

.furniture-name {
  font-size: var(--text-xs);
  text-align: center;
  color: var(--color-gray-600);
  font-weight: 500;
}

.office-workspace {
  flex: 1;
  position: relative;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  overflow: hidden;
  min-height: 600px;
}

.office-workspace.edit-mode {
  cursor: crosshair;
}

.grid-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
  z-index: 1;
}

.placed-item {
  position: absolute;
  cursor: pointer;
  transition: var(--transition-normal);
  user-select: none;
  z-index: 10;
}

.placed-item:hover {
  transform: scale(1.05) !important;
}

.placed-item.selected {
  filter: drop-shadow(0 0 10px var(--color-primary));
}

.placed-item.edit-mode {
  cursor: grab;
}

.placed-item.edit-mode:active {
  cursor: grabbing;
}

.item-content {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.item-controls {
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: var(--spacing-1);
  background: rgba(255, 255, 255, 0.9);
  padding: var(--spacing-1);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  z-index: 100;
}

.item-control-btn {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  background: var(--color-gray-200);
  transition: var(--transition-fast);
  font-size: var(--text-sm);
}

.item-control-btn:hover {
  background: var(--color-gray-300);
  transform: scale(1.1);
}

.item-control-btn.delete {
  background: #ff4757;
  color: white;
}

.item-control-btn.delete:hover {
  background: #ff3838;
}

.workspace-zone-overlay {
  position: absolute;
  border: 2px dashed rgba(255, 107, 107, 0.5);
  background: rgba(255, 107, 107, 0.1);
  border-radius: var(--radius-lg);
  pointer-events: none;
  z-index: 2;
}

.zone-label {
  position: absolute;
  top: -15px;
  left: 10px;
  background: var(--color-primary);
  color: white;
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: 600;
}

.selection-box {
  position: absolute;
  border: 2px dashed var(--color-primary);
  background: rgba(255, 107, 107, 0.1);
  pointer-events: none;
  z-index: 50;
}

.properties-panel {
  width: 300px;
  background: white;
  padding: var(--spacing-4);
  border-left: 2px solid var(--color-gray-200);
  overflow-y: auto;
  max-height: 600px;
}

.properties-panel h3 {
  margin: 0 0 var(--spacing-4) 0;
  color: var(--color-primary);
}

.property-section {
  margin-bottom: var(--spacing-6);
  padding-bottom: var(--spacing-4);
  border-bottom: 1px solid var(--color-gray-200);
}

.property-section:last-child {
  border-bottom: none;
}

.property-section h4 {
  margin: 0 0 var(--spacing-3) 0;
  color: var(--color-gray-700);
  font-size: var(--text-base);
}

.property-group {
  margin-bottom: var(--spacing-3);
}

.property-group label {
  display: block;
  margin-bottom: var(--spacing-1);
  font-weight: 500;
  color: var(--color-gray-600);
  font-size: var(--text-sm);
}

.property-input,
.property-select {
  width: 100%;
  padding: var(--spacing-2);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
}

.property-input:focus,
.property-select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.property-slider {
  width: 100%;
  margin-right: var(--spacing-2);
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: var(--spacing-2);
  cursor: pointer;
}

.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-2);
}

.btn-secondary {
  background: var(--color-gray-200);
  color: var(--color-gray-700);
  border: none;
  padding: var(--spacing-2);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-normal);
  font-size: var(--text-sm);
  font-weight: 500;
}

.btn-secondary:hover {
  background: var(--color-gray-300);
}

/* レスポンシブ対応 */
@media (max-width: 1024px) {
  .office-customizer {
    flex-direction: column;
  }

  .properties-panel {
    width: 100%;
    max-height: 300px;
    order: -1;
  }

  .furniture-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  }
}

@media (max-width: 768px) {
  .customizer-controls {
    flex-direction: column;
    gap: var(--spacing-1);
  }

  .control-btn {
    font-size: var(--text-sm);
    padding: var(--spacing-1) var(--spacing-2);
  }

  .furniture-grid {
    grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  }

  .furniture-icon {
    font-size: 1.5rem;
  }

  .action-buttons {
    grid-template-columns: 1fr;
  }
}
</style>
