<template>
  <div class="meeting-scheduler">
    <!-- カレンダービュー -->
    <div class="calendar-header">
      <div class="calendar-nav">
        <button @click="previousMonth" class="nav-btn">‹</button>
        <h2 class="calendar-title">{{ currentMonthYear }}</h2>
        <button @click="nextMonth" class="nav-btn">›</button>
      </div>
      <div class="calendar-actions">
        <button @click="showCreateMeeting = true" class="btn-primary">📅 新しい会議</button>
        <button @click="showSettings = true" class="btn-secondary">⚙️ 設定</button>
      </div>
    </div>

    <div class="calendar-grid">
      <div class="calendar-weekdays">
        <div v-for="day in weekdays" :key="day" class="weekday">{{ day }}</div>
      </div>
      <div class="calendar-days">
        <div
          v-for="day in calendarDays"
          :key="day.date"
          :class="{
            'other-month': day.otherMonth,
            'today': day.isToday,
            'selected': day.isSelected,
            'has-meetings': day.meetings.length > 0
          }"
          class="calendar-day"
          @click="selectDay(day)"
        >
          <div class="day-number">{{ day.day }}</div>
          <div class="day-meetings">
            <div
              v-for="meeting in day.meetings.slice(0, 2)"
              :key="meeting.id"
              :class="`meeting-${meeting.type}`"
              class="day-meeting"
            >
              {{ meeting.title }}
            </div>
            <div v-if="day.meetings.length > 2" class="more-meetings">
              +{{ day.meetings.length - 2 }}件
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 会議作成モーダル -->
    <div v-if="showCreateMeeting" class="modal-overlay" @click="showCreateMeeting = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>📅 新しい会議を作成</h3>
          <button @click="showCreateMeeting = false" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>会議タイトル</label>
            <input v-model="newMeeting.title" type="text" placeholder="週次ミーティング" class="form-input" />
          </div>

          <div class="form-group">
            <label>説明</label>
            <textarea v-model="newMeeting.description" placeholder="会議の詳細..." class="form-textarea"></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>開始日時</label>
              <input v-model="newMeeting.startDate" type="datetime-local" class="form-input" />
            </div>
            <div class="form-group">
              <label>終了日時</label>
              <input v-model="newMeeting.endDate" type="datetime-local" class="form-input" />
            </div>
          </div>

          <div class="form-group">
            <label>会議室</label>
            <select v-model="newMeeting.room" class="form-select">
              <option value="">選択してください</option>
              <option v-for="room in meetingRooms" :key="room.id" :value="room.id">
                {{ room.name }} ({{ room.capacity }}人)
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>参加者</label>
            <div class="participants-input">
              <input
                v-model="participantEmail"
                type="email"
                placeholder="email@example.com"
                class="form-input"
                @keyup.enter="addParticipant"
              />
              <button @click="addParticipant" class="btn-secondary">追加</button>
            </div>
            <div class="participants-list">
              <div
                v-for="participant in newMeeting.participants"
                :key="participant.email"
                class="participant-item"
              >
                <span class="participant-avatar">{{ participant.avatar }}</span>
                <span class="participant-name">{{ participant.name }}</span>
                <button @click="removeParticipant(participant.email)" class="remove-btn">✕</button>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>会議タイプ</label>
            <div class="meeting-types">
              <label v-for="type in meetingTypes" :key="type.id" class="type-option">
                <input v-model="newMeeting.type" :value="type.id" type="radio" />
                <span class="type-icon">{{ type.icon }}</span>
                <span class="type-label">{{ type.label }}</span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input v-model="newMeeting.recurring" type="checkbox" />
              定期開催
            </label>
          </div>

          <div v-if="newMeeting.recurring" class="form-group">
            <label>繰り返し</label>
            <select v-model="newMeeting.recurringType" class="form-select">
              <option value="daily">毎日</option>
              <option value="weekly">毎週</option>
              <option value="monthly">毎月</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showCreateMeeting = false" class="btn-secondary">キャンセル</button>
          <button @click="createMeeting" class="btn-primary">作成</button>
        </div>
      </div>
    </div>

    <!-- 会議詳細モーダル -->
    <div v-if="selectedMeeting" class="modal-overlay" @click="selectedMeeting = null">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedMeeting.title }}</h3>
          <div class="meeting-actions">
            <button @click="editMeeting(selectedMeeting)" class="btn-secondary">編集</button>
            <button @click="deleteMeeting(selectedMeeting.id)" class="btn-danger">削除</button>
            <button @click="selectedMeeting = null" class="close-btn">✕</button>
          </div>
        </div>
        <div class="modal-body">
          <div class="meeting-info">
            <div class="info-item">
              <span class="info-label">📅 日時:</span>
              <span class="info-value">{{ formatMeetingTime(selectedMeeting) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">🏢 会議室:</span>
              <span class="info-value">{{ getMeetingRoomName(selectedMeeting.room) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">👥 参加者:</span>
              <div class="participants-preview">
                <span v-for="participant in selectedMeeting.participants" :key="participant.email" class="participant-avatar">
                  {{ participant.avatar }}
                </span>
              </div>
            </div>
            <div v-if="selectedMeeting.description" class="info-item">
              <span class="info-label">📝 説明:</span>
              <span class="info-value">{{ selectedMeeting.description }}</span>
            </div>
          </div>

          <div class="meeting-controls">
            <button @click="joinMeeting(selectedMeeting)" class="btn-primary">🎥 参加</button>
            <button @click="recordMeeting(selectedMeeting)" class="btn-secondary">🎬 録画</button>
            <button @click="shareMeeting(selectedMeeting)" class="btn-secondary">📤 共有</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 今日の会議リスト -->
    <div class="today-meetings">
      <h3>📅 今日の会議</h3>
      <div v-if="todayMeetings.length === 0" class="no-meetings">
        今日は会議がありません
      </div>
      <div v-else class="meetings-list">
        <div
          v-for="meeting in todayMeetings"
          :key="meeting.id"
          :class="`meeting-${meeting.type}`"
          class="meeting-card"
          @click="selectedMeeting = meeting"
        >
          <div class="meeting-time">{{ formatTime(meeting.startTime) }}</div>
          <div class="meeting-details">
            <div class="meeting-title">{{ meeting.title }}</div>
            <div class="meeting-room">{{ getMeetingRoomName(meeting.room) }}</div>
          </div>
          <div class="meeting-status">
            <span :class="`status-${meeting.status}`" class="status-indicator">{{ getStatusText(meeting.status) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface Meeting {
  id: string
  title: string
  description: string
  startTime: Date
  endTime: Date
  room: string
  participants: Participant[]
  type: 'meeting' | 'presentation' | 'workshop' | 'standup'
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled'
  recurring: boolean
  recurringType?: 'daily' | 'weekly' | 'monthly'
}

interface Participant {
  email: string
  name: string
  avatar: string
  status: 'accepted' | 'declined' | 'pending'
}

interface MeetingRoom {
  id: string
  name: string
  capacity: number
  equipment: string[]
  available: boolean
}

interface CalendarDay {
  date: string
  day: number
  otherMonth: boolean
  isToday: boolean
  isSelected: boolean
  meetings: Meeting[]
}

const currentDate = ref(new Date())
const selectedDate = ref(new Date())
const meetings = ref<Meeting[]>([])
const showCreateMeeting = ref(false)
const showSettings = ref(false)
const selectedMeeting = ref<Meeting | null>(null)
const participantEmail = ref('')

const newMeeting = ref({
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  room: '',
  participants: [] as Participant[],
  type: 'meeting',
  recurring: false,
  recurringType: 'weekly'
})

const meetingRooms: MeetingRoom[] = [
  { id: 'room1', name: '会議室A', capacity: 8, equipment: ['プロジェクター', 'ホワイトボード'], available: true },
  { id: 'room2', name: '会議室B', capacity: 12, equipment: ['大型モニター', 'スピーカー'], available: true },
  { id: 'room3', name: 'ブレインストーミングルーム', capacity: 6, equipment: ['ホワイトボード', 'ふせん'], available: true }
]

const meetingTypes = [
  { id: 'meeting', label: '会議', icon: '👥' },
  { id: 'presentation', label: 'プレゼン', icon: '📊' },
  { id: 'workshop', label: 'ワークショップ', icon: '🛠️' },
  { id: 'standup', label: 'スタンドアップ', icon: '⚡' }
]

const weekdays = ['日', '月', '火', '水', '木', '金', '土']

const currentMonthYear = computed(() => {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long'
  }).format(currentDate.value)
})

const generateCalendarDays = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startDay = firstDay.getDay()

  const days = []

  // 前月の日付
  for (let i = startDay - 1; i >= 0; i--) {
    const date = new Date(year, month, -i)
    days.push({
      date: date.getDate(),
      isCurrentMonth: false,
      fullDate: date
    })
  }

  // 当月の日付
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    days.push({
      date: day,
      isCurrentMonth: true,
      fullDate: date
    })
  }

  return days
}

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const days = generateCalendarDays(year, month)

  const today = new Date()

  const calendarDays: CalendarDay[] = days.map(day => ({
    date: day.fullDate.toISOString().split('T')[0],
    day: day.date,
    otherMonth: !day.isCurrentMonth,
    isToday: day.fullDate.toDateString() === today.toDateString(),
    isSelected: day.fullDate.toDateString() === selectedDate.value.toDateString(),
    meetings: meetings.value.filter(meeting =>
      meeting.startTime.toDateString() === day.fullDate.toDateString()
    )
  }))

  return calendarDays
})

