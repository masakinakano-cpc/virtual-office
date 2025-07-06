<template>
  <div class="social-hub">
    <div class="social-header">
      <h2>🌟 ソーシャルハブ</h2>
      <div class="social-stats">
        <div class="stat-item">
          <span class="stat-value">{{ teamMembers.length }}</span>
          <span class="stat-label">チームメンバー</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ totalPoints }}</span>
          <span class="stat-label">チームポイント</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ activeProjects.length }}</span>
          <span class="stat-label">アクティブプロジェクト</span>
        </div>
      </div>
    </div>

    <div class="social-content">
      <!-- アクティビティフィード -->
      <div class="activity-feed">
        <div class="section-header">
          <h3>📰 チーム活動フィード</h3>
          <div class="feed-controls">
            <select v-model="feedFilter" class="filter-select">
              <option value="all">すべて</option>
              <option value="achievements">実績</option>
              <option value="projects">プロジェクト</option>
              <option value="social">ソーシャル</option>
              <option value="milestones">マイルストーン</option>
            </select>
            <button @click="refreshFeed" class="refresh-btn">🔄</button>
          </div>
        </div>

        <div class="feed-list">
          <div
            v-for="activity in filteredActivities"
            :key="activity.id"
            class="activity-item"
            :class="`activity-${activity.type}`"
          >
            <div class="activity-avatar">
              <img
                v-if="activity.user.avatar"
                :src="activity.user.avatar"
                :alt="activity.user.name"
              />
              <span v-else class="avatar-placeholder">
                {{ getInitials(activity.user.name) }}
              </span>
            </div>

            <div class="activity-content">
              <div class="activity-header">
                <span class="activity-user">{{ activity.user.name }}</span>
                <span class="activity-action">{{ getActivityAction(activity) }}</span>
                <span class="activity-time">{{ formatRelativeTime(activity.timestamp) }}</span>
              </div>

              <div class="activity-description">
                {{ activity.description }}
              </div>

              <div v-if="activity.metadata" class="activity-metadata">
                <span
                  v-for="(value, key) in activity.metadata"
                  :key="key"
                  class="metadata-tag"
                >
                  {{ key }}: {{ value }}
                </span>
              </div>

              <div class="activity-actions">
                <button
                  @click="likeActivity(activity.id)"
                  class="action-btn like-btn"
                  :class="{ 'liked': activity.likes.includes(currentUserId) }"
                >
                  👍 {{ activity.likes.length }}
                </button>
                <button
                  @click="commentOnActivity(activity.id)"
                  class="action-btn comment-btn"
                >
                  💬 {{ activity.comments.length }}
                </button>
                <button
                  @click="shareActivity(activity.id)"
                  class="action-btn share-btn"
                >
                  📤 共有
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 実績システム -->
      <div class="achievements-section">
        <div class="section-header">
          <h3>🏆 実績システム</h3>
          <button @click="showAchievementsModal = true" class="view-all-btn">
            すべて表示
          </button>
        </div>

        <div class="recent-achievements">
          <div
            v-for="achievement in recentAchievements"
            :key="achievement.id"
            class="achievement-card"
            :class="`achievement-${achievement.rarity}`"
          >
            <div class="achievement-icon">{{ achievement.icon }}</div>
            <div class="achievement-info">
              <h4>{{ achievement.title }}</h4>
              <p>{{ achievement.description }}</p>
              <div class="achievement-meta">
                <span class="achievement-points">+{{ achievement.points }}pt</span>
                <span class="achievement-date">{{ achievement.unlockedAt ? formatDate(achievement.unlockedAt) : '' }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="achievement-progress">
          <h4>進行中の実績</h4>
          <div
            v-for="progress in achievementProgress"
            :key="progress.id"
            class="progress-item"
          >
            <div class="progress-header">
              <span class="progress-title">{{ progress.title }}</span>
              <span class="progress-value">{{ progress.current }}/{{ progress.target }}</span>
            </div>
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: (progress.current / progress.target * 100) + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- ランキング -->
      <div class="rankings-section">
        <div class="section-header">
          <h3>📊 ランキング</h3>
          <div class="ranking-tabs">
            <button
              v-for="tab in rankingTabs"
              :key="tab.id"
              @click="activeRankingTab = tab.id"
              class="tab-btn"
              :class="{ 'active': activeRankingTab === tab.id }"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <div class="ranking-list">
          <div
            v-for="(member, index) in currentRanking"
            :key="member.id"
            class="ranking-item"
            :class="{ 'current-user': member.id === currentUserId }"
          >
            <div class="ranking-position">
              <span class="position-number">{{ index + 1 }}</span>
              <span v-if="index < 3" class="position-medal">
                {{ ['🥇', '🥈', '🥉'][index] }}
              </span>
            </div>

            <div class="ranking-user">
              <div class="user-avatar">
                <img
                  v-if="member.avatar"
                  :src="member.avatar"
                  :alt="member.name"
                />
                <span v-else class="avatar-placeholder">
                  {{ getInitials(member.name) }}
                </span>
              </div>
              <div class="user-info">
                <span class="user-name">{{ member.name }}</span>
                <span class="user-title">{{ member.title || 'メンバー' }}</span>
              </div>
            </div>

            <div class="ranking-value">
              <span class="value-number">{{ (member as any)[activeRankingTab] }}</span>
              <span class="value-unit">{{ getRankingUnit(activeRankingTab) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- メンタリング -->
      <div class="mentoring-section">
        <div class="section-header">
          <h3>🎓 メンタリング</h3>
          <button @click="showMentoringModal = true" class="add-btn">
            + 新規作成
          </button>
        </div>

        <div class="mentoring-cards">
          <div
            v-for="session in mentoringSessions"
            :key="session.id"
            class="mentoring-card"
          >
            <div class="mentoring-header">
              <div class="mentoring-type">{{ session.type }}</div>
              <div class="mentoring-status" :class="`status-${session.status}`">
                {{ session.status }}
              </div>
            </div>

            <div class="mentoring-participants">
              <div class="mentor">
                <strong>メンター:</strong> {{ session.mentor.name }}
              </div>
              <div class="mentee">
                <strong>メンティー:</strong> {{ session.mentee.name }}
              </div>
            </div>

            <div class="mentoring-details">
              <div class="session-topic">{{ session.topic }}</div>
              <div class="session-schedule">
                📅 {{ formatDateTime(session.scheduledAt) }}
              </div>
            </div>

            <div class="mentoring-actions">
              <button
                v-if="session.status === 'scheduled'"
                @click="joinMentoringSession(session.id)"
                class="action-btn primary"
              >
                参加
              </button>
              <button
                @click="viewMentoringDetails(session.id)"
                class="action-btn secondary"
              >
                詳細
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 実績モーダル -->
    <div v-if="showAchievementsModal" class="modal-overlay" @click="closeAchievementsModal">
      <div class="modal achievements-modal" @click.stop>
        <div class="modal-header">
          <h3>🏆 実績一覧</h3>
          <button @click="closeAchievementsModal" class="close-btn">✕</button>
        </div>

        <div class="modal-content">
          <div class="achievements-grid">
            <div
              v-for="achievement in allAchievements"
              :key="achievement.id"
              class="achievement-item"
              :class="{
                'unlocked': achievement.unlocked,
                [`rarity-${achievement.rarity}`]: true
              }"
            >
              <div class="achievement-icon">{{ achievement.icon }}</div>
              <div class="achievement-details">
                <h4>{{ achievement.title }}</h4>
                <p>{{ achievement.description }}</p>
                <div class="achievement-requirements">
                  <span class="points">{{ achievement.points }}pt</span>
                  <span class="rarity">{{ achievement.rarity }}</span>
                </div>
                <div v-if="achievement.unlocked && achievement.unlockedAt" class="unlocked-date">
                  {{ formatDate(achievement.unlockedAt) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- メンタリングモーダル -->
    <div v-if="showMentoringModal" class="modal-overlay" @click="closeMentoringModal">
      <div class="modal mentoring-modal" @click.stop>
        <div class="modal-header">
          <h3>🎓 メンタリングセッション作成</h3>
          <button @click="closeMentoringModal" class="close-btn">✕</button>
        </div>

        <div class="modal-content">
          <form @submit.prevent="createMentoringSession">
            <div class="form-group">
              <label>セッションタイプ</label>
              <select v-model="newMentoringSession.type" required>
                <option value="technical">技術指導</option>
                <option value="career">キャリア相談</option>
                <option value="skill">スキル開発</option>
                <option value="project">プロジェクト支援</option>
              </select>
            </div>

            <div class="form-group">
              <label>トピック</label>
              <input
                v-model="newMentoringSession.topic"
                type="text"
                placeholder="セッションのトピックを入力"
                required
              />
            </div>

            <div class="form-group">
              <label>メンター</label>
              <select v-model="newMentoringSession.mentorId" required>
                <option value="">メンターを選択</option>
                <option
                  v-for="mentor in availableMentors"
                  :key="mentor.id"
                  :value="mentor.id"
                >
                  {{ mentor.name }} ({{ mentor.expertise?.join(', ') || 'エキスパート' }})
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>日時</label>
              <input
                v-model="newMentoringSession.scheduledAt"
                type="datetime-local"
                required
              />
            </div>

            <div class="form-group">
              <label>説明</label>
              <textarea
                v-model="newMentoringSession.description"
                placeholder="セッションの詳細説明"
                rows="4"
              ></textarea>
            </div>

            <div class="form-actions">
              <button type="button" @click="closeMentoringModal" class="cancel-btn">
                キャンセル
              </button>
              <button type="submit" class="submit-btn">
                作成
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'

interface User {
  id: string
  name: string
  avatar?: string
  title?: string
  points: number
  achievements: number
  contributions: number
  mentoringSessions: number
  expertise?: string[]
}

interface Activity {
  id: string
  type: 'achievement' | 'project' | 'social' | 'milestone'
  user: User
  description: string
  timestamp: Date
  metadata?: Record<string, any>
  likes: string[]
  comments: Comment[]
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  points: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  unlocked: boolean
  unlockedAt?: Date
}

interface AchievementProgress {
  id: string
  title: string
  current: number
  target: number
}

interface MentoringSession {
  id: string
  type: 'technical' | 'career' | 'skill' | 'project'
  topic: string
  mentor: User
  mentee: User
  scheduledAt: Date
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
  description?: string
}

interface Comment {
  id: string
  user: User
  content: string
  timestamp: Date
}

const currentUserId = ref('current-user-id')
const feedFilter = ref('all')
const activeRankingTab = ref('points')
const showAchievementsModal = ref(false)
const showMentoringModal = ref(false)

// データ
const teamMembers = ref<User[]>([])
const activities = ref<Activity[]>([])
const allAchievements = ref<Achievement[]>([])
const achievementProgress = ref<AchievementProgress[]>([])
const mentoringSessions = ref<MentoringSession[]>([])
const availableMentors = ref<User[]>([])

const newMentoringSession = reactive({
  type: 'technical',
  topic: '',
  mentorId: '',
  scheduledAt: '',
  description: ''
})

const rankingTabs = [
  { id: 'points', label: 'ポイント' },
  { id: 'achievements', label: '実績' },
  { id: 'contributions', label: '貢献' },
  { id: 'mentoringSessions', label: 'メンタリング' }
]

// 計算プロパティ
const totalPoints = computed(() =>
  teamMembers.value.reduce((sum, member) => sum + member.points, 0)
)

const activeProjects = computed(() =>
  activities.value.filter(activity => activity.type === 'project')
)

const filteredActivities = computed(() => {
  if (feedFilter.value === 'all') return activities.value
  return activities.value.filter(activity => activity.type === feedFilter.value)
})

const recentAchievements = computed(() =>
  allAchievements.value
    .filter(achievement => achievement.unlocked)
    .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
    .slice(0, 3)
)

const currentRanking = computed(() => {
  const sorted = [...teamMembers.value].sort((a, b) => {
    const aValue = a[activeRankingTab.value as keyof User] as number
    const bValue = b[activeRankingTab.value as keyof User] as number
    return bValue - aValue
  })
  return sorted
})

// メソッド
const getInitials = (name: string): string => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

const getActivityAction = (activity: Activity): string => {
  const actions = {
    achievement: '実績を獲得しました',
    project: 'プロジェクトを更新しました',
    social: '活動しました',
    milestone: 'マイルストーンを達成しました'
  }
  return actions[activity.type]
}

const formatRelativeTime = (date: Date): string => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'たった今'
  if (minutes < 60) return `${minutes}分前`
  if (hours < 24) return `${hours}時間前`
  return `${days}日前`
}

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const getRankingUnit = (type: string): string => {
  const units = {
    points: 'pt',
    achievements: '個',
    contributions: '回',
    mentoringSessions: '回'
  }
  return units[type as keyof typeof units] || ''
}

const refreshFeed = (): void => {
  // フィードを更新
  console.log('フィードを更新中...')
}

const likeActivity = (activityId: string): void => {
  const activity = activities.value.find(a => a.id === activityId)
  if (activity) {
    const userIndex = activity.likes.indexOf(currentUserId.value)
    if (userIndex > -1) {
      activity.likes.splice(userIndex, 1)
    } else {
      activity.likes.push(currentUserId.value)
    }
  }
}

const commentOnActivity = (activityId: string): void => {
  console.log('コメント機能:', activityId)
  // コメントモーダルを開く
}

const shareActivity = (activityId: string): void => {
  console.log('活動を共有:', activityId)
  // 共有機能
}

const closeAchievementsModal = (): void => {
  showAchievementsModal.value = false
}

const closeMentoringModal = (): void => {
  showMentoringModal.value = false
  // フォームをリセット
  Object.assign(newMentoringSession, {
    type: 'technical',
    topic: '',
    mentorId: '',
    scheduledAt: '',
    description: ''
  })
}

const createMentoringSession = (): void => {
  const mentor = availableMentors.value.find(m => m.id === newMentoringSession.mentorId)
  if (!mentor) return

  const session: MentoringSession = {
    id: `session_${Date.now()}`,
    type: newMentoringSession.type as any,
    topic: newMentoringSession.topic,
    mentor,
    mentee: teamMembers.value.find(m => m.id === currentUserId.value)!,
    scheduledAt: new Date(newMentoringSession.scheduledAt),
    status: 'scheduled',
    description: newMentoringSession.description
  }

  mentoringSessions.value.push(session)
  closeMentoringModal()
}

const joinMentoringSession = (sessionId: string): void => {
  console.log('メンタリングセッションに参加:', sessionId)
  // セッション参加処理
}

const viewMentoringDetails = (sessionId: string): void => {
  console.log('メンタリングセッション詳細:', sessionId)
  // 詳細表示
}

// 初期化
onMounted(() => {
  // サンプルデータを読み込み
  teamMembers.value = [
    {
      id: 'user1',
      name: '田中太郎',
      avatar: '',
      title: 'シニアデベロッパー',
      points: 1250,
      achievements: 15,
      contributions: 45,
      mentoringSessions: 8
    },
    {
      id: 'user2',
      name: '佐藤花子',
      avatar: '',
      title: 'プロダクトマネージャー',
      points: 980,
      achievements: 12,
      contributions: 38,
      mentoringSessions: 12
    },
    {
      id: 'user3',
      name: '鈴木一郎',
      avatar: '',
      title: 'デザイナー',
      points: 850,
      achievements: 10,
      contributions: 32,
      mentoringSessions: 5
    }
  ]

  activities.value = [
    {
      id: 'activity1',
      type: 'achievement',
      user: teamMembers.value[0],
      description: '「コードレビューマスター」の実績を獲得しました！',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      likes: ['user2', 'user3'],
      comments: []
    },
    {
      id: 'activity2',
      type: 'project',
      user: teamMembers.value[1],
      description: 'バーチャルオフィスプロジェクトの新機能をリリースしました',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      likes: ['user1'],
      comments: []
    }
  ]

  allAchievements.value = [
    {
      id: 'ach1',
      title: 'ファーストステップ',
      description: '初回ログインを完了',
      icon: '🎯',
      points: 10,
      rarity: 'common',
      unlocked: true,
      unlockedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'ach2',
      title: 'コードレビューマスター',
      description: '100回のコードレビューを完了',
      icon: '🔍',
      points: 100,
      rarity: 'rare',
      unlocked: true,
      unlockedAt: new Date(Date.now() - 30 * 60 * 1000)
    },
    {
      id: 'ach3',
      title: 'チームプレイヤー',
      description: '50回のコラボレーションを完了',
      icon: '🤝',
      points: 75,
      rarity: 'epic',
      unlocked: false
    }
  ]

  achievementProgress.value = [
    {
      id: 'prog1',
      title: 'チームプレイヤー',
      current: 42,
      target: 50
    },
    {
      id: 'prog2',
      title: 'メンター',
      current: 3,
      target: 10
    }
  ]

  availableMentors.value = teamMembers.value.filter(member =>
    member.title?.includes('シニア') || member.title?.includes('マネージャー')
  )
})
</script>

<style scoped>
.social-hub {
  padding: var(--spacing-6);
  background: var(--bg-secondary);
  border-radius: var(--radius-xl);
  min-height: 100vh;
}

.social-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-6);
  padding-bottom: var(--spacing-4);
  border-bottom: 1px solid var(--border-color);
}

.social-header h2 {
  margin: 0;
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--text-primary);
}

