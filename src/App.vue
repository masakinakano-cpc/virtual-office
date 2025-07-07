<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// アプリケーション初期化
onMounted(() => {
  // アプリケーションの初期化処理
  console.log('Virtual Office App initialized')

  // URLパラメータをチェックして適切なページにリダイレクト
  const currentPath = window.location.pathname
  const urlParams = new URLSearchParams(window.location.search)

  // ルームIDがURLに含まれている場合の処理
  if (currentPath.includes('/room/')) {
    const roomId = currentPath.split('/room/')[1]
    const nickname = urlParams.get('nickname')

    if (!nickname) {
      // ニックネームが設定されていない場合はログイン画面へ
      router.push({
        name: 'login',
        query: { roomId }
      })
    }
  }
})
</script>

<style>
/* グローバルスタイル */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  height: 100vh;
  overflow: hidden;
}

/* スクロールバーのスタイリング */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

/* フォーカス時のアウトラインスタイル */
button:focus,
input:focus,
textarea:focus,
select:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* ボタンの基本スタイル */
button {
  cursor: pointer;
  transition: all 0.2s ease;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* 入力フィールドの基本スタイル */
input, textarea {
  transition: all 0.2s ease;
}

/* リンクの基本スタイル */
a {
  text-decoration: none;
  color: inherit;
}

/* 選択不可能なテキスト */
.no-select {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

/* アニメーション */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideIn {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

/* レスポンシブデザイン */
@media (max-width: 768px) {
  body {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  body {
    font-size: 12px;
  }
}

/* ダークモード対応 */
@media (prefers-color-scheme: dark) {
  ::-webkit-scrollbar-track {
    background: #2d3748;
  }

  ::-webkit-scrollbar-thumb {
    background: #4a5568;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #718096;
  }
}

/* プリント用スタイル */
@media print {
  * {
    background: transparent !important;
    color: black !important;
    box-shadow: none !important;
    text-shadow: none !important;
  }

  a, a:visited {
    text-decoration: underline;
  }

  .no-print {
    display: none !important;
  }
}
</style>
