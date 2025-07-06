<template>
  <div class="p-8 max-w-6xl mx-auto">
    <h1 class="text-3xl font-bold mb-8 text-gray-800">ListItem コンポーネント</h1>

    <!-- 基本的なリストアイテム -->
    <section class="mb-12">
      <h2 class="text-2xl font-semibold mb-6 text-gray-700">基本的なリストアイテム</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
          <h3 class="text-lg font-medium p-4 bg-gray-50 text-gray-600">シンプルなリスト</h3>
          <ul class="divide-y divide-gray-200">
            <ListItem
              v-for="item in simpleItems"
              :key="item.id"
              @click="handleClick(`Simple: ${item.text}`)"
            >
              <ListItemText :primary="item.text" />
            </ListItem>
          </ul>
        </div>

        <div class="bg-white rounded-lg shadow-md overflow-hidden">
          <h3 class="text-lg font-medium p-4 bg-gray-50 text-gray-600">区切り線付きリスト</h3>
          <ul>
            <ListItem
              v-for="(item, index) in simpleItems"
              :key="item.id"
              :divider="index < simpleItems.length - 1"
              @click="handleClick(`Divider: ${item.text}`)"
            >
              <ListItemText :primary="item.text" />
            </ListItem>
          </ul>
        </div>
      </div>
    </section>

    <!-- アイコン付きリスト -->
    <section class="mb-12">
      <h2 class="text-2xl font-semibold mb-6 text-gray-700">アイコン付きリスト</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
          <h3 class="text-lg font-medium p-4 bg-gray-50 text-gray-600">アイコン + テキスト</h3>
          <ul class="divide-y divide-gray-200">
            <ListItem
              v-for="item in iconItems"
              :key="item.id"
              button
              @click="handleClick(`Icon: ${item.text}`)"
            >
              <ListItemIcon :icon="item.icon" />
              <ListItemText :primary="item.text" :secondary="item.description" />
            </ListItem>
          </ul>
        </div>

        <div class="bg-white rounded-lg shadow-md overflow-hidden">
          <h3 class="text-lg font-medium p-4 bg-gray-50 text-gray-600">密度の高いリスト</h3>
          <ul class="divide-y divide-gray-200">
            <ListItem
              v-for="item in iconItems"
              :key="item.id"
              button
              dense
              @click="handleClick(`Dense: ${item.text}`)"
            >
              <ListItemIcon :icon="item.icon" dense />
              <ListItemText :primary="item.text" />
            </ListItem>
          </ul>
        </div>
      </div>
    </section>

    <!-- アバター付きリスト -->
    <section class="mb-12">
      <h2 class="text-2xl font-semibold mb-6 text-gray-700">アバター付きリスト</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
          <h3 class="text-lg font-medium p-4 bg-gray-50 text-gray-600">ユーザーリスト</h3>
          <ul class="divide-y divide-gray-200">
            <ListItem
              v-for="user in users"
              :key="user.id"
              button
              @click="handleClick(`User: ${user.name}`)"
            >
              <ListItemAvatar
                :src="user.avatar"
                :alt="user.name"
                :initials="user.initials"
                :avatar-color="user.color"
              />
              <ListItemText
                :primary="user.name"
                :secondary="user.email"
              />
            </ListItem>
          </ul>
        </div>

        <div class="bg-white rounded-lg shadow-md overflow-hidden">
          <h3 class="text-lg font-medium p-4 bg-gray-50 text-gray-600">セカンダリアクション付き</h3>
          <ul class="divide-y divide-gray-200">
            <ListItem
              v-for="user in users"
              :key="user.id"
              button
              secondary-action
              @click="handleClick(`User Action: ${user.name}`)"
            >
              <ListItemAvatar
                :src="user.avatar"
                :alt="user.name"
                :initials="user.initials"
                :avatar-color="user.color"
              />
              <ListItemText
                :primary="user.name"
                :secondary="user.status"
              />
              <template #secondary-action>
                <IconButton
                  :icon="MoreIcon"
                  skin="normalWithHover"
                  aria-label="その他のオプション"
                  @click.stop="handleSecondaryAction(user.name)"
                />
              </template>
            </ListItem>
          </ul>
        </div>
      </div>
    </section>

    <!-- 選択可能なリスト -->
    <section class="mb-12">
      <h2 class="text-2xl font-semibold mb-6 text-gray-700">選択可能なリスト</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
          <h3 class="text-lg font-medium p-4 bg-gray-50 text-gray-600">単一選択</h3>
          <ul class="divide-y divide-gray-200">
            <ListItem
              v-for="option in selectableOptions"
              :key="option.id"
              button
              :selected="selectedOption === option.id"
              @click="selectedOption = option.id"
            >
              <ListItemIcon :icon="option.icon" />
              <ListItemText :primary="option.text" :secondary="option.description" />
            </ListItem>
          </ul>
        </div>

        <div class="bg-white rounded-lg shadow-md overflow-hidden">
          <h3 class="text-lg font-medium p-4 bg-gray-50 text-gray-600">複数選択</h3>
          <ul class="divide-y divide-gray-200">
            <ListItem
              v-for="option in selectableOptions"
              :key="option.id"
              button
              :selected="selectedMultiple.includes(option.id)"
              @click="toggleMultipleSelection(option.id)"
            >
              <ListItemIcon :icon="CheckIcon" v-if="selectedMultiple.includes(option.id)" />
              <ListItemIcon :icon="option.icon" v-else />
              <ListItemText :primary="option.text" :secondary="option.description" />
            </ListItem>
          </ul>
        </div>
      </div>
    </section>

    <!-- 特殊なケース -->
    <section class="mb-12">
      <h2 class="text-2xl font-semibold mb-6 text-gray-700">特殊なケース</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
          <h3 class="text-lg font-medium p-4 bg-gray-50 text-gray-600">無効状態</h3>
          <ul class="divide-y divide-gray-200">
            <ListItem button disabled>
              <ListItemIcon :icon="LockIcon" />
              <ListItemText primary="無効なアイテム" secondary="クリックできません" />
            </ListItem>
            <ListItem button>
              <ListItemIcon :icon="UnlockIcon" />
              <ListItemText primary="有効なアイテム" secondary="クリック可能です" />
            </ListItem>
          </ul>
        </div>

        <div class="bg-white rounded-lg shadow-md overflow-hidden">
          <h3 class="text-lg font-medium p-4 bg-gray-50 text-gray-600">カスタムアライメント</h3>
          <ul class="divide-y divide-gray-200">
            <ListItem align-items="flex-start">
              <ListItemAvatar initials="A" avatar-color="#3b82f6" />
              <ListItemText
                primary="上揃えのアイテム"
                secondary="このアイテムは上揃えで表示されます。長いテキストがある場合に便利です。複数行にわたるテキストでも適切に表示されます。"
              />
            </ListItem>
            <ListItem align-items="center">
              <ListItemAvatar initials="B" avatar-color="#10b981" />
              <ListItemText
                primary="中央揃えのアイテム"
                secondary="デフォルトの中央揃えです"
              />
            </ListItem>
          </ul>
        </div>
      </div>
    </section>

    <!-- イベントログ -->
    <section class="mb-8">
      <h2 class="text-2xl font-semibold mb-4 text-gray-700">イベントログ</h2>
      <div class="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-40 overflow-y-auto">
        <div v-for="(log, index) in eventLogs" :key="index" class="mb-1">
          <span class="text-gray-500">{{ log.timestamp }}</span>
          <span class="ml-2">{{ log.message }}</span>
        </div>
        <div v-if="eventLogs.length === 0" class="text-gray-500">
          リストアイテムをクリックするとイベントログが表示されます
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ListItem from './ListItem.vue'
import ListItemText from './ListItemText.vue'
import ListItemIcon from './ListItemIcon.vue'
import ListItemAvatar from './ListItemAvatar.vue'
import IconButton from './IconButton.vue'