.social-stats {
  display: flex;
  gap: var(--spacing-6);
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-primary);
}

.stat-label {
  display: block;
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.social-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--spacing-6);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-4);
}

.section-header h3 {
  margin: 0;
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
}

.activity-feed {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--spacing-6);
  box-shadow: var(--shadow-sm);
}

.feed-controls {
  display: flex;
  gap: var(--spacing-2);
}

.filter-select {
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: white;
}

.refresh-btn {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.feed-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.activity-item {
  display: flex;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  transition: var(--transition-fast);
}

.activity-item:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.activity-avatar {
  flex-shrink: 0;
}

.activity-avatar img,
.avatar-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: var(--text-sm);
}

.activity-content {
  flex: 1;
}

.activity-header {
  display: flex;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-2);
  font-size: var(--text-sm);
}

.activity-user {
  font-weight: 600;
  color: var(--text-primary);
}

.activity-action {
  color: var(--text-muted);
}

.activity-time {
  color: var(--text-muted);
  margin-left: auto;
}

.activity-description {
  margin-bottom: var(--spacing-3);
  color: var(--text-primary);
}

.activity-metadata {
  display: flex;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-3);
}

.metadata-tag {
  background: var(--bg-muted);
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.activity-actions {
  display: flex;
  gap: var(--spacing-3);
}

.action-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: var(--text-sm);
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-sm);
  transition: var(--transition-fast);
}

