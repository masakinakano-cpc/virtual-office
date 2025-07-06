<template>
  <div class="virtual-office-space">
    <div class="office-header">
      <h2 class="office-title">🏢 バーチャルオフィス空間</h2>
      <div class="office-controls">
        <button class="control-btn" @click="toggleView">
          {{ isTopView ? '📐 アイソメトリック' : '🗺️ トップビュー' }}
        </button>
        <button class="control-btn" @click="resetView">
          🔄 リセット
        </button>
        <button
          class="control-btn audio-btn"
          @click="toggleAudio"
          :class="{ active: audioState.isInitialized }"
        >
          {{ audioState.isInitialized ? '🔊 音響ON' : '🔇 音響OFF' }}
        </button>
      </div>
    </div>

    <div
      class="office-container"
      :class="{ 'top-view': isTopView }"
      @click="handleSpaceClick"
      ref="officeContainer"
    >
      <!-- フロアベース -->
      <div class="floor-base"></div>

      <!-- 会議室エリア -->
      <div class="workspace-zone meeting-room" :style="{ transform: 'translate(200px, 100px)' }">
        <div class="zone-label">会議室</div>
        <div class="meeting-table">
          <div class="table-surface"></div>
          <div
            v-for="(chair, index) in meetingChairs"
            :key="'meeting-' + index"
            class="chair meeting-chair"
            :style="chair.style"
            @click="selectSeat('meeting', index)"
            :class="{ occupied: chair.occupied, selected: chair.selected }"
          >
            <div class="chair-back"></div>
            <div class="chair-seat"></div>
            <div v-if="chair.occupied" class="avatar">
              {{ chair.avatar }}
            </div>
          </div>
        </div>
      </div>

      <!-- 個人デスクエリア -->
      <div class="workspace-zone desk-area" :style="{ transform: 'translate(50px, 300px)' }">
        <div class="zone-label">個人デスク</div>
        <div
          v-for="(desk, index) in personalDesks"
          :key="'desk-' + index"
          class="personal-desk"
          :style="desk.style"
          @click="selectSeat('desk', index)"
          :class="{ occupied: desk.occupied, selected: desk.selected }"
        >
          <div class="desk-surface"></div>
          <div class="desk-chair">
            <div class="chair-back"></div>
            <div class="chair-seat"></div>
          </div>
          <div class="monitor"></div>
          <div v-if="desk.occupied" class="avatar">
            {{ desk.avatar }}
          </div>
        </div>
      </div>

      <!-- カフェエリア -->
      <div class="workspace-zone cafe-area" :style="{ transform: 'translate(500px, 250px)' }">
        <div class="zone-label">カフェ</div>
        <div
          v-for="(table, index) in cafeTables"
          :key="'cafe-' + index"
          class="cafe-table"
          :style="table.style"
        >
          <div class="table-surface small"></div>
          <div
            v-for="(chair, chairIndex) in table.chairs"
            :key="'cafe-chair-' + chairIndex"
            class="chair cafe-chair"
            :style="chair.style"
            @click="selectSeat('cafe', index, chairIndex)"
            :class="{ occupied: chair.occupied, selected: chair.selected }"
          >
            <div class="chair-back"></div>
            <div class="chair-seat"></div>
            <div v-if="chair.occupied" class="avatar">
              {{ chair.avatar }}
            </div>
          </div>
        </div>
      </div>

      <!-- プレゼンテーションエリア -->
      <div class="workspace-zone presentation-area" :style="{ transform: 'translate(300px, 400px)' }">
        <div class="zone-label">プレゼンテーション</div>
        <div class="presentation-screen"></div>
        <div class="presentation-podium"></div>
        <div class="audience-seats">
          <div
            v-for="(seat, index) in audienceSeats"
            :key="'audience-' + index"
            class="chair audience-chair"
            :style="seat.style"
            @click="selectSeat('audience', index)"
            :class="{ occupied: seat.occupied, selected: seat.selected }"
          >
            <div class="chair-back"></div>
            <div class="chair-seat"></div>
            <div v-if="seat.occupied" class="avatar">
              {{ seat.avatar }}
            </div>
          </div>
        </div>
      </div>

      <!-- 受付エリア -->
      <div class="workspace-zone reception-area" :style="{ transform: 'translate(100px, 50px)' }">
        <div class="zone-label">受付</div>
        <div class="reception-desk">
          <div class="desk-surface reception"></div>
          <div class="reception-chair">
            <div class="chair-back"></div>
            <div class="chair-seat"></div>
          </div>
        </div>
      </div>

      <!-- 植物とデコレーション -->
      <div
        v-for="(plant, index) in plants"
        :key="'plant-' + index"
        class="plant"
        :style="plant.style"
      >
        🌱
      </div>

      <!-- 現在のユーザーアバター -->
      <div
        v-if="currentUser.position"
        class="current-user-avatar"
        :style="{
          transform: `translate(${currentUser.position.x}px, ${currentUser.position.y}px)`,
          transition: 'transform 0.5s ease'
        }"
      >
        {{ currentUser.avatar }}
      </div>
    </div>

    <!-- コントロールパネル -->
    <div class="control-panel">
      <div class="user-info">
        <div class="avatar-selector">
          <label>アバター選択:</label>
          <select v-model="currentUser.avatar" @change="updateAvatar">
            <option v-for="avatar in availableAvatars" :key="avatar" :value="avatar">
              {{ avatar }}
            </option>
          </select>
        </div>
        <div class="status-selector">
          <label>ステータス:</label>
          <select v-model="currentUser.status" @change="updateStatus">
            <option value="available">🟢 利用可能</option>
            <option value="busy">🔴 取り込み中</option>
            <option value="away">🟡 離席中</option>
          </select>
        </div>
      </div>

      <div class="zone-info" v-if="selectedZone">
        <h3>{{ selectedZone.name }}</h3>
        <p>{{ selectedZone.description }}</p>
                <div class="zone-actions">
          <button
            v-if="!selectedZone.occupied"
            class="btn-creative"
            @click="joinZone"
          >
            参加する
          </button>
          <button
            v-else-if="selectedZone.isCurrentUser"
            class="btn-creative"
            @click="leaveZone"
          >
            退席する
          </button>
        </div>
      </div>

      <div class="audio-info" v-if="audioState.isInitialized">
        <h4>🔊 音響システム</h4>
        <div class="audio-stats">
          <div class="stat">
            <span>アクティブ音源:</span>
            <span>{{ audioState.activeSourcesCount }}</span>
          </div>
          <div class="stat">
            <span>総音源数:</span>
            <span>{{ audioState.totalSourcesCount }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useSpatialAudio } from '@/composables/useSpatialAudio'

