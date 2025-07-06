<template>
  <div class="analytics-dashboard">
    <div class="dashboard-header">
      <h2>📊 分析ダッシュボード</h2>
      <div class="header-controls">
        <select v-model="selectedPeriod" class="period-select">
          <option value="today">今日</option>
          <option value="week">今週</option>
          <option value="month">今月</option>
          <option value="quarter">四半期</option>
          <option value="year">年間</option>
        </select>
        <button @click="generateReport" class="btn-primary">📋 レポート生成</button>
        <button @click="exportData" class="btn-secondary">📤 データ出力</button>
      </div>
    </div>

    <!-- KPI概要 -->
    <div class="kpi-overview">
      <div class="kpi-card">
        <div class="kpi-icon">👥</div>
        <div class="kpi-content">
          <div class="kpi-value">{{ totalUsers }}</div>
          <div class="kpi-label">総利用者数</div>
          <div class="kpi-change positive">+{{ userGrowth }}%</div>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon">⏱️</div>
        <div class="kpi-content">
          <div class="kpi-value">{{ formatTime(totalActiveTime) }}</div>
          <div class="kpi-label">総活動時間</div>
          <div class="kpi-change positive">+{{ timeGrowth }}%</div>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon">💬</div>
        <div class="kpi-content">
          <div class="kpi-value">{{ totalMessages }}</div>
          <div class="kpi-label">メッセージ数</div>
          <div class="kpi-change positive">+{{ messageGrowth }}%</div>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon">🎯</div>
        <div class="kpi-content">
          <div class="kpi-value">{{ productivityScore }}%</div>
          <div class="kpi-label">生産性スコア</div>
          <div class="kpi-change positive">+{{ productivityGrowth }}%</div>
        </div>
      </div>
    </div>

    <!-- チャート表示 -->
    <div class="charts-section">
      <div class="chart-container">
        <h3>📈 利用者推移</h3>
        <div class="chart-placeholder">
          <canvas ref="userChart" width="400" height="200"></canvas>
        </div>
      </div>

      <div class="chart-container">
        <h3>⏰ 活動時間分析</h3>
        <div class="chart-placeholder">
          <canvas ref="activityChart" width="400" height="200"></canvas>
        </div>
      </div>
    </div>

    <!-- 詳細統計 -->
    <div class="detailed-stats">
      <div class="stats-section">
        <h3>👥 利用者統計</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-label">アクティブユーザー</div>
            <div class="stat-value">{{ activeUsers }}</div>
            <div class="stat-trend">{{ activeUserTrend }}%</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">新規ユーザー</div>
            <div class="stat-value">{{ newUsers }}</div>
            <div class="stat-trend">{{ newUserTrend }}%</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">リピートユーザー</div>
            <div class="stat-value">{{ repeatUsers }}</div>
            <div class="stat-trend">{{ repeatUserTrend }}%</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">平均セッション時間</div>
            <div class="stat-value">{{ formatTime(avgSessionTime) }}</div>
            <div class="stat-trend">{{ sessionTimeTrend }}%</div>
          </div>
        </div>
      </div>

      <div class="stats-section">
        <h3>🏢 オフィス利用状況</h3>
        <div class="office-stats">
          <div class="office-item">
            <div class="office-name">メインオフィス</div>
            <div class="office-usage">
              <div class="usage-bar">
                <div class="usage-fill" :style="{ width: '85%' }"></div>
              </div>
              <span class="usage-percentage">85%</span>
            </div>
          </div>
          <div class="office-item">
            <div class="office-name">会議室A</div>
            <div class="office-usage">
              <div class="usage-bar">
                <div class="usage-fill" :style="{ width: '72%' }"></div>
              </div>
              <span class="usage-percentage">72%</span>
            </div>
          </div>
          <div class="office-item">
            <div class="office-name">クリエイティブスペース</div>
            <div class="office-usage">
              <div class="usage-bar">
                <div class="usage-fill" :style="{ width: '58%' }"></div>
              </div>
              <span class="usage-percentage">58%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 機能別使用状況 -->
    <div class="feature-usage">
      <h3>🔧 機能別使用状況</h3>
      <div class="feature-grid">
        <div class="feature-card">
          <div class="feature-icon">💬</div>
          <div class="feature-name">チャット</div>
          <div class="feature-usage-count">{{ chatUsage }}回</div>
          <div class="feature-users">{{ chatUsers }}人が利用</div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">📹</div>
          <div class="feature-name">ビデオ会議</div>
          <div class="feature-usage-count">{{ videoUsage }}回</div>
          <div class="feature-users">{{ videoUsers }}人が利用</div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🎨</div>
          <div class="feature-name">カスタマイズ</div>
          <div class="feature-usage-count">{{ customizeUsage }}回</div>
          <div class="feature-users">{{ customizeUsers }}人が利用</div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🎮</div>
          <div class="feature-name">ゲーミフィケーション</div>
          <div class="feature-usage-count">{{ gameUsage }}回</div>
          <div class="feature-users">{{ gameUsers }}人が利用</div>
        </div>
      </div>
    </div>

    <!-- パフォーマンス指標 -->
    <div class="performance-metrics">
      <h3>⚡ パフォーマンス指標</h3>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-header">
            <div class="metric-title">応答時間</div>
            <div class="metric-status good">良好</div>
          </div>
          <div class="metric-value">{{ responseTime }}ms</div>
          <div class="metric-description">平均API応答時間</div>
        </div>
        <div class="metric-card">
          <div class="metric-header">
            <div class="metric-title">稼働率</div>
            <div class="metric-status excellent">優秀</div>
          </div>
          <div class="metric-value">{{ uptime }}%</div>
          <div class="metric-description">システム稼働率</div>
        </div>
        <div class="metric-card">
          <div class="metric-header">
            <div class="metric-title">エラー率</div>
            <div class="metric-status good">良好</div>
          </div>
          <div class="metric-value">{{ errorRate }}%</div>
          <div class="metric-description">エラー発生率</div>
        </div>
        <div class="metric-card">
          <div class="metric-header">
            <div class="metric-title">満足度</div>
            <div class="metric-status excellent">優秀</div>
          </div>
          <div class="metric-value">{{ satisfaction }}/5</div>
          <div class="metric-description">ユーザー満足度</div>
        </div>
      </div>
    </div>

    <!-- レポート生成モーダル -->
    <div v-if="showReportModal" class="report-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>📋 レポート生成</h3>
          <button @click="showReportModal = false" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <div class="report-options">
            <div class="option-group">
              <label>レポートタイプ</label>
              <div class="radio-group">
                <label class="radio-label">
                  <input v-model="reportType" value="summary" type="radio" />
                  概要レポート
                </label>
                <label class="radio-label">
                  <input v-model="reportType" value="detailed" type="radio" />
                  詳細レポート
                </label>
                <label class="radio-label">
                  <input v-model="reportType" value="custom" type="radio" />
                  カスタムレポート
                </label>
              </div>
            </div>

            <div class="option-group">
              <label>出力形式</label>
              <select v-model="reportFormat" class="form-select">
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
              </select>
            </div>

            <div class="option-group">
              <label>含める項目</label>
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input v-model="reportItems.users" type="checkbox" />
                  利用者統計
                </label>
                <label class="checkbox-label">
                  <input v-model="reportItems.activity" type="checkbox" />
                  活動データ
                </label>
                <label class="checkbox-label">
                  <input v-model="reportItems.performance" type="checkbox" />
                  パフォーマンス
                </label>
                <label class="checkbox-label">
                  <input v-model="reportItems.features" type="checkbox" />
                  機能使用状況
                </label>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showReportModal = false" class="btn-secondary">
            キャンセル
          </button>
          <button @click="downloadReport" class="btn-primary">
            レポートをダウンロード
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'