.action-btn:hover {
  background: var(--bg-muted);
}

.like-btn.liked {
  color: var(--color-primary);
}

.achievements-section,
.rankings-section,
.mentoring-section {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--spacing-6);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--spacing-4);
}

.recent-achievements {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-6);
}

.achievement-card {
  display: flex;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.achievement-card.achievement-rare {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
}

.achievement-card.achievement-epic {
  background: linear-gradient(135deg, #f3e5f5 0%, #ce93d8 100%);
}

.achievement-card.achievement-legendary {
  background: linear-gradient(135deg, #fff3e0 0%, #ffcc02 100%);
}

.achievement-icon {
  font-size: var(--text-2xl);
}

.achievement-info h4 {
  margin: 0 0 var(--spacing-1) 0;
  font-size: var(--text-base);
  font-weight: 600;
}

.achievement-info p {
  margin: 0 0 var(--spacing-2) 0;
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.achievement-meta {
  display: flex;
  gap: var(--spacing-3);
  font-size: var(--text-xs);
}

.achievement-points {
  color: var(--color-primary);
  font-weight: 600;
}

.achievement-progress h4 {
  margin: 0 0 var(--spacing-4) 0;
  font-size: var(--text-base);
  font-weight: 600;
}

.progress-item {
  margin-bottom: var(--spacing-3);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-2);
  font-size: var(--text-sm);
}

.progress-bar {
  height: 8px;
  background: var(--bg-muted);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.ranking-tabs {
  display: flex;
  gap: var(--spacing-2);
}

.tab-btn {
  background: none;
  border: 1px solid var(--border-color);
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--text-sm);
  transition: var(--transition-fast);
}

.tab-btn:hover {
  background: var(--bg-muted);
}

.tab-btn.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  transition: var(--transition-fast);
}

.ranking-item:hover {
  border-color: var(--color-primary);
}

.ranking-item.current-user {
  background: rgba(59, 130, 246, 0.1);
  border-color: var(--color-primary);
}

.ranking-position {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  min-width: 60px;
}

.position-number {
  font-weight: 700;
  font-size: var(--text-lg);
}

.position-medal {
  font-size: var(--text-lg);
}

.ranking-user {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  flex: 1;
}

.user-avatar img,
.user-avatar .avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: var(--text-xs);
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 600;
  color: var(--text-primary);
}

.user-title {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.ranking-value {
  text-align: right;
}

.value-number {
  font-weight: 700;
  font-size: var(--text-lg);
  color: var(--color-primary);
}

.value-unit {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.mentoring-cards {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.mentoring-card {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
  transition: var(--transition-fast);
}

.mentoring-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.mentoring-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-3);
}

.mentoring-type {
  background: var(--color-primary);
  color: white;
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: 600;
}

.mentoring-status {
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: 600;
}

.status-scheduled {
  background: rgba(59, 130, 246, 0.1);
  color: var(--color-primary);
}

.status-in-progress {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
}

.status-completed {
  background: rgba(34, 197, 94, 0.1);
  color: #059669;
}

.mentoring-participants {
  margin-bottom: var(--spacing-3);
  font-size: var(--text-sm);
}

.mentoring-participants div {
  margin-bottom: var(--spacing-1);
}

.mentoring-details {
  margin-bottom: var(--spacing-4);
}

.session-topic {
  font-weight: 600;
  margin-bottom: var(--spacing-2);
}

.session-schedule {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.mentoring-actions {
  display: flex;
  gap: var(--spacing-3);
}

.action-btn.primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-weight: 500;
}

.action-btn.secondary {
  background: var(--bg-muted);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--radius-lg);
  cursor: pointer;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: var(--radius-xl);
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-6) var(--spacing-6) var(--spacing-4);
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  font-size: var(--text-xl);
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: var(--text-xl);
  cursor: pointer;
  color: var(--text-muted);
}

