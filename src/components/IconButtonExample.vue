<template>
  <div class="p-8 max-w-6xl mx-auto">
    <h1 class="text-3xl font-bold mb-8 text-gray-800">IconButton コンポーネント</h1>

    <!-- サイズバリアント -->
    <section class="mb-12">
      <h2 class="text-2xl font-semibold mb-6 text-gray-700">サイズバリアント</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">Small (26x26px)</h3>
          <div class="flex items-center gap-2">
            <IconButton
              size-variant="small"
              skin="normal"
              :icon="HeartIcon"
              aria-label="お気に入り"
              @click="handleClick('Small Heart')"
            />
            <IconButton
              size-variant="small"
              skin="primary"
              :icon="StarIcon"
              aria-label="スター"
              @click="handleClick('Small Star')"
            />
            <IconButton
              size-variant="small"
              skin="info"
              :icon="InfoIcon"
              aria-label="情報"
              @click="handleClick('Small Info')"
            />
          </div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">Regular (44x44px)</h3>
          <div class="flex items-center gap-2">
            <IconButton
              size-variant="regular"
              skin="normal"
              :icon="HeartIcon"
              aria-label="お気に入り"
              @click="handleClick('Regular Heart')"
            />
            <IconButton
              size-variant="regular"
              skin="primary"
              :icon="StarIcon"
              aria-label="スター"
              @click="handleClick('Regular Star')"
            />
            <IconButton
              size-variant="regular"
              skin="info"
              :icon="InfoIcon"
              aria-label="情報"
              @click="handleClick('Regular Info')"
            />
          </div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">Custom Size (60x60px)</h3>
          <div class="flex items-center gap-2">
            <IconButton
              :size-variant="60"
              skin="normal"
              :icon="HeartIcon"
              aria-label="お気に入り"
              @click="handleClick('Custom Heart')"
            />
            <IconButton
              :size-variant="60"
              skin="primary"
              :icon="StarIcon"
              aria-label="スター"
              @click="handleClick('Custom Star')"
            />
            <IconButton
              :size-variant="60"
              skin="info"
              :icon="InfoIcon"
              aria-label="情報"
              @click="handleClick('Custom Info')"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- スキンバリアント -->
    <section class="mb-12">
      <h2 class="text-2xl font-semibold mb-6 text-gray-700">スキンバリアント</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">Notice</h3>
          <div class="flex items-center gap-2">
            <IconButton
              skin="notice"
              :icon="AlertIcon"
              aria-label="警告"
              @click="handleClick('Notice Alert')"
            />
            <IconButton
              skin="notice"
              :icon="AlertIcon"
              aria-label="警告（無効）"
              disabled
            />
          </div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">Info</h3>
          <div class="flex items-center gap-2">
            <IconButton
              skin="info"
              :icon="InfoIcon"
              aria-label="情報"
              @click="handleClick('Info')"
            />
            <IconButton
              skin="info"
              :icon="InfoIcon"
              aria-label="情報（無効）"
              disabled
            />
          </div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">Normal</h3>
          <div class="flex items-center gap-2">
            <IconButton
              skin="normal"
              :icon="HeartIcon"
              aria-label="通常"
              @click="handleClick('Normal')"
            />
            <IconButton
              skin="normal"
              :icon="HeartIcon"
              aria-label="通常（無効）"
              disabled
            />
          </div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">Normal with Background</h3>
          <div class="flex items-center gap-2">
            <IconButton
              skin="normalWithBackground"
              :icon="StarIcon"
              aria-label="背景付き通常"
              @click="handleClick('Normal with Background')"
            />
            <IconButton
              skin="normalWithBackground"
              :icon="StarIcon"
              aria-label="背景付き通常（無効）"
              disabled
            />
          </div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">Normal with Hover</h3>
          <div class="flex items-center gap-2">
            <IconButton
              skin="normalWithHover"
              :icon="SettingsIcon"
              aria-label="ホバー付き通常"
              @click="handleClick('Normal with Hover')"
            />
            <IconButton
              skin="normalWithHover"
              :icon="SettingsIcon"
              aria-label="ホバー付き通常（無効）"
              disabled
            />
          </div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">Active</h3>
          <div class="flex items-center gap-2">
            <IconButton
              skin="active"
              :icon="CheckIcon"
              aria-label="アクティブ"
              @click="handleClick('Active')"
            />
            <IconButton
              skin="active"
              :icon="CheckIcon"
              aria-label="アクティブ（無効）"
              disabled
            />
          </div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">Send</h3>
          <div class="flex items-center gap-2">
            <IconButton
              skin="send"
              :icon="SendIcon"
              aria-label="送信"
              @click="handleClick('Send')"
            />
            <IconButton
              skin="send"
              :icon="SendIcon"
              aria-label="送信（無効）"
              disabled
            />
          </div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">Primary</h3>
          <div class="flex items-center gap-2">
            <IconButton
              skin="primary"
              :icon="PlusIcon"
              aria-label="プライマリ"
              @click="handleClick('Primary')"
            />
            <IconButton
              skin="primary"
              :icon="PlusIcon"
              aria-label="プライマリ（無効）"
              disabled
            />
          </div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">Secondary</h3>
          <div class="flex items-center gap-2">
            <IconButton
              skin="secondary"
              :icon="MenuIcon"
              aria-label="セカンダリ"
              @click="handleClick('Secondary')"
            />
            <IconButton
              skin="secondary"
              :icon="MenuIcon"
              aria-label="セカンダリ（無効）"
              disabled
            />
          </div>
        </div>
      </div>
    </section>

    <!-- 実用例 -->
    <section class="mb-12">
      <h2 class="text-2xl font-semibold mb-6 text-gray-700">実用例</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">ツールバー</h3>
          <div class="flex items-center gap-1 p-2 bg-gray-50 rounded-lg">
            <IconButton
              skin="normalWithHover"
              :icon="BoldIcon"
              aria-label="太字"
              @click="handleClick('Bold')"
            />
            <IconButton
              skin="normalWithHover"
              :icon="ItalicIcon"
              aria-label="斜体"
              @click="handleClick('Italic')"
            />
            <IconButton
              skin="normalWithHover"
              :icon="UnderlineIcon"
              aria-label="下線"
              @click="handleClick('Underline')"
            />
            <div class="w-px h-6 bg-gray-300 mx-1"></div>
            <IconButton
              skin="normalWithHover"
              :icon="AlignLeftIcon"
              aria-label="左揃え"
              @click="handleClick('Align Left')"
            />
            <IconButton
              skin="normalWithHover"
              :icon="AlignCenterIcon"
              aria-label="中央揃え"
              @click="handleClick('Align Center')"
            />
            <IconButton
              skin="normalWithHover"
              :icon="AlignRightIcon"
              aria-label="右揃え"
              @click="handleClick('Align Right')"
            />
          </div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-lg font-medium mb-4 text-gray-600">メディアコントロール</h3>
          <div class="flex items-center gap-2 p-4 bg-gray-900 rounded-lg">
            <IconButton
              skin="normal"
              :icon="PrevIcon"
              aria-label="前へ"
              @click="handleClick('Previous')"
              class="text-white"
            />
            <IconButton
              skin="primary"
              :icon="PlayIcon"
              aria-label="再生"
              @click="handleClick('Play')"
            />
            <IconButton
              skin="normal"
              :icon="NextIcon"
              aria-label="次へ"
              @click="handleClick('Next')"
              class="text-white"
            />
            <div class="flex-1"></div>
            <IconButton
              skin="normal"
              :icon="VolumeIcon"
              aria-label="音量"
              @click="handleClick('Volume')"
              class="text-white"
            />
          </div>
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
          ボタンをクリックするとイベントログが表示されます
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import IconButton from './IconButton.vue'