const todayMeetings = computed(() => {
  const today = new Date()
  return meetings.value
    .filter(meeting => meeting.startTime.toDateString() === today.toDateString())
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
})

const previousMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
}

const nextMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
}

const selectDay = (day: CalendarDay) => {
  selectedDate.value = new Date(day.date)
  if (day.meetings.length > 0) {
    selectedMeeting.value = day.meetings[0]
  }
}

const addParticipant = () => {
  if (participantEmail.value) {
    const participant: Participant = {
      email: participantEmail.value,
      name: participantEmail.value.split('@')[0],
      avatar: '👤',
      status: 'pending'
    }
    newMeeting.value.participants.push(participant)
    participantEmail.value = ''
  }
}

const removeParticipant = (email: string) => {
  newMeeting.value.participants = newMeeting.value.participants.filter(p => p.email !== email)
}

const createMeeting = () => {
  const meeting: Meeting = {
    id: Date.now().toString(),
    title: newMeeting.value.title,
    description: newMeeting.value.description,
    startTime: new Date(newMeeting.value.startDate),
    endTime: new Date(newMeeting.value.endDate),
    room: newMeeting.value.room,
    participants: newMeeting.value.participants,
    type: newMeeting.value.type as any,
    status: 'scheduled',
    recurring: newMeeting.value.recurring,
    recurringType: newMeeting.value.recurringType as any
  }

  meetings.value.push(meeting)

  // 定期開催の場合は追加の会議を作成
  if (meeting.recurring) {
    createRecurringMeetings(meeting)
  }

  showCreateMeeting.value = false
  resetNewMeeting()
}

