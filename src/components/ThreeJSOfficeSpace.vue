<template>
  <div class="threejs-office-space">
    <div class="office-header">
      <h2 class="office-title">🏢 3D バーチャルオフィス</h2>
      <div class="office-controls">
        <button @click="toggleCameraView" class="control-btn">
          <span class="btn-icon">📷</span>
          {{ cameraView }}
        </button>
        <button @click="toggleLighting" class="control-btn" :class="{ active: lightingEnabled }">
          <span class="btn-icon">💡</span>
          照明
        </button>
        <button @click="toggleCollisionDebug" class="control-btn" :class="{ active: showCollisionBoxes }">
          <span class="btn-icon">🔲</span>
          衝突判定
        </button>
        <button @click="resetCamera" class="control-btn">
          <span class="btn-icon">🔄</span>
          リセット
        </button>
      </div>
    </div>

    <!-- Three.js Canvas -->
    <div ref="canvasContainer" class="canvas-container" @click="handleSpaceClick">
      <canvas ref="threeCanvas" class="three-canvas"></canvas>
    </div>

    <!-- UI オーバーレイ -->
    <div class="ui-overlay">
      <!-- ミニマップ -->
      <div class="minimap">
        <h4>ミニマップ</h4>
        <div class="minimap-content">
          <div
            v-for="user in connectedUsers"
            :key="user.id"
            class="minimap-avatar"
            :style="{
              left: (user.position.x / 20) + 'px',
              top: (user.position.y / 20) + 'px',
              backgroundColor: user.color
            }"
          >
            {{ user.nickname.charAt(0) }}
          </div>
          <!-- 自分の位置 -->
          <div
            class="minimap-avatar current-user"
            :style="{
              left: (avatarPosition.x / 20) + 'px',
              top: (avatarPosition.y / 20) + 'px'
            }"
          >
            YOU
          </div>
        </div>
      </div>

      <!-- 3D設定パネル -->
      <div class="settings-panel">
        <h4>3D設定</h4>
        <div class="setting-group">
          <label>視点の高さ</label>
          <input
            v-model="cameraHeight"
            type="range"
            min="2"
            max="15"
            step="0.5"
            @input="updateCameraHeight"
            class="setting-slider"
          />
          <span>{{ cameraHeight }}m</span>
        </div>
        <div class="setting-group">
          <label>照明の強さ</label>
          <input
            v-model="lightIntensity"
            type="range"
            min="0.1"
            max="2.0"
            step="0.1"
            @input="updateLighting"
            class="setting-slider"
          />
          <span>{{ lightIntensity }}</span>
        </div>
        <div class="setting-group">
          <label>アンビエント光</label>
          <input
            v-model="ambientIntensity"
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            @input="updateLighting"
            class="setting-slider"
          />
          <span>{{ ambientIntensity }}</span>
        </div>
      </div>
    </div>

    <!-- ローディング表示 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p>3D空間を読み込み中...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// Props
interface Props {
  connectedUsers: Array<{
    id: string
    nickname: string
    position: { x: number; y: number }
    color: string
    isActive: boolean
  }>
  avatarPosition: { x: number; y: number }
  onPositionUpdate?: (position: { x: number; y: number }) => void
}

const props = defineProps<Props>()
const emit = defineEmits<{
  positionUpdate: [position: { x: number; y: number }]
  userInteraction: [userId: string]
}>()

// Refs
const canvasContainer = ref<HTMLElement>()
const threeCanvas = ref<HTMLCanvasElement>()

// Three.js Objects
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let raycaster: THREE.Raycaster
let mouse: THREE.Vector2

// Lighting
let ambientLight: THREE.AmbientLight
let directionalLight: THREE.DirectionalLight
let pointLights: THREE.PointLight[] = []

// Objects
let floorMesh: THREE.Mesh
let wallMeshes: THREE.Mesh[] = []
let furnitureMeshes: THREE.Object3D[] = []
let avatarMeshes: Map<string, THREE.Object3D> = new Map()
let collisionBoxes: THREE.Box3[] = []