// アイコンコンポーネント（実際のプロジェクトでは適切なアイコンライブラリを使用）
const HeartIcon = {
  template: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`
}

const StarIcon = {
  template: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`
}

const InfoIcon = {
  template: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`
}

const AlertIcon = {
  template: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>`
}

const SettingsIcon = {
  template: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg>`
}

const CheckIcon = {
  template: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`
}

const SendIcon = {
  template: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`
}

const PlusIcon = {
  template: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`
}

const MenuIcon = {
  template: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>`
}

const BoldIcon = {
  template: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/></svg>`
}

const ItalicIcon = {
  template: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/></svg>`
}

const UnderlineIcon = {
  template: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/></svg>`
}

const AlignLeftIcon = {
  template: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"/></svg>`
}

const AlignCenterIcon = {
  template: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z"/></svg>`
}

const AlignRightIcon = {
  template: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z"/></svg>`
}

const PrevIcon = {
  template: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>`
}

const PlayIcon = {
  template: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`
}

const NextIcon = {
  template: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>`
}

const VolumeIcon = {
  template: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`
}

interface EventLog {
  timestamp: string
  message: string
}

const eventLogs = ref<EventLog[]>([])

const handleClick = (buttonName: string) => {
  const timestamp = new Date().toLocaleTimeString()
  eventLogs.value.unshift({
    timestamp,
    message: `${buttonName} ボタンがクリックされました`
  })

  // ログが多くなりすぎないよう制限
  if (eventLogs.value.length > 10) {
    eventLogs.value = eventLogs.value.slice(0, 10)
  }
}
</script>