const selectedPeriod = ref('week')
const showReportModal = ref(false)
const reportType = ref('summary')
const reportFormat = ref('pdf')
const userChart = ref<HTMLCanvasElement>()
const activityChart = ref<HTMLCanvasElement>()

// KPI データ
const totalUsers = ref(1247)
const userGrowth = ref(12.5)
const totalActiveTime = ref(89640) // 秒
const timeGrowth = ref(8.3)
const totalMessages = ref(5632)
const messageGrowth = ref(15.2)
const productivityScore = ref(87)
const productivityGrowth = ref(4.7)

// 詳細統計データ
const activeUsers = ref(892)
const activeUserTrend = ref(9.2)
const newUsers = ref(156)
const newUserTrend = ref(23.1)
const repeatUsers = ref(736)
const repeatUserTrend = ref(6.8)
const avgSessionTime = ref(3420) // 秒
const sessionTimeTrend = ref(11.5)

// 機能使用状況
const chatUsage = ref(2847)
const chatUsers = ref(523)
const videoUsage = ref(1234)
const videoUsers = ref(387)
const customizeUsage = ref(892)
const customizeUsers = ref(234)
const gameUsage = ref(1567)
const gameUsers = ref(445)

// パフォーマンス指標
const responseTime = ref(145)
const uptime = ref(99.8)
const errorRate = ref(0.2)
const satisfaction = ref(4.6)

