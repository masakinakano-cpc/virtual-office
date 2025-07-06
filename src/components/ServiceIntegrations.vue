<template>
  <div class="service-integrations">
    <div class="integrations-header">
      <h2>🔗 外部サービス統合</h2>
      <button @click="refreshConnections" class="btn-primary">
        🔄 接続を更新
      </button>
    </div>

    <!-- 統合サービス一覧 -->
    <div class="services-grid">
      <div
        v-for="service in services"
        :key="service.id"
        :class="{ connected: service.connected }"
        class="service-card"
      >
        <div class="service-header">
          <div class="service-icon">{{ service.icon }}</div>
          <div class="service-info">
            <div class="service-name">{{ service.name }}</div>
            <div class="service-description">{{ service.description }}</div>
          </div>
          <div class="service-status">
            <span :class="{ connected: service.connected }" class="status-dot"></span>
            <span class="status-text">{{ service.connected ? '接続済み' : '未接続' }}</span>
          </div>
        </div>

        <div class="service-features">
          <div class="features-title">利用可能な機能:</div>
          <div class="features-list">
            <span
              v-for="feature in service.features"
              :key="feature"
              class="feature-tag"
            >
              {{ feature }}
            </span>
          </div>
        </div>

        <div class="service-actions">
          <button
            v-if="!service.connected"
            @click="connectService(service)"
            class="btn-primary"
          >
            接続
          </button>
          <div v-else class="connected-actions">
            <button @click="configureService(service)" class="btn-secondary">
              設定
            </button>
            <button @click="disconnectService(service)" class="btn-danger">
              切断
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 接続済みサービスのダッシュボード -->
    <div v-if="connectedServices.length > 0" class="connected-dashboard">
      <h3>📊 接続済みサービス</h3>

      <div class="dashboard-tabs">
        <button
          v-for="service in connectedServices"
          :key="service.id"
          @click="activeService = service.id"
          :class="{ active: activeService === service.id }"
          class="tab-button"
        >
          {{ service.icon }} {{ service.name }}
        </button>
      </div>

      <!-- Slack統合 -->
      <div v-if="activeService === 'slack'" class="service-dashboard">
        <div class="dashboard-header">
          <h4>💬 Slack統合</h4>
          <div class="sync-status">
            <span class="sync-indicator"></span>
            <span>リアルタイム同期中</span>
          </div>
        </div>

        <div class="dashboard-content">
          <div class="recent-messages">
            <h5>最近のメッセージ</h5>
            <div class="message-list">
              <div
                v-for="message in slackMessages"
                :key="message.id"
                class="message-item"
              >
                <div class="message-avatar">{{ message.user.avatar }}</div>
                <div class="message-content">
                  <div class="message-header">
                    <span class="message-user">{{ message.user.name }}</span>
                    <span class="message-channel">#{{ message.channel }}</span>
                    <span class="message-time">{{ formatTime(message.timestamp) }}</span>
                  </div>
                  <div class="message-text">{{ message.text }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="slack-actions">
            <button @click="sendSlackMessage" class="btn-primary">
              メッセージを送信
            </button>
            <button @click="createSlackChannel" class="btn-secondary">
              チャンネル作成
            </button>
          </div>
        </div>
      </div>

      <!-- Teams統合 -->
      <div v-if="activeService === 'teams'" class="service-dashboard">
        <div class="dashboard-header">
          <h4>👥 Microsoft Teams統合</h4>
          <div class="sync-status">
            <span class="sync-indicator"></span>
            <span>会議情報同期中</span>
          </div>
        </div>

        <div class="dashboard-content">
          <div class="upcoming-meetings">
            <h5>今後の会議</h5>
            <div class="meeting-list">
              <div
                v-for="meeting in teamsMeetings"
                :key="meeting.id"
                class="meeting-item"
              >
                <div class="meeting-time">{{ formatMeetingTime(meeting.startTime) }}</div>
                <div class="meeting-info">
                  <div class="meeting-title">{{ meeting.title }}</div>
                  <div class="meeting-participants">
                    参加者: {{ meeting.participants.length }}名
                  </div>
                </div>
                <div class="meeting-actions">
                  <button @click="joinMeeting(meeting)" class="btn-primary">
                    参加
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Google Workspace統合 -->
      <div v-if="activeService === 'google'" class="service-dashboard">
        <div class="dashboard-header">
          <h4>📧 Google Workspace統合</h4>
          <div class="sync-status">
            <span class="sync-indicator"></span>
            <span>カレンダー同期中</span>
          </div>
        </div>

        <div class="dashboard-content">
          <div class="google-services">
            <div class="service-section">
              <h5>📅 Google Calendar</h5>
              <div class="calendar-events">
                <div
                  v-for="event in googleEvents"
                  :key="event.id"
                  class="event-item"
                >
                  <div class="event-time">{{ formatEventTime(event.start) }}</div>
                  <div class="event-title">{{ event.summary }}</div>
                  <div class="event-location">{{ event.location }}</div>
                </div>
              </div>
            </div>

            <div class="service-section">
              <h5>📁 Google Drive</h5>
              <div class="drive-files">
                <div
                  v-for="file in googleFiles"
                  :key="file.id"
                  class="file-item"
                >
                  <div class="file-icon">{{ getFileIcon(file.type) }}</div>
                  <div class="file-info">
                    <div class="file-name">{{ file.name }}</div>
                    <div class="file-modified">{{ formatTime(file.modifiedTime) }}</div>
                  </div>
                  <div class="file-actions">
                    <button @click="openFile(file)" class="btn-secondary">
                      開く
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Zoom統合 -->
      <div v-if="activeService === 'zoom'" class="service-dashboard">
        <div class="dashboard-header">
          <h4>📹 Zoom統合</h4>
          <div class="sync-status">
            <span class="sync-indicator"></span>
            <span>会議室準備完了</span>
          </div>
        </div>

        <div class="dashboard-content">
          <div class="zoom-controls">
            <div class="meeting-controls">
              <button @click="startInstantMeeting" class="btn-primary">
                🎥 即席会議を開始
              </button>
              <button @click="scheduleMeeting" class="btn-secondary">
                📅 会議をスケジュール
              </button>
            </div>

            <div class="personal-room">
              <h5>個人会議室</h5>
              <div class="room-info">
                <div class="room-id">会議ID: {{ personalRoomId }}</div>
                <div class="room-url">{{ personalRoomUrl }}</div>
              </div>
              <button @click="copyRoomUrl" class="btn-secondary">
                URLをコピー
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 設定モーダル -->
    <div v-if="showConfigModal" class="config-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>⚙️ {{ currentService?.name }} 設定</h3>
          <button @click="showConfigModal = false" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <div v-if="currentService" class="config-form">
            <div class="form-group">
              <label>通知設定</label>
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input v-model="serviceConfig.notifications" type="checkbox" />
                  通知を受け取る
                </label>
                <label class="checkbox-label">
                  <input v-model="serviceConfig.realTimeSync" type="checkbox" />
                  リアルタイム同期
                </label>
              </div>
            </div>

            <div class="form-group">
              <label>同期頻度</label>
              <select v-model="serviceConfig.syncFrequency" class="form-select">
                <option value="realtime">リアルタイム</option>
                <option value="5min">5分ごと</option>
                <option value="15min">15分ごと</option>
                <option value="1hour">1時間ごと</option>
              </select>
            </div>

            <div class="form-group">
              <label>データ取得範囲</label>
              <select v-model="serviceConfig.dataRange" class="form-select">
                <option value="1day">過去1日</option>
                <option value="1week">過去1週間</option>
                <option value="1month">過去1ヶ月</option>
                <option value="all">すべて</option>
              </select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showConfigModal = false" class="btn-secondary">
            キャンセル
          </button>
          <button @click="saveConfig" class="btn-primary">
            保存
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface Service {
  id: string
  name: string
  description: string
  icon: string
  connected: boolean
  features: string[]
  apiKey?: string
  lastSync?: Date
}

interface SlackMessage {
  id: string
  text: string
  user: {
    name: string
    avatar: string
  }
  channel: string
  timestamp: Date
}

interface TeamsMeeting {
  id: string
  title: string
  startTime: Date
  participants: string[]
  joinUrl: string
}

interface GoogleEvent {
  id: string
  summary: string
  start: Date
  location: string
}

interface GoogleFile {
  id: string
  name: string
  type: string
  modifiedTime: Date
  webViewLink: string
}

const activeService = ref('slack')
const showConfigModal = ref(false)
const currentService = ref<Service | null>(null)
const personalRoomId = ref('123-456-789')
const personalRoomUrl = ref('https://zoom.us/j/123456789')

const serviceConfig = ref({
  notifications: true,
  realTimeSync: true,
  syncFrequency: 'realtime',
  dataRange: '1week'
})

const services = ref<Service[]>([
  {
    id: 'slack',
    name: 'Slack',
    description: 'チームコミュニケーション',
    icon: '💬',
    connected: true,
    features: ['メッセージ同期', 'チャンネル作成', 'ファイル共有', '通知連携']
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    description: '会議とコラボレーション',
    icon: '👥',
    connected: true,
    features: ['会議参加', 'チャット', 'ファイル共有', 'カレンダー連携']
  },
  {
    id: 'google',
    name: 'Google Workspace',
    description: 'Googleサービス統合',
    icon: '📧',
    connected: true,
    features: ['Gmail', 'Calendar', 'Drive', 'Docs']
  },
  {
    id: 'zoom',
    name: 'Zoom',
    description: 'ビデオ会議',
    icon: '📹',
    connected: true,
    features: ['会議開始', '会議参加', '録画', '画面共有']
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'コード管理',
    icon: '🐙',
    connected: false,
    features: ['リポジトリ', 'プルリクエスト', 'イシュー', 'アクション']
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'ドキュメント管理',
    icon: '📝',
    connected: false,
    features: ['ページ作成', 'データベース', 'テンプレート', 'コメント']
  },
  {
    id: 'figma',
    name: 'Figma',
    description: 'デザインツール',
    icon: '🎨',
    connected: false,
    features: ['デザイン共有', 'コメント', 'バージョン管理', 'プロトタイプ']
  },
  {
    id: 'jira',
    name: 'Jira',
    description: 'プロジェクト管理',
    icon: '📋',
    connected: false,
    features: ['チケット管理', 'スプリント', 'レポート', 'ワークフロー']
  }
])

const slackMessages = ref<SlackMessage[]>([
  {
    id: '1',
    text: 'おはようございます！今日のタスクを確認しましょう。',
    user: { name: '田中さん', avatar: '👨‍💼' },
    channel: 'general',
    timestamp: new Date(Date.now() - 30 * 60 * 1000)
  },
  {
    id: '2',
    text: '新しいプロジェクトの資料を共有します。',
    user: { name: '佐藤さん', avatar: '👩‍💻' },
    channel: 'project',
    timestamp: new Date(Date.now() - 15 * 60 * 1000)
  },
  {
    id: '3',
    text: 'ランチの時間ですね！',
    user: { name: '山田さん', avatar: '😊' },
    channel: 'random',
    timestamp: new Date(Date.now() - 5 * 60 * 1000)
  }
])

const teamsMeetings = ref<TeamsMeeting[]>([
  {
    id: '1',
    title: '週次ミーティング',
    startTime: new Date(Date.now() + 30 * 60 * 1000),
    participants: ['田中さん', '佐藤さん', '山田さん'],
    joinUrl: 'https://teams.microsoft.com/l/meetup-join/...'
  },
  {
    id: '2',
    title: 'プロジェクトレビュー',
    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
    participants: ['佐藤さん', '鈴木さん'],
    joinUrl: 'https://teams.microsoft.com/l/meetup-join/...'
  }
])

const googleEvents = ref<GoogleEvent[]>([
  {
    id: '1',
    summary: 'クライアントミーティング',
    start: new Date(Date.now() + 60 * 60 * 1000),
    location: '会議室A'
  },
  {
    id: '2',
    summary: 'デザインレビュー',
    start: new Date(Date.now() + 3 * 60 * 60 * 1000),
    location: 'オンライン'
  }
])

const googleFiles = ref<GoogleFile[]>([
  {
    id: '1',
    name: 'プロジェクト企画書.docx',
    type: 'document',
    modifiedTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
    webViewLink: 'https://docs.google.com/document/d/...'
  },
  {
    id: '2',
    name: 'デザインガイドライン.pdf',
    type: 'pdf',
    modifiedTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
    webViewLink: 'https://drive.google.com/file/d/...'
  }
])

const connectedServices = computed(() => {
  return services.value.filter(service => service.connected)
})

const connectService = async (service: Service) => {
  console.log(`${service.name}に接続中...`)

  // OAuth認証のシミュレーション
  try {
    // 実際の実装では、OAuth認証フローを実行
    await simulateOAuthFlow(service)

    service.connected = true
    service.lastSync = new Date()

    console.log(`${service.name}に接続しました`)

    // 初期データの同期
    await syncServiceData(service)

  } catch (error) {
    console.error(`${service.name}の接続に失敗しました:`, error)
  }
}

const disconnectService = (service: Service) => {
  service.connected = false
  service.lastSync = undefined
  console.log(`${service.name}から切断しました`)
}

const configureService = (service: Service) => {
  currentService.value = service
  showConfigModal.value = true
}

const saveConfig = () => {
  if (currentService.value) {
    console.log(`${currentService.value.name}の設定を保存しました`)
    // 設定をローカルストレージに保存
    localStorage.setItem(
      `service_config_${currentService.value.id}`,
      JSON.stringify(serviceConfig.value)
    )
  }
  showConfigModal.value = false
}

const refreshConnections = async () => {
  console.log('接続を更新中...')

  for (const service of connectedServices.value) {
    await syncServiceData(service)
  }

  console.log('接続を更新しました')
}

const simulateOAuthFlow = async (service: Service) => {
  // OAuth認証のシミュレーション
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`${service.name}のOAuth認証が完了しました`)
      resolve(true)
    }, 1000)
  })
}

