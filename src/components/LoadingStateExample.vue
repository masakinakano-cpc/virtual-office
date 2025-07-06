<template>
  <div class="p-8 max-w-6xl mx-auto">
    <h1 class="text-3xl font-bold mb-8 text-gray-800">LoadingState コンポーネント</h1>

    <!-- ローディングタイプ -->
    <section class="mb-12">
      <h2 class="text-2xl font-semibold mb-6 text-gray-700">ローディングタイプ</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">スピナー</h3>
          <LoadingState type="spinner" />
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">ドット</h3>
          <LoadingState type="dots" />
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">バー</h3>
          <LoadingState type="bars" />
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">プログレスバー</h3>
          <LoadingState type="progress" :progress="progressValue" />
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">不確定プログレス</h3>
          <LoadingState type="progress" indeterminate />
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">テキスト付き</h3>
          <LoadingState type="text" text="読み込み中..." />
        </div>
      </div>
    </section>

    <!-- サイズバリエーション -->
    <section class="mb-12">
      <h2 class="text-2xl font-semibold mb-6 text-gray-700">サイズバリエーション</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">Mini</h3>
          <LoadingState type="spinner" size="mini" />
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">Small</h3>
          <LoadingState type="spinner" size="small" />
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">Medium</h3>
          <LoadingState type="spinner" size="medium" />
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">Large</h3>
          <LoadingState type="spinner" size="large" />
        </div>
      </div>
    </section>

    <!-- カラーバリエーション -->
    <section class="mb-12">
      <h2 class="text-2xl font-semibold mb-6 text-gray-700">カラーバリエーション</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">Primary</h3>
          <LoadingState type="spinner" color="primary" />
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">Success</h3>
          <LoadingState type="spinner" color="success" />
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">Warning</h3>
          <LoadingState type="spinner" color="warning" />
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">Error</h3>
          <LoadingState type="spinner" color="error" />
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">Info</h3>
          <LoadingState type="spinner" color="info" />
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">Secondary</h3>
          <LoadingState type="spinner" color="secondary" />
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">Gray</h3>
          <LoadingState type="spinner" color="gray" />
        </div>
      </div>
    </section>

    <!-- 実用例 -->
    <section class="mb-12">
      <h2 class="text-2xl font-semibold mb-6 text-gray-700">実用例</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">カード内ローディング</h3>
          <div class="border rounded-lg p-4 bg-gray-50">
            <div class="flex items-center justify-between mb-4">
              <h4 class="font-medium">データ読み込み中</h4>
              <button
                @click="toggleCardLoading"
                class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                {{ cardLoading ? '停止' : '開始' }}
              </button>
            </div>
            <div v-if="cardLoading" class="py-8">
              <LoadingState type="spinner" text="データを読み込んでいます..." />
            </div>
            <div v-else class="py-4">
              <p class="text-gray-600">データが読み込まれました。</p>
            </div>
          </div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">フォーム送信</h3>
          <div class="border rounded-lg p-4 bg-gray-50">
            <div class="flex items-center justify-between mb-4">
              <h4 class="font-medium">フォーム送信</h4>
              <button
                @click="toggleFormLoading"
                :disabled="formLoading"
                class="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50"
              >
                {{ formLoading ? '送信中...' : '送信' }}
              </button>
            </div>
            <div v-if="formLoading" class="py-4">
              <LoadingState type="progress" :progress="formProgress" />
              <p class="text-sm text-gray-600 mt-2 text-center">{{ formProgress }}% 完了</p>
            </div>
            <div v-else class="py-4">
              <p class="text-gray-600">フォームを送信する準備ができました。</p>
            </div>
          </div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">ファイルアップロード</h3>
          <div class="border rounded-lg p-4 bg-gray-50">
            <div class="flex items-center justify-between mb-4">
              <h4 class="font-medium">ファイルアップロード</h4>
              <button
                @click="toggleFileUpload"
                :disabled="fileUploading"
                class="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 disabled:opacity-50"
              >
                {{ fileUploading ? 'アップロード中...' : 'アップロード' }}
              </button>
            </div>
            <div v-if="fileUploading" class="py-4">
              <LoadingState type="bars" color="info" text="ファイルをアップロードしています..." />
            </div>
            <div v-else class="py-4">
              <p class="text-gray-600">ファイルをアップロードする準備ができました。</p>
            </div>
          </div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">検索結果</h3>
          <div class="border rounded-lg p-4 bg-gray-50">
            <div class="flex items-center justify-between mb-4">
              <h4 class="font-medium">検索</h4>
              <button
                @click="toggleSearchLoading"
                :disabled="searchLoading"
                class="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 disabled:opacity-50"
              >
                {{ searchLoading ? '検索中...' : '検索' }}
              </button>
            </div>
            <div v-if="searchLoading" class="py-4">
              <LoadingState type="dots" color="warning" />
            </div>
            <div v-else class="py-4">
              <p class="text-gray-600">検索結果が表示されます。</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- オーバーレイローディング -->
    <section class="mb-12">
      <h2 class="text-2xl font-semibold mb-6 text-gray-700">オーバーレイローディング</h2>
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h3 class="text-lg font-medium mb-4 text-gray-600">全画面ローディング</h3>
        <div class="flex gap-4">
          <button
            @click="showOverlay"
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            オーバーレイ表示
          </button>
          <button
            @click="showOverlayWithProgress"
            class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            プログレス付きオーバーレイ
          </button>
        </div>
      </div>
    </section>

    <!-- カスタムローダー -->
    <section class="mb-12">
      <h2 class="text-2xl font-semibold mb-6 text-gray-700">カスタムローダー</h2>
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h3 class="text-lg font-medium mb-4 text-gray-600">カスタムアニメーション</h3>
        <LoadingState type="custom" color="primary">
          <template #loader>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
              <div class="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
              <div class="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
              <div class="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0.3s"></div>
            </div>
          </template>
        </LoadingState>
      </div>
    </section>

    <!-- オーバーレイコンポーネント -->
    <LoadingState
      v-if="overlayVisible"
      type="text"
      text="処理中です..."
      overlay
      @click="hideOverlay"
    />

    <LoadingState
      v-if="overlayProgressVisible"
      type="progress"
      :progress="overlayProgress"
      overlay
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import LoadingState from './LoadingState.vue'

