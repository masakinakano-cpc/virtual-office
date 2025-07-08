<template>
  <div class="collision-system">
    <div class="collision-debug" v-if="showDebug">
      <h3>衝突判定デバッグ</h3>
      <div class="debug-info">
        <p>現在位置: ({{ Math.round(currentPosition.x) }}, {{ Math.round(currentPosition.y) }})</p>
        <p>衝突状態: {{ isColliding ? '衝突中' : '正常' }}</p>
        <p>衝突オブジェクト: {{ collisionObject || 'なし' }}</p>
        <p>移動可能方向: {{ availableDirections.join(', ') || 'なし' }}</p>
      </div>

      <div class="collision-objects">
        <h4>衝突オブジェクト一覧</h4>
        <div v-for="obj in collisionObjects" :key="obj.id" class="collision-object">
          <span class="object-name">{{ obj.name }}</span>
          <span class="object-bounds">
            ({{ obj.bounds.x }}, {{ obj.bounds.y }})
            {{ obj.bounds.width }}×{{ obj.bounds.height }}
          </span>
        </div>
      </div>
    </div>

    <!-- 衝突判定の可視化 -->
    <div
      v-if="showVisualization"
      class="collision-visualization"
      :style="{ width: spaceWidth + 'px', height: spaceHeight + 'px' }"
    >
      <!-- 衝突オブジェクトの表示 -->
      <div
        v-for="obj in collisionObjects"
        :key="obj.id"
        class="collision-box"
        :class="{ 'collision-active': obj.isColliding }"
        :style="{
          left: obj.bounds.x + 'px',
          top: obj.bounds.y + 'px',
          width: obj.bounds.width + 'px',
          height: obj.bounds.height + 'px'
        }"
      >
        <span class="collision-label">{{ obj.name }}</span>
      </div>

      <!-- アバターの衝突範囲 -->
      <div
        class="avatar-collision-box"
        :style="{
          left: (currentPosition.x - avatarSize / 2) + 'px',
          top: (currentPosition.y - avatarSize / 2) + 'px',
          width: avatarSize + 'px',
          height: avatarSize + 'px'
        }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

// 型定義
interface Position {
  x: number
  y: number
}

interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

interface CollisionObject {
  id: string
  name: string
  type: 'wall' | 'furniture' | 'decoration' | 'zone'
  bounds: Bounds
  isCollidable: boolean
  isColliding?: boolean
}

interface CollisionResult {
  isColliding: boolean
  collisionObject?: CollisionObject
  correctedPosition?: Position
  availableDirections: string[]
}

// Props
interface Props {
  currentPosition: Position
  targetPosition?: Position
  avatarSize?: number
  spaceWidth?: number
  spaceHeight?: number
  showDebug?: boolean
  showVisualization?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  avatarSize: 60,
  spaceWidth: 1000,
  spaceHeight: 600,
  showDebug: false,
  showVisualization: false
})

// Emits
const emit = defineEmits<{
  collision: [result: CollisionResult]
  positionCorrected: [position: Position]
}>()

// State
const collisionObjects = ref<CollisionObject[]>([])
const isColliding = ref(false)
const collisionObject = ref<string | null>(null)

// 衝突判定の設定
const COLLISION_MARGIN = 5 // 衝突判定のマージン
const WALL_THICKNESS = 20

// 移動可能方向の計算
const availableDirections = computed(() => {
  const directions: string[] = []
  const testPositions = {
    '上': { x: props.currentPosition.x, y: props.currentPosition.y - 10 },
    '下': { x: props.currentPosition.x, y: props.currentPosition.y + 10 },
    '左': { x: props.currentPosition.x - 10, y: props.currentPosition.y },
    '右': { x: props.currentPosition.x + 10, y: props.currentPosition.y }
  }

  Object.entries(testPositions).forEach(([direction, position]) => {
    if (!checkCollisionAtPosition(position).isColliding) {
      directions.push(direction)
    }
  })

  return directions
})

