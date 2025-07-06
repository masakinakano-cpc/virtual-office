<template>
  <div class="ai-assistant">
    <div class="assistant-header">
      <h2>🤖 AIアシスタント</h2>
      <div class="assistant-status">
        <div :class="{ online: isOnline }" class="status-indicator"></div>
        <span>{{ isOnline ? 'オンライン' : 'オフライン' }}</span>
      </div>
    </div>

    <!-- チャットインターフェース -->
    <div class="chat-interface">
      <div class="chat-messages" ref="chatMessages">
        <div
          v-for="message in messages"
          :key="message.id"
          :class="{ user: message.isUser, assistant: !message.isUser }"
          class="message"
        >
          <div class="message-avatar">
            {{ message.isUser ? '👤' : '🤖' }}
          </div>
          <div class="message-content">
            <div class="message-text" v-html="formatMessage(message.text)"></div>
            <div class="message-time">{{ formatTime(message.timestamp) }}</div>
          </div>
        </div>

        <div v-if="isTyping" class="typing-indicator">
          <div class="message-avatar">🤖</div>
          <div class="typing-dots">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>

      <div class="chat-input">
        <input
          v-model="currentMessage"
          @keydown.enter="sendMessage"
          placeholder="AIアシスタントに質問してください..."
          class="message-input"
        />
        <button @click="sendMessage" :disabled="!currentMessage.trim()" class="send-btn">
          📤
        </button>
      </div>
    </div>

    <!-- 機能タブ -->
    <div class="assistant-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="{ active: activeTab === tab.id }"
        class="tab-button"
      >
        {{ tab.icon }} {{ tab.name }}
      </button>
    </div>

    <!-- レイアウト提案 -->
    <div v-if="activeTab === 'layout'" class="layout-suggestions">
      <div class="section-header">
        <h3>🏗️ レイアウト提案</h3>
        <button @click="generateLayoutSuggestions" class="btn-primary">
          新しい提案を生成
        </button>
      </div>

      <div class="suggestions-grid">
        <div
          v-for="suggestion in layoutSuggestions"
          :key="suggestion.id"
          class="suggestion-card"
        >
          <div class="suggestion-preview">
            <div class="preview-layout">
              <div
                v-for="item in suggestion.items"
                :key="item.id"
                :style="{
                  left: item.x + '%',
                  top: item.y + '%',
                  width: item.width + '%',
                  height: item.height + '%'
                }"
                class="preview-item"
              >
                {{ item.icon }}
              </div>
            </div>
          </div>
          <div class="suggestion-info">
            <div class="suggestion-name">{{ suggestion.name }}</div>
            <div class="suggestion-description">{{ suggestion.description }}</div>
            <div class="suggestion-benefits">
              <span
                v-for="benefit in suggestion.benefits"
                :key="benefit"
                class="benefit-tag"
              >
                {{ benefit }}
              </span>
            </div>
          </div>
          <div class="suggestion-actions">
            <button @click="previewLayout(suggestion)" class="btn-secondary">
              プレビュー
            </button>
            <button @click="applyLayout(suggestion)" class="btn-primary">
              適用
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 生産性分析 -->
    <div v-if="activeTab === 'productivity'" class="productivity-analysis">
      <div class="section-header">
        <h3>📊 生産性分析</h3>
        <button @click="analyzeProductivity" class="btn-primary">
          分析を更新
        </button>
      </div>

      <div class="analysis-summary">
        <div class="summary-card">
          <div class="summary-icon">⚡</div>
          <div class="summary-content">
            <div class="summary-value">{{ productivityScore }}%</div>
            <div class="summary-label">生産性スコア</div>
          </div>
        </div>

        <div class="summary-card">
          <div class="summary-icon">🎯</div>
          <div class="summary-content">
            <div class="summary-value">{{ focusTime }}h</div>
            <div class="summary-label">集中時間</div>
          </div>
        </div>

        <div class="summary-card">
          <div class="summary-icon">📈</div>
          <div class="summary-content">
            <div class="summary-value">{{ improvementRate }}%</div>
            <div class="summary-label">改善率</div>
          </div>
        </div>
      </div>

      <div class="recommendations">
        <h4>🎯 改善提案</h4>
        <div class="recommendation-list">
          <div
            v-for="recommendation in recommendations"
            :key="recommendation.id"
            class="recommendation-item"
          >
            <div class="recommendation-icon">{{ recommendation.icon }}</div>
            <div class="recommendation-content">
              <div class="recommendation-title">{{ recommendation.title }}</div>
              <div class="recommendation-description">{{ recommendation.description }}</div>
            </div>
            <div class="recommendation-impact">
              <span class="impact-label">効果:</span>
              <span class="impact-value">{{ recommendation.impact }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 自動最適化 -->
    <div v-if="activeTab === 'optimization'" class="auto-optimization">
      <div class="section-header">
        <h3>⚙️ 自動最適化</h3>
        <label class="toggle-switch">
          <input v-model="autoOptimizationEnabled" type="checkbox" />
          <span class="slider"></span>
        </label>
      </div>

      <div class="optimization-settings">
        <div class="setting-group">
          <h4>🔧 最適化設定</h4>
          <div class="setting-item">
            <label class="setting-label">
              <input v-model="optimizationSettings.layout" type="checkbox" />
              レイアウト自動調整
            </label>
            <p class="setting-description">使用パターンに基づいてレイアウトを自動調整</p>
          </div>

          <div class="setting-item">
            <label class="setting-label">
              <input v-model="optimizationSettings.lighting" type="checkbox" />
              照明自動調整
            </label>
            <p class="setting-description">時間帯に応じて照明を自動調整</p>
          </div>

          <div class="setting-item">
            <label class="setting-label">
              <input v-model="optimizationSettings.notifications" type="checkbox" />
              通知最適化
            </label>
            <p class="setting-description">集中時間中の通知を自動調整</p>
          </div>

          <div class="setting-item">
            <label class="setting-label">
              <input v-model="optimizationSettings.breaks" type="checkbox" />
              休憩提案
            </label>
            <p class="setting-description">疲労度に基づいて休憩を提案</p>
          </div>
        </div>

        <div class="optimization-history">
          <h4>📋 最適化履歴</h4>
          <div class="history-list">
            <div
              v-for="history in optimizationHistory"
              :key="history.id"
              class="history-item"
            >
              <div class="history-icon">{{ history.icon }}</div>
              <div class="history-content">
                <div class="history-title">{{ history.title }}</div>
                <div class="history-description">{{ history.description }}</div>
                <div class="history-time">{{ formatTime(history.timestamp) }}</div>
              </div>
              <div class="history-result">
                <span class="result-label">効果:</span>
                <span class="result-value">{{ history.result }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 学習データ -->
    <div v-if="activeTab === 'learning'" class="learning-data">
      <div class="section-header">
        <h3>🧠 学習データ</h3>
        <button @click="exportLearningData" class="btn-secondary">
          データをエクスポート
        </button>
      </div>

      <div class="learning-stats">
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <div class="stat-value">{{ learningData.interactions }}</div>
            <div class="stat-label">インタラクション数</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🎯</div>
          <div class="stat-content">
            <div class="stat-value">{{ learningData.accuracy }}%</div>
            <div class="stat-label">予測精度</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">📈</div>
          <div class="stat-content">
            <div class="stat-value">{{ learningData.improvements }}</div>
            <div class="stat-label">改善提案数</div>
          </div>
        </div>
      </div>

      <div class="learning-insights">
        <h4>💡 学習インサイト</h4>
        <div class="insight-list">
          <div
            v-for="insight in learningInsights"
            :key="insight.id"
            class="insight-item"
          >
            <div class="insight-icon">{{ insight.icon }}</div>
            <div class="insight-content">
              <div class="insight-title">{{ insight.title }}</div>
              <div class="insight-description">{{ insight.description }}</div>
            </div>
            <div class="insight-confidence">
              <span class="confidence-label">信頼度:</span>
              <span class="confidence-value">{{ insight.confidence }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

interface LayoutSuggestion {
  id: string
  name: string
  description: string
  benefits: string[]
  items: LayoutItem[]
}

interface LayoutItem {
  id: string
  icon: string
  x: number
  y: number
  width: number
  height: number
}

interface Recommendation {
  id: string
  title: string
  description: string
  icon: string
  impact: string
}

interface OptimizationHistory {
  id: string
  title: string
  description: string
  icon: string
  timestamp: Date
  result: string
}

interface LearningInsight {
  id: string
  title: string
  description: string
  icon: string
  confidence: number
}

const activeTab = ref('layout')
const currentMessage = ref('')
const isTyping = ref(false)
const isOnline = ref(true)
const autoOptimizationEnabled = ref(true)
const chatMessages = ref<HTMLElement>()

const tabs = [
  { id: 'layout', name: 'レイアウト提案', icon: '🏗️' },
  { id: 'productivity', name: '生産性分析', icon: '📊' },
  { id: 'optimization', name: '自動最適化', icon: '⚙️' },
  { id: 'learning', name: '学習データ', icon: '🧠' }
]

const messages = ref<Message[]>([
  {
    id: '1',
    text: 'こんにちは！AIアシスタントです。オフィス環境の最適化についてお手伝いします。何かご質問はありますか？',
    isUser: false,
    timestamp: new Date()
  }
])

const layoutSuggestions = ref<LayoutSuggestion[]>([
  {
    id: 'focus-layout',
    name: '集中レイアウト',
    description: '集中作業に最適化された配置',
    benefits: ['集中力向上', '生産性アップ', '疲労軽減'],
    items: [
      { id: 'desk', icon: '🗃️', x: 30, y: 40, width: 40, height: 20 },
      { id: 'chair', icon: '🪑', x: 45, y: 60, width: 10, height: 10 },
      { id: 'plant', icon: '🌱', x: 10, y: 20, width: 15, height: 15 },
      { id: 'light', icon: '💡', x: 70, y: 10, width: 20, height: 20 }
    ]
  },
  {
    id: 'collaboration-layout',
    name: 'コラボレーションレイアウト',
    description: 'チームワークを促進する配置',
    benefits: ['コミュニケーション促進', 'チームワーク向上', '創造性向上'],
    items: [
      { id: 'table', icon: '🪑', x: 20, y: 30, width: 60, height: 40 },
      { id: 'whiteboard', icon: '📋', x: 10, y: 10, width: 80, height: 15 },
      { id: 'coffee', icon: '☕', x: 85, y: 75, width: 10, height: 15 }
    ]
  }
])

const productivityScore = ref(78)
const focusTime = ref(6.5)
const improvementRate = ref(12)

const recommendations = ref<Recommendation[]>([
  {
    id: 'break-reminder',
    title: '定期的な休憩の取得',
    description: '1時間ごとに5分の休憩を取ることで集中力を維持できます',
    icon: '☕',
    impact: '生産性15%向上'
  },
  {
    id: 'lighting-adjustment',
    title: '照明の調整',
    description: '自然光に近い照明に調整することで疲労を軽減できます',
    icon: '💡',
    impact: '疲労20%軽減'
  },
  {
    id: 'noise-reduction',
    title: 'ノイズ対策',
    description: '集中時間中はノイズキャンセリングを有効にしましょう',
    icon: '🔇',
    impact: '集中力25%向上'
  }
])

const optimizationSettings = ref({
  layout: true,
  lighting: true,
  notifications: true,
  breaks: true
})

const optimizationHistory = ref<OptimizationHistory[]>([
  {
    id: '1',
    title: 'レイアウト自動調整',
    description: '使用パターンに基づいてデスクの位置を調整しました',
    icon: '🏗️',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    result: '作業効率10%向上'
  },
  {
    id: '2',
    title: '照明自動調整',
    description: '時間帯に応じて照明の色温度を調整しました',
    icon: '💡',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    result: '目の疲労15%軽減'
  }
])

const learningData = ref({
  interactions: 1247,
  accuracy: 89,
  improvements: 23
})

const learningInsights = ref<LearningInsight[]>([
  {
    id: '1',
    title: '午前中の生産性が高い',
    description: '9-11時の時間帯で最も高いパフォーマンスを発揮しています',
    icon: '🌅',
    confidence: 92
  },
  {
    id: '2',
    title: '短い休憩が効果的',
    description: '5分の短い休憩が長時間の休憩より効果的です',
    icon: '⏰',
    confidence: 87
  },
  {
    id: '3',
    title: '自然光の影響',
    description: '自然光の多い日は生産性が15%向上しています',
    icon: '☀️',
    confidence: 94
  }
])

const sendMessage = async () => {
  if (!currentMessage.value.trim()) return

  const userMessage: Message = {
    id: Date.now().toString(),
    text: currentMessage.value,
    isUser: true,
    timestamp: new Date()
  }

  messages.value.push(userMessage)
  currentMessage.value = ''

  // AIの応答をシミュレート
  isTyping.value = true
  await nextTick()
  scrollToBottom()

  setTimeout(() => {
    const aiResponse = generateAIResponse(userMessage.text)
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: aiResponse,
      isUser: false,
      timestamp: new Date()
    }

    messages.value.push(aiMessage)
    isTyping.value = false
    scrollToBottom()
  }, 1500)
}

const generateAIResponse = (userInput: string): string => {
  const lowerInput = userInput.toLowerCase()

  if (lowerInput.includes('レイアウト') || lowerInput.includes('配置')) {
    return '現在の使用パターンを分析した結果、<strong>集中レイアウト</strong>をお勧めします。デスクを窓側に配置し、植物を近くに置くことで、生産性が15%向上すると予測されます。'
  }

  if (lowerInput.includes('生産性') || lowerInput.includes('効率')) {
    return '生産性分析の結果、午前中の集中力が高いことが分かりました。<strong>ポモドーロテクニック</strong>を使用し、1時間ごとに5分の休憩を取ることをお勧めします。'
  }

  if (lowerInput.includes('疲労') || lowerInput.includes('疲れ')) {
    return '疲労軽減のため、以下をお勧めします：<br>1. 照明を自然光に近い色温度に調整<br>2. 20-20-20ルール（20分ごとに20秒間、20フィート先を見る）<br>3. 定期的なストレッチ'
  }

  if (lowerInput.includes('集中') || lowerInput.includes('フォーカス')) {
    return '集中力向上のため、<strong>ノイズキャンセリング</strong>を有効にし、通知を一時的に無効化することをお勧めします。また、植物を視界に入れることで、ストレス軽減効果も期待できます。'
  }

  return 'ご質問ありがとうございます。より具体的な改善提案をするため、現在の作業環境や課題について詳しく教えていただけますか？レイアウト、生産性、疲労軽減など、どの分野でお手伝いできるでしょうか？'
}

const formatMessage = (text: string): string => {
  return text.replace(/\n/g, '<br>')
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const scrollToBottom = () => {
  nextTick(() => {
    if (chatMessages.value) {
      chatMessages.value.scrollTop = chatMessages.value.scrollHeight
    }
  })
}

const generateLayoutSuggestions = () => {
  // 新しいレイアウト提案を生成
  console.log('新しいレイアウト提案を生成中...')

  const newSuggestion: LayoutSuggestion = {
    id: 'wellness-layout',
    name: 'ウェルネスレイアウト',
    description: '健康と快適性を重視した配置',
    benefits: ['健康促進', 'ストレス軽減', '快適性向上'],
    items: [
      { id: 'standing-desk', icon: '🏢', x: 25, y: 35, width: 50, height: 30 },
      { id: 'yoga-mat', icon: '🧘', x: 10, y: 70, width: 30, height: 20 },
      { id: 'air-purifier', icon: '🌬️', x: 80, y: 20, width: 15, height: 25 },
      { id: 'water', icon: '💧', x: 70, y: 75, width: 10, height: 15 }
    ]
  }

  layoutSuggestions.value.unshift(newSuggestion)
}

const previewLayout = (suggestion: LayoutSuggestion) => {
  console.log('レイアウトをプレビュー:', suggestion.name)
  // プレビュー機能の実装
}

const applyLayout = (suggestion: LayoutSuggestion) => {
  console.log('レイアウトを適用:', suggestion.name)
  // レイアウト適用機能の実装
}

const analyzeProductivity = () => {
  console.log('生産性を分析中...')

  // 分析結果を更新
  productivityScore.value = Math.floor(Math.random() * 20) + 75
  focusTime.value = Math.round((Math.random() * 3 + 5) * 10) / 10
  improvementRate.value = Math.floor(Math.random() * 15) + 10
}

const exportLearningData = () => {
  console.log('学習データをエクスポート中...')

  const data = {
    interactions: learningData.value.interactions,
    accuracy: learningData.value.accuracy,
    improvements: learningData.value.improvements,
    insights: learningInsights.value
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'ai-learning-data.json'
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(() => {
  console.log('AIアシスタントが初期化されました')
  scrollToBottom()
})

// エクスポート
defineExpose({
  sendMessage,
  generateLayoutSuggestions,
  analyzeProductivity,
  exportLearningData
})
</script>

<style scoped>
.ai-assistant {
  padding: var(--spacing-6);
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.assistant-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-4);
}

.assistant-header h2 {
  color: var(--color-primary);
  margin: 0;
}

.assistant-status {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  color: var(--color-gray-600);
  font-size: var(--text-sm);
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-error);
  transition: var(--transition-normal);
}

.status-indicator.online {
  background: var(--color-success);
}

.chat-interface {
  background: var(--color-gray-50);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
  margin-bottom: var(--spacing-6);
  height: 300px;
  display: flex;
  flex-direction: column;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-2);
  margin-bottom: var(--spacing-4);
}

.message {
  display: flex;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-4);
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.message.user .message-avatar {
  background: var(--color-secondary);
}

.message-content {
  flex: 1;
  max-width: 70%;
}

.message.user .message-content {
  text-align: right;
}

.message-text {
  background: white;
  padding: var(--spacing-3);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--spacing-1);
  line-height: 1.5;
}

.message.user .message-text {
  background: var(--color-primary);
  color: white;
}

.message-time {
  font-size: var(--text-xs);
  color: var(--color-gray-500);
  padding: 0 var(--spacing-3);
}

.typing-indicator {
  display: flex;
  gap: var(--spacing-3);
  align-items: center;
}

.typing-dots {
  display: flex;
  gap: var(--spacing-1);
  padding: var(--spacing-3);
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.typing-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-gray-400);
  animation: typing 1.4s infinite;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
}

