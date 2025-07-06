<template>
  <div class="realtime-collaboration">
    <!-- 接続状態表示 -->
    <div class="connection-status" :class="connectionStatus">
      <span class="status-icon">{{ getStatusIcon() }}</span>
      <span class="status-text">{{ getStatusText() }}</span>
      <span class="user-count">{{ onlineUsers.length }}人がオンライン</span>
    </div>

    <!-- オンラインユーザー一覧 -->
    <div class="online-users">
      <h3>👥 オンラインユーザー</h3>
      <div class="users-grid">
        <div
          v-for="user in onlineUsers"
          :key="user.id"
          class="user-card"
          :class="{ 'current-user': user.id === currentUser.id }"
                      @click="startPrivateChat"
        >
          <div class="user-avatar" :style="{ backgroundColor: user.color }">
            {{ user.avatar }}
          </div>
          <div class="user-info">
            <div class="user-name">{{ user.name }}</div>
            <div class="user-status">{{ user.status }}</div>
            <div class="user-activity">{{ user.currentActivity }}</div>
          </div>
          <div class="user-actions">
            <button @click.stop="inviteToCollaborate(user)" class="action-btn">🤝</button>
            <button @click.stop="startVideoCall(user)" class="action-btn">📹</button>
          </div>
        </div>
      </div>
    </div>

    <!-- リアルタイムチャット -->
    <div class="chat-container">
      <div class="chat-header">
        <h3>💬 チャット</h3>
        <div class="chat-controls">
          <button @click="toggleChatMode" class="btn-secondary">
            {{ chatMode === 'public' ? '🌐 パブリック' : '👥 プライベート' }}
          </button>
          <button @click="clearChat" class="btn-secondary">🗑️ クリア</button>
        </div>
      </div>

      <div class="chat-messages" ref="chatMessages">
        <div
          v-for="message in filteredMessages"
          :key="message.id"
          :class="{ 'own-message': message.userId === currentUser.id }"
          class="chat-message"
        >
          <div class="message-avatar">{{ getUserAvatar(message.userId) }}</div>
          <div class="message-content">
            <div class="message-header">
              <span class="message-author">{{ getUserName(message.userId) }}</span>
              <span class="message-time">{{ formatTime(message.timestamp) }}</span>
            </div>
            <div class="message-text">{{ message.content }}</div>
            <div v-if="message.reactions.length > 0" class="message-reactions">
              <span
                v-for="reaction in getUniqueReactions(message.reactions)"
                :key="reaction.emoji"
                class="reaction"
                @click="toggleReaction(message.id, reaction.emoji)"
              >
                {{ reaction.emoji }} {{ reaction.count }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="chat-input">
        <input
          v-model="newMessage"
          type="text"
          placeholder="メッセージを入力..."
          @keyup.enter="sendMessage"
          class="message-input"
        />
        <button @click="sendMessage" class="send-btn">📤</button>
        <button @click="showEmojiPicker = !showEmojiPicker" class="emoji-btn">😊</button>
      </div>

      <!-- 絵文字ピッカー -->
      <div v-if="showEmojiPicker" class="emoji-picker">
        <div
          v-for="emoji in commonEmojis"
          :key="emoji"
          class="emoji-option"
          @click="addEmoji(emoji)"
        >
          {{ emoji }}
        </div>
      </div>
    </div>

    <!-- 共同編集セッション -->
    <div class="collaboration-sessions">
      <h3>🤝 共同編集セッション</h3>
      <div v-if="activeSessions.length === 0" class="no-sessions">
        アクティブなセッションはありません
      </div>
      <div v-else class="sessions-list">
        <div
          v-for="session in activeSessions"
          :key="session.id"
          class="session-card"
        >
          <div class="session-info">
            <div class="session-title">{{ session.title }}</div>
            <div class="session-participants">
              <span
                v-for="participant in session.participants"
                :key="participant.id"
                class="participant-avatar"
                :style="{ backgroundColor: participant.color }"
              >
                {{ participant.avatar }}
              </span>
            </div>
          </div>
          <div class="session-actions">
            <button @click="joinSession(session)" class="btn-primary">参加</button>
            <button v-if="session.ownerId === currentUser.id" @click="endSession(session)" class="btn-danger">終了</button>
          </div>
        </div>
      </div>

      <button @click="createCollaborationSession" class="btn-primary">
        ➕ 新しいセッションを開始
      </button>
    </div>

    <!-- 画面共有 -->
    <div class="screen-sharing">
      <h3>🖥️ 画面共有</h3>
      <div v-if="!isSharing && !viewingSharedScreen" class="sharing-controls">
        <button @click="startScreenShare" class="btn-primary">📺 画面を共有</button>
        <button @click="startApplicationShare" class="btn-secondary">🖼️ アプリケーションを共有</button>
      </div>

      <div v-if="isSharing" class="sharing-active">
        <div class="sharing-info">
          <span class="sharing-icon">📺</span>
          <span class="sharing-text">画面を共有中...</span>
        </div>
        <button @click="stopScreenShare" class="btn-danger">共有を停止</button>
      </div>

      <div v-if="viewingSharedScreen" class="viewing-shared">
        <div class="shared-screen-info">
          <span class="viewer-icon">👁️</span>
          <span class="viewer-text">{{ sharedScreenOwner }}の画面を表示中</span>
        </div>
        <button @click="stopViewingSharedScreen" class="btn-secondary">表示を停止</button>
      </div>
    </div>

    <!-- 音声・ビデオ通話 -->
    <div class="voice-video-calls">
      <h3>📞 音声・ビデオ通話</h3>
      <div v-if="!inCall" class="call-controls">
        <button @click="startVoiceCall" class="btn-secondary">🎤 音声通話</button>
        <button @click="() => startVideoCall()" class="btn-primary">📹 ビデオ通話</button>
      </div>

      <div v-if="inCall" class="call-active">
        <div class="call-info">
          <span class="call-type">{{ callType === 'voice' ? '🎤' : '📹' }}</span>
          <span class="call-duration">{{ formatCallDuration(callDuration) }}</span>
          <span class="call-participants">{{ callParticipants.length }}人参加中</span>
        </div>
        <div class="call-controls-active">
          <button @click="toggleMute" :class="{ muted: isMuted }" class="call-btn">🎤</button>
          <button @click="toggleVideo" :class="{ disabled: !videoEnabled }" class="call-btn">📹</button>
          <button @click="shareScreen" class="call-btn">🖥️</button>
          <button @click="endCall" class="call-btn end-call">📞</button>
        </div>
      </div>
    </div>

    <!-- 通知・アラート -->
    <div class="collaboration-notifications">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="`notification-${notification.type}`"
        class="collaboration-notification"
      >
        <span class="notification-icon">{{ notification.icon }}</span>
        <span class="notification-text">{{ notification.message }}</span>
        <button @click="dismissNotification(notification.id)" class="dismiss-btn">✕</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

interface User {
  id: string
  name: string
  avatar: string
  color: string
  status: 'online' | 'away' | 'busy' | 'offline'
  currentActivity: string
  lastSeen: Date
}

interface ChatMessage {
  id: string
  userId: string
  content: string
  timestamp: Date
  type: 'public' | 'private'
  targetUserId?: string
  reactions: Reaction[]
}

interface Reaction {
  emoji: string
  userId: string
}

interface CollaborationSession {
  id: string
  title: string
  ownerId: string
  participants: User[]
  type: 'layout-edit' | 'whiteboard' | 'document'
  createdAt: Date
}

interface CollaborationNotification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  icon: string
  message: string
  timestamp: Date
}

