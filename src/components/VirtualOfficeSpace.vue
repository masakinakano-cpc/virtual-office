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

    <!-- リアルタイムデバッグパネル（ドラッグ可能） -->
    <div
      class="debug-panel"
      ref="debugPanelRef"
      :style="{ left: debugPanelPosition.x + 'px', top: debugPanelPosition.y + 'px' }"
      @mousedown="startDragDebugPanel"
    >
      <div class="debug-header">
        <h4>🔧 デバッグパネル（ドラッグ可能）</h4>
        <button @click="toggleDebugMinimized" class="debug-toggle">
          {{ isDebugMinimized ? '▼' : '▲' }}
        </button>
      </div>

      <div v-if="!isDebugMinimized" class="debug-content">
        <div class="debug-info">
          <div class="debug-section">
            <h5>🌐 接続状態</h5>
            <div class="debug-item">
              <span>現在時刻:</span>
              <span>{{ currentTime }}</span>
            </div>
            <div class="debug-item">
              <span>WebSocket接続:</span>
              <span :class="{ connected: signalingClient.isConnected.value, disconnected: !signalingClient.isConnected.value }">
                {{ signalingClient.isConnected.value ? '✅ 接続中' : '❌ 切断' }}
              </span>
            </div>
            <div class="debug-item">
              <span>接続ユーザー数:</span>
              <span>{{ connectedUsers.length }}人</span>
            </div>
            <div v-if="signalingClient.connectionError.value" class="debug-item error">
              <span>エラー:</span>
              <span>{{ signalingClient.connectionError.value }}</span>
            </div>
          </div>

          <div class="debug-section">
            <h5>💬 チャット状態</h5>
            <div class="debug-item">
              <span>チャット表示:</span>
              <span>{{ showChat ? 'オープン' : 'クローズ' }}</span>
            </div>
            <div class="debug-item">
              <span>未読メッセージ:</span>
              <span>{{ unreadCount }}件</span>
            </div>
            <div class="debug-item">
              <span>メッセージ履歴:</span>
              <span>{{ chatMessages.length }}件</span>
            </div>
          </div>
        </div>

        <div v-if="connectedUsers.length > 0" class="connected-users">
          <h5>👥 接続中のユーザー:</h5>
          <div v-for="user in connectedUsers" :key="user.id" class="user-item">
            <span class="user-nickname">{{ user.nickname }}</span>
            <span class="user-position">({{ Math.round(user.position.x) }}, {{ Math.round(user.position.y) }})</span>
            <div class="user-actions">
              <button @click="startAudioCallWithUser(user)" class="call-btn audio">🎤</button>
              <button @click="startVideoCallWithUser(user)" class="call-btn video">📹</button>
            </div>
          </div>
        </div>

        <div class="debug-controls">
          <button @click="testConnection" class="debug-btn">🔗 接続テスト</button>
          <button @click="testAudioCall" class="debug-btn">🎤 音声テスト</button>
          <button @click="testVideoCall" class="debug-btn">📹 ビデオテスト</button>
          <button @click="requestMediaPermissions" class="debug-btn">🔐 権限取得</button>
          <button @click="toggleChat" class="debug-btn">
            💬 チャット {{ unreadCount > 0 ? `(${unreadCount})` : '' }}
          </button>
          <button @click="sendTestMessage" class="debug-btn">📤 テストメッセージ</button>
        </div>
      </div>
    </div>

    <div
      class="office-container"
      :class="{ 'top-view': isTopView }"
      @click="handleSpaceClick"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      ref="officeContainer"
    >
      <!-- フロアベース -->
      <div class="floor-base"></div>

      <!-- ユーザーアバター（ドラッグ可能） -->
      <div
        class="user-avatar"
        :style="{
          left: currentUser.position.x + 'px',
          top: currentUser.position.y + 'px',
          backgroundColor: currentUser.color
        }"
        @mousedown="startDragAvatar"
        @click.stop
      >
        <div class="avatar-emoji">{{ currentUser.avatar }}</div>
        <div class="avatar-name">{{ currentUser.nickname }}</div>
        <div class="avatar-status">{{ currentUser.status }}</div>
      </div>

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

      <!-- 他のユーザーのアバター -->
      <div
        v-for="user in connectedUsers"
        :key="user.id"
        class="other-user-avatar"
        :style="{
          left: user.position.x + 'px',
          top: user.position.y + 'px',
          backgroundColor: user.color
        }"
      >
        <div class="avatar-emoji">😊</div>
        <div class="avatar-name">{{ user.nickname }}</div>
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

    <!-- 近接ビデオ通話システム -->
    <div class="proximity-video-call-wrapper">
      <ProximityVideoCall
        :current-position="currentUser.position || { x: 300, y: 300 }"
        :connected-users="connectedUsers"
        :call-radius="150"
        :auto-join-enabled="true"
        :show-call-range="showCallRange"
        @call-started="handleCallStarted"
        @call-ended="handleCallEnded"
        ref="proximityCallRef"
      />
    </div>

    <!-- チャット機能 -->
    <div class="chat-panel" v-if="showChat">
      <div class="chat-header">
        <h3>チャット</h3>
        <button @click="showChat = false">閉じる</button>
      </div>
      <div class="chat-messages">
        <div v-for="message in chatMessages" :key="message.id" class="chat-message">
          <span class="user-nickname">{{ message.nickname }}</span>
          <span class="message-content">{{ message.message }}</span>
          <span class="timestamp">{{ new Date(message.timestamp).toLocaleTimeString() }}</span>
        </div>
      </div>
      <div class="chat-input">
        <input v-model="newMessage" @keydown.enter="sendMessage" placeholder="メッセージを入力">
        <button @click="sendMessage">送信</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed, watch } from 'vue'