const reportItems = ref({
  users: true,
  activity: true,
  performance: true,
  features: true
})

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}

const generateReport = () => {
  showReportModal.value = true
}

const downloadReport = () => {
  console.log('レポートを生成中...')

  const reportData = {
    type: reportType.value,
    format: reportFormat.value,
    period: selectedPeriod.value,
    items: reportItems.value,
    data: {
      kpi: {
        totalUsers: totalUsers.value,
        totalActiveTime: totalActiveTime.value,
        totalMessages: totalMessages.value,
        productivityScore: productivityScore.value
      },
      users: {
        active: activeUsers.value,
        new: newUsers.value,
        repeat: repeatUsers.value,
        avgSessionTime: avgSessionTime.value
      },
      performance: {
        responseTime: responseTime.value,
        uptime: uptime.value,
        errorRate: errorRate.value,
        satisfaction: satisfaction.value
      },
      features: {
        chat: { usage: chatUsage.value, users: chatUsers.value },
        video: { usage: videoUsage.value, users: videoUsers.value },
        customize: { usage: customizeUsage.value, users: customizeUsers.value },
        game: { usage: gameUsage.value, users: gameUsers.value }
      }
    },
    generatedAt: new Date().toISOString()
  }

  const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `analytics-report-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)

  showReportModal.value = false
  console.log('レポートをダウンロードしました')
}

const exportData = () => {
  console.log('データを出力中...')

  const csvData = [
    ['指標', '値', '前期比'],
    ['総利用者数', totalUsers.value, `+${userGrowth.value}%`],
    ['総活動時間', formatTime(totalActiveTime.value), `+${timeGrowth.value}%`],
    ['メッセージ数', totalMessages.value, `+${messageGrowth.value}%`],
    ['生産性スコア', `${productivityScore.value}%`, `+${productivityGrowth.value}%`],
    ['アクティブユーザー', activeUsers.value, `+${activeUserTrend.value}%`],
    ['新規ユーザー', newUsers.value, `+${newUserTrend.value}%`],
    ['リピートユーザー', repeatUsers.value, `+${repeatUserTrend.value}%`],
    ['平均セッション時間', formatTime(avgSessionTime.value), `+${sessionTimeTrend.value}%`]
  ]

  const csvContent = csvData.map(row => row.join(',')).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `analytics-data-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)

  console.log('データを出力しました')
}