// WebSocket接続
let websocket: WebSocket | null = null
const connectionStatus = ref<'connecting' | 'connected' | 'disconnected'>('disconnected')

// ユーザー管理
const currentUser = ref<User>({
  id: 'user_' + Date.now(),
  name: 'あなた',
  avatar: '😊',
  color: '#ff6b6b',
  status: 'online',
  currentActivity: 'バーチャルオフィスを閲覧中',
  lastSeen: new Date()
})

const onlineUsers = ref<User[]>([])

// チャット
const chatMessages = ref<ChatMessage[]>([])
const newMessage = ref('')
const chatMode = ref<'public' | 'private'>('public')
const showEmojiPicker = ref(false)
const chatMessagesEl = ref<HTMLElement>()

// 共同編集
const activeSessions = ref<CollaborationSession[]>([])

// 画面共有
const isSharing = ref(false)
const viewingSharedScreen = ref(false)
const sharedScreenOwner = ref('')

// 音声・ビデオ通話
const inCall = ref(false)
const callType = ref<'voice' | 'video'>('voice')
const callDuration = ref(0)
const callParticipants = ref<User[]>([])
const isMuted = ref(false)
const videoEnabled = ref(true)

// 通知
const notifications = ref<CollaborationNotification[]>([])

// 絵文字
const commonEmojis = ['😊', '😂', '❤️', '👍', '👎', '🎉', '🔥', '💡', '✅', '❌', '🤔', '😍']

