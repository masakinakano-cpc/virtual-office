<template>
  <div class="gamification-system">
    <div class="gamification-header">
      <h2>🎮 ゲーミフィケーション</h2>
      <div class="user-stats">
        <div class="level-badge">
          <span class="level-number">{{ userLevel }}</span>
          <span class="level-text">レベル</span>
        </div>
        <div class="points-display">
          <span class="points-icon">⭐</span>
          <span class="points-value">{{ userPoints }}</span>
        </div>
      </div>
    </div>

    <!-- プログレスバー -->
    <div class="level-progress">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: levelProgress + '%' }"></div>
      </div>
      <div class="progress-text">
        {{ currentLevelExp }}/{{ nextLevelExp }} EXP ({{ levelProgress }}%)
      </div>
    </div>

    <!-- メインタブ -->
    <div class="gamification-tabs">
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

    <!-- 実績システム -->
    <div v-if="activeTab === 'achievements'" class="achievements-section">
      <div class="section-header">
        <h3>🏆 実績</h3>
        <div class="achievement-stats">
          {{ unlockedAchievements.length }}/{{ achievements.length }} 獲得
        </div>
      </div>

      <div class="achievements-grid">
        <div
          v-for="achievement in achievements"
          :key="achievement.id"
          :class="{ unlocked: achievement.unlocked }"
          class="achievement-card"
        >
          <div class="achievement-icon">{{ achievement.icon }}</div>
          <div class="achievement-info">
            <div class="achievement-name">{{ achievement.name }}</div>
            <div class="achievement-description">{{ achievement.description }}</div>
            <div class="achievement-progress">
              <div class="progress-bar small">
                <div class="progress-fill" :style="{ width: (achievement.progress / achievement.target) * 100 + '%' }"></div>
              </div>
              <span class="progress-text">{{ achievement.progress }}/{{ achievement.target }}</span>
            </div>
          </div>
          <div class="achievement-reward">
            <span class="reward-points">+{{ achievement.points }}pt</span>
            <span v-if="achievement.badge" class="reward-badge">{{ achievement.badge }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ランキング -->
    <div v-if="activeTab === 'leaderboard'" class="leaderboard-section">
      <div class="section-header">
        <h3>🏅 リーダーボード</h3>
        <select v-model="leaderboardType" class="leaderboard-filter">
          <option value="points">ポイント</option>
          <option value="level">レベル</option>
          <option value="achievements">実績</option>
          <option value="activity">活動時間</option>
        </select>
      </div>

      <div class="leaderboard-list">
        <div
          v-for="(user, index) in sortedLeaderboard"
          :key="user.id"
          :class="{ current: user.id === currentUser.id }"
          class="leaderboard-item"
        >
          <div class="rank">
            <span v-if="index === 0" class="rank-icon">🥇</span>
            <span v-else-if="index === 1" class="rank-icon">🥈</span>
            <span v-else-if="index === 2" class="rank-icon">🥉</span>
            <span v-else class="rank-number">{{ index + 1 }}</span>
          </div>
          <div class="user-avatar">{{ user.avatar }}</div>
          <div class="user-info">
            <div class="user-name">{{ user.name }}</div>
            <div class="user-title">{{ user.title }}</div>
          </div>
          <div class="user-stats">
            <div class="stat-value">{{ getStatValue(user) }}</div>
            <div class="stat-label">{{ getStatLabel() }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- クエスト -->
    <div v-if="activeTab === 'quests'" class="quests-section">
      <div class="section-header">
        <h3>⚔️ クエスト</h3>
        <div class="quest-filter">
          <button
            v-for="filter in questFilters"
            :key="filter"
            @click="questFilter = filter"
            :class="{ active: questFilter === filter }"
            class="filter-btn"
          >
            {{ filter }}
          </button>
        </div>
      </div>

      <div class="quests-list">
        <div
          v-for="quest in filteredQuests"
          :key="quest.id"
          :class="{ completed: quest.completed, expired: quest.expired }"
          class="quest-card"
        >
          <div class="quest-header">
            <div class="quest-icon">{{ quest.icon }}</div>
            <div class="quest-info">
              <div class="quest-name">{{ quest.name }}</div>
              <div class="quest-description">{{ quest.description }}</div>
            </div>
            <div class="quest-reward">
              <span class="reward-exp">+{{ quest.exp }}EXP</span>
              <span class="reward-points">+{{ quest.points }}pt</span>
            </div>
          </div>

          <div class="quest-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: (quest.progress / quest.target) * 100 + '%' }"></div>
            </div>
            <span class="progress-text">{{ quest.progress }}/{{ quest.target }}</span>
          </div>

          <div class="quest-footer">
            <div class="quest-deadline">
              <span class="deadline-icon">⏰</span>
              <span>{{ formatDeadline(quest.deadline) }}</span>
            </div>
            <button
              v-if="quest.completed && !quest.claimed"
              @click="claimQuest(quest)"
              class="claim-btn"
            >
              報酬を受け取る
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- バッジコレクション -->
    <div v-if="activeTab === 'badges'" class="badges-section">
      <div class="section-header">
        <h3>🎖️ バッジコレクション</h3>
        <div class="badge-stats">
          {{ unlockedBadges.length }}/{{ badges.length }} 獲得
        </div>
      </div>

      <div class="badges-grid">
        <div
          v-for="badge in badges"
          :key="badge.id"
          :class="{ unlocked: badge.unlocked }"
          class="badge-card"
        >
          <div class="badge-icon">{{ badge.icon }}</div>
          <div class="badge-name">{{ badge.name }}</div>
          <div class="badge-description">{{ badge.description }}</div>
          <div class="badge-rarity" :class="badge.rarity">
            {{ getRarityText(badge.rarity) }}
          </div>
        </div>
      </div>
    </div>

    <!-- 統計 -->
    <div v-if="activeTab === 'stats'" class="stats-section">
      <div class="section-header">
        <h3>📊 統計</h3>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">⏱️</div>
          <div class="stat-value">{{ formatTime(totalWorkTime) }}</div>
          <div class="stat-label">総作業時間</div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">📅</div>
          <div class="stat-value">{{ streakDays }}</div>
          <div class="stat-label">連続ログイン</div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🎯</div>
          <div class="stat-value">{{ completedTasks }}</div>
          <div class="stat-label">完了タスク</div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">💬</div>
          <div class="stat-value">{{ messagesSent }}</div>
          <div class="stat-label">メッセージ送信</div>
        </div>
      </div>
    </div>

    <!-- レベルアップ通知 -->
    <div v-if="showLevelUp" class="level-up-notification">
      <div class="level-up-content">
        <div class="level-up-icon">🎉</div>
        <div class="level-up-text">
          <h3>レベルアップ！</h3>
          <p>レベル {{ userLevel }} に到達しました！</p>
        </div>
        <button @click="showLevelUp = false" class="close-btn">✕</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  points: number
  progress: number
  target: number
  unlocked: boolean
  badge?: string
}

interface Quest {
  id: string
  name: string
  description: string
  icon: string
  exp: number
  points: number
  progress: number
  target: number
  deadline: Date
  completed: boolean
  claimed: boolean
  expired: boolean
  difficulty: 'easy' | 'medium' | 'hard'
}

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  unlocked: boolean
}

