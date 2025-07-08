<template>
  <div class="whiteboard-system">
    <!-- ヘッダー -->
    <div class="whiteboard-header">
      <div class="header-left">
        <h3 class="whiteboard-title">
          <span class="title-icon">📝</span>
          {{ boardTitle }}
        </h3>
        <div class="collaboration-status">
          <span class="collaborators-count">{{ collaborators.length }}人が編集中</span>
          <div class="collaborator-avatars">
            <div
              v-for="user in collaborators"
              :key="user.id"
              class="collaborator-avatar"
              :style="{ backgroundColor: user.color }"
              :title="user.nickname"
            >
              {{ user.nickname.charAt(0).toUpperCase() }}
            </div>
          </div>
        </div>
      </div>

      <div class="header-right">
        <button @click="toggleFullscreen" class="header-btn" :class="{ active: isFullscreen }">
          {{ isFullscreen ? '🗗' : '⛶' }}
        </button>
        <button @click="shareBoard" class="header-btn">
          📤
        </button>
        <button @click="closeBoard" class="header-btn close-btn">
          ✕
        </button>
      </div>
    </div>

    <!-- ツールバー -->
    <div class="toolbar">
      <div class="tool-group">
        <button
          v-for="tool in drawingTools"
          :key="tool.name"
          @click="selectTool(tool.name)"
          class="tool-btn"
          :class="{ active: selectedTool === tool.name }"
          :title="tool.label"
        >
          {{ tool.icon }}
        </button>
      </div>

      <div class="tool-group">
        <div class="color-picker">
          <input
            v-model="selectedColor"
            type="color"
            class="color-input"
            @change="updateColor"
          />
          <div class="color-presets">
            <div
              v-for="color in colorPresets"
              :key="color"
              class="color-preset"
              :style="{ backgroundColor: color }"
              @click="selectColor(color)"
            ></div>
          </div>
        </div>
      </div>

      <div class="tool-group">
        <label class="stroke-width-label">
          太さ:
          <input
            v-model="strokeWidth"
            type="range"
            min="1"
            max="20"
            step="1"
            class="stroke-width-slider"
            @input="updateStrokeWidth"
          />
          <span class="stroke-width-value">{{ strokeWidth }}px</span>
        </label>
      </div>

      <div class="tool-group">
        <button @click="undo" class="tool-btn" :disabled="!canUndo">
          ↶
        </button>
        <button @click="redo" class="tool-btn" :disabled="!canRedo">
          ↷
        </button>
        <button @click="clearBoard" class="tool-btn clear-btn">
          🗑️
        </button>
      </div>

      <div class="tool-group">
        <button @click="toggleGrid" class="tool-btn" :class="{ active: showGrid }">
          ⊞
        </button>
        <button @click="toggleRuler" class="tool-btn" :class="{ active: showRuler }">
          📏
        </button>
      </div>
    </div>

    <!-- キャンバス領域 -->
    <div class="canvas-container" ref="canvasContainer">
      <!-- グリッド -->
      <div v-if="showGrid" class="grid-overlay"></div>

      <!-- ルーラー -->
      <div v-if="showRuler" class="ruler-overlay">
        <div class="ruler-horizontal"></div>
        <div class="ruler-vertical"></div>
      </div>

      <!-- メインキャンバス -->
      <canvas
        ref="mainCanvas"
        class="main-canvas"
        @mousedown="startDrawing"
        @mousemove="draw"
        @mouseup="stopDrawing"
        @mouseleave="stopDrawing"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      ></canvas>

      <!-- 他のユーザーのカーソル -->
      <div
        v-for="cursor in remoteCursors"
        :key="cursor.userId"
        class="remote-cursor"
        :style="{
          left: cursor.x + 'px',
          top: cursor.y + 'px',
          color: cursor.color
        }"
      >
        <div class="cursor-pointer">→</div>
        <div class="cursor-label">{{ cursor.nickname }}</div>
      </div>
    </div>

    <!-- テキスト入力モーダル -->
    <div v-if="showTextInput" class="text-input-modal">
      <div class="modal-content">
        <h4>テキストを入力</h4>
        <textarea
          v-model="textInput"
          placeholder="テキストを入力してください..."
          class="text-input-field"
          @keydown.enter.ctrl="addText"
        ></textarea>
        <div class="text-input-controls">
          <select v-model="textFontSize" class="font-size-select">
            <option value="12">12px</option>
            <option value="16">16px</option>
            <option value="20">20px</option>
            <option value="24">24px</option>
            <option value="32">32px</option>
            <option value="48">48px</option>
          </select>
          <button @click="addText" class="btn-primary">追加</button>
          <button @click="cancelTextInput" class="btn-secondary">キャンセル</button>
        </div>
      </div>
    </div>

    <!-- 共有モーダル -->
    <div v-if="showShareModal" class="share-modal">
      <div class="modal-content">
        <h4>ホワイトボードを共有</h4>
        <div class="share-options">
          <div class="share-option">
            <label>共有URL:</label>
            <div class="url-input-group">
              <input
                v-model="shareUrl"
                type="text"
                readonly
                class="share-url-input"
              />
              <button @click="copyShareUrl" class="copy-btn">
                {{ urlCopied ? '✓' : '📋' }}
              </button>
            </div>
          </div>
          <div class="share-option">
            <label>アクセス権限:</label>
            <select v-model="sharePermission" class="permission-select">
              <option value="view">閲覧のみ</option>
              <option value="edit">編集可能</option>
              <option value="admin">管理者</option>
            </select>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="generateShareLink" class="btn-primary">リンク生成</button>
          <button @click="closeShareModal" class="btn-secondary">閉じる</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'

