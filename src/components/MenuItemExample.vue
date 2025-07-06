<template>
  <div class="p-8 max-w-6xl mx-auto">
    <h1 class="text-3xl font-bold mb-8 text-gray-800">MenuItem & Menu コンポーネント</h1>

    <!-- 基本的なメニューアイテム -->
    <section class="mb-12">
      <h2 class="text-2xl font-semibold mb-6 text-gray-700">基本的なメニューアイテム</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">標準メニューアイテム</h3>
          <div class="border rounded-lg overflow-hidden">
            <ul role="menu" class="py-2">
              <MenuItem
                v-for="item in basicItems"
                :key="item.id"
                :value="item.id"
                @click="handleMenuItemClick"
              >
                <div class="flex items-center">
                  <component :is="item.icon" class="w-5 h-5 mr-3 text-gray-500" />
                  <span>{{ item.label }}</span>
                </div>
              </MenuItem>
            </ul>
          </div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">密度の高いメニュー</h3>
          <div class="border rounded-lg overflow-hidden">
            <ul role="menu" class="py-1">
              <MenuItem
                v-for="item in basicItems"
                :key="item.id"
                :value="item.id"
                dense
                @click="handleMenuItemClick"
              >
                <div class="flex items-center">
                  <component :is="item.icon" class="w-4 h-4 mr-2 text-gray-500" />
                  <span>{{ item.label }}</span>
                </div>
              </MenuItem>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- 状態バリエーション -->
    <section class="mb-12">
      <h2 class="text-2xl font-semibold mb-6 text-gray-700">状態バリエーション</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">選択状態</h3>
          <div class="border rounded-lg overflow-hidden">
            <ul role="menu" class="py-2">
              <MenuItem
                v-for="item in selectableItems"
                :key="item.id"
                :value="item.id"
                :selected="selectedItem === item.id"
                @click="handleSelectableClick"
              >
                <div class="flex items-center">
                  <component :is="item.icon" class="w-5 h-5 mr-3" />
                  <span>{{ item.label }}</span>
                  <CheckIcon v-if="selectedItem === item.id" class="w-4 h-4 ml-auto text-blue-600" />
                </div>
              </MenuItem>
            </ul>
          </div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">無効状態・区切り線</h3>
          <div class="border rounded-lg overflow-hidden">
            <ul role="menu" class="py-2">
              <MenuItem>
                <div class="flex items-center">
                  <HomeIcon class="w-5 h-5 mr-3 text-gray-500" />
                  <span>ホーム</span>
                </div>
              </MenuItem>
              <MenuItem>
                <div class="flex items-center">
                  <SettingsIcon class="w-5 h-5 mr-3 text-gray-500" />
                  <span>設定</span>
                </div>
              </MenuItem>
              <MenuItem divider disabled>
                <div class="flex items-center">
                  <LockIcon class="w-5 h-5 mr-3 text-gray-400" />
                  <span>無効なアイテム</span>
                </div>
              </MenuItem>
              <MenuItem>
                <div class="flex items-center">
                  <LogoutIcon class="w-5 h-5 mr-3 text-gray-500" />
                  <span>ログアウト</span>
                </div>
              </MenuItem>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- ドロップダウンメニュー -->
    <section class="mb-12">
      <h2 class="text-2xl font-semibold mb-6 text-gray-700">ドロップダウンメニュー</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">基本ドロップダウン</h3>
          <button
            ref="basicMenuAnchor"
            @click="toggleBasicMenu"
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
          >
            <span>メニューを開く</span>
            <ChevronDownIcon class="w-4 h-4 ml-2" />
          </button>

          <Menu
            :open="basicMenuOpen"
            :anchor-el="basicMenuAnchor"
            @close="basicMenuOpen = false"
          >
            <MenuItem
              v-for="action in menuActions"
              :key="action.id"
              :value="action.id"
              @click="handleActionClick"
            >
              <div class="flex items-center">
                <component :is="action.icon" class="w-5 h-5 mr-3 text-gray-500" />
                <span>{{ action.label }}</span>
              </div>
            </MenuItem>
          </Menu>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">右クリックメニュー</h3>
          <div
            @contextmenu="handleContextMenu"
            class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500 cursor-pointer hover:border-gray-400"
          >
            右クリックしてメニューを表示
          </div>

          <Menu
            :open="contextMenuOpen"
            :anchor-el="contextMenuAnchor"
            anchor-origin-horizontal="right"
            anchor-origin-vertical="top"
            transform-origin-horizontal="left"
            transform-origin-vertical="top"
            @close="contextMenuOpen = false"
          >
            <MenuItem
              v-for="action in contextActions"
              :key="action.id"
              :value="action.id"
              :disabled="action.disabled"
              @click="handleContextAction"
            >
              <div class="flex items-center">
                <component :is="action.icon" class="w-5 h-5 mr-3 text-gray-500" />
                <span>{{ action.label }}</span>
                <span v-if="action.shortcut" class="ml-auto text-xs text-gray-400">{{ action.shortcut }}</span>
              </div>
            </MenuItem>
          </Menu>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">アバターメニュー</h3>
          <button
            ref="avatarMenuAnchor"
            @click="toggleAvatarMenu"
            class="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100"
          >
            <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              田
            </div>
            <span class="text-gray-700">田中太郎</span>
            <ChevronDownIcon class="w-4 h-4 text-gray-500" />
          </button>

          <Menu
            :open="avatarMenuOpen"
            :anchor-el="avatarMenuAnchor"
            anchor-origin-horizontal="right"
            anchor-origin-vertical="bottom"
            transform-origin-horizontal="right"
            transform-origin-vertical="top"
            @close="avatarMenuOpen = false"
          >
            <MenuItem disabled>
              <div class="flex items-center">
                <div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium mr-3">
                  田
                </div>
                <div>
                  <div class="font-medium">田中太郎</div>
                  <div class="text-xs text-gray-500">tanaka@example.com</div>
                </div>
              </div>
            </MenuItem>
            <MenuItem divider />
            <MenuItem
              v-for="action in userActions"
              :key="action.id"
              :value="action.id"
              @click="handleUserAction"
            >
              <div class="flex items-center">
                <component :is="action.icon" class="w-5 h-5 mr-3 text-gray-500" />
                <span>{{ action.label }}</span>
              </div>
            </MenuItem>
          </Menu>
        </div>
      </div>
    </section>

    <!-- ネストメニュー -->
    <section class="mb-12">
      <h2 class="text-2xl font-semibold mb-6 text-gray-700">複雑なメニュー</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">カテゴリ分けメニュー</h3>
          <button
            ref="categoryMenuAnchor"
            @click="toggleCategoryMenu"
            class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            カテゴリメニュー
          </button>

          <Menu
            :open="categoryMenuOpen"
            :anchor-el="categoryMenuAnchor"
            @close="categoryMenuOpen = false"
            max-width="250"
          >
            <!-- ファイル操作 -->
            <div class="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              ファイル操作
            </div>
            <MenuItem
              v-for="action in fileActions"
              :key="action.id"
              :value="action.id"
              @click="handleCategoryAction"
            >
              <div class="flex items-center">
                <component :is="action.icon" class="w-5 h-5 mr-3 text-gray-500" />
                <span>{{ action.label }}</span>
              </div>
            </MenuItem>

            <MenuItem divider />

            <!-- 編集操作 -->
            <div class="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              編集操作
            </div>
            <MenuItem
              v-for="action in editActions"
              :key="action.id"
              :value="action.id"
              @click="handleCategoryAction"
            >
              <div class="flex items-center">
                <component :is="action.icon" class="w-5 h-5 mr-3 text-gray-500" />
                <span>{{ action.label }}</span>
                <span v-if="action.shortcut" class="ml-auto text-xs text-gray-400">{{ action.shortcut }}</span>
              </div>
            </MenuItem>
          </Menu>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">検索可能メニュー</h3>
          <button
            ref="searchMenuAnchor"
            @click="toggleSearchMenu"
            class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            検索メニュー
          </button>

          <Menu
            :open="searchMenuOpen"
            :anchor-el="searchMenuAnchor"
            @close="searchMenuOpen = false"
            max-width="300"
          >
            <div class="p-2 border-b border-gray-200">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="メニューを検索..."
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                @click.stop
              />
            </div>
            <MenuItem
              v-for="item in filteredSearchItems"
              :key="item.id"
              :value="item.id"
              @click="handleSearchAction"
            >
              <div class="flex items-center">
                <component :is="item.icon" class="w-5 h-5 mr-3 text-gray-500" />
                <span>{{ item.label }}</span>
                <span v-if="item.description" class="ml-auto text-xs text-gray-400">{{ item.description }}</span>
              </div>
            </MenuItem>
            <div v-if="filteredSearchItems.length === 0" class="px-4 py-8 text-center text-gray-500">
              検索結果が見つかりません
            </div>
          </Menu>
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
          メニューアイテムをクリックするとイベントログが表示されます
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import MenuItem from './MenuItem.vue'
import Menu from './Menu.vue'