.chat-input {
  display: flex;
  gap: var(--spacing-2);
}

.message-input {
  flex: 1;
  padding: var(--spacing-3);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-lg);
  outline: none;
  transition: var(--transition-normal);
}

.message-input:focus {
  border-color: var(--color-primary);
}

.send-btn {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: var(--spacing-3);
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-size: 1rem;
  transition: var(--transition-normal);
  min-width: 50px;
}

.send-btn:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.send-btn:disabled {
  background: var(--color-gray-400);
  cursor: not-allowed;
}

.assistant-tabs {
  display: flex;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-6);
  border-bottom: 2px solid var(--color-gray-200);
}

.tab-button {
  background: none;
  border: none;
  padding: var(--spacing-3) var(--spacing-4);
  cursor: pointer;
  font-weight: 500;
  color: var(--color-gray-600);
  transition: var(--transition-normal);
  border-bottom: 2px solid transparent;
}

.tab-button:hover {
  color: var(--color-primary);
}

.tab-button.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-4);
}

.section-header h3 {
  margin: 0;
  color: var(--color-gray-800);
}

.suggestions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-4);
}

.suggestion-card {
  background: white;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
  transition: var(--transition-normal);
}

.suggestion-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.suggestion-preview {
  height: 120px;
  background: var(--color-gray-100);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-3);
  position: relative;
  overflow: hidden;
}