const createRecurringMeetings = (baseMeeting: Meeting) => {
  const recurringCount = 10 // 10回分作成

  for (let i = 1; i < recurringCount; i++) {
    const nextMeeting = { ...baseMeeting }
    nextMeeting.id = `${baseMeeting.id}_${i}`

    const startTime = new Date(baseMeeting.startTime)
    const endTime = new Date(baseMeeting.endTime)

    switch (baseMeeting.recurringType) {
      case 'daily':
        startTime.setDate(startTime.getDate() + i)
        endTime.setDate(endTime.getDate() + i)
        break
      case 'weekly':
        startTime.setDate(startTime.getDate() + (i * 7))
        endTime.setDate(endTime.getDate() + (i * 7))
        break
      case 'monthly':
        startTime.setMonth(startTime.getMonth() + i)
        endTime.setMonth(endTime.getMonth() + i)
        break
    }

    nextMeeting.startTime = startTime
    nextMeeting.endTime = endTime

    meetings.value.push(nextMeeting)
  }
}

const resetNewMeeting = () => {
  newMeeting.value = {
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    room: '',
    participants: [],
    type: 'meeting',
    recurring: false,
    recurringType: 'weekly'
  }
}

const editMeeting = (meeting: Meeting) => {
  // 編集機能の実装
  console.log('会議を編集:', meeting)
}

