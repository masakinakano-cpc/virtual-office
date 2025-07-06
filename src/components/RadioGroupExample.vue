<template>
  <div class="p-8 max-w-6xl mx-auto">
    <h1 class="text-3xl font-bold mb-8 text-gray-800">RadioGroup & Radio コンポーネント</h1>

    <!-- 基本的な使用例 -->
    <section class="mb-12">
      <h2 class="text-2xl font-semibold mb-6 text-gray-700">基本的な使用例</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">縦並びラジオグループ</h3>
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              お好みの言語を選択してください
            </label>
            <RadioGroup v-model:value="selectedLanguage" name="language">
              <Radio value="javascript" label="JavaScript" />
              <Radio value="typescript" label="TypeScript" />
              <Radio value="python" label="Python" />
              <Radio value="java" label="Java" />
            </RadioGroup>
            <p class="text-sm text-gray-500 mt-2">
              選択: {{ selectedLanguage || '未選択' }}
            </p>
          </div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">横並びラジオグループ</h3>
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              サイズを選択してください
            </label>
            <RadioGroup v-model:value="selectedSize" name="size" row>
              <Radio value="small" label="S" />
              <Radio value="medium" label="M" />
              <Radio value="large" label="L" />
              <Radio value="xlarge" label="XL" />
            </RadioGroup>
            <p class="text-sm text-gray-500 mt-2">
              選択: {{ selectedSize || '未選択' }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- サイズバリエーション -->
    <section class="mb-12">
      <h2 class="text-2xl font-semibold mb-6 text-gray-700">サイズバリエーション</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">Small</h3>
          <RadioGroup v-model:value="sizeSmall" name="size-small">
            <Radio value="option1" label="オプション1" size="small" />
            <Radio value="option2" label="オプション2" size="small" />
            <Radio value="option3" label="オプション3" size="small" />
          </RadioGroup>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">Medium</h3>
          <RadioGroup v-model:value="sizeMedium" name="size-medium">
            <Radio value="option1" label="オプション1" size="medium" />
            <Radio value="option2" label="オプション2" size="medium" />
            <Radio value="option3" label="オプション3" size="medium" />
          </RadioGroup>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">Large</h3>
          <RadioGroup v-model:value="sizeLarge" name="size-large">
            <Radio value="option1" label="オプション1" size="large" />
            <Radio value="option2" label="オプション2" size="large" />
            <Radio value="option3" label="オプション3" size="large" />
          </RadioGroup>
        </div>
      </div>
    </section>

    <!-- カラーバリエーション -->
    <section class="mb-12">
      <h2 class="text-2xl font-semibold mb-6 text-gray-700">カラーバリエーション</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">Primary</h3>
          <RadioGroup v-model:value="colorPrimary" name="color-primary">
            <Radio value="option1" label="オプション1" color="primary" />
            <Radio value="option2" label="オプション2" color="primary" />
          </RadioGroup>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">Secondary</h3>
          <RadioGroup v-model:value="colorSecondary" name="color-secondary">
            <Radio value="option1" label="オプション1" color="secondary" />
            <Radio value="option2" label="オプション2" color="secondary" />
          </RadioGroup>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">Success</h3>
          <RadioGroup v-model:value="colorSuccess" name="color-success">
            <Radio value="option1" label="オプション1" color="success" />
            <Radio value="option2" label="オプション2" color="success" />
          </RadioGroup>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">Warning</h3>
          <RadioGroup v-model:value="colorWarning" name="color-warning">
            <Radio value="option1" label="オプション1" color="warning" />
            <Radio value="option2" label="オプション2" color="warning" />
          </RadioGroup>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">Error</h3>
          <RadioGroup v-model:value="colorError" name="color-error">
            <Radio value="option1" label="オプション1" color="error" />
            <Radio value="option2" label="オプション2" color="error" />
          </RadioGroup>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">Info</h3>
          <RadioGroup v-model:value="colorInfo" name="color-info">
            <Radio value="option1" label="オプション1" color="info" />
            <Radio value="option2" label="オプション2" color="info" />
          </RadioGroup>
        </div>
      </div>
    </section>

    <!-- 状態バリエーション -->
    <section class="mb-12">
      <h2 class="text-2xl font-semibold mb-6 text-gray-700">状態バリエーション</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">無効状態</h3>
          <RadioGroup v-model:value="disabledValue" name="disabled-example">
            <Radio value="option1" label="通常のオプション" />
            <Radio value="option2" label="無効なオプション" disabled />
            <Radio value="option3" label="選択済み無効" disabled checked />
            <Radio value="option4" label="通常のオプション2" />
          </RadioGroup>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">エラー状態</h3>
          <RadioGroup v-model:value="errorValue" name="error-example" error>
            <Radio value="option1" label="オプション1" />
            <Radio value="option2" label="オプション2" />
            <Radio value="option3" label="オプション3" />
          </RadioGroup>
          <p class="text-sm text-red-600 mt-2">
            このフィールドは必須です
          </p>
        </div>
      </div>
    </section>

    <!-- 実用例 -->
    <section class="mb-12">
      <h2 class="text-2xl font-semibold mb-6 text-gray-700">実用例</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">設定フォーム</h3>
          <form @submit.prevent="handleSettingsSubmit" class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                通知設定
              </label>
              <RadioGroup v-model:value="notificationSetting" name="notifications">
                <Radio value="all" label="すべての通知を受け取る" />
                <Radio value="important" label="重要な通知のみ" />
                <Radio value="none" label="通知を受け取らない" />
              </RadioGroup>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                テーマ設定
              </label>
              <RadioGroup v-model:value="themeSetting" name="theme" row>
                <Radio value="light" label="ライト" />
                <Radio value="dark" label="ダーク" />
                <Radio value="auto" label="自動" />
              </RadioGroup>
            </div>

            <button
              type="submit"
              class="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              設定を保存
            </button>
          </form>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">アンケートフォーム</h3>
          <form @submit.prevent="handleSurveySubmit" class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                このサービスの満足度はいかがですか？
              </label>
              <RadioGroup v-model:value="satisfaction" name="satisfaction">
                <Radio value="very-satisfied">
                  <div class="flex items-center">
                    <span class="text-green-600 mr-2">😄</span>
                    <span>とても満足</span>
                  </div>
                </Radio>
                <Radio value="satisfied">
                  <div class="flex items-center">
                    <span class="text-blue-600 mr-2">😊</span>
                    <span>満足</span>
                  </div>
                </Radio>
                <Radio value="neutral">
                  <div class="flex items-center">
                    <span class="text-yellow-600 mr-2">😐</span>
                    <span>普通</span>
                  </div>
                </Radio>
                <Radio value="dissatisfied">
                  <div class="flex items-center">
                    <span class="text-orange-600 mr-2">😟</span>
                    <span>不満</span>
                  </div>
                </Radio>
                <Radio value="very-dissatisfied">
                  <div class="flex items-center">
                    <span class="text-red-600 mr-2">😠</span>
                    <span>とても不満</span>
                  </div>
                </Radio>
              </RadioGroup>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                推奨度（1-10）
              </label>
              <RadioGroup v-model:value="recommendation" name="recommendation" row>
                <Radio v-for="i in 10" :key="i" :value="i" :label="i.toString()" size="small" />
              </RadioGroup>
            </div>

            <button
              type="submit"
              class="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              アンケートを送信
            </button>
          </form>
        </div>
      </div>
    </section>

    <!-- 複雑な例 -->
    <section class="mb-12">
      <h2 class="text-2xl font-semibold mb-6 text-gray-700">複雑な例</h2>
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h3 class="text-lg font-medium mb-4 text-gray-600">商品選択フォーム</h3>
        <form @submit.prevent="handleProductSubmit" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                商品カテゴリ
              </label>
              <RadioGroup v-model:value="productCategory" name="category">
                <Radio
                  v-for="category in productCategories"
                  :key="category.id"
                  :value="category.id"
                >
                  <div class="flex items-center">
                    <component :is="category.icon" class="w-5 h-5 mr-3 text-gray-500" />
                    <div>
                      <div class="font-medium">{{ category.name }}</div>
                      <div class="text-sm text-gray-500">{{ category.description }}</div>
                    </div>
                  </div>
                </Radio>
              </RadioGroup>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                配送オプション
              </label>
              <RadioGroup v-model:value="shippingOption" name="shipping">
                <Radio
                  v-for="option in shippingOptions"
                  :key="option.id"
                  :value="option.id"
                >
                  <div class="flex items-center justify-between w-full">
                    <div>
                      <div class="font-medium">{{ option.name }}</div>
                      <div class="text-sm text-gray-500">{{ option.description }}</div>
                    </div>
                    <div class="text-right">
                      <div class="font-medium">{{ option.price }}</div>
                      <div class="text-sm text-gray-500">{{ option.duration }}</div>
                    </div>
                  </div>
                </Radio>
              </RadioGroup>
            </div>
          </div>

          <div class="border-t pt-4">
            <div class="flex justify-between items-center">
              <div class="text-lg font-medium">
                選択内容の確認
              </div>
              <button
                type="submit"
                class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                注文を確定
              </button>
            </div>
            <div class="mt-2 text-sm text-gray-600">
              カテゴリ: {{ getSelectedCategoryName() }}<br>
              配送: {{ getSelectedShippingName() }}
            </div>
          </div>
        </form>
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
          ラジオボタンを選択するとイベントログが表示されます
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import RadioGroup from './RadioGroup.vue'
import Radio from './Radio.vue'

// アイコンコンポーネント
const LaptopIcon = {
  template: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/></svg>`
}

const PhoneIcon = {
  template: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/></svg>`
}

const GameIcon = {
  template: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.58 16.09l-1.09-7.66C20.21 6.46 18.52 5 16.53 5H7.47C5.48 5 3.79 6.46 3.51 8.43l-1.09 7.66C2.2 17.63 3.39 19 4.94 19c.68 0 1.32-.27 1.8-.75L9 16h6l2.25 2.25c.48.48 1.13.75 1.8.75 1.56 0 2.75-1.37 2.53-2.91zM11 11H9v2H8v-2H6v-1h2V8h1v2h2v1zm4-0.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zm2 3c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5z"/></svg>`
}

const BookIcon = {
  template: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>`
}

// データ
const selectedLanguage = ref('')
const selectedSize = ref('')
const sizeSmall = ref('option1')
const sizeMedium = ref('option2')
const sizeLarge = ref('option3')

const colorPrimary = ref('option1')
const colorSecondary = ref('option1')
const colorSuccess = ref('option1')
const colorWarning = ref('option1')
const colorError = ref('option1')
const colorInfo = ref('option1')

const disabledValue = ref('option1')
const errorValue = ref('')

const notificationSetting = ref('important')
const themeSetting = ref('auto')

const satisfaction = ref('')
const recommendation = ref(8)

const productCategory = ref('')
const shippingOption = ref('')

const productCategories = ref([
  {
    id: 'electronics',
    name: '電子機器',
    description: 'スマートフォン、PC、タブレット',
    icon: LaptopIcon
  },
  {
    id: 'mobile',
    name: 'モバイル',
    description: 'スマートフォン、アクセサリー',
    icon: PhoneIcon
  },
  {
    id: 'gaming',
    name: 'ゲーム',
    description: 'ゲーム機、ソフト、周辺機器',
    icon: GameIcon
  },
  {
    id: 'books',
    name: '書籍',
    description: '本、雑誌、電子書籍',
    icon: BookIcon
  }
])

const shippingOptions = ref([
  {
    id: 'standard',
    name: '通常配送',
    description: '追跡可能',
    price: '無料',
    duration: '3-5日'
  },
  {
    id: 'express',
    name: '速達配送',
    description: '翌日配達',
    price: '¥500',
    duration: '1-2日'
  },
  {
    id: 'premium',
    name: 'プレミアム配送',
    description: '当日配達・時間指定',
    price: '¥1,000',
    duration: '当日'
  }
])

// イベントログ
interface EventLog {
  timestamp: string
  message: string
}

const eventLogs = ref<EventLog[]>([])

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

// ヘルパー関数
const getSelectedCategoryName = () => {
  const category = productCategories.value.find(c => c.id === productCategory.value)
  return category ? category.name : '未選択'
}

const getSelectedShippingName = () => {
  const shipping = shippingOptions.value.find(s => s.id === shippingOption.value)
  return shipping ? shipping.name : '未選択'
}

// イベントハンドラー
const handleSettingsSubmit = () => {
  logEvent(`設定保存: 通知=${notificationSetting.value}, テーマ=${themeSetting.value}`)
}

const handleSurveySubmit = () => {
  logEvent(`アンケート送信: 満足度=${satisfaction.value}, 推奨度=${recommendation.value}`)
}

const handleProductSubmit = () => {
  logEvent(`注文確定: カテゴリ=${getSelectedCategoryName()}, 配送=${getSelectedShippingName()}`)
}

// 値の変更を監視
watch(selectedLanguage, (newValue) => {
  logEvent(`言語選択: ${newValue}`)
})

watch(selectedSize, (newValue) => {
  logEvent(`サイズ選択: ${newValue}`)
})

watch(satisfaction, (newValue) => {
  logEvent(`満足度選択: ${newValue}`)
})

watch(productCategory, () => {
  logEvent(`商品カテゴリ選択: ${getSelectedCategoryName()}`)
})

watch(shippingOption, () => {
  logEvent(`配送オプション選択: ${getSelectedShippingName()}`)
})
</script>