.preview-layout {
  position: relative;
  width: 100%;
  height: 100%;
}

.preview-item {
  position: absolute;
  background: var(--color-primary);
  color: white;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  opacity: 0.8;
}

.suggestion-name {
  font-weight: 600;
  color: var(--color-gray-800);
  margin-bottom: var(--spacing-1);
}

.suggestion-description {
  color: var(--color-gray-600);
  font-size: var(--text-sm);
  margin-bottom: var(--spacing-2);
}

.suggestion-benefits {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-1);
  margin-bottom: var(--spacing-3);
}

.benefit-tag {
  background: var(--color-info);
  color: white;
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 500;
}

.suggestion-actions {
  display: flex;
  gap: var(--spacing-2);
}

.analysis-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-6);
}

.summary-card {
  background: white;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.summary-icon {
  font-size: 2rem;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-primary);
}

.summary-label {
  color: var(--color-gray-600);
  font-size: var(--text-sm);
}

.recommendations h4 {
  margin-bottom: var(--spacing-3);
  color: var(--color-gray-800);
}

.recommendation-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.recommendation-item {
  background: white;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.recommendation-icon {
  font-size: 1.5rem;
}

.recommendation-content {
  flex: 1;
}

.recommendation-title {
  font-weight: 600;
  color: var(--color-gray-800);
  margin-bottom: var(--spacing-1);
}

.recommendation-description {
  color: var(--color-gray-600);
  font-size: var(--text-sm);
}

.recommendation-impact {
  text-align: right;
}

.impact-label {
  color: var(--color-gray-600);
  font-size: var(--text-sm);
}

.impact-value {
  color: var(--color-success);
  font-weight: 600;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-gray-300);
  transition: var(--transition-normal);
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: var(--transition-normal);
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--color-primary);
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.optimization-settings {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-6);
}