const deleteMeeting = (meetingId: string) => {
  if (confirm('この会議を削除しますか？')) {
    meetings.value = meetings.value.filter(m => m.id !== meetingId)
    selectedMeeting.value = null
  }
}

const joinMeeting = (meeting: Meeting) => {
  console.log('会議に参加:', meeting)
  // 実際の実装では、ビデオ会議ツールを起動
}

const recordMeeting = (meeting: Meeting) => {
  console.log('会議を録画:', meeting)
  // 録画機能の実装
}

const shareMeeting = (meeting: Meeting) => {
  console.log('会議を共有:', meeting)
  // 共有機能の実装
}

const formatMeetingTime = (meeting: Meeting) => {
  const start = new Intl.DateTimeFormat('ja-JP', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(meeting.startTime)

  const end = new Intl.DateTimeFormat('ja-JP', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(meeting.endTime)

  return `${start} - ${end}`
}

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('ja-JP', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const getMeetingRoomName = (roomId: string) => {
  const room = meetingRooms.find(r => r.id === roomId)
  return room ? room.name : '未設定'
}

const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    scheduled: 'スケジュール済み',
    ongoing: '進行中',
    completed: '完了',
    cancelled: 'キャンセル'
  }
  return statusMap[status] || status
}

// 初期化
onMounted(() => {
  // サンプルデータの作成
  const sampleMeetings: Meeting[] = [
    {
      id: '1',
      title: '週次チームミーティング',
      description: 'プロジェクトの進捗確認',
      startTime: new Date(2024, 0, 15, 10, 0),
      endTime: new Date(2024, 0, 15, 11, 0),
      room: 'room1',
      participants: [
        { email: 'user1@example.com', name: 'ユーザー1', avatar: '👨‍💻', status: 'accepted' },
        { email: 'user2@example.com', name: 'ユーザー2', avatar: '👩‍💻', status: 'pending' }
      ],
      type: 'meeting',
      status: 'scheduled',
      recurring: true,
      recurringType: 'weekly'
    }
  ]

  meetings.value = sampleMeetings
})
</script>

<style scoped>
.meeting-scheduler {
  padding: var(--spacing-6);
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-6);
}

.calendar-nav {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
}

.nav-btn {
  background: var(--color-gray-200);
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  transition: var(--transition-normal);
}

.nav-btn:hover {
  background: var(--color-gray-300);
}

.calendar-title {
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--color-gray-800);
  margin: 0;
}