interface User {
  id: string
  name: string
  avatar: string
  title: string
  level: number
  points: number
  achievements: number
  activityTime: number
}

const activeTab = ref('achievements')
const userLevel = ref(5)
const userPoints = ref(2450)
const currentLevelExp = ref(750)
const nextLevelExp = ref(1000)
const showLevelUp = ref(false)
const leaderboardType = ref('points')
const questFilter = ref('全て')

const tabs = [
  { id: 'achievements', name: '実績', icon: '🏆' },
  { id: 'leaderboard', name: 'ランキング', icon: '🏅' },
  { id: 'quests', name: 'クエスト', icon: '⚔️' },
  { id: 'badges', name: 'バッジ', icon: '🎖️' },
  { id: 'stats', name: '統計', icon: '📊' }
]

const questFilters = ['全て', 'アクティブ', '完了', '期限切れ']

const achievements = ref<Achievement[]>([
  {
    id: 'first_login',
    name: '初回ログイン',
    description: 'バーチャルオフィスに初めてログインしました',
    icon: '🎊',
    points: 100,
    progress: 1,
    target: 1,
    unlocked: true,
    badge: '🎊'
  },
  {
    id: 'work_streak_7',
    name: '継続は力なり',
    description: '7日連続でログインしました',
    icon: '🔥',
    points: 300,
    progress: 5,
    target: 7,
    unlocked: false
  },
  {
    id: 'messages_100',
    name: 'チャットマスター',
    description: '100回メッセージを送信しました',
    icon: '💬',
    points: 200,
    progress: 87,
    target: 100,
    unlocked: false
  },
  {
    id: 'meetings_attended',
    name: '会議の達人',
    description: '50回の会議に参加しました',
    icon: '🤝',
    points: 400,
    progress: 32,
    target: 50,
    unlocked: false
  },
  {
    id: 'customization_master',
    name: 'カスタマイズマスター',
    description: 'オフィスレイアウトを10回変更しました',
    icon: '🎨',
    points: 250,
    progress: 3,
    target: 10,
    unlocked: false
  }
])