// アイコンコンポーネント
const HomeIcon = {
  template: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`
}

const SettingsIcon = {
  template: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg>`
}

const UserIcon = {
  template: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`
}

const NotificationIcon = {
  template: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>`
}

const CheckIcon = {
  template: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`
}

const LockIcon = {
  template: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>`
}

const LogoutIcon = {
  template: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>`
}

const ChevronDownIcon = {
  template: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>`
}

const EditIcon = {
  template: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`
}

const DeleteIcon = {
  template: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`
}

const CopyIcon = {
  template: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`
}

const SaveIcon = {
  template: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>`
}

const FolderIcon = {
  template: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/></svg>`
}

const SearchIcon = {
  template: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>`
}

// データ
const basicItems = ref([
  { id: 1, label: 'ホーム', icon: HomeIcon },
  { id: 2, label: '設定', icon: SettingsIcon },
  { id: 3, label: 'ユーザー', icon: UserIcon },
  { id: 4, label: '通知', icon: NotificationIcon }
])

const selectableItems = ref([
  { id: 1, label: 'リスト表示', icon: HomeIcon },
  { id: 2, label: 'グリッド表示', icon: SettingsIcon },
  { id: 3, label: 'カード表示', icon: UserIcon }
])

const menuActions = ref([
  { id: 1, label: '新規作成', icon: EditIcon },
  { id: 2, label: '開く', icon: FolderIcon },
  { id: 3, label: '保存', icon: SaveIcon },
  { id: 4, label: '削除', icon: DeleteIcon }
])