const syncServiceData = async (service: Service) => {
  console.log(`${service.name}のデータを同期中...`)

  // サービスごとのデータ同期
  switch (service.id) {
    case 'slack':
      // Slackメッセージの同期
      break
    case 'teams':
      // Teams会議の同期
      break
    case 'google':
      // Googleサービスの同期
      break
    case 'zoom':
      // Zoom会議の同期
      break
  }

  service.lastSync = new Date()
}

// Slack関連
const sendSlackMessage = () => {
  console.log('Slackメッセージを送信')
  // メッセージ送信ダイアログを表示
}

const createSlackChannel = () => {
  console.log('Slackチャンネルを作成')
  // チャンネル作成ダイアログを表示
}

// Teams関連
const joinMeeting = (meeting: TeamsMeeting) => {
  console.log(`会議「${meeting.title}」に参加`)
  window.open(meeting.joinUrl, '_blank')
}

// Google関連
const openFile = (file: GoogleFile) => {
  console.log(`ファイル「${file.name}」を開く`)
  window.open(file.webViewLink, '_blank')
}

const getFileIcon = (type: string) => {
  switch (type) {
    case 'document':
      return '📄'
    case 'spreadsheet':
      return '📊'
    case 'presentation':
      return '📽️'
    case 'pdf':
      return '📕'
    case 'image':
      return '🖼️'
    default:
      return '📁'
  }
}