import { useSpatialAudio } from '@/composables/useSpatialAudio'
import { useRealtimeSync } from '@/composables/useRealtimeSync'
import { useAvatarMovement } from '@/composables/useAvatarMovement'
import ProximityVideoCall from './ProximityVideoCall.vue'
import { useSignalingClient } from '@/composables/useSignalingClient'

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
const showCallRange = ref(false)

// ProximityVideoCallコンポーネントのref
const proximityCallRef = ref<InstanceType<typeof ProximityVideoCall>>()

// ユーザーID生成
const currentUserId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
const roomId = 'office-main' // メインオフィスルーム
const nickname = localStorage.getItem('user-nickname') || 'ゲスト'
const userColor = localStorage.getItem('user-color') || '#6366f1'

// 現在のユーザー定義
const currentUser = reactive({
  id: currentUserId,
  nickname: nickname,
  avatar: '😊',
  status: 'available',
  position: { x: 300, y: 300 },
  color: userColor
})

// リアルタイム同期
const realtimeSync = useRealtimeSync(roomId, currentUserId, nickname)
const signalingClient = useSignalingClient(roomId, currentUserId, nickname)

// チャット機能の状態
const chatMessages = ref<Array<{
  id: string
  userId: string
  nickname: string
  message: string
  timestamp: number
  color: string
}>>([])
const newMessage = ref('')
const showChat = ref(false)
const unreadCount = ref(0)

// デバッグパネルのドラッグ機能
const debugPanelRef = ref<HTMLElement>()
const debugPanelPosition = ref({ x: 20, y: 20 })
const isDebugMinimized = ref(false)
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })

// アバタードラッグ機能
const isAvatarDragging = ref(false)
const avatarDragOffset = ref({ x: 0, y: 0 })

// 動的時刻表示
const currentTime = ref(new Date().toLocaleTimeString())

// 音声制御の状態
let audioContext: AudioContext | null = null
let isSpatialAudioEnabled = false
let spatialAudio: any = null

// アバター移動システム
const avatarMovement = useAvatarMovement('office-space', (position) => {
  // 位置更新をサーバーに送信
  if (realtimeSync.updateUserPosition) {
    realtimeSync.updateUserPosition(currentUser.id, currentUser.position)
  }
  // 現在のユーザー位置を更新
  currentUser.position = position
})

// 接続ユーザーをリアルタイム同期から取得
const connectedUsers = computed(() => {
  return realtimeSync.connectedUsers.value.map(user => ({
    id: user.id,
    nickname: user.nickname,
    position: user.position,
    color: user.color,
    isAudioEnabled: user.isActive,
    isVideoEnabled: user.isVideoEnabled,
    isSpeaking: user.isSpeaking
  }))
})

// 空間音響システム
const {
  audioState,
  initializeAudio,
  updateListenerPosition,
  addAmbientSound,
  playNotificationSound
} = useSpatialAudio()

// ユーザー情報
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