// 計算プロパティ
const filteredMessages = computed(() => {
  if (chatMode.value === 'public') {
    return chatMessages.value.filter(msg => msg.type === 'public')
  } else {
    return chatMessages.value.filter(msg =>
      msg.type === 'private' &&
      (msg.userId === currentUser.value.id || msg.targetUserId === currentUser.value.id)
    )
  }
})

// WebSocket接続
const connectWebSocket = () => {
  connectionStatus.value = 'connecting'

  // 実際の実装では適切なWebSocketサーバーのURLを使用
  websocket = new WebSocket('ws://localhost:8080/collaboration')

  websocket.onopen = () => {
    connectionStatus.value = 'connected'
    sendUserJoin()
  }

  websocket.onmessage = (event) => {
    const data = JSON.parse(event.data)
    handleWebSocketMessage(data)
  }

  websocket.onclose = () => {
    connectionStatus.value = 'disconnected'
    setTimeout(connectWebSocket, 3000) // 3秒後に再接続
  }

  websocket.onerror = (error) => {
    console.error('WebSocket error:', error)
    connectionStatus.value = 'disconnected'
  }
}

const handleWebSocketMessage = (data: any) => {
  switch (data.type) {
    case 'user_joined':
      onlineUsers.value.push(data.user)
      addNotification('info', '👋', `${data.user.name}が参加しました`)
      break
    case 'user_left':
      onlineUsers.value = onlineUsers.value.filter(u => u.id !== data.userId)
      addNotification('info', '👋', `${data.userName}が退出しました`)
      break
    case 'chat_message':
      chatMessages.value.push(data.message)
      scrollToBottom()
      break
    case 'reaction_added':
      addReactionToMessage(data.messageId, data.reaction)
      break
    case 'collaboration_session_created':
      activeSessions.value.push(data.session)
      break
    case 'collaboration_session_ended':
      activeSessions.value = activeSessions.value.filter(s => s.id !== data.sessionId)
      break
    case 'screen_share_started':
      viewingSharedScreen.value = true
      sharedScreenOwner.value = data.ownerName
      break
    case 'screen_share_ended':
      viewingSharedScreen.value = false
      sharedScreenOwner.value = ''
      break
  }
}

const sendWebSocketMessage = (data: any) => {
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    websocket.send(JSON.stringify(data))
  }
}

const sendUserJoin = () => {
  sendWebSocketMessage({
    type: 'user_join',
    user: currentUser.value
  })
}

// チャット機能
const sendMessage = () => {
  if (!newMessage.value.trim()) return

  const message: ChatMessage = {
    id: Date.now().toString(),
    userId: currentUser.value.id,
    content: newMessage.value,
    timestamp: new Date(),
    type: chatMode.value,
    reactions: []
  }

  sendWebSocketMessage({
    type: 'chat_message',
    message
  })

  newMessage.value = ''
}

const toggleChatMode = () => {
  chatMode.value = chatMode.value === 'public' ? 'private' : 'public'
}

const clearChat = () => {
  chatMessages.value = []
}

const addEmoji = (emoji: string) => {
  newMessage.value += emoji
  showEmojiPicker.value = false
}

const toggleReaction = (messageId: string, emoji: string) => {
  const reaction: Reaction = {
    emoji,
    userId: currentUser.value.id
  }

  sendWebSocketMessage({
    type: 'add_reaction',
    messageId,
    reaction
  })
}