// 状態管理
const progressValue = ref(0)
const cardLoading = ref(false)
const formLoading = ref(false)
const formProgress = ref(0)
const fileUploading = ref(false)
const searchLoading = ref(false)
const overlayVisible = ref(false)
const overlayProgressVisible = ref(false)
const overlayProgress = ref(0)

// インターバル管理
let progressInterval: ReturnType<typeof setInterval> | null = null
let formProgressInterval: ReturnType<typeof setInterval> | null = null
let overlayProgressInterval: ReturnType<typeof setInterval> | null = null

// プログレスバーアニメーション
const startProgressAnimation = () => {
  progressInterval = setInterval(() => {
    progressValue.value += 2
    if (progressValue.value >= 100) {
      progressValue.value = 0
    }
  }, 100)
}

const stopProgressAnimation = () => {
  if (progressInterval) {
    clearInterval(progressInterval)
    progressInterval = null
  }
}

// カードローディングトグル
const toggleCardLoading = () => {
  cardLoading.value = !cardLoading.value
}

// フォームローディングトグル
const toggleFormLoading = () => {
  if (formLoading.value) return

  formLoading.value = true
  formProgress.value = 0

  formProgressInterval = setInterval(() => {
    formProgress.value += 5
    if (formProgress.value >= 100) {
      formProgress.value = 100
      setTimeout(() => {
        formLoading.value = false
        formProgress.value = 0
        if (formProgressInterval) {
          clearInterval(formProgressInterval)
          formProgressInterval = null
        }
      }, 500)
    }
  }, 100)
}

// ファイルアップロードトグル
const toggleFileUpload = () => {
  if (fileUploading.value) return

  fileUploading.value = true
  setTimeout(() => {
    fileUploading.value = false
  }, 3000)
}

// 検索ローディングトグル
const toggleSearchLoading = () => {
  if (searchLoading.value) return

  searchLoading.value = true
  setTimeout(() => {
    searchLoading.value = false
  }, 2000)
}

// オーバーレイ表示
const showOverlay = () => {
  overlayVisible.value = true
  setTimeout(() => {
    overlayVisible.value = false
  }, 3000)
}

const hideOverlay = () => {
  overlayVisible.value = false
}

// プログレス付きオーバーレイ表示
const showOverlayWithProgress = () => {
  overlayProgressVisible.value = true
  overlayProgress.value = 0

  overlayProgressInterval = setInterval(() => {
    overlayProgress.value += 2
    if (overlayProgress.value >= 100) {
      overlayProgress.value = 100
      setTimeout(() => {
        overlayProgressVisible.value = false
        overlayProgress.value = 0
        if (overlayProgressInterval) {
          clearInterval(overlayProgressInterval)
          overlayProgressInterval = null
        }
      }, 500)
    }
  }, 50)
}

// ライフサイクル
onMounted(() => {
  startProgressAnimation()
})

onUnmounted(() => {
  stopProgressAnimation()
  if (formProgressInterval) {
    clearInterval(formProgressInterval)
  }
  if (overlayProgressInterval) {
    clearInterval(overlayProgressInterval)
  }
})
</script>

<style scoped>
@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-25%);
  }
}

.animate-bounce {
  animation: bounce 1s infinite;
}
</style>