// 通話関連のハンドラー
const handleCallStarted = (call: any) => {
  console.log('通話が開始されました:', call)
}

const handleCallEnded = (callId: string) => {
  console.log('通話が終了されました:', callId)
}

// ユーザークリックハンドラー
const handleUserClick = (user: any) => {
  console.log('ユーザーをクリックしました:', user.nickname)
  // 通話機能があれば追加実装
}

const startAudioCallWithUser = (user: any) => {
  console.log('音声通話を開始しました:', user.nickname)
  // 音声通話の実装
  if (proximityCallRef.value) {
    proximityCallRef.value.startCall('audio', [user])
  }
}

const startVideoCallWithUser = (user: any) => {
  console.log('ビデオ通話を開始しました:', user.nickname)
  // ビデオ通話の実装
  if (proximityCallRef.value) {
    proximityCallRef.value.startCall('video', [user])
  }
}

const testAudioCall = async () => {
  console.log('音声通話テストを実行しました')
  // 音声通話テストの実装
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    console.log('音声デバイスアクセス成功:', stream)
    // 3秒後に停止
    setTimeout(() => {
      stream.getTracks().forEach(track => track.stop())
      console.log('音声テスト完了')
    }, 3000)
  } catch (error) {
    console.error('音声テストエラー:', error)
  }
}

const testVideoCall = async () => {
  console.log('ビデオ通話テストを実行しました')
  // ビデオ通話テストの実装
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
    console.log('ビデオデバイスアクセス成功:', stream)
    // 3秒後に停止
    setTimeout(() => {
      stream.getTracks().forEach(track => track.stop())
      console.log('ビデオテスト完了')
    }, 3000)
  } catch (error) {
    console.error('ビデオテストエラー:', error)
  }
}

const requestMediaPermissions = async () => {
  console.log('メディア権限を取得中...')
  try {
    // まず音声のみ
    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    console.log('音声権限取得成功')
    audioStream.getTracks().forEach(track => track.stop())

    // 次にビデオ
    const videoStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
    console.log('ビデオ権限取得成功')
    videoStream.getTracks().forEach(track => track.stop())

    console.log('全てのメディア権限取得完了')
  } catch (error) {
    console.error('メディア権限取得エラー:', error)
  }
}

// メッセージ送信機能
const sendMessage = () => {
  if (!newMessage.value.trim()) return

  const message = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId: currentUserId,
    nickname: nickname,
    message: newMessage.value.trim(),
    timestamp: Date.now(),
    color: userColor
  }

  // ローカルにメッセージ追加
  chatMessages.value.push(message)

  // サーバーにメッセージ送信
  signalingClient.sendChatMessage(newMessage.value.trim())

  newMessage.value = ''
}

// メッセージ受信処理
const handleMessageReceived = (messageData: any) => {
  if (messageData.userId !== currentUserId) {
    chatMessages.value.push(messageData)
    if (!showChat.value) {
      unreadCount.value++
    }
  }
}

const toggleChat = () => {
  showChat.value = !showChat.value
  // チャットを開いたときに未読カウンターをリセット
  if (showChat.value) {
    unreadCount.value = 0
  }
}

// デバッグパネルのドラッグ機能
const startDragDebugPanel = (event: MouseEvent) => {
  isDragging.value = true
  const rect = debugPanelRef.value?.getBoundingClientRect()
  if (rect) {
    dragOffset.value = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }
  }

  // マウスイベントリスナーを追加
  document.addEventListener('mousemove', dragDebugPanel)
  document.addEventListener('mouseup', stopDragDebugPanel)
}

const dragDebugPanel = (event: MouseEvent) => {
  if (isDragging.value) {
    debugPanelPosition.value = {
      x: event.clientX - dragOffset.value.x,
      y: event.clientY - dragOffset.value.y
    }
  }
}

const stopDragDebugPanel = () => {
  isDragging.value = false
  // マウスイベントリスナーを削除
  document.removeEventListener('mousemove', dragDebugPanel)
  document.removeEventListener('mouseup', stopDragDebugPanel)
}

const toggleDebugMinimized = () => {
  isDebugMinimized.value = !isDebugMinimized.value
}

