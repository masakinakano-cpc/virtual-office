<template>
  <div class="emoji-picker-example">
    <div class="example-header">
      <h2>絵文字ピッカー機能</h2>
      <p>チャットやメッセージで使用できる絵文字ピッカーのデモです。</p>
    </div>

    <!-- チャット風インターフェース -->
    <div class="chat-interface">
      <div class="chat-messages">
        <div
          v-for="(message, index) in messages"
          :key="index"
          class="message"
          :class="{ own: message.isOwn }"
        >
          <div class="message-content">
            <div class="message-text" v-html="message.text"></div>
            <div class="message-time">{{ formatTime(message.timestamp) }}</div>
          </div>
        </div>
      </div>

      <div class="chat-input-container">
        <div class="chat-input">
          <textarea
            v-model="currentMessage"
            placeholder="メッセージを入力..."
            class="message-input"
            rows="1"
            @keydown.enter.exact.prevent="sendMessage"
            @keydown.enter.shift.exact="addNewLine"
            ref="messageInput"
          ></textarea>

          <div class="input-actions">
            <button
              @click="toggleEmojiPicker"
              class="emoji-trigger-btn"
              :class="{ active: showEmojiPicker }"
            >
              😊
            </button>

            <button
              @click="sendMessage"
              :disabled="!currentMessage.trim()"
              class="send-btn"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22,2 15,22 11,13 2,9 22,2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 絵文字ピッカー -->
    <EmojiPicker
      :is-open="showEmojiPicker"
      @close="showEmojiPicker = false"
      @select="insertEmoji"
    />

    <!-- 機能説明 -->
    <div class="feature-explanation">
      <h3>主な機能</h3>
      <ul>
        <li>📱 カテゴリ別絵文字表示（Smileys & Emotion、People & Body、Activities、Objects）</li>
        <li>🔍 絵文字検索機能</li>
        <li>🎨 スキントーン変更対応</li>
        <li>⌨️ キーボードショートカット対応</li>
        <li>📋 クリックで簡単挿入</li>
        <li>🎯 レスポンシブデザイン</li>
      </ul>

      <div class="usage-tips">
        <h4>使用方法</h4>
        <p>1. 😊ボタンをクリックして絵文字ピッカーを開く</p>
        <p>2. カテゴリーを選択するか、検索バーで絵文字を探す</p>
        <p>3. スキントーンを変更したい場合は、上部のスキントーン選択を使用</p>
        <p>4. 絵文字をクリックしてメッセージに挿入</p>
        <p>5. Enterキーでメッセージ送信、Shift+Enterで改行</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import EmojiPicker from './EmojiPicker.vue'

interface Message {
  text: string
  timestamp: Date
  isOwn: boolean
}

const showEmojiPicker = ref(false)
const currentMessage = ref('')
const messageInput = ref<HTMLTextAreaElement>()
const messages = ref<Message[]>([
  {
    text: 'こんにちは！絵文字ピッカーのテストです 👋',
    timestamp: new Date(Date.now() - 60000),
    isOwn: false
  },
  {
    text: '素晴らしい機能ですね！😄 いろんな絵文字が使えて楽しいです 🎉',
    timestamp: new Date(Date.now() - 30000),
    isOwn: true
  },
  {
    text: 'スキントーンも変更できるんですね 👍🏽',
    timestamp: new Date(Date.now() - 15000),
    isOwn: false
  }
])

// 絵文字ピッカーの表示切り替え
const toggleEmojiPicker = () => {
  showEmojiPicker.value = !showEmojiPicker.value
}

// 絵文字を挿入
const insertEmoji = (emoji: string) => {
  if (messageInput.value) {
    const start = messageInput.value.selectionStart || 0
    const end = messageInput.value.selectionEnd || 0

    const before = currentMessage.value.substring(0, start)
    const after = currentMessage.value.substring(end)

    currentMessage.value = before + emoji + after

    // カーソル位置を絵文字の後に移動
    nextTick(() => {
      if (messageInput.value) {
        const newPosition = start + emoji.length
        messageInput.value.setSelectionRange(newPosition, newPosition)
        messageInput.value.focus()
      }
    })
  } else {
    currentMessage.value += emoji
  }

  showEmojiPicker.value = false
}