const contextActions = ref([
  { id: 1, label: 'コピー', icon: CopyIcon, shortcut: 'Ctrl+C' },
  { id: 2, label: '切り取り', icon: EditIcon, shortcut: 'Ctrl+X' },
  { id: 3, label: '貼り付け', icon: SaveIcon, shortcut: 'Ctrl+V', disabled: true },
  { id: 4, label: '削除', icon: DeleteIcon, shortcut: 'Del' }
])

const userActions = ref([
  { id: 1, label: 'プロフィール', icon: UserIcon },
  { id: 2, label: '設定', icon: SettingsIcon },
  { id: 3, label: 'ログアウト', icon: LogoutIcon }
])

const fileActions = ref([
  { id: 1, label: '新規ファイル', icon: EditIcon },
  { id: 2, label: 'フォルダを開く', icon: FolderIcon },
  { id: 3, label: '保存', icon: SaveIcon }
])

const editActions = ref([
  { id: 1, label: 'コピー', icon: CopyIcon, shortcut: 'Ctrl+C' },
  { id: 2, label: '切り取り', icon: EditIcon, shortcut: 'Ctrl+X' },
  { id: 3, label: '削除', icon: DeleteIcon, shortcut: 'Del' }
])

const searchItems = ref([
  { id: 1, label: 'ダッシュボード', icon: HomeIcon, description: 'メイン画面' },
  { id: 2, label: 'ユーザー管理', icon: UserIcon, description: '権限設定' },
  { id: 3, label: 'システム設定', icon: SettingsIcon, description: '全般設定' },
  { id: 4, label: '通知設定', icon: NotificationIcon, description: 'アラート' },
  { id: 5, label: 'ファイル管理', icon: FolderIcon, description: 'ドキュメント' },
  { id: 6, label: '検索機能', icon: SearchIcon, description: '高度検索' }
])