// Zoom関連
const startInstantMeeting = () => {
  console.log('即席会議を開始')
  // Zoom会議を開始
}

const scheduleMeeting = () => {
  console.log('会議をスケジュール')
  // 会議スケジュールダイアログを表示
}

const copyRoomUrl = () => {
  navigator.clipboard.writeText(personalRoomUrl.value)
  console.log('会議室URLをコピーしました')
}

// 時間フォーマット
const formatTime = (date: Date) => {
  return date.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatMeetingTime = (date: Date) => {
  return date.toLocaleString('ja-JP', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatEventTime = (date: Date) => {
  return date.toLocaleString('ja-JP', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  console.log('外部サービス統合が初期化されました')

  // 保存された設定を読み込み
  connectedServices.value.forEach(service => {
    const savedConfig = localStorage.getItem(`service_config_${service.id}`)
    if (savedConfig) {
      Object.assign(serviceConfig.value, JSON.parse(savedConfig))
    }
  })
})

// エクスポート
defineExpose({
  connectService,
  disconnectService,
  refreshConnections,
  sendSlackMessage,
  joinMeeting,
  startInstantMeeting
})
</script>

<style scoped>
.service-integrations {
  padding: var(--spacing-6);
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
}

.integrations-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-6);
}

.integrations-header h2 {
  color: var(--color-primary);
  margin: 0;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-8);
}

