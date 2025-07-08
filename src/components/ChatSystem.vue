<template>
  <div class="chat-system" :class="{ 'chat-expanded': isExpanded }">
    <!-- チャットトグルボタン -->
    <button
      @click="toggleChat"
      class="chat-toggle-btn"
      :class="{ 'has-unread': unreadCount > 0 }"
    >
      <span class="chat-icon">💬</span>
      <span v-if="unreadCount > 0" class="unread-badge">{{ unreadCount }}</span>
    </button>

    <!-- チャットパネル -->
    <div v-if="isExpanded" class="chat-panel">
      <!-- チャットヘッダー -->
      <div class="chat-header">
        <div class="chat-title">
          <h3>💬 チャット</h3>
          <span class="online-count">{{ onlineUsers.length }}人がオンライン</span>
        </div>
        <div class="chat-controls">
          <button @click="toggleEmojiPicker" class="emoji-btn">😊</button>
          <button @click="toggleChat" class="close-btn">✕</button>
        </div>
      </div>

      <!-- チャットメッセージ -->
      <div class="chat-messages" ref="messagesContainer">
        <div
          v-for="message in messages"
          :key="message.id"
          class="message"
          :class="{ 'own-message': message.userId === currentUserId }"
        >
          <div class="message-avatar">
            <div class="avatar" :style="{ backgroundColor: message.userColor }">
              {{ message.userName.charAt(0) }}
            </div>
          </div>
          <div class="message-content">
            <div class="message-header">
              <span class="message-user">{{ message.userName }}</span>
              <span class="message-time">{{ formatTime(message.timestamp) }}</span>
            </div>
            <div class="message-text">{{ message.text }}</div>
            <div v-if="message.reactions && message.reactions.length > 0" class="message-reactions">
              <button
                v-for="reaction in getUniqueReactions(message.reactions)"
                :key="reaction.emoji"
                @click="toggleReaction(message.id, reaction.emoji)"
                class="reaction-btn"
                :class="{ 'reacted': hasUserReacted(message.reactions, reaction.emoji) }"
              >
                {{ reaction.emoji }} {{ reaction.count }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 絵文字ピッカー -->
      <div v-if="showEmojiPicker" class="emoji-picker">
        <div class="emoji-grid">
          <button
            v-for="emoji in commonEmojis"
            :key="emoji"
            @click="addEmoji(emoji)"
            class="emoji-item"
          >
            {{ emoji }}
          </button>
        </div>
      </div>

      <!-- メッセージ入力 -->
      <div class="chat-input">
        <div class="input-container">
          <input
            v-model="newMessage"
            @keyup.enter="sendMessage"
            @keyup.esc="isExpanded = false"
            placeholder="メッセージを入力..."
            class="message-input"
            maxlength="500"
          />
          <button @click="sendMessage" class="send-btn" :disabled="!newMessage.trim()">
            <span class="send-icon">📤</span>
          </button>
        </div>
        <div class="input-info">
          <span class="char-count">{{ newMessage.length }}/500</span>
        </div>
      </div>
    </div>

    <!-- 通知トースト -->
    <div v-if="showNotification" class="chat-notification">
      <div class="notification-content">
        <span class="notification-icon">💬</span>
        <span class="notification-text">{{ notificationText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'

// 型定義
interface ChatMessage {
  id: string
  userId: string
  userName: string
  userColor: string
  text: string
  timestamp: Date
  reactions?: ChatReaction[]
}

interface ChatReaction {
  emoji: string
  userId: string
  userName: string
}

interface OnlineUser {
  id: string
  name: string
  color: string
  isActive: boolean
}

// Props
interface Props {
  currentUserId?: string
  currentUserName?: string
  currentUserColor?: string
  onlineUsers?: OnlineUser[]
}

const props = withDefaults(defineProps<Props>(), {
  currentUserId: 'user-current',
  currentUserName: 'ユーザー',
  currentUserColor: '#6366f1',
  onlineUsers: () => []
})

// Emits
const emit = defineEmits<{
  messagesent: [message: ChatMessage]
  reactionAdded: [messageId: string, emoji: string]
}>()

// リアクティブ状態
const isExpanded = ref(false)
const newMessage = ref('')
const messages = ref<ChatMessage[]>([])
const unreadCount = ref(0)
const showEmojiPicker = ref(false)
const showNotification = ref(false)
const notificationText = ref('')
const messagesContainer = ref<HTMLElement>()

// 絵文字リスト
const commonEmojis = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
  '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
  '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
  '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
  '👍', '👎', '👏', '🙌', '👌', '✌️', '🤞', '🤟',
  '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
  '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘'
]

// サンプルメッセージ
const sampleMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    userId: 'user-1',
    userName: 'テストユーザー1',
    userColor: '#ff6b6b',
    text: 'こんにちは！バーチャルオフィスへようこそ！',
    timestamp: new Date(Date.now() - 300000),
    reactions: [
      { emoji: '👋', userId: 'user-2', userName: 'テストユーザー2' },
      { emoji: '😊', userId: 'user-current', userName: props.currentUserName }
    ]
  },
  {
    id: 'msg-2',
    userId: 'user-2',
    userName: 'テストユーザー2',
    userColor: '#4ecdc4',
    text: 'みなさんお疲れ様です！今日も一日頑張りましょう✨',
    timestamp: new Date(Date.now() - 240000),
    reactions: [
      { emoji: '💪', userId: 'user-1', userName: 'テストユーザー1' },
      { emoji: '🔥', userId: 'user-current', userName: props.currentUserName }
    ]
  },
  {
    id: 'msg-3',
    userId: 'user-3',
    userName: 'テストユーザー3',
    userColor: '#45b7d1',
    text: '会議の準備ができました。ホワイトボードエリアでお待ちしています！',
    timestamp: new Date(Date.now() - 180000)
  }
]