const quests = ref<Quest[]>([
  {
    id: 'daily_login',
    name: 'デイリーログイン',
    description: '今日ログインする',
    icon: '🌅',
    exp: 50,
    points: 25,
    progress: 1,
    target: 1,
    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
    completed: true,
    claimed: false,
    expired: false,
    difficulty: 'easy'
  },
  {
    id: 'send_messages',
    name: 'コミュニケーション',
    description: '5つのメッセージを送信する',
    icon: '💬',
    exp: 100,
    points: 50,
    progress: 3,
    target: 5,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    completed: false,
    claimed: false,
    expired: false,
    difficulty: 'easy'
  },
  {
    id: 'attend_meeting',
    name: '会議参加',
    description: '会議に参加する',
    icon: '🤝',
    exp: 200,
    points: 100,
    progress: 0,
    target: 1,
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    completed: false,
    claimed: false,
    expired: false,
    difficulty: 'medium'
  },
  {
    id: 'customize_office',
    name: 'オフィス改装',
    description: 'オフィスレイアウトを変更する',
    icon: '🏢',
    exp: 150,
    points: 75,
    progress: 1,
    target: 1,
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    completed: true,
    claimed: false,
    expired: false,
    difficulty: 'medium'
  }
])

const badges = ref<Badge[]>([
  {
    id: 'newcomer',
    name: '新参者',
    description: '初めてのログイン',
    icon: '🌟',
    rarity: 'common',
    unlocked: true
  },
  {
    id: 'social_butterfly',
    name: '社交的',
    description: '多くの人とチャットした',
    icon: '🦋',
    rarity: 'rare',
    unlocked: false
  },
  {
    id: 'meeting_master',
    name: '会議マスター',
    description: '多くの会議に参加した',
    icon: '👑',
    rarity: 'epic',
    unlocked: false
  },
  {
    id: 'legend',
    name: '伝説',
    description: '最高レベルに到達した',
    icon: '🏆',
    rarity: 'legendary',
    unlocked: false
  }
])