// 初期衝突オブジェクトの設定
const initializeCollisionObjects = () => {
  collisionObjects.value = [
    // 外壁
    {
      id: 'wall-left',
      name: '左壁',
      type: 'wall',
      bounds: { x: 0, y: 0, width: WALL_THICKNESS, height: props.spaceHeight },
      isCollidable: true
    },
    {
      id: 'wall-right',
      name: '右壁',
      type: 'wall',
      bounds: { x: props.spaceWidth - WALL_THICKNESS, y: 0, width: WALL_THICKNESS, height: props.spaceHeight },
      isCollidable: true
    },
    {
      id: 'wall-top',
      name: '上壁',
      type: 'wall',
      bounds: { x: 0, y: 0, width: props.spaceWidth, height: WALL_THICKNESS },
      isCollidable: true
    },
    {
      id: 'wall-bottom',
      name: '下壁',
      type: 'wall',
      bounds: { x: 0, y: props.spaceHeight - WALL_THICKNESS, width: props.spaceWidth, height: WALL_THICKNESS },
      isCollidable: true
    },

    // 家具
    {
      id: 'desk-1',
      name: 'デスク1',
      type: 'furniture',
      bounds: { x: 100, y: 100, width: 120, height: 60 },
      isCollidable: true
    },
    {
      id: 'desk-2',
      name: 'デスク2',
      type: 'furniture',
      bounds: { x: 300, y: 100, width: 120, height: 60 },
      isCollidable: true
    },
    {
      id: 'desk-3',
      name: 'デスク3',
      type: 'furniture',
      bounds: { x: 500, y: 100, width: 120, height: 60 },
      isCollidable: true
    },
    {
      id: 'meeting-table',
      name: '会議テーブル',
      type: 'furniture',
      bounds: { x: 200, y: 300, width: 200, height: 100 },
      isCollidable: true
    },
    {
      id: 'sofa',
      name: 'ソファ',
      type: 'furniture',
      bounds: { x: 600, y: 400, width: 150, height: 80 },
      isCollidable: true
    },

    // 装飾品
    {
      id: 'plant-1',
      name: '植物1',
      type: 'decoration',
      bounds: { x: 50, y: 50, width: 30, height: 30 },
      isCollidable: true
    },
    {
      id: 'plant-2',
      name: '植物2',
      type: 'decoration',
      bounds: { x: 850, y: 50, width: 30, height: 30 },
      isCollidable: true
    },
    {
      id: 'plant-3',
      name: '植物3',
      type: 'decoration',
      bounds: { x: 50, y: 500, width: 30, height: 30 },
      isCollidable: true
    },

    // 会議室エリア（仕切り）
    {
      id: 'meeting-room-wall',
      name: '会議室仕切り',
      type: 'wall',
      bounds: { x: 150, y: 250, width: 300, height: WALL_THICKNESS },
      isCollidable: true
    },

    // ホワイトボード
    {
      id: 'whiteboard',
      name: 'ホワイトボード',
      type: 'furniture',
      bounds: { x: 100, y: 200, width: 80, height: 10 },
      isCollidable: true
    }
  ]
}

// 衝突判定の実行
const checkCollisionAtPosition = (position: Position): CollisionResult => {
  const avatarBounds = {
    x: position.x - props.avatarSize / 2,
    y: position.y - props.avatarSize / 2,
    width: props.avatarSize,
    height: props.avatarSize
  }

  for (const obj of collisionObjects.value) {
    if (!obj.isCollidable) continue

    if (isRectColliding(avatarBounds, obj.bounds)) {
      return {
        isColliding: true,
        collisionObject: obj,
        correctedPosition: getCorrectedPosition(position, obj),
        availableDirections: []
      }
    }
  }

  return {
    isColliding: false,
    availableDirections: []
  }
}

// 矩形同士の衝突判定
const isRectColliding = (rect1: Bounds, rect2: Bounds): boolean => {
  return !(
    rect1.x + rect1.width <= rect2.x + COLLISION_MARGIN ||
    rect2.x + rect2.width <= rect1.x + COLLISION_MARGIN ||
    rect1.y + rect1.height <= rect2.y + COLLISION_MARGIN ||
    rect2.y + rect2.height <= rect1.y + COLLISION_MARGIN
  )
}

// 衝突時の修正位置を計算
const getCorrectedPosition = (position: Position, collisionObj: CollisionObject): Position => {
  const avatarHalfSize = props.avatarSize / 2
  const objBounds = collisionObj.bounds

  // 各方向への押し出し距離を計算
  const pushDistances = {
    left: (position.x + avatarHalfSize) - objBounds.x,
    right: (objBounds.x + objBounds.width) - (position.x - avatarHalfSize),
    top: (position.y + avatarHalfSize) - objBounds.y,
    bottom: (objBounds.y + objBounds.height) - (position.y - avatarHalfSize)
  }

  // 最小の押し出し距離を選択
  const minDistance = Math.min(...Object.values(pushDistances))

  let correctedPosition = { ...position }

  if (pushDistances.left === minDistance) {
    correctedPosition.x = objBounds.x - avatarHalfSize - COLLISION_MARGIN
  } else if (pushDistances.right === minDistance) {
    correctedPosition.x = objBounds.x + objBounds.width + avatarHalfSize + COLLISION_MARGIN
  } else if (pushDistances.top === minDistance) {
    correctedPosition.y = objBounds.y - avatarHalfSize - COLLISION_MARGIN
  } else if (pushDistances.bottom === minDistance) {
    correctedPosition.y = objBounds.y + objBounds.height + avatarHalfSize + COLLISION_MARGIN
  }

  return correctedPosition
}

