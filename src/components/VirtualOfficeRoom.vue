<template>
  <div class="virtual-office-room">
    <!-- ヘッダー -->
    <div class="room-header">
      <div class="room-info">
        <h2 class="room-title">
          <span class="room-icon">🏢</span>
          Room: {{ roomId }}
        </h2>
        <div class="user-info">
          <span class="user-avatar" :style="{ backgroundColor: userColor }">
            {{ userNickname.charAt(0).toUpperCase() }}
          </span>
          <span class="user-name">{{ userNickname }}</span>
        </div>
      </div>

      <div class="room-controls">
        <button
          @click="shareRoom"
          class="control-button share-button"
          title="ルームを共有"
        >
          <span class="button-icon">🔗</span>
          共有
        </button>
        <button
          @click="leaveRoom"
          class="control-button leave-button"
          title="ルームから退出"
        >
          <span class="button-icon">🚪</span>
          退出
        </button>
      </div>
    </div>

    <!-- メインコンテンツ -->
    <div class="room-content">
      <!-- オフィス空間 -->
      <div class="office-space" ref="officeSpaceRef" id="office-space">
        <div class="office-background">
          <!-- 背景グリッド -->
          <div class="grid-pattern"></div>

          <!-- 家具・装飾 -->
          <div class="furniture-container">
            <div class="desk" style="top: 100px; left: 100px;">
              <span class="furniture-icon">🪑</span>
            </div>
            <div class="desk" style="top: 100px; left: 300px;">
              <span class="furniture-icon">🪑</span>
            </div>
            <div class="plant" style="top: 50px; left: 500px;">
              <span class="furniture-icon">🌱</span>
            </div>
            <div class="whiteboard" style="top: 20px; left: 200px;">
              <span class="furniture-icon">📋</span>
            </div>
          </div>

          <!-- 移動矢印の表示 -->
          <div
            v-if="movementTarget?.showArrow"
            class="movement-arrow"
            :style="{
              left: movementTarget.x + 'px',
              top: movementTarget.y + 'px'
            }"
          >
            <div class="arrow-icon">📍</div>
            <div class="arrow-text">ダブルクリックで移動</div>
          </div>

          <!-- アバター表示 -->
          <div class="avatars-container">
            <!-- 自分のアバター -->
            <div
              class="avatar current-user"
              :style="{
                left: avatarPosition.x + 'px',
                top: avatarPosition.y + 'px',
                backgroundColor: userColor
              }"
            >
              <span class="avatar-initial">{{ userNickname.charAt(0).toUpperCase() }}</span>
              <div class="avatar-name">{{ userNickname }} (あなた)</div>
              <div v-if="isMoving" class="avatar-status moving"></div>
              <div v-if="isMicrophoneOn" class="speaking-indicator active"></div>
              <div v-if="isCameraOn" class="camera-indicator active">📹</div>
            </div>

            <!-- 他のユーザーのアバター -->
            <div
              v-for="user in connectedUsers"
              :key="user.id"
              class="avatar"
              :class="{
                'in-call-range': isUserInCallRange(user.id),
                'in-call': isUserInCall(user.id)
              }"
              :style="{
                left: user.position.x + 'px',
                top: user.position.y + 'px',
                backgroundColor: user.color
              }"
              @click="handleAvatarClick(user)"
            >
              <span class="avatar-initial">{{ user.nickname.charAt(0).toUpperCase() }}</span>
              <div class="avatar-name">{{ user.nickname }}</div>
              <div v-if="user.isActive" class="avatar-status active"></div>
              <div v-if="user.isSpeaking" class="speaking-indicator active"></div>
              <div v-if="user.isVideoEnabled" class="camera-indicator active">📹</div>
              <div v-if="isUserInCallRange(user.id)" class="call-range-indicator">
                <span class="range-icon">📞</span>
              </div>
            </div>
          </div>

          <!-- 通話範囲の表示 -->
          <div
            v-if="showCallRange"
            class="call-range-circle"
            :style="{
              left: (avatarPosition.x - callRadius) + 'px',
              top: (avatarPosition.y - callRadius) + 'px',
              width: (callRadius * 2) + 'px',
              height: (callRadius * 2) + 'px'
            }"
          ></div>
        </div>
      </div>

      <!-- サイドパネル -->
      <div class="side-panel">
        <!-- 通話コントロール -->
        <div class="call-controls">
          <h3 class="panel-title">
            <span class="panel-icon">🎤</span>
            通話
          </h3>
          <div class="control-buttons">
            <button
              @click="toggleMicrophone"
              :class="['control-btn', { active: isMicrophoneOn }]"
              title="マイクのオン/オフ"
            >
              <span class="btn-icon">{{ isMicrophoneOn ? '🎤' : '🔇' }}</span>
            </button>
            <button
              @click="toggleCamera"
              :class="['control-btn', { active: isCameraOn }]"
              title="カメラのオン/オフ"
            >
              <span class="btn-icon">{{ isCameraOn ? '📹' : '📷' }}</span>
            </button>
            <button
              @click="toggleScreenShare"
              :class="['control-btn', { active: isScreenSharing }]"
              title="画面共有"
            >
              <span class="btn-icon">🖥️</span>
            </button>
            <button
              @click="toggleCallRangeDisplay"
              :class="['control-btn', { active: showCallRange }]"
              title="通話範囲の表示切り替え"
            >
              <span class="btn-icon">📡</span>
            </button>
          </div>
          <div class="call-info">
            <p class="info-text">
              📞 通話範囲: {{ callRadius }}px
            </p>
            <p class="info-text">
              👥 通話中: {{ activeCallUsers.length }}人
            </p>
          </div>
        </div>

        <!-- 参加者リスト -->
        <div class="participants-list">
          <h3 class="panel-title">
            <span class="panel-icon">👥</span>
            参加者 ({{ connectedUsers.length }})
          </h3>
          <div class="participants">
            <div
              v-for="user in connectedUsers"
              :key="user.id"
              class="participant"
            >
              <div class="participant-avatar" :style="{ backgroundColor: user.color }">
                {{ user.nickname.charAt(0).toUpperCase() }}
              </div>
              <div class="participant-info">
                <div class="participant-name">{{ user.nickname }}</div>
                <div class="participant-status">
                  <span v-if="user.isActive" class="status-indicator online">🟢</span>
                  <span v-else class="status-indicator offline">🔴</span>
                  {{ user.isActive ? 'オンライン' : 'オフライン' }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- チャット -->
        <div class="chat-section">
          <h3 class="panel-title">
            <span class="panel-icon">💬</span>
            チャット
          </h3>
          <div class="chat-messages" ref="chatMessagesRef">
            <div
              v-for="message in chatMessages"
              :key="message.id"
              class="chat-message"
            >
              <div class="message-avatar" :style="{ backgroundColor: message.userColor }">
                {{ message.username.charAt(0).toUpperCase() }}
              </div>
              <div class="message-content">
                <div class="message-header">
                  <span class="message-username">{{ message.username }}</span>
                  <span class="message-time">{{ formatTime(message.timestamp) }}</span>
                </div>
                <div class="message-text">{{ message.text }}</div>
              </div>
            </div>
          </div>
          <div class="chat-input">
            <input
              v-model="newMessage"
              @keyup.enter="sendMessage"
              type="text"
              placeholder="メッセージを入力..."
              class="message-input"
            />
            <button @click="sendMessage" class="send-button">
              <span class="btn-icon">📤</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ビデオ通話エリア -->
    <div v-if="isVideoCallActive" class="video-call-area">
      <div class="video-grid">
        <div class="video-item local-video">
          <video ref="localVideoRef" autoplay muted playsinline></video>
          <div class="video-overlay">
            <span class="video-name">あなた</span>
          </div>
        </div>
        <div
          v-for="user in videoCallUsers"
          :key="user.id"
          class="video-item remote-video"
        >
          <video :ref="'remoteVideo-' + user.id" autoplay playsinline></video>
          <div class="video-overlay">
            <span class="video-name">{{ user.nickname }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 共有URLモーダル -->
    <div v-if="showShareModal" class="share-modal-overlay" @click="closeShareModal">
      <div class="share-modal" @click.stop>
        <h3 class="modal-title">ルームを共有</h3>
        <p class="modal-description">
          このURLを友達に送って、一緒にバーチャルオフィスを楽しもう！
        </p>
        <div class="share-url-container">
          <input
            v-model="shareUrl"
            readonly
            class="share-url-input"
            @click="selectShareUrl"
          />
          <button @click="copyShareUrl" class="copy-button">
            <span class="btn-icon">📋</span>
            コピー
          </button>
        </div>
        <div class="modal-actions">
          <button @click="closeShareModal" class="modal-button secondary">
            閉じる
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useRealtimeSync } from '../composables/useRealtimeSync'
import { useWebRTCCall } from '../composables/useWebRTCCall'
import { useAvatarMovement } from '../composables/useAvatarMovement'

// Props
interface Props {
  roomId: string
  userNickname: string
  userColor: string
}

const props = defineProps<Props>()
const router = useRouter()

// ユーザーID生成
const currentUserId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// コンポーザブルの初期化
const avatarMovement = useAvatarMovement('office-space', (position) => {
  // 位置更新をリアルタイム同期に送信
  realtimeSync.updateUserPosition(currentUserId, position)

  // 近接通話の更新
  updateProximityCall()
})
const realtimeSync = useRealtimeSync(props.roomId, currentUserId, props.userNickname)
const webrtcCall = useWebRTCCall(props.roomId, currentUserId, props.userNickname, {
  audioEnabled: true,
  videoEnabled: false,
  callRadius: 150,
  autoConnect: true
})

// リアクティブデータ
const officeSpaceRef = ref<HTMLElement>()
const chatMessagesRef = ref<HTMLElement>()
const localVideoRef = ref<HTMLVideoElement>()

const newMessage = ref('')
const showShareModal = ref(false)
const showCallRange = ref(false)
const shareUrl = computed(() => {
  return `${window.location.origin}/room/${props.roomId}`
})

// アバター移動関連
const avatarPosition = avatarMovement.avatarPosition
const isMoving = avatarMovement.isMoving
const movementTarget = avatarMovement.movementTarget

// コンポーザブルからのリアクティブデータを使用
const connectedUsers = realtimeSync.connectedUsers
const chatMessages = realtimeSync.chatMessages

// WebRTC関連
const isMicrophoneOn = webrtcCall.isMicrophoneOn
const isCameraOn = webrtcCall.isCameraOn
const isScreenSharing = webrtcCall.isScreenSharing
const isVideoCallActive = webrtcCall.isCallActive
const localStream = webrtcCall.localStream
const remoteUsers = webrtcCall.remoteUsers
const callRadius = webrtcCall.callRadius
const activeCallUsers = webrtcCall.activeCallUsers

const videoCallUsers = computed(() => {
  return Array.from(remoteUsers.values()).map(user => ({
    id: user.id,
    nickname: user.nickname
  }))
})

// Emits
const emit = defineEmits<{
  leaveRoom: []
}>()

// メソッド
const shareRoom = () => {
  showShareModal.value = true
}

const closeShareModal = () => {
  showShareModal.value = false
}

const selectShareUrl = (event: Event) => {
  const input = event.target as HTMLInputElement
  input.select()
}

const copyShareUrl = async () => {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    // TODO: トーストメッセージを表示
    console.log('URLをコピーしました')
  } catch (err) {
    console.error('URLのコピーに失敗しました:', err)
  }
}