// 型定義
interface Point {
  x: number
  y: number
}

interface DrawingPath {
  id: string
  tool: string
  color: string
  strokeWidth: number
  points: Point[]
  timestamp: number
  userId: string
}

interface TextElement {
  id: string
  text: string
  x: number
  y: number
  fontSize: number
  color: string
  timestamp: number
  userId: string
}

interface RemoteCursor {
  userId: string
  nickname: string
  color: string
  x: number
  y: number
}

interface Collaborator {
  id: string
  nickname: string
  color: string
  isActive: boolean
}

// Props
interface Props {
  boardId?: string
  boardTitle?: string
  isFullscreen?: boolean
  collaborators?: Collaborator[]
}

const props = withDefaults(defineProps<Props>(), {
  boardId: 'default-board',
  boardTitle: 'ホワイトボード',
  isFullscreen: false,
  collaborators: () => []
})

// Emits
const emit = defineEmits<{
  close: []
  fullscreenToggle: [isFullscreen: boolean]
  share: [url: string, permission: string]
}>()

// Refs
const canvasContainer = ref<HTMLElement>()
const mainCanvas = ref<HTMLCanvasElement>()

// State
const isDrawing = ref(false)
const selectedTool = ref('pen')
const selectedColor = ref('#000000')
const strokeWidth = ref(3)
const showGrid = ref(false)
const showRuler = ref(false)
const showTextInput = ref(false)
const showShareModal = ref(false)
const textInput = ref('')
const textFontSize = ref(16)
const shareUrl = ref('')
const sharePermission = ref('edit')
const urlCopied = ref(false)

// Canvas context
let ctx: CanvasRenderingContext2D | null = null
let currentPath: Point[] = []

// Drawing data
const drawingPaths = ref<DrawingPath[]>([])
const textElements = ref<TextElement[]>([])
const remoteCursors = ref<RemoteCursor[]>([])

// History for undo/redo
const history = ref<(DrawingPath | TextElement)[][]>([])
const historyIndex = ref(-1)

// Computed
const canUndo = computed(() => historyIndex.value > 0)
const canRedo = computed(() => historyIndex.value < history.value.length - 1)

// Drawing tools
const drawingTools = [
  { name: 'pen', icon: '✏️', label: 'ペン' },
  { name: 'highlighter', icon: '🖍️', label: 'ハイライター' },
  { name: 'eraser', icon: '🧹', label: '消しゴム' },
  { name: 'line', icon: '📏', label: '直線' },
  { name: 'rectangle', icon: '⬜', label: '四角形' },
  { name: 'circle', icon: '⭕', label: '円' },
  { name: 'arrow', icon: '➡️', label: '矢印' },
  { name: 'text', icon: '📝', label: 'テキスト' }
]