.setting-group h4 {
  margin-bottom: var(--spacing-3);
  color: var(--color-gray-800);
}

.setting-item {
  margin-bottom: var(--spacing-4);
}

.setting-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  cursor: pointer;
  font-weight: 500;
  color: var(--color-gray-700);
}

.setting-description {
  margin: var(--spacing-1) 0 0 var(--spacing-6);
  color: var(--color-gray-600);
  font-size: var(--text-sm);
}

.optimization-history h4 {
  margin-bottom: var(--spacing-3);
  color: var(--color-gray-800);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.history-item {
  background: white;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  padding: var(--spacing-3);
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.history-icon {
  font-size: 1.2rem;
}

.history-content {
  flex: 1;
}

.history-title {
  font-weight: 600;
  color: var(--color-gray-800);
  margin-bottom: var(--spacing-1);
}

.history-description {
  color: var(--color-gray-600);
  font-size: var(--text-sm);
  margin-bottom: var(--spacing-1);
}

.history-time {
  color: var(--color-gray-500);
  font-size: var(--text-xs);
}

.history-result {
  text-align: right;
}

.result-label {
  color: var(--color-gray-600);
  font-size: var(--text-sm);
}

.result-value {
  color: var(--color-success);
  font-weight: 600;
}

.learning-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-6);
}