const leaveRoom = () => {
  emit('leaveRoom')
  router.push('/')
}

const handleAvatarClick = (user: any) => {
  // アバターをクリックした時の処理（通話開始など）
  console.log('Avatar clicked:', user.nickname)
}

const toggleMicrophone = async () => {
  await webrtcCall.toggleMicrophone()
}

const toggleCamera = async () => {
  await webrtcCall.toggleCamera()
}

const toggleScreenShare = async () => {
  await webrtcCall.toggleScreenShare()
}

const sendMessage = () => {
  if (!newMessage.value.trim()) return

  realtimeSync.sendChatMessage(newMessage.value.trim())
  newMessage.value = ''

  // チャットを最下部にスクロール
  nextTick(() => {
    if (chatMessagesRef.value) {
      chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
    }
  })
}

const formatTime = (timestamp: Date) => {
  return timestamp.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 近接通話関連のメソッド
const updateProximityCall = () => {
  const nearbyUsers = connectedUsers.value.map(user => ({
    id: user.id,
    nickname: user.nickname,
    distance: Math.sqrt(
      Math.pow(user.position.x - avatarPosition.value.x, 2) +
      Math.pow(user.position.y - avatarPosition.value.y, 2)
    )
  }))

  webrtcCall.updateProximityCall(nearbyUsers)
}

const isUserInCallRange = (userId: string) => {
  const user = connectedUsers.value.find(u => u.id === userId)
  if (!user) return false

  const distance = Math.sqrt(
    Math.pow(user.position.x - avatarPosition.value.x, 2) +
    Math.pow(user.position.y - avatarPosition.value.y, 2)
  )

  return distance <= callRadius.value
}

const isUserInCall = (userId: string) => {
  return activeCallUsers.value.includes(userId)
}

const toggleCallRangeDisplay = () => {
  showCallRange.value = !showCallRange.value
}

// ライフサイクル
onMounted(async () => {
  // 自分のユーザーをリアルタイム同期に追加
  realtimeSync.addOrUpdateUser({
    id: currentUserId,
    nickname: props.userNickname,
    color: props.userColor,
    position: { x: 200, y: 200 },
    isActive: true,
    isSpeaking: false,
    isVideoEnabled: false,
    joinedAt: new Date()
  })

  // WebRTC通話を開始
  await webrtcCall.startCall()

  // ローカルビデオストリームを設定
  if (localStream.value && localVideoRef.value) {
    localVideoRef.value.srcObject = localStream.value
  }
})

onUnmounted(() => {
  // WebRTC通話を終了
  webrtcCall.endCall()
})
</script>

<style scoped>
.virtual-office-room {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
}

.room-header {
  background: white;
  padding: 1rem 2rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.room-info {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.room-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.room-icon {
  font-size: 1.5rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
}

.user-name {
  font-weight: 500;
  color: #374151;
}

.room-controls {
  display: flex;
  gap: 1rem;
}

.control-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  color: #374151;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.control-button:hover {
  background: #f3f4f6;
}

.share-button:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.leave-button:hover {
  border-color: #ef4444;
  color: #ef4444;
}

.room-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.office-space {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  margin: 10px;
  cursor: pointer;
  user-select: none;
}

.office-background {
  width: 100%;
  height: 100%;
  position: relative;
  background: linear-gradient(45deg, #f0f2f5 25%, transparent 25%),
              linear-gradient(-45deg, #f0f2f5 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #f0f2f5 75%),
              linear-gradient(-45deg, transparent 75%, #f0f2f5 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
}

.grid-pattern {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
  background-size: 50px 50px;
  pointer-events: none;
}

.furniture-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.desk, .plant, .whiteboard {
  position: absolute;
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.8);
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.desk:hover, .plant:hover, .whiteboard:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  background: rgba(255, 255, 255, 0.9);
}

.avatars-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.avatar {
  position: absolute;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.avatar:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.avatar.current-user {
  border: 3px solid #4CAF50;
  box-shadow: 0 0 20px rgba(76, 175, 80, 0.4);
}

.avatar.in-call-range {
  border: 2px solid #2196F3;
  box-shadow: 0 0 15px rgba(33, 150, 243, 0.3);
}

.avatar.in-call {
  border: 3px solid #FF9800;
  box-shadow: 0 0 20px rgba(255, 152, 0, 0.5);
  animation: pulse-call 2s infinite;
}

@keyframes pulse-call {
  0% { box-shadow: 0 0 20px rgba(255, 152, 0, 0.5); }
  50% { box-shadow: 0 0 30px rgba(255, 152, 0, 0.8); }
  100% { box-shadow: 0 0 20px rgba(255, 152, 0, 0.5); }
}

.avatar-initial {
  font-size: 24px;
  font-weight: bold;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.avatar-name {
  position: absolute;
  bottom: -25px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  white-space: nowrap;
  pointer-events: none;
}

.avatar-status {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid white;
}

.avatar-status.active {
  background: #4CAF50;
}

.avatar-status.moving {
  background: #2196F3;
  animation: pulse-moving 1s infinite;
}

@keyframes pulse-moving {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.speaking-indicator {
  position: absolute;
  top: -8px;
  left: -8px;
  width: 20px;
  height: 20px;
  background: #FF4444;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  border: 2px solid white;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.speaking-indicator.active {
  opacity: 1;
  animation: pulse-speaking 1s infinite;
}

.speaking-indicator::before {
  content: '';
  font-size: 8px;
}

@keyframes pulse-speaking {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

.camera-indicator {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  background: #4CAF50;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  border: 2px solid white;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.camera-indicator.active {
  opacity: 1;
}

.call-range-indicator {
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(33, 150, 243, 0.9);
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  animation: bounce-gentle 2s infinite;
}

.range-icon {
  font-size: 8px;
}

/* 移動矢印のスタイル */
.movement-arrow {
  position: absolute;
  z-index: 15;
  pointer-events: none;
  transform: translate(-50%, -50%);
  animation: bounce-arrow 1s infinite;
}

.arrow-icon {
  font-size: 24px;
  text-align: center;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.arrow-text {
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  text-align: center;
  margin-top: 5px;
  white-space: nowrap;
}

@keyframes bounce-arrow {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.1); }
}

/* 通話範囲の円 */
.call-range-circle {
  position: absolute;
  border: 2px dashed rgba(33, 150, 243, 0.5);
  border-radius: 50%;
  background: rgba(33, 150, 243, 0.1);
  pointer-events: none;
  z-index: 5;
  animation: pulse-range 3s infinite;
}

@keyframes pulse-range {
  0% { opacity: 0.3; }
  50% { opacity: 0.6; }
  100% { opacity: 0.3; }
}

.side-panel {
  width: 320px;
  background: white;
  border-left: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.call-controls {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.panel-icon {
  font-size: 1.2rem;
}

.control-buttons {
  display: flex;
  gap: 0.5rem;
}

.control-btn {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-btn:hover {
  background: #f3f4f6;
}

.control-btn.active {
  background: var(--primary-color);
  color: white;
  transform: scale(1.05);
}

.btn-icon {
  font-size: 1.2rem;
}

.call-info {
  margin-top: 15px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
}

.info-text {
  margin: 5px 0;
  font-size: 12px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 5px;
}

.participants-list {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.participants {
  max-height: 200px;
  overflow-y: auto;
}

.participant {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
}

.participant-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
}

.participant-info {
  flex: 1;
}

.participant-name {
  font-weight: 500;
  color: #1f2937;
  font-size: 0.875rem;
}

.participant-status {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.status-indicator {
  font-size: 0.5rem;
}

.chat-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  min-height: 0;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 1rem;
  padding-right: 0.5rem;
}

.chat-message {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.message-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.message-username {
  font-weight: 500;
  color: #1f2937;
  font-size: 0.875rem;
}

.message-time {
  font-size: 0.75rem;
  color: #6b7280;
}

.message-text {
  color: #374151;
  font-size: 0.875rem;
  word-wrap: break-word;
}

.chat-input {
  display: flex;
  gap: 0.5rem;
}

.message-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
}

.message-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.send-button {
  padding: 0.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.send-button:hover {
  background: #2563eb;
}

.video-call-area {
  position: fixed;
  top: 80px;
  right: 20px;
  width: 400px;
  height: 300px;
  background: rgba(0, 0, 0, 0.9);
  border-radius: 12px;
  overflow: hidden;
  z-index: 1000;
}

.video-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  width: 100%;
  height: 100%;
  padding: 4px;
}

.video-item {
  position: relative;
  background: #1f2937;
  border-radius: 8px;
  overflow: hidden;
}

.video-item video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-overlay {
  position: absolute;
  bottom: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
}

.share-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.share-modal {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
}

.modal-title {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.modal-description {
  margin: 0 0 1.5rem 0;
  color: #6b7280;
}

.share-url-container {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.share-url-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  background: #f9fafb;
}

.copy-button {
  padding: 0.75rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.copy-button:hover {
  background: #2563eb;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
}

.modal-button {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #374151;
  cursor: pointer;
  font-weight: 500;
}

.modal-button:hover {
  background: #f3f4f6;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .room-content {
    flex-direction: column;
  }

  .side-panel {
    width: 100%;
    height: 300px;
    border-left: none;
    border-top: 1px solid #e2e8f0;
  }

  .video-call-area {
    position: relative;
    top: 0;
    right: 0;
    width: 100%;
    height: 200px;
    margin-bottom: 1rem;
  }
}
</style>