// Color presets
const colorPresets = [
  '#000000', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500',
  '#800080', '#FFC0CB', '#A52A2A', '#808080'
]

// Canvas initialization
const initCanvas = () => {
  if (!mainCanvas.value || !canvasContainer.value) return

  const canvas = mainCanvas.value
  const container = canvasContainer.value

  // Set canvas size
  canvas.width = container.clientWidth
  canvas.height = container.clientHeight

  ctx = canvas.getContext('2d')
  if (!ctx) return

  // Set default styles
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = selectedColor.value
  ctx.lineWidth = strokeWidth.value
}

// Drawing functions
const startDrawing = (event: MouseEvent) => {
  if (!ctx) return

  isDrawing.value = true
  const rect = mainCanvas.value!.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  if (selectedTool.value === 'text') {
    showTextInputAt(x, y)
    return
  }

  currentPath = [{ x, y }]

  ctx.beginPath()
  ctx.moveTo(x, y)
}

const draw = (event: MouseEvent) => {
  if (!isDrawing.value || !ctx) return

  const rect = mainCanvas.value!.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  currentPath.push({ x, y })

  if (selectedTool.value === 'pen' || selectedTool.value === 'highlighter') {
    ctx.lineTo(x, y)
    ctx.stroke()
  } else if (selectedTool.value === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out'
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  // Send cursor position to other users
  broadcastCursorPosition(x, y)
}

const stopDrawing = () => {
  if (!isDrawing.value) return

  isDrawing.value = false

  if (currentPath.length > 0) {
    const path: DrawingPath = {
      id: `path-${Date.now()}`,
      tool: selectedTool.value,
      color: selectedColor.value,
      strokeWidth: strokeWidth.value,
      points: [...currentPath],
      timestamp: Date.now(),
      userId: 'current-user'
    }

    drawingPaths.value.push(path)
    addToHistory()
    broadcastDrawingPath(path)
  }

  currentPath = []

  if (ctx) {
    ctx.globalCompositeOperation = 'source-over'
  }
}

// Touch events
const handleTouchStart = (event: TouchEvent) => {
  event.preventDefault()
  const touch = event.touches[0]
  const mouseEvent = new MouseEvent('mousedown', {
    clientX: touch.clientX,
    clientY: touch.clientY
  })
  startDrawing(mouseEvent)
}

const handleTouchMove = (event: TouchEvent) => {
  event.preventDefault()
  const touch = event.touches[0]
  const mouseEvent = new MouseEvent('mousemove', {
    clientX: touch.clientX,
    clientY: touch.clientY
  })
  draw(mouseEvent)
}

const handleTouchEnd = (event: TouchEvent) => {
  event.preventDefault()
  stopDrawing()
}

// Tool functions
const selectTool = (tool: string) => {
  selectedTool.value = tool
}

const updateColor = () => {
  if (ctx) {
    ctx.strokeStyle = selectedColor.value
  }
}

const selectColor = (color: string) => {
  selectedColor.value = color
  updateColor()
}

const updateStrokeWidth = () => {
  if (ctx) {
    ctx.lineWidth = strokeWidth.value
  }
}

// Text functions
const showTextInputAt = (_x: number, _y: number) => {
  showTextInput.value = true
  // Store position for later use
  textInput.value = ''
}

const addText = () => {
  if (!textInput.value.trim()) return

  const textElement: TextElement = {
    id: `text-${Date.now()}`,
    text: textInput.value,
    x: 100, // Use stored position
    y: 100,
    fontSize: textFontSize.value,
    color: selectedColor.value,
    timestamp: Date.now(),
    userId: 'current-user'
  }

  textElements.value.push(textElement)
  drawText(textElement)
  addToHistory()
  broadcastTextElement(textElement)

  cancelTextInput()
}

const cancelTextInput = () => {
  showTextInput.value = false
  textInput.value = ''
}

const drawText = (textElement: TextElement) => {
  if (!ctx) return

  ctx.font = `${textElement.fontSize}px Arial`
  ctx.fillStyle = textElement.color
  ctx.fillText(textElement.text, textElement.x, textElement.y)
}

// History functions
const addToHistory = () => {
  const currentState = [...drawingPaths.value, ...textElements.value]
  history.value = history.value.slice(0, historyIndex.value + 1)
  history.value.push(currentState)
  historyIndex.value++
}

const undo = () => {
  if (!canUndo.value) return

  historyIndex.value--
  restoreFromHistory()
}

const redo = () => {
  if (!canRedo.value) return

  historyIndex.value++
  restoreFromHistory()
}

const restoreFromHistory = () => {
  if (historyIndex.value < 0) return

  const state = history.value[historyIndex.value]
  drawingPaths.value = state.filter(item => 'points' in item) as DrawingPath[]
  textElements.value = state.filter(item => 'text' in item) as TextElement[]

  redrawCanvas()
}

// Canvas functions
const redrawCanvas = () => {
  if (!ctx) return

  ctx.clearRect(0, 0, mainCanvas.value!.width, mainCanvas.value!.height)

  // Redraw paths
  drawingPaths.value.forEach(path => {
    ctx!.strokeStyle = path.color
    ctx!.lineWidth = path.strokeWidth
    ctx!.beginPath()

    path.points.forEach((point, index) => {
      if (index === 0) {
        ctx!.moveTo(point.x, point.y)
      } else {
        ctx!.lineTo(point.x, point.y)
      }
    })

    ctx!.stroke()
  })

  // Redraw text
  textElements.value.forEach(textElement => {
    drawText(textElement)
  })
}

const clearBoard = () => {
  if (!ctx) return

  ctx.clearRect(0, 0, mainCanvas.value!.width, mainCanvas.value!.height)
  drawingPaths.value = []
  textElements.value = []
  addToHistory()
  broadcastClearBoard()
}

// UI functions
const toggleGrid = () => {
  showGrid.value = !showGrid.value
}

const toggleRuler = () => {
  showRuler.value = !showRuler.value
}

const toggleFullscreen = () => {
  emit('fullscreenToggle', !props.isFullscreen)
}

const closeBoard = () => {
  emit('close')
}

// Share functions
const shareBoard = () => {
  showShareModal.value = true
  generateShareLink()
}

const generateShareLink = () => {
  shareUrl.value = `${window.location.origin}/whiteboard/${props.boardId}?permission=${sharePermission.value}`
}

const copyShareUrl = async () => {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    urlCopied.value = true
    setTimeout(() => {
      urlCopied.value = false
    }, 2000)
  } catch (error) {
    console.error('URLのコピーに失敗しました:', error)
  }
}