const leaderboard = ref<User[]>([
  {
    id: 'user1',
    name: 'あなた',
    avatar: '😊',
    title: 'クリエイティブワーカー',
    level: 5,
    points: 2450,
    achievements: 1,
    activityTime: 1800
  },
  {
    id: 'user2',
    name: '田中さん',
    avatar: '🤓',
    title: 'プロダクトマネージャー',
    level: 8,
    points: 3200,
    achievements: 5,
    activityTime: 2400
  },
  {
    id: 'user3',
    name: '佐藤さん',
    avatar: '👩‍💻',
    title: 'デベロッパー',
    level: 6,
    points: 2800,
    achievements: 3,
    activityTime: 2100
  },
  {
    id: 'user4',
    name: '山田さん',
    avatar: '👨‍🎨',
    title: 'デザイナー',
    level: 4,
    points: 1900,
    achievements: 2,
    activityTime: 1500
  }
])

const currentUser = computed(() => leaderboard.value[0])
const totalWorkTime = ref(18000) // 秒
const streakDays = ref(5)
const completedTasks = ref(23)
const messagesSent = ref(87)

const levelProgress = computed(() => {
  return Math.round((currentLevelExp.value / nextLevelExp.value) * 100)
})

const unlockedAchievements = computed(() => {
  return achievements.value.filter(a => a.unlocked)
})

const unlockedBadges = computed(() => {
  return badges.value.filter(b => b.unlocked)
})

const sortedLeaderboard = computed(() => {
  const sorted = [...leaderboard.value]
  switch (leaderboardType.value) {
    case 'points':
      return sorted.sort((a, b) => b.points - a.points)
    case 'level':
      return sorted.sort((a, b) => b.level - a.level)
    case 'achievements':
      return sorted.sort((a, b) => b.achievements - a.achievements)
    case 'activity':
      return sorted.sort((a, b) => b.activityTime - a.activityTime)
    default:
      return sorted
  }
})

const filteredQuests = computed(() => {
  switch (questFilter.value) {
    case 'アクティブ':
      return quests.value.filter(q => !q.completed && !q.expired)
    case '完了':
      return quests.value.filter(q => q.completed)
    case '期限切れ':
      return quests.value.filter(q => q.expired)
    default:
      return quests.value
  }
})

const getStatValue = (user: User) => {
  switch (leaderboardType.value) {
    case 'points':
      return user.points.toLocaleString()
    case 'level':
      return user.level
    case 'achievements':
      return user.achievements
    case 'activity':
      return formatTime(user.activityTime)
    default:
      return user.points
  }
}

const getStatLabel = () => {
  switch (leaderboardType.value) {
    case 'points':
      return 'ポイント'
    case 'level':
      return 'レベル'
    case 'achievements':
      return '実績'
    case 'activity':
      return '活動時間'
    default:
      return 'ポイント'
  }
}

const getRarityText = (rarity: string) => {
  switch (rarity) {
    case 'common':
      return 'コモン'
    case 'rare':
      return 'レア'
    case 'epic':
      return 'エピック'
    case 'legendary':
      return 'レジェンダリー'
    default:
      return 'コモン'
  }
}

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}

const formatDeadline = (deadline: Date) => {
  const now = new Date()
  const diff = deadline.getTime() - now.getTime()
  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))

  if (days > 0) {
    return `${days}日${hours}時間後`
  } else if (hours > 0) {
    return `${hours}時間後`
  } else {
    return '期限切れ'
  }
}

const claimQuest = (quest: Quest) => {
  quest.claimed = true
  userPoints.value += quest.points
  currentLevelExp.value += quest.exp

  // レベルアップチェック
  if (currentLevelExp.value >= nextLevelExp.value) {
    levelUp()
  }

  console.log(`クエスト「${quest.name}」の報酬を受け取りました！`)
}

const levelUp = () => {
  userLevel.value++
  currentLevelExp.value = currentLevelExp.value - nextLevelExp.value
  nextLevelExp.value = Math.floor(nextLevelExp.value * 1.5)
  showLevelUp.value = true

  // レベルアップボーナス
  userPoints.value += userLevel.value * 100

  console.log(`レベル${userLevel.value}にレベルアップしました！`)
}