.service-card {
  background: white;
  border: 2px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
  transition: var(--transition-normal);
}

.service-card.connected {
  border-color: var(--color-success);
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.05) 0%, rgba(139, 195, 74, 0.05) 100%);
}

.service-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.service-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-3);
}

.service-icon {
  font-size: 2rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-gray-100);
  border-radius: var(--radius-lg);
}

.service-info {
  flex: 1;
}

.service-name {
  font-weight: 600;
  color: var(--color-gray-800);
  margin-bottom: var(--spacing-1);
}

.service-description {
  color: var(--color-gray-600);
  font-size: var(--text-sm);
}

.service-status {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-error);
}

.status-dot.connected {
  background: var(--color-success);
}

.status-text {
  font-size: var(--text-sm);
  color: var(--color-gray-600);
}

.service-features {
  margin-bottom: var(--spacing-4);
}

.features-title {
  font-size: var(--text-sm);
  color: var(--color-gray-700);
  margin-bottom: var(--spacing-2);
}

.features-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-1);
}

.feature-tag {
  background: var(--color-info);
  color: white;
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 500;
}

.service-actions {
  display: flex;
  gap: var(--spacing-2);
}

.connected-actions {
  display: flex;
  gap: var(--spacing-2);
}

.connected-dashboard {
  border-top: 2px solid var(--color-gray-200);
  padding-top: var(--spacing-6);
}