const addReactionToMessage = (messageId: string, reaction: Reaction) => {
  const message = chatMessages.value.find(m => m.id === messageId)
  if (message) {
    const existingReaction = message.reactions.find(r =>
      r.emoji === reaction.emoji && r.userId === reaction.userId
    )

    if (existingReaction) {
      message.reactions = message.reactions.filter(r => r !== existingReaction)
    } else {
      message.reactions.push(reaction)
    }
  }
}

const getUniqueReactions = (reactions: Reaction[]) => {
  const grouped = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = { emoji: reaction.emoji, count: 0 }
    }
    acc[reaction.emoji].count++
    return acc
  }, {} as Record<string, { emoji: string; count: number }>)

  return Object.values(grouped)
}

const scrollToBottom = () => {
  nextTick(() => {
    if (chatMessagesEl.value) {
      chatMessagesEl.value.scrollTop = chatMessagesEl.value.scrollHeight
    }
  })
}

// ユーザー関連
const startPrivateChat = () => {
  console.log('プライベートチャットを開始')
  // プライベートチャット機能の実装
}

const inviteToCollaborate = (user: User) => {
  addNotification('info', '🤝', `${user.name}をコラボレーションに招待しました`)
}

const startVideoCall = (user?: User) => {
  inCall.value = true
  callType.value = 'video'
  callDuration.value = 0

  if (user) {
    callParticipants.value = [user]
  }

  // 通話時間のカウント開始
  const interval = setInterval(() => {
    if (inCall.value) {
      callDuration.value++
    } else {
      clearInterval(interval)
    }
  }, 1000)
}

const startVoiceCall = () => {
  inCall.value = true
  callType.value = 'voice'
  callDuration.value = 0
}

const endCall = () => {
  inCall.value = false
  callParticipants.value = []
  callDuration.value = 0
}

const toggleMute = () => {
  isMuted.value = !isMuted.value
}

const toggleVideo = () => {
  videoEnabled.value = !videoEnabled.value
}

// 共同編集セッション
const createCollaborationSession = () => {
  const session: CollaborationSession = {
    id: Date.now().toString(),
    title: '新しい共同編集セッション',
    ownerId: currentUser.value.id,
    participants: [currentUser.value],
    type: 'layout-edit',
    createdAt: new Date()
  }

  sendWebSocketMessage({
    type: 'create_collaboration_session',
    session
  })
}

const joinSession = (session: CollaborationSession) => {
  sendWebSocketMessage({
    type: 'join_collaboration_session',
    sessionId: session.id,
    user: currentUser.value
  })
}

const endSession = (session: CollaborationSession) => {
  sendWebSocketMessage({
    type: 'end_collaboration_session',
    sessionId: session.id
  })
}

// 画面共有
const startScreenShare = async () => {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true
    })

    isSharing.value = true

    sendWebSocketMessage({
      type: 'start_screen_share',
      ownerId: currentUser.value.id,
      ownerName: currentUser.value.name
    })

    stream.getVideoTracks()[0].onended = () => {
      stopScreenShare()
    }
  } catch (error) {
    console.error('画面共有の開始に失敗:', error)
  }
}

const startApplicationShare = async () => {
  // アプリケーション共有の実装
  console.log('アプリケーション共有を開始')
}

const stopScreenShare = () => {
  isSharing.value = false

  sendWebSocketMessage({
    type: 'stop_screen_share',
    ownerId: currentUser.value.id
  })
}

const stopViewingSharedScreen = () => {
  viewingSharedScreen.value = false
  sharedScreenOwner.value = ''
}

const shareScreen = () => {
  if (inCall.value) {
    startScreenShare()
  }
}

// 通知
const addNotification = (type: CollaborationNotification['type'], icon: string, message: string) => {
  const notification: CollaborationNotification = {
    id: Date.now().toString(),
    type,
    icon,
    message,
    timestamp: new Date()
  }

  notifications.value.push(notification)

  // 5秒後に自動削除
  setTimeout(() => {
    dismissNotification(notification.id)
  }, 5000)
}

const dismissNotification = (id: string) => {
  notifications.value = notifications.value.filter(n => n.id !== id)
}

// ユーティリティ関数
const getUserAvatar = (userId: string) => {
  const user = onlineUsers.value.find(u => u.id === userId) || currentUser.value
  return user.avatar
}