// 実績の進捗更新
const updateAchievementProgress = (achievementId: string, progress: number) => {
  const achievement = achievements.value.find(a => a.id === achievementId)
  if (achievement && !achievement.unlocked) {
    achievement.progress = Math.min(progress, achievement.target)

    if (achievement.progress >= achievement.target) {
      achievement.unlocked = true
      userPoints.value += achievement.points
      console.log(`実績「${achievement.name}」を獲得しました！`)
    }
  }
}

// バッジの獲得
const unlockBadge = (badgeId: string) => {
  const badge = badges.value.find(b => b.id === badgeId)
  if (badge && !badge.unlocked) {
    badge.unlocked = true
    console.log(`バッジ「${badge.name}」を獲得しました！`)
  }
}

onMounted(() => {
  // 初期化処理
  console.log('ゲーミフィケーションシステムが初期化されました')
})

// エクスポート
defineExpose({
  updateAchievementProgress,
  unlockBadge,
  claimQuest,
  levelUp
})
</script>

<style scoped>
.gamification-system {
  padding: var(--spacing-6);
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
}

.gamification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-4);
}

.gamification-header h2 {
  color: var(--color-primary);
  margin: 0;
}

.user-stats {
  display: flex;
  gap: var(--spacing-4);
  align-items: center;
}

.level-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-weight: 600;
}

.level-number {
  font-size: 1.2rem;
}

.points-display {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-weight: 600;
}

.level-progress {
  margin-bottom: var(--spacing-6);
}

.progress-bar {
  background: var(--color-gray-200);
  height: 8px;
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: var(--spacing-2);
}

.progress-bar.small {
  height: 6px;
}

.progress-fill {
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  height: 100%;
  transition: width 0.3s ease;
}

.progress-text {
  color: var(--color-gray-600);
  font-size: var(--text-sm);
  text-align: center;
  display: block;
}

.gamification-tabs {
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

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-4);
}

.achievement-card {
  background: white;
  border: 2px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
  transition: var(--transition-normal);
}

.achievement-card.unlocked {
  border-color: var(--color-success);
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(139, 195, 74, 0.1) 100%);
}

.achievement-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.achievement-icon {
  font-size: 2rem;
  margin-bottom: var(--spacing-2);
}

.achievement-name {
  font-weight: 600;
  color: var(--color-gray-800);
  margin-bottom: var(--spacing-1);
}

.achievement-description {
  color: var(--color-gray-600);
  font-size: var(--text-sm);
  margin-bottom: var(--spacing-3);
}

.achievement-progress {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-2);
}

.achievement-progress .progress-bar {
  flex: 1;
  margin-bottom: 0;
}

.achievement-progress .progress-text {
  font-size: var(--text-xs);
  color: var(--color-gray-500);
}

.achievement-reward {
  display: flex;
  gap: var(--spacing-2);
  align-items: center;
}

.reward-points {
  background: var(--color-warning);
  color: white;
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: 600;
}

.reward-badge {
  font-size: 1.2rem;
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.leaderboard-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  padding: var(--spacing-3);
  background: white;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  transition: var(--transition-normal);
}

.leaderboard-item.current {
  border-color: var(--color-primary);
  background: rgba(255, 107, 107, 0.05);
}

.leaderboard-item:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.rank {
  width: 40px;
  text-align: center;
}

.rank-icon {
  font-size: 1.5rem;
}

.rank-number {
  font-weight: 600;
  color: var(--color-gray-600);
}

.user-avatar {
  font-size: 2rem;
}

.user-info {
  flex: 1;
}

.user-name {
  font-weight: 600;
  color: var(--color-gray-800);
}

.user-title {
  color: var(--color-gray-600);
  font-size: var(--text-sm);
}

.user-stats {
  text-align: right;
}

.stat-value {
  font-weight: 600;
  color: var(--color-gray-800);
}

.stat-label {
  color: var(--color-gray-600);
  font-size: var(--text-sm);
}

.quests-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.quest-card {
  background: white;
  border: 2px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
  transition: var(--transition-normal);
}