// 状態管理
const selectedItem = ref<number | null>(null)
const searchQuery = ref('')

// メニュー状態
const basicMenuOpen = ref(false)
const basicMenuAnchor = ref<HTMLElement>()

const contextMenuOpen = ref(false)
const contextMenuAnchor = ref<HTMLElement>()

const avatarMenuOpen = ref(false)
const avatarMenuAnchor = ref<HTMLElement>()

const categoryMenuOpen = ref(false)
const categoryMenuAnchor = ref<HTMLElement>()

const searchMenuOpen = ref(false)
const searchMenuAnchor = ref<HTMLElement>()

// 計算プロパティ
const filteredSearchItems = computed(() => {
  if (!searchQuery.value) return searchItems.value

  const query = searchQuery.value.toLowerCase()
  return searchItems.value.filter(item =>
    item.label.toLowerCase().includes(query) ||
    item.description.toLowerCase().includes(query)
  )
})

// イベントログ
interface EventLog {
  timestamp: string
  message: string
}

const eventLogs = ref<EventLog[]>([])

// イベントハンドラー
const logEvent = (message: string) => {
  const timestamp = new Date().toLocaleTimeString()
  eventLogs.value.unshift({
    timestamp,
    message
  })

  if (eventLogs.value.length > 10) {
    eventLogs.value = eventLogs.value.slice(0, 10)
  }
}

const handleMenuItemClick = (payload: { event: MouseEvent; value?: any }) => {
  const value = payload.value as number
  const item = basicItems.value.find(i => i.id === value)
  logEvent(`基本メニュー: ${item?.label} がクリックされました`)
}

const handleSelectableClick = (payload: { event: MouseEvent; value?: any }) => {
  const value = payload.value as number
  selectedItem.value = value
  const item = selectableItems.value.find(i => i.id === value)
  logEvent(`選択可能メニュー: ${item?.label} が選択されました`)
}

const toggleBasicMenu = () => {
  basicMenuOpen.value = !basicMenuOpen.value
}

const handleActionClick = (payload: { event: MouseEvent; value?: any }) => {
  const value = payload.value as number
  const action = menuActions.value.find(a => a.id === value)
  logEvent(`アクション: ${action?.label} が実行されました`)
  basicMenuOpen.value = false
}

const handleContextMenu = (event: MouseEvent) => {
  event.preventDefault()
  contextMenuAnchor.value = {
    getBoundingClientRect: () => ({
      left: event.clientX,
      top: event.clientY,
      right: event.clientX,
      bottom: event.clientY,
      width: 0,
      height: 0
    })
  } as HTMLElement
  contextMenuOpen.value = true
}

const handleContextAction = (payload: { event: MouseEvent; value?: any }) => {
  const value = payload.value as number
  const action = contextActions.value.find(a => a.id === value)
  logEvent(`コンテキストメニュー: ${action?.label} が実行されました`)
  contextMenuOpen.value = false
}

const toggleAvatarMenu = () => {
  avatarMenuOpen.value = !avatarMenuOpen.value
}

const handleUserAction = (payload: { event: MouseEvent; value?: any }) => {
  const value = payload.value as number
  const action = userActions.value.find(a => a.id === value)
  logEvent(`ユーザーアクション: ${action?.label} が実行されました`)
  avatarMenuOpen.value = false
}

const toggleCategoryMenu = () => {
  categoryMenuOpen.value = !categoryMenuOpen.value
}

const handleCategoryAction = (payload: { event: MouseEvent; value?: any }) => {
  const value = payload.value as number
  const allActions = [...fileActions.value, ...editActions.value]
  const action = allActions.find(a => a.id === value)
  logEvent(`カテゴリアクション: ${action?.label} が実行されました`)
  categoryMenuOpen.value = false
}

const toggleSearchMenu = () => {
  searchMenuOpen.value = !searchMenuOpen.value
  if (searchMenuOpen.value) {
    searchQuery.value = ''
  }
}

const handleSearchAction = (payload: { event: MouseEvent; value?: any }) => {
  const value = payload.value as number
  const item = searchItems.value.find(i => i.id === value)
  logEvent(`検索メニュー: ${item?.label} が選択されました`)
  searchMenuOpen.value = false
}
</script>