const closeShareModal = () => {
  showShareModal.value = false
}

// Collaboration functions
const broadcastDrawingPath = (path: DrawingPath) => {
  // WebSocket or WebRTC implementation
  console.log('Broadcasting drawing path:', path)
}

const broadcastTextElement = (textElement: TextElement) => {
  // WebSocket or WebRTC implementation
  console.log('Broadcasting text element:', textElement)
}

const broadcastCursorPosition = (x: number, y: number) => {
  // WebSocket or WebRTC implementation
  console.log('Broadcasting cursor position:', { x, y })
}

const broadcastClearBoard = () => {
  // WebSocket or WebRTC implementation
  console.log('Broadcasting clear board')
}

// Resize handler
const handleResize = () => {
  if (!mainCanvas.value || !canvasContainer.value) return

  const imageData = ctx?.getImageData(0, 0, mainCanvas.value.width, mainCanvas.value.height)

  mainCanvas.value.width = canvasContainer.value.clientWidth
  mainCanvas.value.height = canvasContainer.value.clientHeight

  if (imageData && ctx) {
    ctx.putImageData(imageData, 0, 0)
  }

  updateColor()
  updateStrokeWidth()
}

// Lifecycle
onMounted(async () => {
  await nextTick()
  initCanvas()
  addToHistory()

  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// Watchers
watch([selectedColor, strokeWidth], () => {
  updateColor()
  updateStrokeWidth()
})
</script>

<style scoped>
.whiteboard-system {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f8f9fa;
}

.whiteboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-3) var(--spacing-4);
  background: white;
  border-bottom: 1px solid #e9ecef;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
}