.quest-card.completed {
  border-color: var(--color-success);
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(139, 195, 74, 0.1) 100%);
}

.quest-card.expired {
  border-color: var(--color-error);
  background: rgba(244, 67, 54, 0.05);
  opacity: 0.7;
}

.quest-header {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-3);
}

.quest-icon {
  font-size: 1.5rem;
}

.quest-info {
  flex: 1;
}

.quest-name {
  font-weight: 600;
  color: var(--color-gray-800);
  margin-bottom: var(--spacing-1);
}

.quest-description {
  color: var(--color-gray-600);
  font-size: var(--text-sm);
}

.quest-reward {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.reward-exp,
.reward-points {
  background: var(--color-info);
  color: white;
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: 600;
  text-align: center;
}

.reward-exp {
  background: var(--color-success);
}

.quest-progress {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-3);
}

.quest-progress .progress-bar {
  flex: 1;
  margin-bottom: 0;
}

.quest-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quest-deadline {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  color: var(--color-gray-600);
  font-size: var(--text-sm);
}

.claim-btn {
  background: var(--color-success);
  color: white;
  border: none;
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-weight: 500;
  transition: var(--transition-normal);
}

.claim-btn:hover {
  background: var(--color-success-dark);
}

.badges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-4);
}

.badge-card {
  background: white;
  border: 2px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
  text-align: center;
  transition: var(--transition-normal);
}

.badge-card.unlocked {
  border-color: var(--color-success);
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(139, 195, 74, 0.1) 100%);
}

.badge-icon {
  font-size: 3rem;
  margin-bottom: var(--spacing-2);
}

.badge-name {
  font-weight: 600;
  color: var(--color-gray-800);
  margin-bottom: var(--spacing-1);
}

.badge-description {
  color: var(--color-gray-600);
  font-size: var(--text-sm);
  margin-bottom: var(--spacing-2);
}

.badge-rarity {
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
}

.badge-rarity.common {
  background: var(--color-gray-200);
  color: var(--color-gray-700);
}

.badge-rarity.rare {
  background: var(--color-info);
  color: white;
}

.badge-rarity.epic {
  background: var(--color-warning);
  color: white;
}

.badge-rarity.legendary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-4);
}

.stat-card {
  background: white;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
  text-align: center;
  transition: var(--transition-normal);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-icon {
  font-size: 2rem;
  margin-bottom: var(--spacing-2);
}

.stat-card .stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: var(--spacing-1);
}

.stat-card .stat-label {
  color: var(--color-gray-600);
  font-size: var(--text-sm);
}

.level-up-notification {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: var(--spacing-6);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  animation: bounce 0.6s ease;
}

.level-up-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
}

.level-up-icon {
  font-size: 3rem;
}

.level-up-text h3 {
  margin: 0 0 var(--spacing-1) 0;
  font-size: 1.5rem;
}

.level-up-text p {
  margin: 0;
  opacity: 0.9;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  padding: var(--spacing-1);
  opacity: 0.7;
  transition: var(--transition-fast);
}

.close-btn:hover {
  opacity: 1;
}

@keyframes bounce {
  0%, 20%, 53%, 80%, 100% {
    transform: translate(-50%, -50%) translateY(0);
  }
  40%, 43% {
    transform: translate(-50%, -50%) translateY(-30px);
  }
  70% {
    transform: translate(-50%, -50%) translateY(-15px);
  }
  90% {
    transform: translate(-50%, -50%) translateY(-4px);
  }
}

@media (max-width: 768px) {
  .gamification-header {
    flex-direction: column;
    gap: var(--spacing-4);
  }

  .user-stats {
    width: 100%;
    justify-content: center;
  }

  .gamification-tabs {
    overflow-x: auto;
    padding-bottom: var(--spacing-2);
  }

  .achievements-grid,
  .badges-grid,
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .quest-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .quest-footer {
    flex-direction: column;
    gap: var(--spacing-2);
    align-items: flex-start;
  }
}
</style>