// メソッド
const toggleChat = () => {
  isExpanded.value = !isExpanded.value
  if (isExpanded.value) {
    unreadCount.value = 0
    nextTick(() => {
      scrollToBottom()
    })
  }
}

const toggleEmojiPicker = () => {
  showEmojiPicker.value = !showEmojiPicker.value
}

const sendMessage = () => {
  if (!newMessage.value.trim()) return

  const message: ChatMessage = {
    id: `msg-${Date.now()}`,
    userId: props.currentUserId,
    userName: props.currentUserName,
    userColor: props.currentUserColor,
    text: newMessage.value.trim(),
    timestamp: new Date(),
    reactions: []
  }

  messages.value.push(message)
  emit('messagesent', message)

  newMessage.value = ''
  showNotification.value = true
  notificationText.value = 'メッセージを送信しました'

  nextTick(() => {
    scrollToBottom()
  })

  setTimeout(() => {
    showNotification.value = false
  }, 2000)
}

const addEmoji = (emoji: string) => {
  newMessage.value += emoji
  showEmojiPicker.value = false
}

const toggleReaction = (messageId: string, emoji: string) => {
  const message = messages.value.find(m => m.id === messageId)
  if (!message) return

  if (!message.reactions) {
    message.reactions = []
  }

  const existingReaction = message.reactions.find(
    r => r.emoji === emoji && r.userId === props.currentUserId
  )

  if (existingReaction) {
    // リアクションを削除
    message.reactions = message.reactions.filter(
      r => !(r.emoji === emoji && r.userId === props.currentUserId)
    )
  } else {
    // リアクションを追加
    message.reactions.push({
      emoji,
      userId: props.currentUserId,
      userName: props.currentUserName
    })
  }

  emit('reactionAdded', messageId, emoji)
}

const getUniqueReactions = (reactions: ChatReaction[]) => {
  const reactionMap = new Map<string, { emoji: string; count: number }>()

  reactions.forEach(reaction => {
    if (reactionMap.has(reaction.emoji)) {
      reactionMap.get(reaction.emoji)!.count++
    } else {
      reactionMap.set(reaction.emoji, { emoji: reaction.emoji, count: 1 })
    }
  })

  return Array.from(reactionMap.values())
}

const hasUserReacted = (reactions: ChatReaction[], emoji: string) => {
  return reactions.some(r => r.emoji === emoji && r.userId === props.currentUserId)
}