const drawUserChart = () => {
  if (!userChart.value) return

  const ctx = userChart.value.getContext('2d')
  if (!ctx) return

  // 簡単なチャート描画
  const data = [850, 920, 1050, 1180, 1247]
  const labels = ['月', '火', '水', '木', '金']

  const width = userChart.value.width
  const height = userChart.value.height
  const padding = 40

  ctx.clearRect(0, 0, width, height)

  // 背景
  ctx.fillStyle = '#f8f9fa'
  ctx.fillRect(0, 0, width, height)

  // グリッド
  ctx.strokeStyle = '#e9ecef'
  ctx.lineWidth = 1

  for (let i = 0; i <= 5; i++) {
    const y = padding + (height - 2 * padding) * i / 5
    ctx.beginPath()
    ctx.moveTo(padding, y)
    ctx.lineTo(width - padding, y)
    ctx.stroke()
  }

  // データライン
  ctx.strokeStyle = '#ff6b6b'
  ctx.lineWidth = 3
  ctx.beginPath()

  for (let i = 0; i < data.length; i++) {
    const x = padding + (width - 2 * padding) * i / (data.length - 1)
    const y = height - padding - (height - 2 * padding) * (data[i] - 800) / 500

    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  }

  ctx.stroke()

  // データポイント
  ctx.fillStyle = '#ff6b6b'
  for (let i = 0; i < data.length; i++) {
    const x = padding + (width - 2 * padding) * i / (data.length - 1)
    const y = height - padding - (height - 2 * padding) * (data[i] - 800) / 500

    ctx.beginPath()
    ctx.arc(x, y, 4, 0, 2 * Math.PI)
    ctx.fill()
  }

  // ラベル
  ctx.fillStyle = '#6c757d'
  ctx.font = '12px Arial'
  ctx.textAlign = 'center'

  for (let i = 0; i < labels.length; i++) {
    const x = padding + (width - 2 * padding) * i / (labels.length - 1)
    ctx.fillText(labels[i], x, height - 10)
  }
}

const drawActivityChart = () => {
  if (!activityChart.value) return

  const ctx = activityChart.value.getContext('2d')
  if (!ctx) return

  // 時間別活動データ
  const data = [20, 35, 45, 65, 80, 95, 85, 70, 60, 45, 30, 25]
  const labels = ['6', '8', '10', '12', '14', '16', '18', '20', '22', '0', '2', '4']

  const width = activityChart.value.width
  const height = activityChart.value.height
  const padding = 40

  ctx.clearRect(0, 0, width, height)

  // 背景
  ctx.fillStyle = '#f8f9fa'
  ctx.fillRect(0, 0, width, height)

  // バーチャート
  const barWidth = (width - 2 * padding) / data.length * 0.8
  const barSpacing = (width - 2 * padding) / data.length * 0.2

  for (let i = 0; i < data.length; i++) {
    const x = padding + i * (barWidth + barSpacing)
    const barHeight = (height - 2 * padding) * data[i] / 100
    const y = height - padding - barHeight

    ctx.fillStyle = '#4ecdc4'
    ctx.fillRect(x, y, barWidth, barHeight)
  }

  // ラベル
  ctx.fillStyle = '#6c757d'
  ctx.font = '12px Arial'
  ctx.textAlign = 'center'

  for (let i = 0; i < labels.length; i++) {
    const x = padding + i * (barWidth + barSpacing) + barWidth / 2
    ctx.fillText(labels[i], x, height - 10)
  }
}

onMounted(() => {
  console.log('分析ダッシュボードが初期化されました')

  nextTick(() => {
    drawUserChart()
    drawActivityChart()
  })
})

// エクスポート
defineExpose({
  generateReport,
  exportData,
  drawUserChart,
  drawActivityChart
})
</script>

<style scoped>
.analytics-dashboard {
  padding: var(--spacing-6);
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-6);
}

.dashboard-header h2 {
  color: var(--color-primary);
  margin: 0;
}

.header-controls {
  display: flex;
  gap: var(--spacing-3);
  align-items: center;
}

.period-select {
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-lg);
  outline: none;
  transition: var(--transition-normal);
}

.period-select:focus {
  border-color: var(--color-primary);
}

.kpi-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-8);
}

.kpi-card {
  background: white;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  transition: var(--transition-normal);
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.kpi-icon {
  font-size: 2.5rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-gray-100);
  border-radius: var(--radius-lg);
}

.kpi-content {
  flex: 1;
}