.stat-card {
  background: white;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.stat-icon {
  font-size: 2rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-primary);
}

.stat-label {
  color: var(--color-gray-600);
  font-size: var(--text-sm);
}

.learning-insights h4 {
  margin-bottom: var(--spacing-3);
  color: var(--color-gray-800);
}

.insight-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.insight-item {
  background: white;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.insight-icon {
  font-size: 1.5rem;
}

.insight-content {
  flex: 1;
}

.insight-title {
  font-weight: 600;
  color: var(--color-gray-800);
  margin-bottom: var(--spacing-1);
}

.insight-description {
  color: var(--color-gray-600);
  font-size: var(--text-sm);
}

.insight-confidence {
  text-align: right;
}

.confidence-label {
  color: var(--color-gray-600);
  font-size: var(--text-sm);
}

.confidence-value {
  color: var(--color-info);
  font-weight: 600;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-weight: 500;
  transition: var(--transition-normal);
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-secondary {
  background: var(--color-gray-200);
  color: var(--color-gray-700);
  border: none;
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-weight: 500;
  transition: var(--transition-normal);
}

.btn-secondary:hover {
  background: var(--color-gray-300);
}

@media (max-width: 768px) {
  .optimization-settings {
    grid-template-columns: 1fr;
  }

  .analysis-summary,
  .learning-stats {
    grid-template-columns: 1fr;
  }

  .suggestions-grid {
    grid-template-columns: 1fr;
  }

  .assistant-tabs {
    overflow-x: auto;
    padding-bottom: var(--spacing-2);
  }

  .chat-interface {
    height: 250px;
  }
}
</style>