// State
const isLoading = ref(true)
const cameraView = ref('俯瞰視点')
const lightingEnabled = ref(true)
const showCollisionBoxes = ref(false)
const cameraHeight = ref(8)
const lightIntensity = ref(1.0)
const ambientIntensity = ref(0.4)

// 3D空間の設定
const SPACE_WIDTH = 1000
const SPACE_HEIGHT = 600
const WALL_HEIGHT = 3
const AVATAR_HEIGHT = 1.8

// 初期化
const initThreeJS = async () => {
  if (!canvasContainer.value || !threeCanvas.value) return

  // シーンの作成
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf0f8ff)

  // カメラの作成
  const aspect = canvasContainer.value.clientWidth / canvasContainer.value.clientHeight
  camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000)
  camera.position.set(0, cameraHeight.value, 10)
  camera.lookAt(0, 0, 0)

  // レンダラーの作成
  renderer = new THREE.WebGLRenderer({
    canvas: threeCanvas.value,
    antialias: true,
    alpha: true
  })
  renderer.setSize(canvasContainer.value.clientWidth, canvasContainer.value.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace

  // コントロールの設定
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.screenSpacePanning = false
  controls.minDistance = 5
  controls.maxDistance = 50
  controls.maxPolarAngle = Math.PI / 2.2

  // レイキャスターとマウスの初期化
  raycaster = new THREE.Raycaster()
  mouse = new THREE.Vector2()

  // 照明の設定
  setupLighting()

  // オフィス空間の構築
  await buildOfficeSpace()

  // アニメーションループの開始
  animate()

  isLoading.value = false
}

// 照明設定
const setupLighting = () => {
  // アンビエント光
  ambientLight = new THREE.AmbientLight(0x404040, ambientIntensity.value)
  scene.add(ambientLight)

  // 方向光（太陽光）
  directionalLight = new THREE.DirectionalLight(0xffffff, lightIntensity.value)
  directionalLight.position.set(50, 50, 50)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.width = 2048
  directionalLight.shadow.mapSize.height = 2048
  directionalLight.shadow.camera.near = 0.5
  directionalLight.shadow.camera.far = 500
  directionalLight.shadow.camera.left = -50
  directionalLight.shadow.camera.right = 50
  directionalLight.shadow.camera.top = 50
  directionalLight.shadow.camera.bottom = -50
  scene.add(directionalLight)

  // ポイントライト（室内照明）
  const positions = [
    { x: -15, y: 4, z: -10 },
    { x: 15, y: 4, z: -10 },
    { x: -15, y: 4, z: 10 },
    { x: 15, y: 4, z: 10 }
  ]

  positions.forEach(pos => {
    const pointLight = new THREE.PointLight(0xffffff, 0.5, 30)
    pointLight.position.set(pos.x, pos.y, pos.z)
    pointLight.castShadow = true
    scene.add(pointLight)
    pointLights.push(pointLight)
  })
}

// オフィス空間の構築
const buildOfficeSpace = async () => {
  // 床の作成
  const floorGeometry = new THREE.PlaneGeometry(SPACE_WIDTH / 10, SPACE_HEIGHT / 10)
  const floorMaterial = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.9
  })
  floorMesh = new THREE.Mesh(floorGeometry, floorMaterial)
  floorMesh.rotation.x = -Math.PI / 2
  floorMesh.receiveShadow = true
  scene.add(floorMesh)

  // 壁の作成
  createWalls()

  // 家具の配置
  await placeFurniture()

  // アバターの初期化
  updateAvatars()
}