// 壁に沿った移動の計算
const getWallSlidePosition = (fromPosition: Position, toPosition: Position): Position => {
  const collisionResult = checkCollisionAtPosition(toPosition)

  if (!collisionResult.isColliding) {
    return toPosition
  }

  // X軸のみの移動を試す
  const xOnlyPosition = { x: toPosition.x, y: fromPosition.y }
  if (!checkCollisionAtPosition(xOnlyPosition).isColliding) {
    return xOnlyPosition
  }

  // Y軸のみの移動を試す
  const yOnlyPosition = { x: fromPosition.x, y: toPosition.y }
  if (!checkCollisionAtPosition(yOnlyPosition).isColliding) {
    return yOnlyPosition
  }

  // 移動できない場合は元の位置を返す
  return fromPosition
}

// 衝突オブジェクトの追加
const addCollisionObject = (obj: CollisionObject) => {
  collisionObjects.value.push(obj)
}

// 衝突オブジェクトの削除
const removeCollisionObject = (id: string) => {
  const index = collisionObjects.value.findIndex(obj => obj.id === id)
  if (index !== -1) {
    collisionObjects.value.splice(index, 1)
  }
}

// 衝突オブジェクトの更新
const updateCollisionObject = (id: string, updates: Partial<CollisionObject>) => {
  const obj = collisionObjects.value.find(obj => obj.id === id)
  if (obj) {
    Object.assign(obj, updates)
  }
}

// パブリックメソッド
const checkCollision = (position: Position) => {
  return checkCollisionAtPosition(position)
}

const canMoveTo = (position: Position): boolean => {
  return !checkCollisionAtPosition(position).isColliding
}

const getValidPosition = (fromPosition: Position, toPosition: Position): Position => {
  const directResult = checkCollisionAtPosition(toPosition)

  if (!directResult.isColliding) {
    return toPosition
  }

  // 壁に沿った移動を試す
  const slidePosition = getWallSlidePosition(fromPosition, toPosition)
  return slidePosition
}

// 現在位置の監視
watch(() => props.currentPosition, (newPosition) => {
  const result = checkCollisionAtPosition(newPosition)
  isColliding.value = result.isColliding
  collisionObject.value = result.collisionObject?.name || null

  // 衝突オブジェクトの状態を更新
  collisionObjects.value.forEach(obj => {
    obj.isColliding = false
  })

  if (result.collisionObject) {
    result.collisionObject.isColliding = true
  }

  emit('collision', result)

  if (result.isColliding && result.correctedPosition) {
    emit('positionCorrected', result.correctedPosition)
  }
}, { deep: true })

// 初期化
onMounted(() => {
  initializeCollisionObjects()
})

// エクスポート
defineExpose({
  checkCollision,
  canMoveTo,
  getValidPosition,
  addCollisionObject,
  removeCollisionObject,
  updateCollisionObject,
  collisionObjects
})
</script>

<style scoped>
.collision-system {
  position: relative;
}

.collision-debug {
  position: fixed;
  top: 20px;
  left: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: var(--spacing-4);
  border-radius: var(--radius-lg);
  font-family: monospace;
  font-size: var(--text-sm);
  z-index: 1000;
  max-width: 300px;
}

.collision-debug h3 {
  margin: 0 0 var(--spacing-3) 0;
  color: #ffd700;
}

.debug-info p {
  margin: var(--spacing-1) 0;
  line-height: 1.4;
}

.collision-objects {
  margin-top: var(--spacing-4);
  border-top: 1px solid #444;
  padding-top: var(--spacing-3);
}

.collision-objects h4 {
  margin: 0 0 var(--spacing-2) 0;
  color: #87ceeb;
  font-size: var(--text-sm);
}

.collision-object {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-1);
  font-size: 11px;
}

.object-name {
  color: #90ee90;
}

.object-bounds {
  color: #ffa500;
}

.collision-visualization {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 5;
}

.collision-box {
  position: absolute;
  border: 2px solid rgba(255, 0, 0, 0.5);
  background: rgba(255, 0, 0, 0.1);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.collision-box.collision-active {
  border-color: rgba(255, 0, 0, 0.8);
  background: rgba(255, 0, 0, 0.3);
  box-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
}

.collision-label {
  font-size: 10px;
  color: rgba(255, 0, 0, 0.8);
  font-weight: bold;
  text-align: center;
  padding: 2px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 2px;
}

.avatar-collision-box {
  position: absolute;
  border: 2px solid rgba(0, 255, 0, 0.7);
  background: rgba(0, 255, 0, 0.1);
  border-radius: 50%;
  transition: all 0.1s ease;
}
</style>