interface Position {
  x: number
  y: number
}

interface Chair {
  style: string
  occupied: boolean
  selected: boolean
  avatar?: string
}

interface Desk {
  style: string
  occupied: boolean
  selected: boolean
  avatar?: string
}

interface Table {
  style: string
  chairs: Chair[]
}

interface Plant {
  style: string
}

interface User {
  avatar: string
  status: string
  position?: Position
}

interface Zone {
  name: string
  description: string
  occupied: boolean
  isCurrentUser: boolean
}

// 状態管理
const isTopView = ref(false)
const officeContainer = ref<HTMLElement>()
const selectedZone = ref<Zone | null>(null)

// 空間音響システム
const {
  audioState,
  initializeAudio,
  updateListenerPosition,
  addAmbientSound,
  playNotificationSound
} = useSpatialAudio()

// ユーザー情報
const currentUser = reactive<User>({
  avatar: '😊',
  status: 'available'
})

const availableAvatars = ['😊', '😎', '🤓', '😄', '🙂', '😌', '🤗', '😋', '🤔', '😴']

// 会議室の椅子配置
const meetingChairs = ref<Chair[]>([
  { style: 'transform: translate(-60px, -40px)', occupied: false, selected: false },
  { style: 'transform: translate(-20px, -40px)', occupied: true, selected: false, avatar: '😎' },
  { style: 'transform: translate(20px, -40px)', occupied: false, selected: false },
  { style: 'transform: translate(60px, -40px)', occupied: false, selected: false },
  { style: 'transform: translate(-60px, 40px)', occupied: false, selected: false },
  { style: 'transform: translate(-20px, 40px)', occupied: false, selected: false },
  { style: 'transform: translate(20px, 40px)', occupied: true, selected: false, avatar: '🤓' },
  { style: 'transform: translate(60px, 40px)', occupied: false, selected: false },
])

// 個人デスク配置
const personalDesks = ref<Desk[]>([
  { style: 'transform: translate(0px, 0px)', occupied: false, selected: false },
  { style: 'transform: translate(120px, 0px)', occupied: true, selected: false, avatar: '😄' },
  { style: 'transform: translate(240px, 0px)', occupied: false, selected: false },
  { style: 'transform: translate(0px, 100px)', occupied: false, selected: false },
  { style: 'transform: translate(120px, 100px)', occupied: false, selected: false },
  { style: 'transform: translate(240px, 100px)', occupied: true, selected: false, avatar: '🙂' },
])