// 壁の作成
const createWalls = () => {
  const wallMaterial = new THREE.MeshLambertMaterial({ color: 0xe0e0e0 })
  const wallThickness = 0.2

  // 壁の定義 [x, y, z, width, height, depth]
  const walls = [
    // 外壁
    [-SPACE_WIDTH / 20, WALL_HEIGHT / 2, -SPACE_HEIGHT / 20, wallThickness, WALL_HEIGHT, SPACE_HEIGHT / 10], // 左
    [SPACE_WIDTH / 20, WALL_HEIGHT / 2, -SPACE_HEIGHT / 20, wallThickness, WALL_HEIGHT, SPACE_HEIGHT / 10], // 右
    [0, WALL_HEIGHT / 2, -SPACE_HEIGHT / 20, SPACE_WIDTH / 10, WALL_HEIGHT, wallThickness], // 奥
    [0, WALL_HEIGHT / 2, SPACE_HEIGHT / 20, SPACE_WIDTH / 10, WALL_HEIGHT, wallThickness], // 手前

    // 内部仕切り
    [-10, WALL_HEIGHT / 2, 0, wallThickness, WALL_HEIGHT, 15], // 会議室仕切り
    [10, WALL_HEIGHT / 2, 5, 15, WALL_HEIGHT, wallThickness], // 作業エリア仕切り
  ]

  walls.forEach(wall => {
    const [x, y, z, width, height, depth] = wall
    const wallGeometry = new THREE.BoxGeometry(width, height, depth)
    const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial)
    wallMesh.position.set(x, y, z)
    wallMesh.castShadow = true
    wallMesh.receiveShadow = true
    scene.add(wallMesh)
    wallMeshes.push(wallMesh)

    // 衝突判定用のボックス
    const box = new THREE.Box3().setFromObject(wallMesh)
    collisionBoxes.push(box)
  })
}

// 家具の配置
const placeFurniture = async () => {
  // デスクの配置
  const deskPositions = [
    { x: -15, z: -15 }, { x: -5, z: -15 }, { x: 5, z: -15 }, { x: 15, z: -15 },
    { x: -15, z: 15 }, { x: -5, z: 15 }, { x: 5, z: 15 }, { x: 15, z: 15 }
  ]

  deskPositions.forEach(pos => {
    const desk = createDesk()
    desk.position.set(pos.x, 0.4, pos.z)
    scene.add(desk)
    furnitureMeshes.push(desk)

    // 衝突判定
    const box = new THREE.Box3().setFromObject(desk)
    collisionBoxes.push(box)
  })

  // 会議テーブルの配置
  const meetingTable = createMeetingTable()
  meetingTable.position.set(-15, 0.4, 0)
  scene.add(meetingTable)
  furnitureMeshes.push(meetingTable)

  // 植物の配置
  const plantPositions = [
    { x: -20, z: -20 }, { x: 20, z: -20 }, { x: -20, z: 20 }, { x: 20, z: 20 }
  ]

  plantPositions.forEach(pos => {
    const plant = createPlant()
    plant.position.set(pos.x, 0, pos.z)
    scene.add(plant)
    furnitureMeshes.push(plant)
  })
}

// デスクの作成
const createDesk = (): THREE.Group => {
  const desk = new THREE.Group()

  // デスク天板
  const topGeometry = new THREE.BoxGeometry(3, 0.1, 1.5)
  const topMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 })
  const top = new THREE.Mesh(topGeometry, topMaterial)
  top.position.y = 0.4
  top.castShadow = true
  top.receiveShadow = true
  desk.add(top)

  // デスク脚
  const legGeometry = new THREE.BoxGeometry(0.1, 0.8, 0.1)
  const legMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 })

  const legPositions = [
    { x: -1.4, z: -0.7 }, { x: 1.4, z: -0.7 },
    { x: -1.4, z: 0.7 }, { x: 1.4, z: 0.7 }
  ]

  legPositions.forEach(pos => {
    const leg = new THREE.Mesh(legGeometry, legMaterial)
    leg.position.set(pos.x, 0, pos.z)
    leg.castShadow = true
    desk.add(leg)
  })

  return desk
}

// 会議テーブルの作成
const createMeetingTable = (): THREE.Group => {
  const table = new THREE.Group()

  // テーブル天板
  const topGeometry = new THREE.CylinderGeometry(2.5, 2.5, 0.1, 16)
  const topMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 })
  const top = new THREE.Mesh(topGeometry, topMaterial)
  top.position.y = 0.4
  top.castShadow = true
  top.receiveShadow = true
  table.add(top)

  // テーブル脚
  const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8)
  const legMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F })
  const leg = new THREE.Mesh(legGeometry, legMaterial)
  leg.position.y = 0
  leg.castShadow = true
  table.add(leg)

  return table
}