const formatTime = (timestamp: Date) => {
  return timestamp.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const simulateIncomingMessage = () => {
  const users = [
    { id: 'user-1', name: 'テストユーザー1', color: '#ff6b6b' },
    { id: 'user-2', name: 'テストユーザー2', color: '#4ecdc4' },
    { id: 'user-3', name: 'テストユーザー3', color: '#45b7d1' }
  ]

  const sampleTexts = [
    'お疲れ様です！',
    'いい感じですね👍',
    'ちょっと休憩しませんか？☕',
    'プレゼンの準備はどうですか？',
    'みなさんの進捗はいかがですか？',
    'ランチの時間ですね🍽️',
    '今日は天気がいいですね☀️',
    '新しい機能、素晴らしいです！✨'
  ]

  const randomUser = users[Math.floor(Math.random() * users.length)]
  const randomText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)]

  const message: ChatMessage = {
    id: `msg-${Date.now()}`,
    userId: randomUser.id,
    userName: randomUser.name,
    userColor: randomUser.color,
    text: randomText,
    timestamp: new Date(),
    reactions: []
  }

  messages.value.push(message)

  if (!isExpanded.value) {
    unreadCount.value++
  }

  nextTick(() => {
    scrollToBottom()
  })
}

// ライフサイクル
onMounted(() => {
  // サンプルメッセージを追加
  messages.value = [...sampleMessages]

  // 定期的にサンプルメッセージを追加（デモ用）
  const messageInterval = setInterval(() => {
    if (Math.random() < 0.3) { // 30%の確率でメッセージを追加
      simulateIncomingMessage()
    }
  }, 10000) // 10秒ごと

  onUnmounted(() => {
    clearInterval(messageInterval)
  })
})

// メッセージが追加されたときに自動スクロール
watch(messages, () => {
  if (isExpanded.value) {
    nextTick(() => {
      scrollToBottom()
    })
  }
}, { deep: true })
</script>

<style scoped>
.chat-system {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  font-family: 'Inter', sans-serif;
}

.chat-toggle-btn {
  position: relative;
  width: 60px;
  height: 60px;
  border: none;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-toggle-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(99, 102, 241, 0.5);
}

.chat-toggle-btn.has-unread {
  animation: pulse 2s infinite;
}

.unread-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ef4444;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.chat-expanded .chat-toggle-btn {
  display: none;
}

.chat-panel {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 380px;
  height: 500px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  padding: 16px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-title h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.online-count {
  font-size: 12px;
  opacity: 0.9;
}

.chat-controls {
  display: flex;
  gap: 8px;
}

.emoji-btn,
.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 8px;
  color: white;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.emoji-btn:hover,
.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.message.own-message {
  flex-direction: row-reverse;
}

.message.own-message .message-content {
  background: #6366f1;
  color: white;
}

.message-avatar .avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 14px;
}