// メッセージ送信
const sendMessage = () => {
  if (!currentMessage.value.trim()) return

  messages.value.push({
    text: escapeHtml(currentMessage.value),
    timestamp: new Date(),
    isOwn: true
  })

  currentMessage.value = ''

  // 自動返信（デモ用）
  setTimeout(() => {
    const responses = [
      'いいですね！👍',
      'その絵文字可愛い！😊',
      '絵文字があると楽しいですね 🎉',
      'ありがとうございます！😄',
      '素晴らしいメッセージです ✨'
    ]

    const randomResponse = responses[Math.floor(Math.random() * responses.length)]

    messages.value.push({
      text: randomResponse,
      timestamp: new Date(),
      isOwn: false
    })
  }, 1000)
}

// 改行追加
const addNewLine = () => {
  if (messageInput.value) {
    const start = messageInput.value.selectionStart || 0
    const end = messageInput.value.selectionEnd || 0

    const before = currentMessage.value.substring(0, start)
    const after = currentMessage.value.substring(end)

    currentMessage.value = before + '\n' + after

    nextTick(() => {
      if (messageInput.value) {
        const newPosition = start + 1
        messageInput.value.setSelectionRange(newPosition, newPosition)
      }
    })
  }
}

// HTMLエスケープ
const escapeHtml = (text: string): string => {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML.replace(/\n/g, '<br>')
}

// 時刻フォーマット
const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.emoji-picker-example {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.example-header {
  text-align: center;
  margin-bottom: 30px;
}

.example-header h2 {
  margin: 0 0 8px 0;
  color: #1f2937;
}

.example-header p {
  margin: 0;
  color: #6b7280;
}

.chat-interface {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 30px;
}

.chat-messages {
  height: 300px;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message {
  display: flex;
  justify-content: flex-start;
}

.message.own {
  justify-content: flex-end;
}

.message-content {
  max-width: 70%;
  background: #f3f4f6;
  border-radius: 18px;
  padding: 12px 16px;
  position: relative;
}

.message.own .message-content {
  background: #3b82f6;
  color: white;
}

.message-text {
  margin-bottom: 4px;
  line-height: 1.4;
  word-wrap: break-word;
}

.message-time {
  font-size: 11px;
  opacity: 0.7;
  text-align: right;
}

.chat-input-container {
  border-top: 1px solid #e5e7eb;
  padding: 16px 20px;
}

.chat-input {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  background: #f9fafb;
  border-radius: 24px;
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
}

.message-input {
  flex: 1;
  border: none;
  background: none;
  outline: none;
  resize: none;
  font-size: 14px;
  line-height: 1.4;
  padding: 8px 0;
  max-height: 120px;
  overflow-y: auto;
}

.input-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.emoji-trigger-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.2s;
}

.emoji-trigger-btn:hover {
  background: #e5e7eb;
}

.emoji-trigger-btn.active {
  background: #3b82f6;
  transform: scale(1.1);
}

.send-btn {
  background: #3b82f6;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: all 0.2s;
}

.send-btn:hover:not(:disabled) {
  background: #2563eb;
  transform: scale(1.05);
}

.send-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

.send-btn svg {
  width: 16px;
  height: 16px;
}

.feature-explanation {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 24px;
}

.feature-explanation h3 {
  margin: 0 0 16px 0;
  color: #1f2937;
}

.feature-explanation ul {
  margin: 0 0 24px 0;
  padding-left: 20px;
}

.feature-explanation li {
  margin-bottom: 8px;
  color: #374151;
}

.usage-tips {
  border-top: 1px solid #e5e7eb;
  padding-top: 20px;
}

.usage-tips h4 {
  margin: 0 0 12px 0;
  color: #1f2937;
}

.usage-tips p {
  margin: 8px 0;
  color: #6b7280;
  font-size: 14px;
}

/* スクロールバーのスタイル */
.chat-messages::-webkit-scrollbar {
  width: 4px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