// アイコンコンポーネント
const HomeIcon = {
  template: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`
}

const SettingsIcon = {
  template: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg>`
}

const NotificationIcon = {
  template: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>`
}

const MessageIcon = {
  template: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>`
}

const CheckIcon = {
  template: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`
}

const LockIcon = {
  template: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>`
}

const UnlockIcon = {
  template: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2z"/></svg>`
}

const MoreIcon = {
  template: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>`
}

// データ
const simpleItems = ref([
  { id: 1, text: 'ホーム' },
  { id: 2, text: '設定' },
  { id: 3, text: '通知' },
  { id: 4, text: 'メッセージ' }
])

const iconItems = ref([
  { id: 1, text: 'ホーム', description: 'メインダッシュボード', icon: HomeIcon },
  { id: 2, text: '設定', description: 'アプリケーション設定', icon: SettingsIcon },
  { id: 3, text: '通知', description: '新しい通知を確認', icon: NotificationIcon },
  { id: 4, text: 'メッセージ', description: 'チャットメッセージ', icon: MessageIcon }
])

const users = ref([
  {
    id: 1,
    name: '田中太郎',
    email: 'tanaka@example.com',
    status: 'オンライン',
    avatar: '',
    initials: '田太',
    color: '#3b82f6'
  },
  {
    id: 2,
    name: '佐藤花子',
    email: 'sato@example.com',
    status: 'オフライン',
    avatar: '',
    initials: '佐花',
    color: '#10b981'
  },
  {
    id: 3,
    name: '鈴木一郎',
    email: 'suzuki@example.com',
    status: '取り込み中',
    avatar: '',
    initials: '鈴一',
    color: '#f59e0b'
  },
  {
    id: 4,
    name: '高橋美咲',
    email: 'takahashi@example.com',
    status: 'オンライン',
    avatar: '',
    initials: '高美',
    color: '#ec4899'
  }
])

const selectableOptions = ref([
  { id: 1, text: 'ダッシュボード', description: 'メイン画面', icon: HomeIcon },
  { id: 2, text: '設定', description: '環境設定', icon: SettingsIcon },
  { id: 3, text: '通知', description: 'アラート設定', icon: NotificationIcon },
  { id: 4, text: 'メッセージ', description: 'チャット機能', icon: MessageIcon }
])

// 状態管理
const selectedOption = ref<number | null>(null)
const selectedMultiple = ref<number[]>([])

interface EventLog {
  timestamp: string
  message: string
}

const eventLogs = ref<EventLog[]>([])

// イベントハンドラー
const handleClick = (message: string) => {
  const timestamp = new Date().toLocaleTimeString()
  eventLogs.value.unshift({
    timestamp,
    message: `クリック: ${message}`
  })

  // ログが多くなりすぎないよう制限
  if (eventLogs.value.length > 10) {
    eventLogs.value = eventLogs.value.slice(0, 10)
  }
}

const handleSecondaryAction = (userName: string) => {
  const timestamp = new Date().toLocaleTimeString()
  eventLogs.value.unshift({
    timestamp,
    message: `セカンダリアクション: ${userName}のメニューを開く`
  })

  if (eventLogs.value.length > 10) {
    eventLogs.value = eventLogs.value.slice(0, 10)
  }
}

const toggleMultipleSelection = (id: number) => {
  const index = selectedMultiple.value.indexOf(id)
  if (index > -1) {
    selectedMultiple.value.splice(index, 1)
  } else {
    selectedMultiple.value.push(id)
  }

  handleClick(`複数選択: ${selectedMultiple.value.length}個選択中`)
}
</script>
