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
      <div class="office-space" ref="officeSpaceRef">
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

          <!-- アバター表示 -->
          <div class="avatars-container">
            <div
              v-for="user in connectedUsers"
              :key="user.id"
              class="avatar"
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
              <div v-if="user.isSpeaking" class="speaking-indicator"></div>
            </div>
          </div>
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
})
const realtimeSync = useRealtimeSync(props.roomId, currentUserId, props.userNickname)
const webrtcCall = useWebRTCCall(props.roomId, currentUserId, props.userNickname)

// リアクティブデータ
const officeSpaceRef = ref<HTMLElement>()
const chatMessagesRef = ref<HTMLElement>()
const localVideoRef = ref<HTMLVideoElement>()

const newMessage = ref('')
const showShareModal = ref(false)
const shareUrl = computed(() => {
  return `${window.location.origin}/room/${props.roomId}`
})

// コンポーザブルからのリアクティブデータを使用
const connectedUsers = realtimeSync.connectedUsers
const chatMessages = realtimeSync.chatMessages
const isConnected = realtimeSync.isConnected
const connectionError = realtimeSync.connectionError

// WebRTC関連
const isMicrophoneOn = webrtcCall.isMicrophoneOn
const isCameraOn = webrtcCall.isCameraOn
const isScreenSharing = webrtcCall.isScreenSharing
const isVideoCallActive = webrtcCall.isCallActive
const localStream = webrtcCall.localStream
const remoteUsers = webrtcCall.remoteUsers

const videoCallUsers = computed(() => {
  return Array.from(remoteUsers.value.values()).map(user => ({
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
}

.office-background {
  width: 100%;
  height: 100%;
  position: relative;
  background: linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%);
}

.grid-pattern {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
  background-size: 50px 50px;
  opacity: 0.3;
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
  color: white;
  font-weight: 600;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 3px solid white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.avatar:hover {
  transform: scale(1.1);
}

.avatar-initial {
  position: relative;
  z-index: 2;
}

.avatar-name {
  position: absolute;
  bottom: -25px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  white-space: nowrap;
  z-index: 3;
}

.avatar-status {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid white;
}

.avatar-status.active {
  background: #10b981;
}

.speaking-indicator {
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border: 3px solid #3b82f6;
  border-radius: 50%;
  animation: pulse 1s infinite;
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
  border-color: #3b82f6;
  background: #dbeafe;
  color: #3b82f6;
}

.btn-icon {
  font-size: 1.2rem;
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