const getUserName = (userId: string) => {
  const user = onlineUsers.value.find(u => u.id === userId) || currentUser.value
  return user.name
}

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('ja-JP', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const formatCallDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

const getStatusIcon = () => {
  switch (connectionStatus.value) {
    case 'connected': return '🟢'
    case 'connecting': return '🟡'
    case 'disconnected': return '🔴'
    default: return '⚪'
  }
}

const getStatusText = () => {
  switch (connectionStatus.value) {
    case 'connected': return '接続済み'
    case 'connecting': return '接続中...'
    case 'disconnected': return '切断済み'
    default: return '不明'
  }
}

// ライフサイクル
onMounted(() => {
  connectWebSocket()

  // サンプルユーザーを追加
  onlineUsers.value = [
    {
      id: 'user1',
      name: '田中太郎',
      avatar: '👨‍💻',
      color: '#4ecdc4',
      status: 'online',
      currentActivity: 'レイアウトを編集中',
      lastSeen: new Date()
    },
    {
      id: 'user2',
      name: '佐藤花子',
      avatar: '👩‍💼',
      color: '#ffe66d',
      status: 'busy',
      currentActivity: '会議中',
      lastSeen: new Date()
    }
  ]
})

onUnmounted(() => {
  if (websocket) {
    websocket.close()
  }
})
</script>

<style scoped>
.realtime-collaboration {
  padding: var(--spacing-6);
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
}

.connection-status {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-6);
  font-weight: 500;
}

.connection-status.connected {
  background: #e8f5e8;
  color: #2e7d32;
}

.connection-status.connecting {
  background: #fff3e0;
  color: #f57c00;
}

.connection-status.disconnected {
  background: #ffebee;
  color: #c62828;
}

.online-users {
  margin-bottom: var(--spacing-8);
}

.online-users h3 {
  color: var(--color-primary);
  margin-bottom: var(--spacing-4);
}

.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-4);
}

.user-card {
  display: flex;
  align-items: center;
  padding: var(--spacing-4);
  background: var(--color-gray-50);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition-normal);
  border: 2px solid transparent;
}

.user-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.user-card.current-user {
  border-color: var(--color-primary);
  background: rgba(255, 107, 107, 0.1);
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-right: var(--spacing-3);
  color: white;
  font-weight: 600;
}

.user-info {
  flex: 1;
}

.user-name {
  font-weight: 600;
  color: var(--color-gray-800);
  margin-bottom: var(--spacing-1);
}

.user-status {
  font-size: var(--text-sm);
  color: var(--color-gray-600);
  margin-bottom: var(--spacing-1);
}

.user-activity {
  font-size: var(--text-xs);
  color: var(--color-gray-500);
  font-style: italic;
}

.user-actions {
  display: flex;
  gap: var(--spacing-2);
}

.action-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: var(--spacing-2);
  border-radius: var(--radius-md);
  transition: var(--transition-fast);
}

.action-btn:hover {
  background: var(--color-gray-200);
}

.chat-container {
  margin-bottom: var(--spacing-8);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-4);
  background: var(--color-gray-100);
  border-bottom: 1px solid var(--color-gray-200);
}

.chat-header h3 {
  margin: 0;
  color: var(--color-primary);
}

.chat-controls {
  display: flex;
  gap: var(--spacing-2);
}

.chat-messages {
  height: 300px;
  overflow-y: auto;
  padding: var(--spacing-4);
}

.chat-message {
  display: flex;
  align-items: flex-start;
  margin-bottom: var(--spacing-4);
}

.chat-message.own-message {
  flex-direction: row-reverse;
}

.chat-message.own-message .message-content {
  background: var(--color-primary);
  color: white;
  border-radius: var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-lg);
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-gray-300);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 var(--spacing-2);
  font-size: 1rem;
}

.message-content {
  max-width: 70%;
  background: white;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm);
  padding: var(--spacing-3);
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-1);
}

.message-author {
  font-weight: 600;
  font-size: var(--text-sm);
}

.message-time {
  font-size: var(--text-xs);
  opacity: 0.7;
}

.message-text {
  line-height: 1.4;
}

.message-reactions {
  display: flex;
  gap: var(--spacing-1);
  margin-top: var(--spacing-2);
  flex-wrap: wrap;
}

.reaction {
  background: var(--color-gray-100);
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  cursor: pointer;
  transition: var(--transition-fast);
}