.message-content {
  flex: 1;
  background: #f3f4f6;
  padding: 12px;
  border-radius: 12px;
  max-width: 70%;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.message-user {
  font-weight: 600;
  font-size: 14px;
}

.message-time {
  font-size: 12px;
  opacity: 0.6;
}

.message-text {
  font-size: 14px;
  line-height: 1.4;
  word-wrap: break-word;
}

.message-reactions {
  display: flex;
  gap: 4px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.reaction-btn {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reaction-btn:hover {
  background: rgba(255, 255, 255, 1);
  transform: translateY(-1px);
}

.reaction-btn.reacted {
  background: #dbeafe;
  border-color: #3b82f6;
  color: #3b82f6;
}

.emoji-picker {
  position: absolute;
  bottom: 80px;
  right: 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
  max-width: 240px;
}

.emoji-item {
  background: none;
  border: none;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s ease;
}

.emoji-item:hover {
  background: #f3f4f6;
  transform: scale(1.1);
}

.chat-input {
  padding: 16px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.input-container {
  display: flex;
  gap: 8px;
  align-items: center;
}

.message-input {
  flex: 1;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  font-size: 14px;
  outline: none;
  transition: all 0.2s ease;
}

.message-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.send-btn {
  background: #6366f1;
  border: none;
  border-radius: 12px;
  color: white;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.send-btn:hover:not(:disabled) {
  background: #5855eb;
  transform: translateY(-1px);
}

.send-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.input-info {
  margin-top: 8px;
  text-align: right;
}

.char-count {
  font-size: 12px;
  color: #6b7280;
}

.chat-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  z-index: 1001;
  animation: slideIn 0.3s ease;
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.notification-icon {
  font-size: 16px;
}

.notification-text {
  font-size: 14px;
  font-weight: 500;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* スクロールバーのスタイル */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* レスポンシブデザイン - モバイル対応強化 */

/* Extra Small デバイス (phones, 375px以下) */
@media (max-width: 374px) {
  .chat-system {
    bottom: 90px; /* ボトムナビゲーションを考慮 */
    right: 8px;
  }

  .chat-toggle-btn {
    width: 48px;
    height: 48px;
    font-size: 18px;
    box-shadow: 0 2px 12px rgba(99, 102, 241, 0.3);
  }

  .chat-panel {
    width: 100vw;
    height: calc(100vh - 140px); /* ヘッダーとボトムナビを除く */
    bottom: 80px; /* ボトムナビゲーションの高さ */
    right: 0;
    left: 0;
    border-radius: 16px 16px 0 0;
    max-height: none;
  }

  .chat-header {
    padding: 12px 16px;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .chat-title h3 {
    font-size: 14px;
  }

  .online-count {
    font-size: 11px;
  }

  .chat-messages {
    padding: 12px;
    gap: 12px;
    padding-bottom: 80px; /* 入力エリアのスペース */
  }

  .message-content {
    max-width: 85%;
    padding: 10px;
    font-size: 13px;
  }

  .message-avatar .avatar {
    width: 32px;
    height: 32px;
    font-size: 12px;
  }

  .chat-input {
    padding: 12px;
    position: sticky;
    bottom: 0;
    background: white;
    border-top: 1px solid #e5e7eb;
  }

  .message-input {
    font-size: 16px; /* iOS zoom防止 */
    padding: 10px 12px;
    border-radius: 20px;
  }

  .send-btn {
    width: 40px;
    height: 40px;
    border-radius: 20px;
  }

  .emoji-picker {
    bottom: 70px;
    right: 8px;
    left: 8px;
    max-width: none;
  }

  .emoji-grid {
    grid-template-columns: repeat(6, 1fr);
    gap: 8px;
  }

  .emoji-item {
    padding: 12px 8px;
    font-size: 18px;
  }
}

/* Small デバイス (phones, 640px以下) */
@media (max-width: 639px) {
  .chat-system {
    bottom: 90px;
    right: 12px;
  }

  .chat-toggle-btn {
    width: 52px;
    height: 52px;
    font-size: 20px;
    /* タッチ対応の改善 */
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

  .chat-panel {
    width: calc(100vw - 16px);
    height: calc(100vh - 160px);
    bottom: 88px;
    right: 8px;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  }

  .chat-messages {
    padding: 14px;
    /* スクロール改善 */
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }

  .message {
    gap: 10px;
  }

  .message-content {
    max-width: 80%;
    padding: 11px;
  }

  .message-text {
    font-size: 13px;
    line-height: 1.5;
  }

  .reaction-btn {
    padding: 6px 10px;
    font-size: 11px;
    border-radius: 12px;
    /* タッチ対応 */
    min-height: 28px;
    min-width: 28px;
  }

  .chat-input {
    padding: 14px;
  }

  .input-container {
    gap: 10px;
  }

  .message-input {
    font-size: 16px;
    padding: 12px 16px;
    border-radius: 24px;
    /* タッチ対応 */
    -webkit-appearance: none;
    appearance: none;
  }

  .send-btn {
    width: 42px;
    height: 42px;
    border-radius: 21px;
    /* タッチフィードバック */
    transition: all 0.1s ease;
  }

  .send-btn:active {
    transform: scale(0.95);
  }

  .emoji-picker {
    bottom: 75px;
    right: 12px;
    left: 12px;
    border-radius: 12px;
    max-height: 200px;
    overflow-y: auto;
  }

  .emoji-grid {
    grid-template-columns: repeat(7, 1fr);
    gap: 6px;
  }

  .emoji-item {
    padding: 10px 6px;
    font-size: 16px;
    border-radius: 8px;
    /* タッチ対応 */
    min-height: 40px;
    min-width: 40px;
  }

  /* スワイプジェスチャー対応 */
  .message-content {
    position: relative;
    transition: transform 0.2s ease;
  }

  .message-content.swipe-left {
    transform: translateX(-20px);
  }

  .message-content.swipe-right {
    transform: translateX(20px);
  }
}

/* Medium デバイス (tablets, 768px以上) */
@media (min-width: 640px) and (max-width: 1023px) {
  .chat-system {
    bottom: 20px;
    right: 20px;
  }

  .chat-panel {
    width: 400px;
    height: 520px;
    border-radius: 18px;
  }

  .chat-messages {
    padding: 18px;
    gap: 18px;
  }

  .message-content {
    max-width: 75%;
    padding: 13px;
  }

  .emoji-picker {
    bottom: 85px;
    right: 16px;
    max-width: 280px;
  }

  .emoji-grid {
    grid-template-columns: repeat(8, 1fr);
  }
}

/* Large デバイス (desktops, 1024px以上) */
@media (min-width: 1024px) {
  .chat-panel {
    width: 420px;
    height: 560px;
  }

  .chat-messages {
    padding: 20px;
    gap: 20px;
  }

  .emoji-picker {
    max-width: 300px;
  }
}

/* タッチデバイス専用スタイル */
@media (hover: none) and (pointer: coarse) {
  .chat-toggle-btn:hover {
    transform: none;
    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
  }

  .reaction-btn:hover {
    transform: none;
    background: rgba(255, 255, 255, 0.8);
  }

  .emoji-item:hover {
    transform: none;
    background: #f3f4f6;
  }

  .send-btn:hover:not(:disabled) {
    transform: none;
    background: #6366f1;
  }

  /* タッチフィードバック */
  .chat-toggle-btn:active {
    transform: scale(0.95);
  }

  .reaction-btn:active {
    transform: scale(0.95);
  }

  .emoji-item:active {
    transform: scale(0.9);
    background: #e5e7eb;
  }

  /* 長押し対応 */
  .message-content {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    user-select: none;
  }

  .message-text {
    -webkit-user-select: text;
    user-select: text;
  }
}

/* 横向き対応 */
@media (max-height: 500px) and (orientation: landscape) {
  .chat-panel {
    height: calc(100vh - 120px);
    max-height: 400px;
  }

  .chat-messages {
    padding: 12px;
  }

  .emoji-picker {
    max-height: 150px;
  }
}

/* ダークモード対応 */
@media (prefers-color-scheme: dark) {
  .chat-panel {
    background: var(--color-gray-900);
    border-color: var(--color-gray-700);
  }

  .chat-messages {
    background: var(--color-gray-900);
  }

  .message-content {
    background: var(--color-gray-800);
    color: var(--color-gray-100);
  }

  .message.own-message .message-content {
    background: var(--color-primary);
    color: white;
  }

  .message-input {
    background: var(--color-gray-800);
    border-color: var(--color-gray-700);
    color: var(--color-gray-100);
  }

  .emoji-picker {
    background: var(--color-gray-800);
    border-color: var(--color-gray-700);
  }

  .emoji-item {
    background: var(--color-gray-700);
  }

  .emoji-item:hover {
    background: var(--color-gray-600);
  }

  .reaction-btn {
    background: var(--color-gray-700);
    border-color: var(--color-gray-600);
    color: var(--color-gray-200);
  }

  .reaction-btn.reacted {
    background: rgba(99, 102, 241, 0.2);
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
}

/* アニメーション削減 */
@media (prefers-reduced-motion: reduce) {
  .chat-toggle-btn,
  .chat-panel,
  .message-content,
  .reaction-btn,
  .emoji-item,
  .send-btn {
    animation: none !important;
    transition: none !important;
  }

  .chat-toggle-btn.has-unread {
    animation: none !important;
  }
}

/* 高コントラスト対応 */
@media (prefers-contrast: high) {
  .chat-panel {
    border: 2px solid var(--color-gray-900);
  }

  .message-content {
    border: 1px solid var(--color-gray-400);
  }

  .reaction-btn {
    border: 2px solid var(--color-gray-600);
  }

  .message-input {
    border: 2px solid var(--color-gray-600);
  }
}
</style>