.modal-content {
  padding: var(--spacing-6);
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-4);
}

.achievement-item {
  display: flex;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  opacity: 0.6;
  transition: var(--transition-fast);
}

.achievement-item.unlocked {
  opacity: 1;
}

.achievement-item.rarity-rare {
  border-color: #3b82f6;
}

.achievement-item.rarity-epic {
  border-color: #8b5cf6;
}

.achievement-item.rarity-legendary {
  border-color: #f59e0b;
}

.achievement-details h4 {
  margin: 0 0 var(--spacing-2) 0;
  font-size: var(--text-base);
  font-weight: 600;
}

.achievement-details p {
  margin: 0 0 var(--spacing-3) 0;
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.achievement-requirements {
  display: flex;
  gap: var(--spacing-3);
  font-size: var(--text-xs);
  margin-bottom: var(--spacing-2);
}

.points {
  color: var(--color-primary);
  font-weight: 600;
}

.rarity {
  text-transform: uppercase;
  font-weight: 600;
}

.unlocked-date {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.form-group {
  margin-bottom: var(--spacing-4);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-2);
  font-weight: 500;
  color: var(--text-primary);
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: var(--spacing-3);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
  margin-top: var(--spacing-6);
}

.cancel-btn {
  background: var(--bg-muted);
  color: var(--text-primary);
  border: none;
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-lg);
  cursor: pointer;
}

.submit-btn {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-weight: 500;
}

.view-all-btn,
.add-btn {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 500;
}

@media (max-width: 768px) {
  .social-content {
    grid-template-columns: 1fr;
  }

  .social-header {
    flex-direction: column;
    gap: var(--spacing-4);
  }

  .social-stats {
    justify-content: center;
  }

  .achievements-grid {
    grid-template-columns: 1fr;
  }
}
</style>