.whiteboard-title {
  margin: 0;
  font-size: var(--text-lg);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.collaboration-status {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--text-sm);
  color: var(--color-gray-600);
}

.collaborator-avatars {
  display: flex;
  gap: var(--spacing-1);
}

.collaborator-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 10px;
  font-weight: bold;
}

.header-right {
  display: flex;
  gap: var(--spacing-2);
}

.header-btn {
  background: none;
  border: 1px solid #dee2e6;
  padding: var(--spacing-2);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-normal);
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-btn:hover {
  background: #f8f9fa;
}

.header-btn.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.header-btn.close-btn:hover {
  background: #dc3545;
  color: white;
  border-color: #dc3545;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  padding: var(--spacing-3) var(--spacing-4);
  background: white;
  border-bottom: 1px solid #e9ecef;
  overflow-x: auto;
}

.tool-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2);
  border-radius: var(--radius-md);
  background: #f8f9fa;
}

.tool-btn {
  background: none;
  border: 1px solid transparent;
  padding: var(--spacing-2);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-normal);
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.tool-btn:hover {
  background: white;
  border-color: #dee2e6;
}

.tool-btn.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.tool-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tool-btn.clear-btn:hover {
  background: #dc3545;
  color: white;
  border-color: #dc3545;
}

.color-picker {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.color-input {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.color-presets {
  display: flex;
  gap: 2px;
}

.color-preset {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 0 0 1px #dee2e6;
}

.stroke-width-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--text-sm);
  color: var(--color-gray-700);
}

.stroke-width-slider {
  width: 80px;
}

.stroke-width-value {
  min-width: 30px;
  text-align: center;
  font-weight: 500;
}

.canvas-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.grid-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    linear-gradient(to right, #e9ecef 1px, transparent 1px),
    linear-gradient(to bottom, #e9ecef 1px, transparent 1px);
  background-size: 20px 20px;
  pointer-events: none;
  z-index: 1;
}

.ruler-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 2;
}

.ruler-horizontal {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.ruler-vertical {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 20px;
  background: #f8f9fa;
  border-right: 1px solid #dee2e6;
}

.main-canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: crosshair;
  background: white;
}

.remote-cursor {
  position: absolute;
  pointer-events: none;
  z-index: 10;
  transform: translate(-2px, -2px);
}

.cursor-pointer {
  font-size: 16px;
  transform: rotate(-45deg);
}

.cursor-label {
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  margin-top: 4px;
  white-space: nowrap;
}

.text-input-modal,
.share-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: var(--spacing-6);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}

.modal-content h4 {
  margin: 0 0 var(--spacing-4) 0;
  font-size: var(--text-lg);
}

.text-input-field {
  width: 100%;
  height: 120px;
  padding: var(--spacing-3);
  border: 1px solid #dee2e6;
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: var(--text-base);
  resize: vertical;
  margin-bottom: var(--spacing-3);
}

.text-input-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.font-size-select {
  padding: var(--spacing-2);
  border: 1px solid #dee2e6;
  border-radius: var(--radius-md);
}

.share-options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-4);
}

.share-option label {
  display: block;
  margin-bottom: var(--spacing-2);
  font-weight: 500;
}

.url-input-group {
  display: flex;
  gap: var(--spacing-2);
}

.share-url-input {
  flex: 1;
  padding: var(--spacing-2);
  border: 1px solid #dee2e6;
  border-radius: var(--radius-md);
  font-family: monospace;
  font-size: var(--text-sm);
}

.copy-btn {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-normal);
}

.copy-btn:hover {
  background: var(--color-primary-dark);
}

.permission-select {
  padding: var(--spacing-2);
  border: 1px solid #dee2e6;
  border-radius: var(--radius-md);
  width: 100%;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
}

.btn-primary,
.btn-secondary {
  padding: var(--spacing-2) var(--spacing-4);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-normal);
  font-weight: 500;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

/* レスポンシブデザイン */
@media (max-width: 768px) {
  .toolbar {
    flex-wrap: wrap;
    gap: var(--spacing-2);
  }

  .tool-group {
    flex-wrap: wrap;
  }

  .stroke-width-label {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-1);
  }

  .modal-content {
    margin: var(--spacing-4);
    width: auto;
  }
}
</style>