// カフェテーブル配置
const cafeTables = ref<Table[]>([
  {
    style: 'transform: translate(0px, 0px)',
    chairs: [
      { style: 'transform: translate(-30px, -30px)', occupied: false, selected: false },
      { style: 'transform: translate(30px, -30px)', occupied: true, selected: false, avatar: '😌' },
      { style: 'transform: translate(-30px, 30px)', occupied: false, selected: false },
      { style: 'transform: translate(30px, 30px)', occupied: false, selected: false },
    ]
  },
  {
    style: 'transform: translate(100px, 50px)',
    chairs: [
      { style: 'transform: translate(-30px, -30px)', occupied: false, selected: false },
      { style: 'transform: translate(30px, -30px)', occupied: false, selected: false },
      { style: 'transform: translate(-30px, 30px)', occupied: true, selected: false, avatar: '🤗' },
      { style: 'transform: translate(30px, 30px)', occupied: false, selected: false },
    ]
  }
])

// 観客席配置
const audienceSeats = ref<Chair[]>([
  { style: 'transform: translate(-60px, 0px)', occupied: false, selected: false },
  { style: 'transform: translate(-20px, 0px)', occupied: true, selected: false, avatar: '😋' },
  { style: 'transform: translate(20px, 0px)', occupied: false, selected: false },
  { style: 'transform: translate(60px, 0px)', occupied: false, selected: false },
  { style: 'transform: translate(-60px, 40px)', occupied: false, selected: false },
  { style: 'transform: translate(-20px, 40px)', occupied: false, selected: false },
  { style: 'transform: translate(20px, 40px)', occupied: true, selected: false, avatar: '🤔' },
  { style: 'transform: translate(60px, 40px)', occupied: false, selected: false },
])

// 植物配置
const plants = ref<Plant[]>([
  { style: 'transform: translate(150px, 200px) scale(1.5)' },
  { style: 'transform: translate(400px, 150px) scale(1.2)' },
  { style: 'transform: translate(250px, 350px) scale(1.3)' },
  { style: 'transform: translate(550px, 400px) scale(1.1)' },
  { style: 'transform: translate(80px, 450px) scale(1.4)' },
])

// 機能実装
const toggleView = () => {
  isTopView.value = !isTopView.value
}

const resetView = () => {
  isTopView.value = false
  selectedZone.value = null
  // 全ての選択状態をリセット
  meetingChairs.value.forEach(chair => chair.selected = false)
  personalDesks.value.forEach(desk => desk.selected = false)
  cafeTables.value.forEach(table => table.chairs.forEach(chair => chair.selected = false))
  audienceSeats.value.forEach(seat => seat.selected = false)
}

const selectSeat = (type: string, index: number, chairIndex?: number) => {
  resetSelections()

  let seatInfo: Zone

  switch (type) {
    case 'meeting':
      meetingChairs.value[index].selected = true
      seatInfo = {
        name: '会議室',
        description: 'チームミーティングや重要な議論を行う場所です',
        occupied: meetingChairs.value[index].occupied,
        isCurrentUser: false
      }
      break
    case 'desk':
      personalDesks.value[index].selected = true
      seatInfo = {
        name: '個人デスク',
        description: '集中して作業を行う個人スペースです',
        occupied: personalDesks.value[index].occupied,
        isCurrentUser: false
      }
      break
    case 'cafe':
      if (chairIndex !== undefined) {
        cafeTables.value[index].chairs[chairIndex].selected = true
        seatInfo = {
          name: 'カフェエリア',
          description: 'リラックスした雰囲気でカジュアルな会話を楽しめます',
          occupied: cafeTables.value[index].chairs[chairIndex].occupied,
          isCurrentUser: false
        }
      }
      break
    case 'audience':
      audienceSeats.value[index].selected = true
      seatInfo = {
        name: 'プレゼンテーションエリア',
        description: '発表や講演を聞く場所です',
        occupied: audienceSeats.value[index].occupied,
        isCurrentUser: false
      }
      break
    default:
      return
  }

  selectedZone.value = seatInfo!
}

const resetSelections = () => {
  meetingChairs.value.forEach(chair => chair.selected = false)
  personalDesks.value.forEach(desk => desk.selected = false)
  cafeTables.value.forEach(table => table.chairs.forEach(chair => chair.selected = false))
  audienceSeats.value.forEach(seat => seat.selected = false)
}

const handleSpaceClick = (event: MouseEvent) => {
  const rect = officeContainer.value?.getBoundingClientRect()
  if (rect) {
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // 空いているスペースをクリックした場合、アバターを移動
    if (event.target === officeContainer.value) {
      currentUser.position = { x, y }

      // リスナー位置を更新（空間音響）
      updateListenerPosition({ x, y })
    }
  }
}