// 植物の作成
const createPlant = (): THREE.Group => {
  const plant = new THREE.Group()

  // 鉢
  const potGeometry = new THREE.CylinderGeometry(0.3, 0.2, 0.4, 8)
  const potMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 })
  const pot = new THREE.Mesh(potGeometry, potMaterial)
  pot.position.y = 0.2
  pot.castShadow = true
  plant.add(pot)

  // 葉
  const leafGeometry = new THREE.SphereGeometry(0.5, 8, 6)
  const leafMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 })
  const leaves = new THREE.Mesh(leafGeometry, leafMaterial)
  leaves.position.y = 0.8
  leaves.castShadow = true
  plant.add(leaves)

  return plant
}

// アバターの作成
const createAvatar = (color: string): THREE.Group => {
  const avatar = new THREE.Group()

  // 体
  const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.4, AVATAR_HEIGHT * 0.6, 8)
  const bodyMaterial = new THREE.MeshLambertMaterial({ color: color })
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
  body.position.y = AVATAR_HEIGHT * 0.3
  body.castShadow = true
  avatar.add(body)

  // 頭
  const headGeometry = new THREE.SphereGeometry(0.25, 8, 6)
  const headMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBB5 })
  const head = new THREE.Mesh(headGeometry, headMaterial)
  head.position.y = AVATAR_HEIGHT * 0.8
  head.castShadow = true
  avatar.add(head)

  return avatar
}

// アバターの更新
const updateAvatars = () => {
  // 既存のアバターをクリア
  avatarMeshes.forEach(mesh => {
    scene.remove(mesh)
  })
  avatarMeshes.clear()

  // 他のユーザーのアバター
  props.connectedUsers.forEach(user => {
    const avatar = createAvatar(user.color)
    avatar.position.set(
      (user.position.x - SPACE_WIDTH / 2) / 10,
      0,
      (user.position.y - SPACE_HEIGHT / 2) / 10
    )
    scene.add(avatar)
    avatarMeshes.set(user.id, avatar)
  })

  // 自分のアバター
  const myAvatar = createAvatar('#ff6b6b')
  myAvatar.position.set(
    (props.avatarPosition.x - SPACE_WIDTH / 2) / 10,
    0,
    (props.avatarPosition.y - SPACE_HEIGHT / 2) / 10
  )
  scene.add(myAvatar)
  avatarMeshes.set('current-user', myAvatar)
}

// 衝突判定
const checkCollision = (newPosition: THREE.Vector3): boolean => {
  const avatarBox = new THREE.Box3().setFromCenterAndSize(
    newPosition,
    new THREE.Vector3(0.8, AVATAR_HEIGHT, 0.8)
  )

  return collisionBoxes.some(box => box.intersectsBox(avatarBox))
}

// 3D空間でのクリック処理
const handleSpaceClick = (event: MouseEvent) => {
  if (!canvasContainer.value) return

  const rect = canvasContainer.value.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObject(floorMesh)

  if (intersects.length > 0) {
    const point = intersects[0].point
    const newPosition = new THREE.Vector3(point.x, 0, point.z)

    // 衝突判定
    if (!checkCollision(newPosition)) {
      // 2D座標に変換
      const x = (point.x * 10) + (SPACE_WIDTH / 2)
      const y = (point.z * 10) + (SPACE_HEIGHT / 2)

      emit('positionUpdate', { x, y })
    }
  }
}

// カメラビューの切り替え
const toggleCameraView = () => {
  if (cameraView.value === '俯瞰視点') {
    // 一人称視点
    camera.position.set(0, 2, 0)
    controls.enableRotate = true
    cameraView.value = '一人称視点'
  } else {
    // 俯瞰視点に戻す
    camera.position.set(0, cameraHeight.value, 10)
    camera.lookAt(0, 0, 0)
    controls.enableRotate = true
    cameraView.value = '俯瞰視点'
  }
}