.connected-dashboard h3 {
  margin-bottom: var(--spacing-4);
  color: var(--color-gray-800);
}

.dashboard-tabs {
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

.service-dashboard {
  background: var(--color-gray-50);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-4);
}

.dashboard-header h4 {
  margin: 0;
  color: var(--color-gray-800);
}

.sync-status {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  color: var(--color-gray-600);
  font-size: var(--text-sm);
}

.sync-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-success);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.dashboard-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-4);
}

.message-list,
.meeting-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.message-item,
.meeting-item {
  background: white;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  padding: var(--spacing-3);
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.message-avatar {
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-gray-100);
  border-radius: 50%;
}

.message-content {
  flex: 1;
}

.message-header {
  display: flex;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-1);
  font-size: var(--text-sm);
}

.message-user {
  font-weight: 600;
  color: var(--color-gray-800);
}

.message-channel {
  color: var(--color-info);
}

.message-time {
  color: var(--color-gray-500);
}

.message-text {
  color: var(--color-gray-700);
}

.meeting-time {
  font-weight: 600;
  color: var(--color-primary);
  min-width: 120px;
}

.meeting-info {
  flex: 1;
}

.meeting-title {
  font-weight: 600;
  color: var(--color-gray-800);
  margin-bottom: var(--spacing-1);
}

.meeting-participants {
  color: var(--color-gray-600);
  font-size: var(--text-sm);
}

.google-services {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-4);
}

.service-section h5 {
  margin-bottom: var(--spacing-3);
  color: var(--color-gray-800);
}

.event-item,
.file-item {
  background: white;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  padding: var(--spacing-3);
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-2);
}

.event-time {
  font-weight: 600;
  color: var(--color-primary);
  min-width: 100px;
}

.event-title {
  font-weight: 600;
  color: var(--color-gray-800);
}

.event-location {
  color: var(--color-gray-600);
  font-size: var(--text-sm);
}

.file-icon {
  font-size: 1.5rem;
}

.file-info {
  flex: 1;
}

.file-name {
  font-weight: 600;
  color: var(--color-gray-800);
  margin-bottom: var(--spacing-1);
}

.file-modified {
  color: var(--color-gray-600);
  font-size: var(--text-sm);
}

.zoom-controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-4);
}

.meeting-controls {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.personal-room {
  background: white;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
}

.personal-room h5 {
  margin-bottom: var(--spacing-3);
  color: var(--color-gray-800);
}

.room-info {
  margin-bottom: var(--spacing-3);
}

.room-id {
  font-weight: 600;
  color: var(--color-gray-800);
  margin-bottom: var(--spacing-1);
}

.room-url {
  color: var(--color-gray-600);
  font-size: var(--text-sm);
  word-break: break-all;
}

.config-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-4);
}

.modal-content {
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-6);
  border-bottom: 1px solid var(--color-gray-200);
}

.modal-header h3 {
  margin: 0;
  color: var(--color-gray-800);
}

.modal-body {
  padding: var(--spacing-6);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
  padding: var(--spacing-4) var(--spacing-6);
  border-top: 1px solid var(--color-gray-200);
}

.form-group {
  margin-bottom: var(--spacing-4);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-2);
  font-weight: 600;
  color: var(--color-gray-700);
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: var(--spacing-2);
  cursor: pointer;
  font-weight: normal !important;
}

.form-select {
  width: 100%;
  padding: var(--spacing-3);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-lg);
  outline: none;
  transition: var(--transition-normal);
}

.form-select:focus {
  border-color: var(--color-primary);
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

.btn-danger {
  background: var(--color-error);
  color: white;
  border: none;
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-weight: 500;
  transition: var(--transition-normal);
}

.btn-danger:hover {
  background: var(--color-error-dark);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: var(--color-gray-500);
  padding: var(--spacing-1);
}

@media (max-width: 768px) {
  .services-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-tabs {
    overflow-x: auto;
    padding-bottom: var(--spacing-2);
  }

  .google-services,
  .zoom-controls {
    grid-template-columns: 1fr;
  }

  .service-header {
    flex-direction: column;
    text-align: center;
  }

  .service-actions,
  .connected-actions {
    width: 100%;
    justify-content: center;
  }
}
</style>
