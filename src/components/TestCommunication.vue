<template>
  <div class="test-communication">
    <div class="test-header">
      <h2>通信テスト</h2>
      <div class="connection-status">
        <span :class="['status-indicator', isConnected ? 'connected' : 'disconnected']">
          {{ isConnected ? '接続中' : '切断中' }}
        </span>
      </div>
    </div>

    <div class="test-content">
      <div class="user-info">
        <h3>ユーザー情報</h3>
        <p>ユーザーID: {{ userId }}</p>
        <p>ニックネーム: {{ nickname }}</p>
        <p>ルーム: {{ roomId }}</p>
      </div>

      <div class="connected-users">
        <h3>接続ユーザー ({{ connectedUsers.length }})</h3>
        <div class="users-list">
          <div
            v-for="user in connectedUsers"
            :key="user.id"
            class="user-item"
          >
            <div class="user-avatar" :style="{ backgroundColor: user.color }">
              {{ user.nickname.charAt(0).toUpperCase() }}
            </div>
            <div class="user-details">
              <div class="user-name">{{ user.nickname }}</div>
              <div class="user-position">
                位置: ({{ Math.round(user.position.x) }}, {{ Math.round(user.position.y) }})
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="chat-test">
        <h3>チャットテスト</h3>
        <div class="chat-messages">
          <div
            v-for="message in chatMessages"
            :key="message.id"
            class="chat-message"
          >
            <strong>{{ message.username }}:</strong> {{ message.text }}
            <span class="message-time">{{ formatTime(message.timestamp) }}</span>
          </div>
        </div>
        <div class="chat-input">
          <input
            v-model="newMessage"
            @keyup.enter="sendMessage"
            placeholder="メッセージを入力..."
            class="message-input"
          />
          <button @click="sendMessage" class="send-button">送信</button>
        </div>
      </div>

      <div class="webrtc-test">
        <h3>WebRTCテスト</h3>
        <div class="webrtc-controls">
          <button @click="startCall" :disabled="isCallActive" class="control-button">
            {{ isCallActive ? '通話中' : '通話開始' }}
          </button>
          <button @click="endCall" :disabled="!isCallActive" class="control-button">
            通話終了
          </button>
        </div>
        <div class="webrtc-status">
          <p>通話状態: {{ isCallActive ? 'アクティブ' : '非アクティブ' }}</p>
          <p>マイク: {{ isMicrophoneOn ? 'オン' : 'オフ' }}</p>
          <p>カメラ: {{ isCameraOn ? 'オン' : 'オフ' }}</p>
          <p>リモートユーザー: {{ remoteUsers.size }}</p>
        </div>
      </div>

      <div class="error-display" v-if="connectionError">
        <h3>エラー</h3>
        <p class="error-message">{{ connectionError }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRealtimeSync } from '../composables/useRealtimeSync'
import { useWebRTCCall } from '../composables/useWebRTCCall'

// テスト用のデータ
const roomId = ref('test-room')
const userId = ref(`user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
const nickname = ref(`テストユーザー${Math.floor(Math.random() * 1000)}`)
const newMessage = ref('')

// コンポーザブルの初期化
const realtimeSync = useRealtimeSync(roomId.value, userId.value, nickname.value)
const webrtcCall = useWebRTCCall(roomId.value, userId.value, nickname.value)

// リアクティブデータ
const connectedUsers = realtimeSync.connectedUsers
const chatMessages = realtimeSync.chatMessages
const isConnected = realtimeSync.isConnected
const connectionError = realtimeSync.connectionError

const isCallActive = webrtcCall.isCallActive
const isMicrophoneOn = webrtcCall.isMicrophoneOn
const isCameraOn = webrtcCall.isCameraOn
const remoteUsers = webrtcCall.remoteUsers

// メソッド
const sendMessage = () => {
  if (!newMessage.value.trim()) return

  realtimeSync.sendChatMessage(newMessage.value.trim())
  newMessage.value = ''
}

const startCall = async () => {
  await webrtcCall.startCall()
}

const endCall = () => {
  webrtcCall.endCall()
}

const formatTime = (timestamp: Date) => {
  return timestamp.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 初期化
onMounted(() => {
  // 自分をユーザーリストに追加
  realtimeSync.addOrUpdateUser({
    id: userId.value,
    nickname: nickname.value,
    color: '#3B82F6',
    position: { x: 100, y: 100 },
    isActive: true,
    isSpeaking: false,
    joinedAt: new Date()
  })
})
</script>

<style scoped>
.test-communication {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.test-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
}

.test-header h2 {
  margin: 0;
  color: #1f2937;
}

.status-indicator {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.875rem;
}

.status-indicator.connected {
  background-color: #10b981;
  color: white;
}

.status-indicator.disconnected {
  background-color: #ef4444;
  color: white;
}

.test-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.user-info,
.connected-users,
.chat-test,
.webrtc-test,
.error-display {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.user-info h3,
.connected-users h3,
.chat-test h3,
.webrtc-test h3,
.error-display h3 {
  margin: 0 0 1rem 0;
  color: #1f2937;
  font-size: 1.125rem;
}

.users-list {
  max-height: 200px;
  overflow-y: auto;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.user-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 1rem;
}

.user-details {
  flex: 1;
}

.user-name {
  font-weight: 600;
  color: #1f2937;
}

.user-position {
  font-size: 0.875rem;
  color: #6b7280;
}

.chat-messages {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 1rem;
  background: #f9fafb;
}

.chat-message {
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  background: white;
  border-radius: 4px;
  font-size: 0.875rem;
}

.message-time {
  float: right;
  color: #6b7280;
  font-size: 0.75rem;
}

.chat-input {
  display: flex;
  gap: 0.5rem;
}

.message-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
}

.send-button,
.control-button {
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

.send-button:hover,
.control-button:hover {
  background: #2563eb;
}

.control-button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.webrtc-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.webrtc-status p {
  margin: 0.25rem 0;
  font-size: 0.875rem;
  color: #4b5563;
}

.error-message {
  color: #ef4444;
  font-weight: 600;
  margin: 0;
}

@media (max-width: 768px) {
  .test-content {
    grid-template-columns: 1fr;
  }
}
</style>