.calendar-actions {
  display: flex;
  gap: var(--spacing-3);
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

.calendar-grid {
  background: white;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: var(--color-gray-100);
}

.weekday {
  padding: var(--spacing-3);
  text-align: center;
  font-weight: 600;
  color: var(--color-gray-600);
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.calendar-day {
  min-height: 100px;
  padding: var(--spacing-2);
  border: 1px solid var(--color-gray-200);
  cursor: pointer;
  transition: var(--transition-fast);
}

.calendar-day:hover {
  background: var(--color-gray-50);
}

.calendar-day.other-month {
  color: var(--color-gray-400);
  background: var(--color-gray-50);
}

.calendar-day.today {
  background: rgba(255, 107, 107, 0.1);
  border-color: var(--color-primary);
}

.calendar-day.selected {
  background: var(--color-primary);
  color: white;
}

.calendar-day.has-meetings {
  background: rgba(255, 107, 107, 0.05);
}

.day-number {
  font-weight: 600;
  margin-bottom: var(--spacing-1);
}

.day-meetings {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.day-meeting {
  background: var(--color-primary);
  color: white;
  padding: var(--spacing-1);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meeting-presentation {
  background: #2196f3;
}

.meeting-workshop {
  background: #ff9800;
}

.meeting-standup {
  background: #4caf50;
}

.more-meetings {
  font-size: var(--text-xs);
  color: var(--color-gray-600);
  font-weight: 500;
}

.today-meetings {
  margin-top: var(--spacing-8);
}

.today-meetings h3 {
  color: var(--color-primary);
  margin-bottom: var(--spacing-4);
}

.no-meetings {
  color: var(--color-gray-500);
  text-align: center;
  padding: var(--spacing-6);
  font-style: italic;
}

.meetings-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.meeting-card {
  display: flex;
  align-items: center;
  padding: var(--spacing-4);
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: var(--transition-normal);
  border-left: 4px solid var(--color-primary);
}

.meeting-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.meeting-time {
  font-weight: 600;
  color: var(--color-primary);
  margin-right: var(--spacing-4);
  min-width: 80px;
}

.meeting-details {
  flex: 1;
}

.meeting-title {
  font-weight: 600;
  color: var(--color-gray-800);
  margin-bottom: var(--spacing-1);
}

.meeting-room {
  color: var(--color-gray-600);
  font-size: var(--text-sm);
}

.meeting-status {
  margin-left: var(--spacing-4);
}

.status-indicator {
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
}

.status-scheduled {
  background: #e3f2fd;
  color: #1976d2;
}

.status-ongoing {
  background: #e8f5e8;
  color: #388e3c;
}

.status-completed {
  background: #f3e5f5;
  color: #7b1fa2;
}

.status-cancelled {
  background: #ffebee;
  color: #d32f2f;
}

/* モーダルスタイル */
.modal-overlay {
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
  max-width: 600px;
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-4);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-2);
  font-weight: 600;
  color: var(--color-gray-700);
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: var(--spacing-3);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  transition: var(--transition-normal);
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.1);
}

.form-textarea {
  height: 80px;
  resize: vertical;
}

.participants-input {
  display: flex;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-3);
}

.participants-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
}

.participant-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-3);
  background: var(--color-gray-100);
  border-radius: var(--radius-full);
}

.participant-avatar {
  font-size: 1.2rem;
}

.participant-name {
  font-weight: 500;
  color: var(--color-gray-700);
}

.remove-btn {
  background: none;
  border: none;
  color: var(--color-gray-500);
  cursor: pointer;
  font-size: 0.8rem;
}

.meeting-types {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-2);
}

.type-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition-normal);
}

.type-option:hover {
  border-color: var(--color-primary);
}

.type-option input[type="radio"] {
  margin: 0;
}

.type-icon {
  font-size: 1.2rem;
}

.type-label {
  font-weight: 500;
  color: var(--color-gray-700);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  cursor: pointer;
}

.meeting-actions {
  display: flex;
  gap: var(--spacing-2);
  align-items: center;
}

.btn-danger {
  background: #f44336;
  color: white;
  border: none;
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-weight: 500;
  transition: var(--transition-normal);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: var(--color-gray-500);
}

.meeting-info {
  margin-bottom: var(--spacing-6);
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-3);
}

.info-label {
  font-weight: 600;
  color: var(--color-gray-700);
  min-width: 80px;
}

.info-value {
  color: var(--color-gray-600);
}

.participants-preview {
  display: flex;
  gap: var(--spacing-2);
}

.meeting-controls {
  display: flex;
  gap: var(--spacing-3);
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .calendar-header {
    flex-direction: column;
    gap: var(--spacing-4);
  }

  .calendar-actions {
    width: 100%;
    justify-content: center;
  }

  .calendar-day {
    min-height: 80px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .meeting-types {
    grid-template-columns: 1fr;
  }

  .meeting-card {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-2);
  }

  .meeting-time {
    margin-right: 0;
    min-width: auto;
  }
}
</style>