// 接続テスト機能
const testConnection = async () => {
  console.log('🔗 接続テストを実行中...')
  try {
    // WebSocket接続状態確認
    console.log('WebSocket状態:', signalingClient.isConnected.value ? '接続中' : '切断')
    console.log('接続エラー:', signalingClient.connectionError.value)
    console.log('接続ユーザー数:', connectedUsers.value.length)

    // テストメッセージ送信
    if (signalingClient.isConnected.value) {
      signalingClient.sendMessage({
        type: 'test-connection',
        message: 'connection test from ' + nickname,
        timestamp: Date.now()
      })
      console.log('✅ 接続テスト完了')
    } else {
      console.log('❌ WebSocket未接続')
    }
  } catch (error) {
    console.error('❌ 接続テストエラー:', error)
  }
}

// テストメッセージ送信
const sendTestMessage = () => {
  const testMessage = `テストメッセージ from ${nickname} at ${new Date().toLocaleTimeString()}`
  console.log('📤 テストメッセージ送信:', testMessage)

  if (signalingClient.isConnected.value) {
    signalingClient.sendChatMessage(testMessage)

    // ローカルにも追加（自分のメッセージとして）
    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: currentUserId,
      nickname: nickname,
      message: testMessage,
      timestamp: Date.now(),
      color: userColor
    }
    chatMessages.value.push(message)
  } else {
    console.log('❌ WebSocket未接続のため送信できません')
  }
}

// アバタードラッグ機能
const startDragAvatar = (event: MouseEvent) => {
  isAvatarDragging.value = true
  const rect = (event.target as HTMLElement).closest('.office-container')?.getBoundingClientRect()
  if (rect) {
    avatarDragOffset.value = {
      x: event.clientX - rect.left - currentUser.position.x,
      y: event.clientY - rect.top - currentUser.position.y
    }
  }
  event.preventDefault()
}

const handleMouseMove = (event: MouseEvent) => {
  if (isAvatarDragging.value) {
    const rect = (event.target as HTMLElement).closest('.office-container')?.getBoundingClientRect()
    if (rect) {
      const newX = Math.max(0, Math.min(rect.width - 50, event.clientX - rect.left - avatarDragOffset.value.x))
      const newY = Math.max(0, Math.min(rect.height - 80, event.clientY - rect.top - avatarDragOffset.value.y))

      currentUser.position = { x: newX, y: newY }

      // WebSocketでリアルタイム同期
      if (realtimeSync.updateUserPosition) {
        realtimeSync.updateUserPosition(currentUser.id, currentUser.position)
      }
    }
    return
  }

  if (isDragging.value && debugPanelRef.value) {
    const newX = event.clientX - dragOffset.value.x
    const newY = event.clientY - dragOffset.value.y

    const maxX = window.innerWidth - debugPanelRef.value.offsetWidth
    const maxY = window.innerHeight - debugPanelRef.value.offsetHeight

    debugPanelPosition.value = {
      x: Math.max(0, Math.min(maxX, newX)),
      y: Math.max(0, Math.min(maxY, newY))
    }
  }
}

const handleMouseUp = () => {
  isAvatarDragging.value = false
  isDragging.value = false
}

onMounted(async () => {
  // 初期接続開始（useRealtimeSyncとuseSignalingClientは自動接続）

  // 時刻更新タイマー
  setInterval(() => {
    currentTime.value = new Date().toLocaleTimeString()
  }, 1000)

  // チャットメッセージのイベントリスナー
  signalingClient.on('chat-message', (message: any) => {
    if (message.userId !== currentUserId) {
      const newChatMessage = {
        id: message.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: message.userId,
        nickname: message.nickname,
        message: message.message,
        timestamp: message.timestamp || Date.now(),
        color: message.color || '#6366f1'
      }
      chatMessages.value.push(newChatMessage)
      if (!showChat.value) {
        unreadCount.value++
      }
    }
  })

  // 空間音響システムは手動で有効にする必要がある
  console.log('空間音響システムは音響ONボタンで有効にしてください')
  console.log('🔧 デバッグパネルが右上に表示されているはずです')
})