const joinZone = () => {
  if (selectedZone.value && !selectedZone.value.occupied) {
    selectedZone.value.occupied = true
    selectedZone.value.isCurrentUser = true

    // 参加音を再生
    if (currentUser.position) {
      playNotificationSound(currentUser.position)
    }

    console.log('ゾーンに参加しました:', selectedZone.value.name)
  }
}

const leaveZone = () => {
  if (selectedZone.value && selectedZone.value.isCurrentUser) {
    selectedZone.value.occupied = false
    selectedZone.value.isCurrentUser = false

    // 退席音を再生
    if (currentUser.position) {
      playNotificationSound(currentUser.position)
    }

    console.log('ゾーンから退席しました:', selectedZone.value.name)
  }
}

const updateAvatar = () => {
  console.log('アバターを変更しました:', currentUser.avatar)
}

const updateStatus = () => {
  console.log('ステータスを変更しました:', currentUser.status)
}

const toggleAudio = async () => {
  if (audioState.value.isInitialized) {
    // 音響システムを停止
    stopAllAudio()
  } else {
    // 音響システムを開始
    await initializeAudio()
    addAmbientSound('meeting-room', { x: 200, y: 100 })
    addAmbientSound('cafe-area', { x: 500, y: 250 })
    addAmbientSound('office-general', { x: 300, y: 300 })

    if (currentUser.position) {
      updateListenerPosition(currentUser.position)
    }
  }
}

const stopAllAudio = () => {
  console.log('音声を停止しています...')
  // 音声停止の実装
}

onMounted(async () => {
  // 初期位置設定
  currentUser.position = { x: 300, y: 300 }

  // 空間音響システムの初期化
  await initializeAudio()

  // 環境音の追加
  addAmbientSound('meeting-room', { x: 200, y: 100 })
  addAmbientSound('cafe-area', { x: 500, y: 250 })
  addAmbientSound('office-general', { x: 300, y: 300 })

  // リスナー位置の設定
  if (currentUser.position) {
    updateListenerPosition(currentUser.position)
  }
})

onUnmounted(() => {
  // 全ての音源を停止
  if (audioState.value.isInitialized) {
    stopAllAudio()
  }
})

// エクスポート
defineExpose({
  updateListenerPosition,
  selectSeat,
  joinZone,
  leaveZone
})
</script>

<style scoped>
.virtual-office-space {
  width: 100%;
  min-height: 800px;
  background: var(--bg-secondary);
  border-radius: var(--radius-xl);
  overflow: hidden;
  position: relative;
}

.office-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-4);
  background: var(--bg-creative);
  color: white;
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
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.audio-btn.active {
  background: rgba(255, 255, 255, 0.4);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.office-container {
  position: relative;
  width: 100%;
  height: 600px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  overflow: hidden;
  cursor: crosshair;
  transform-style: preserve-3d;
  perspective: 1000px;
}

.office-container.top-view {
  transform: rotateX(60deg) rotateY(0deg);
}

.floor-base {
  position: absolute;
  width: 100%;
  height: 100%;
  background:
    radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.3) 0%, transparent 50%),
    linear-gradient(45deg, #f8f9fa 25%, transparent 25%),
    linear-gradient(-45deg, #f8f9fa 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #f8f9fa 75%),
    linear-gradient(-45deg, transparent 75%, #f8f9fa 75%);
  background-size: 40px 40px;
  opacity: 0.3;
}

.workspace-zone {
  position: absolute;
  padding: var(--spacing-4);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: var(--shadow-lg);
  transition: var(--transition-normal);
}

.workspace-zone:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-2px) !important;
}

.zone-label {
  position: absolute;
  top: -15px;
  left: 10px;
  background: var(--color-primary);
  color: white;
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  font-weight: 600;
  z-index: 10;
}

/* 会議室スタイル */
.meeting-room {
  width: 300px;
  height: 200px;
}

.meeting-table {
  position: relative;
  width: 100%;
  height: 100%;
}