.reaction:hover {
  background: var(--color-gray-200);
}

.chat-input {
  display: flex;
  gap: var(--spacing-2);
  padding: var(--spacing-4);
  background: var(--color-gray-50);
  border-top: 1px solid var(--color-gray-200);
}

.message-input {
  flex: 1;
  padding: var(--spacing-3);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-lg);
  outline: none;
}

.message-input:focus {
  border-color: var(--color-primary);
}

.send-btn,
.emoji-btn {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: var(--spacing-3);
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-size: 1rem;
}

.emoji-btn {
  background: var(--color-gray-300);
}

.emoji-picker {
  position: absolute;
  bottom: 60px;
  right: var(--spacing-4);
  background: white;
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-lg);
  padding: var(--spacing-3);
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: var(--spacing-2);
  box-shadow: var(--shadow-lg);
  z-index: 100;
}

.emoji-option {
  padding: var(--spacing-2);
  cursor: pointer;
  border-radius: var(--radius-md);
  text-align: center;
  transition: var(--transition-fast);
}

.emoji-option:hover {
  background: var(--color-gray-100);
}

.collaboration-sessions {
  margin-bottom: var(--spacing-8);
}

.collaboration-sessions h3 {
  color: var(--color-primary);
  margin-bottom: var(--spacing-4);
}

.no-sessions {
  color: var(--color-gray-500);
  text-align: center;
  padding: var(--spacing-6);
  font-style: italic;
}

.sessions-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-4);
}

.session-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-4);
  background: var(--color-gray-50);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-gray-200);
}

.session-info {
  flex: 1;
}

.session-title {
  font-weight: 600;
  color: var(--color-gray-800);
  margin-bottom: var(--spacing-2);
}

.session-participants {
  display: flex;
  gap: var(--spacing-1);
}

.participant-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  color: white;
  font-weight: 600;
}

.session-actions {
  display: flex;
  gap: var(--spacing-2);
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-weight: 500;
}

.btn-secondary {
  background: var(--color-gray-200);
  color: var(--color-gray-700);
  border: none;
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-weight: 500;
}

.btn-danger {
  background: #f44336;
  color: white;
  border: none;
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-weight: 500;
}

.screen-sharing,
.voice-video-calls {
  margin-bottom: var(--spacing-8);
}

.screen-sharing h3,
.voice-video-calls h3 {
  color: var(--color-primary);
  margin-bottom: var(--spacing-4);
}

.sharing-controls,
.call-controls {
  display: flex;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-4);
}

.sharing-active,
.viewing-shared,
.call-active {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-4);
  background: var(--color-gray-50);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-gray-200);
}

.sharing-info,
.shared-screen-info,
.call-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.call-controls-active {
  display: flex;
  gap: var(--spacing-2);
}

.call-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  transition: var(--transition-normal);
  background: var(--color-gray-200);
}

.call-btn.muted {
  background: #f44336;
  color: white;
}

.call-btn.disabled {
  background: #f44336;
  color: white;
}

.call-btn.end-call {
  background: #f44336;
  color: white;
}

.collaboration-notifications {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.collaboration-notification {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  min-width: 300px;
  animation: slideInRight 0.3s ease-out;
}

.notification-info {
  background: #e3f2fd;
  border-left: 4px solid #2196f3;
}

.notification-success {
  background: #e8f5e8;
  border-left: 4px solid #4caf50;
}

.notification-warning {
  background: #fff3e0;
  border-left: 4px solid #ff9800;
}

.notification-error {
  background: #ffebee;
  border-left: 4px solid #f44336;
}

.notification-text {
  flex: 1;
  font-weight: 500;
}

.dismiss-btn {
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0.7;
  font-size: 1rem;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .users-grid {
    grid-template-columns: 1fr;
  }

  .user-card {
    flex-direction: column;
    text-align: center;
    gap: var(--spacing-3);
  }

  .chat-messages {
    height: 200px;
  }

  .chat-input {
    flex-direction: column;
  }

  .sharing-controls,
  .call-controls {
    flex-direction: column;
  }

  .sharing-active,
  .viewing-shared,
  .call-active {
    flex-direction: column;
    gap: var(--spacing-3);
  }
}
</style>