// 照明の切り替え
const toggleLighting = () => {
  lightingEnabled.value = !lightingEnabled.value
  directionalLight.visible = lightingEnabled.value
  pointLights.forEach(light => {
    light.visible = lightingEnabled.value
  })
}

// 衝突判定の表示切り替え
const toggleCollisionDebug = () => {
  showCollisionBoxes.value = !showCollisionBoxes.value
  // デバッグ表示の実装（簡略化）
}

// カメラリセット
const resetCamera = () => {
  camera.position.set(0, cameraHeight.value, 10)
  camera.lookAt(0, 0, 0)
  controls.reset()
}

// カメラ高さの更新
const updateCameraHeight = () => {
  if (cameraView.value === '俯瞰視点') {
    camera.position.y = cameraHeight.value
  }
}

// 照明の更新
const updateLighting = () => {
  ambientLight.intensity = ambientIntensity.value
  directionalLight.intensity = lightIntensity.value
}

// アニメーションループ
const animate = () => {
  requestAnimationFrame(animate)

  controls.update()
  renderer.render(scene, camera)
}

// リサイズ処理
const handleResize = () => {
  if (!canvasContainer.value) return

  const width = canvasContainer.value.clientWidth
  const height = canvasContainer.value.clientHeight

  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

// ウォッチャー
watch(() => props.connectedUsers, updateAvatars, { deep: true })
watch(() => props.avatarPosition, updateAvatars, { deep: true })

// ライフサイクル
onMounted(async () => {
  await nextTick()
  await initThreeJS()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (renderer) {
    renderer.dispose()
  }
})
</script>

<style scoped>
.threejs-office-space {
  width: 100%;
  height: 100vh;
  background: var(--color-gray-100);
  position: relative;
  overflow: hidden;
}

.office-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-4);
  background: var(--bg-creative);
  color: white;
  z-index: 10;
  position: relative;
}

.office-title {
  font-size: var(--text-xl);
  font-weight: 600;
  margin: 0;
}

.office-controls {
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
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.control-btn.active {
  background: rgba(255, 255, 255, 0.4);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.canvas-container {
  width: 100%;
  height: calc(100vh - 80px);
  position: relative;
  cursor: crosshair;
}

.three-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.ui-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 5;
}

.minimap {
  position: absolute;
  top: var(--spacing-4);
  right: var(--spacing-4);
  width: 200px;
  height: 120px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: var(--radius-lg);
  padding: var(--spacing-3);
  pointer-events: auto;
  box-shadow: var(--shadow-lg);
}

.minimap h4 {
  margin: 0 0 var(--spacing-2) 0;
  font-size: var(--text-sm);
  color: var(--color-gray-700);
}

.minimap-content {
  position: relative;
  width: 100%;
  height: 80px;
  background: var(--color-gray-200);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.minimap-avatar {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  font-size: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  transform: translate(-50%, -50%);
}

.minimap-avatar.current-user {
  background: #ff6b6b !important;
  border: 2px solid white;
  width: 12px;
  height: 12px;
  font-size: 7px;
}

.settings-panel {
  position: absolute;
  bottom: var(--spacing-4);
  right: var(--spacing-4);
  width: 250px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
  pointer-events: auto;
  box-shadow: var(--shadow-lg);
}

.settings-panel h4 {
  margin: 0 0 var(--spacing-3) 0;
  font-size: var(--text-base);
  color: var(--color-gray-800);
}

.setting-group {
  margin-bottom: var(--spacing-3);
}

.setting-group label {
  display: block;
  margin-bottom: var(--spacing-1);
  font-size: var(--text-sm);
  color: var(--color-gray-700);
  font-weight: 500;
}

.setting-slider {
  width: 100%;
  margin-bottom: var(--spacing-1);
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.loading-content {
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-gray-300);
  border-top: 4px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto var(--spacing-3) auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.btn-icon {
  font-size: 1.1em;
}
</style>