onUnmounted(() => {
  // 全ての音源を停止
  if (audioState.value.isInitialized) {
    stopAllAudio()
  }

  // ドラッグイベントリスナーのクリーンアップ
  document.removeEventListener('mousemove', dragDebugPanel)
  document.removeEventListener('mouseup', stopDragDebugPanel)
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
  transition: all 0.3s ease;
  transform-origin: center;
}

.chair:hover {
  transform: scale(1.05) !important;
  filter: brightness(1.1);
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
  transition: all 0.3s ease;
  transform-origin: center;
}

.personal-desk:hover {
  transform: scale(1.03) !important;
  filter: brightness(1.1);
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
  width: 60px;
  height: 60px;
  background: #4CAF50;
  border: 3px solid #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  cursor: pointer;
}

.other-user-avatar {
  position: absolute;
  width: 50px;
  height: 70px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  transition: transform 0.2s ease;
  z-index: 90;
}

.other-user-avatar:hover {
  transform: scale(1.05);
}

.other-user-avatar .avatar-emoji {
  font-size: 20px;
  margin-bottom: 2px;
}

.other-user-avatar .avatar-name {
  font-size: 10px;
  font-weight: bold;
  color: white;
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.5);
  text-align: center;
  max-width: 50px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-name-tag {
  position: absolute;
  bottom: -30px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 1000;
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

/* リアルタイムデバッグパネル（ドラッグ可能） */
.debug-panel {
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(15px);
  border: 2px solid #4f46e5;
  border-radius: 12px;
  padding: 16px;
  max-width: 350px;
  min-width: 300px;
  z-index: 9999;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
  cursor: move;
  user-select: none;
  transition: all 0.2s ease;
  font-size: 14px;
}

.debug-panel:hover {
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
  transform: scale(1.02);
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #4f46e5;
  padding-bottom: 8px;
  margin-bottom: 12px;
  cursor: move;
  background: linear-gradient(90deg, #4f46e5, #7c3aed);
  margin: -16px -16px 12px -16px;
  padding: 12px 16px;
  border-radius: 10px 10px 0 0;
}

.debug-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.debug-toggle {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  color: white;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.debug-toggle:hover {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.debug-content {
  margin-top: 12px;
}

.debug-section {
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 8px;
}

.debug-section h5 {
  margin: 0 0 8px 0;
  color: #374151;
  font-size: 14px;
  font-weight: 600;
}

.debug-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.debug-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.debug-item.error span:last-child {
  color: #dc2626;
  font-weight: 600;
}

.connected-users {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  margin: 4px 0;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 8px;
}

.user-nickname {
  font-weight: 600;
  color: #4f46e5;
}

.user-position {
  font-size: 12px;
  color: #6b7280;
  font-family: monospace;
}

.user-actions {
  display: flex;
  gap: var(--spacing-2);
}

.call-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.5rem;
  color: var(--color-gray-600);
}

.debug-controls {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
}

.debug-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.5rem;
  color: var(--color-gray-600);
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

/* チャット機能 */
.chat-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: var(--spacing-4);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-header h3 {
  margin: 0;
  font-size: var(--text-lg);
  font-weight: 600;
}

.chat-header button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.5rem;
  color: var(--color-gray-600);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-3);
}

.chat-message {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-2) 0;
}

.user-nickname {
  font-weight: 600;
  color: var(--color-primary);
}

.message-content {
  flex: 1;
  margin: 0 var(--spacing-2);
  color: var(--color-gray-700);
}

.timestamp {
  font-size: var(--text-sm);
  color: var(--color-gray-500);
}

.chat-input {
  display: flex;
  gap: var(--spacing-2);
}

.chat-input input {
  flex: 1;
  padding: var(--spacing-2);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
}

.chat-input button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.5rem;
  color: var(--color-gray-600);
}

.connected {
  color: #16a34a;
  font-weight: 600;
}

.disconnected {
  color: #dc2626;
  font-weight: 600;
}

/* ユーザーアバター（ドラッグ可能） */
.user-avatar {
  position: absolute;
  width: 50px;
  height: 70px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  cursor: grab;
  user-select: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  z-index: 100;
}

.user-avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.user-avatar:active {
  cursor: grabbing;
  transform: scale(1.02);
}

.user-avatar .avatar-emoji {
  font-size: 20px;
  margin-bottom: 2px;
}

.user-avatar .avatar-name {
  font-size: 10px;
  font-weight: bold;
  color: white;
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.5);
  text-align: center;
  max-width: 50px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-avatar .avatar-status {
  font-size: 8px;
  color: white;
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.5);
  margin-top: 1px;
}

/* ProximityVideoCallラッパー */
.proximity-video-call-wrapper {
  position: relative;
  z-index: 8000;
  pointer-events: none;
}

.proximity-video-call-wrapper > * {
  pointer-events: auto;
}
</style>