.kpi-value {
  font-size: 1.8rem;
  font-weight: 600;
  color: var(--color-gray-800);
  margin-bottom: var(--spacing-1);
}

.kpi-label {
  color: var(--color-gray-600);
  font-size: var(--text-sm);
  margin-bottom: var(--spacing-1);
}

.kpi-change {
  font-size: var(--text-sm);
  font-weight: 600;
}

.kpi-change.positive {
  color: var(--color-success);
}

.kpi-change.negative {
  color: var(--color-error);
}

.charts-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-6);
  margin-bottom: var(--spacing-8);
}

.chart-container {
  background: white;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
}

.chart-container h3 {
  margin-bottom: var(--spacing-4);
  color: var(--color-gray-800);
}

.chart-placeholder {
  width: 100%;
  height: 200px;
  background: var(--color-gray-50);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.detailed-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-6);
  margin-bottom: var(--spacing-8);
}

.stats-section {
  background: white;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
}

.stats-section h3 {
  margin-bottom: var(--spacing-4);
  color: var(--color-gray-800);
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-3);
}

.stat-item {
  background: var(--color-gray-50);
  padding: var(--spacing-3);
  border-radius: var(--radius-md);
}

.stat-label {
  color: var(--color-gray-600);
  font-size: var(--text-sm);
  margin-bottom: var(--spacing-1);
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--color-gray-800);
  margin-bottom: var(--spacing-1);
}

.stat-trend {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-success);
}

.office-stats {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.office-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.office-name {
  min-width: 120px;
  font-weight: 500;
  color: var(--color-gray-700);
}

.office-usage {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.usage-bar {
  flex: 1;
  height: 8px;
  background: var(--color-gray-200);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.usage-fill {
  height: 100%;
  background: linear-gradient(90deg, #4ecdc4 0%, #44a08d 100%);
  transition: width 0.3s ease;
}

.usage-percentage {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-gray-700);
  min-width: 40px;
}

.feature-usage {
  margin-bottom: var(--spacing-8);
}

.feature-usage h3 {
  margin-bottom: var(--spacing-4);
  color: var(--color-gray-800);
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-4);
}

.feature-card {
  background: white;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
  text-align: center;
  transition: var(--transition-normal);
}

.feature-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.feature-icon {
  font-size: 2rem;
  margin-bottom: var(--spacing-2);
}

.feature-name {
  font-weight: 600;
  color: var(--color-gray-800);
  margin-bottom: var(--spacing-2);
}

.feature-usage-count {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: var(--spacing-1);
}

.feature-users {
  color: var(--color-gray-600);
  font-size: var(--text-sm);
}

.performance-metrics {
  margin-bottom: var(--spacing-8);
}

.performance-metrics h3 {
  margin-bottom: var(--spacing-4);
  color: var(--color-gray-800);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-4);
}

.metric-card {
  background: white;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
  transition: var(--transition-normal);
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-3);
}

.metric-title {
  font-weight: 600;
  color: var(--color-gray-800);
}

.metric-status {
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
}

.metric-status.excellent {
  background: var(--color-success);
  color: white;
}

.metric-status.good {
  background: var(--color-info);
  color: white;
}

.metric-status.warning {
  background: var(--color-warning);
  color: white;
}

.metric-value {
  font-size: 2rem;
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: var(--spacing-1);
}

.metric-description {
  color: var(--color-gray-600);
  font-size: var(--text-sm);
}

.report-modal {
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

.option-group {
  margin-bottom: var(--spacing-4);
}

.option-group label {
  display: block;
  margin-bottom: var(--spacing-2);
  font-weight: 600;
  color: var(--color-gray-700);
}

.radio-group,
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.radio-label,
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

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: var(--color-gray-500);
  padding: var(--spacing-1);
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    gap: var(--spacing-4);
  }

  .header-controls {
    width: 100%;
    justify-content: center;
  }

  .kpi-overview {
    grid-template-columns: 1fr;
  }

  .charts-section,
  .detailed-stats {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .feature-grid,
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