.table-surface {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 160px;
  height: 80px;
  background: linear-gradient(135deg, #8b4513 0%, #a0522d 100%);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.table-surface.small {
  width: 60px;
  height: 60px;
  border-radius: 50%;
}

.table-surface.reception {
  width: 120px;
  height: 60px;
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
}

/* 椅子スタイル */
.chair {
  position: absolute;
  cursor: pointer;
  transition: var(--transition-normal);
}

.chair:hover {
  transform: scale(1.1);
}

.chair.selected {
  animation: pulse-creative 1s infinite;
}

.chair.occupied {
  opacity: 0.7;
}

.chair-back {
  width: 20px;
  height: 25px;
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  position: relative;
  z-index: 2;
}

.chair-seat {
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, #34495e 0%, #2c3e50 100%);
  border-radius: var(--radius-sm);
  margin-top: -5px;
  position: relative;
  z-index: 1;
}

/* デスクスタイル */
.desk-area {
  width: 400px;
  height: 250px;
}

.personal-desk {
  position: absolute;
  cursor: pointer;
  transition: var(--transition-normal);
}

.personal-desk:hover {
  transform: scale(1.05);
}

.personal-desk.selected {
  animation: bounce-gentle 0.6s ease-in-out;
}

.desk-surface {
  width: 80px;
  height: 50px;
  background: linear-gradient(135deg, #8b4513 0%, #a0522d 100%);
  border-radius: var(--radius-md);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.desk-chair {
  position: absolute;
  top: 35px;
  left: 30px;
}

.monitor {
  position: absolute;
  top: -15px;
  left: 20px;
  width: 40px;
  height: 25px;
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  border-radius: var(--radius-sm);
  border: 2px solid #1a252f;
}

.monitor::after {
  content: '';
  position: absolute;
  top: 25px;
  left: 50%;
  transform: translateX(-50%);
  width: 8px;
  height: 8px;
  background: #34495e;
  border-radius: 50%;
}

/* カフェエリア */
.cafe-area {
  width: 250px;
  height: 200px;
}

.cafe-table {
  position: absolute;
}

/* プレゼンテーションエリア */
.presentation-area {
  width: 300px;
  height: 200px;
}

.presentation-screen {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 60px;
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  border-radius: var(--radius-md);
  border: 3px solid #1a252f;
}

.presentation-podium {
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 30px;
  background: linear-gradient(135deg, #8b4513 0%, #a0522d 100%);
  border-radius: var(--radius-sm);
}

.audience-seats {
  position: absolute;
  top: 120px;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
}

/* 受付エリア */
.reception-area {
  width: 200px;
  height: 120px;
}

.reception-desk {
  position: relative;
  width: 100%;
  height: 100%;
}

.reception-chair {
  position: absolute;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
}

/* アバターと植物 */
.avatar {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 1.5rem;
  z-index: 10;
  animation: float 3s ease-in-out infinite;
}

.current-user-avatar {
  position: absolute;
  font-size: 2rem;
  z-index: 100;
  animation: float 4s ease-in-out infinite;
  pointer-events: none;
}

.plant {
  position: absolute;
  font-size: 2rem;
  z-index: 5;
  animation: float 6s ease-in-out infinite;
}

/* コントロールパネル */
.control-panel {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: var(--spacing-4);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  gap: var(--spacing-6);
  align-items: flex-start;
}

.user-info {
  display: flex;
  gap: var(--spacing-4);
  align-items: center;
}

.avatar-selector,
.status-selector {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.avatar-selector label,
.status-selector label {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-gray-700);
}

.avatar-selector select,
.status-selector select {
  padding: var(--spacing-2);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  background: white;
  font-size: var(--text-sm);
}

.zone-info {
  flex: 1;
  padding: var(--spacing-3);
  background: rgba(255, 255, 255, 0.8);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.zone-info h3 {
  margin: 0 0 var(--spacing-2) 0;
  color: var(--color-primary);
  font-size: var(--text-lg);
}

.zone-info p {
  margin: 0 0 var(--spacing-3) 0;
  color: var(--color-gray-600);
  font-size: var(--text-sm);
}

.zone-actions {
  display: flex;
  gap: var(--spacing-2);
}

.audio-info {
  margin-top: var(--spacing-4);
  padding: var(--spacing-3);
  background: rgba(78, 205, 196, 0.1);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(78, 205, 196, 0.3);
}

.audio-info h4 {
  margin: 0 0 var(--spacing-2) 0;
  color: var(--color-secondary);
  font-size: var(--text-base);
}

.audio-stats {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.stat {
  display: flex;
  justify-content: space-between;
  font-size: var(--text-sm);
  color: var(--color-gray-600);
}

.stat span:last-child {
  font-weight: 600;
  color: var(--color-secondary);
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
  .office-container {
    height: 400px;
  }

  .control-panel {
    flex-direction: column;
    gap: var(--spacing-3);
  }

  .user-info {
    flex-direction: column;
    align-items: flex-start;
  }

  .workspace-zone {
    transform: scale(0.8) !important;
  }
}
</style>
