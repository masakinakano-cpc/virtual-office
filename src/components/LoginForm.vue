<template>
  <div class="login-form">
    <div class="login-container">
      <div class="login-header">
        <h1 class="login-title">
          <span class="title-icon">🏢</span>
          バーチャルオフィス
        </h1>
        <p class="login-subtitle">3Dバーチャル空間でリモートワークを体験</p>
      </div>

      <div class="login-card">
        <form @submit.prevent="handleLogin" class="login-form-content">
          <div class="form-group">
            <label for="nickname" class="form-label">ニックネーム</label>
            <input
              id="nickname"
              v-model="nickname"
              type="text"
              placeholder="あなたのニックネームを入力"
              class="form-input"
              required
              maxlength="20"
            />
          </div>

          <div class="form-group">
            <label for="roomId" class="form-label">ルームID</label>
            <input
              id="roomId"
              v-model="roomId"
              type="text"
              placeholder="参加するルームIDを入力"
              class="form-input"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">アバターカラー</label>
            <div class="color-picker-grid">
              <div
                v-for="color in avatarColors"
                :key="color"
                class="color-option"
                :class="{ selected: selectedColor === color }"
                :style="{ backgroundColor: color }"
                @click="selectedColor = color"
              ></div>
            </div>
          </div>

          <button type="submit" class="login-btn" :disabled="!isFormValid">
            <span class="btn-icon">🚀</span>
            オフィスに入室
          </button>
        </form>

        <div class="login-options">
          <div class="divider">
            <span class="divider-text">または</span>
          </div>

          <button @click="createNewRoom" class="create-room-btn">
            <span class="btn-icon">➕</span>
            新しいルームを作成
          </button>

          <button @click="joinDemo" class="demo-btn">
            <span class="btn-icon">🎮</span>
            デモルームに参加
          </button>

          <button @click="goToOffice" class="office-btn">
            <span class="btn-icon">🏢</span>
            2Dオフィスに入る
          </button>

          <!-- Windows用アクセス情報 -->
          <div class="access-info">
            <h4>🖥️ Windowsからのアクセス方法</h4>
            <div class="access-details">
              <p><strong>URL:</strong> <code>http://192.168.3.138:3000</code></p>
              <p><strong>WebSocket:</strong> <code>ws://192.168.3.138:8080</code></p>
              <button @click="copyAccessUrl" class="copy-url-btn">
                📋 URLをコピー
              </button>
            </div>
            <div class="access-troubleshooting">
              <details>
                <summary>🔧 アクセスできない場合</summary>
                <ul>
                  <li>Windowsファイアウォールを確認</li>
                  <li>プライベートブラウジングモードで試行</li>
                  <li>ブラウザキャッシュをクリア</li>
                  <li>アドブロッカーを無効化</li>
                  <li>同じWiFiネットワークに接続</li>
                </ul>
              </details>
            </div>
          </div>
        </div>
      </div>

      <div class="login-footer">
        <div class="feature-highlights">
          <div class="feature">
            <span class="feature-icon">🎯</span>
            <span class="feature-text">3D空間でのアバター移動</span>
          </div>
          <div class="feature">
            <span class="feature-icon">📞</span>
            <span class="feature-text">近接ビデオ通話</span>
          </div>
          <div class="feature">
            <span class="feature-icon">📝</span>
            <span class="feature-text">リアルタイム共同編集</span>
          </div>
          <div class="feature">
            <span class="feature-icon">🎨</span>
            <span class="feature-text">カスタマイズ可能な空間</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

// Router
const router = useRouter()
const route = useRoute()

// State
const nickname = ref('')
const roomId = ref((route.query.roomId as string) || '')
const selectedColor = ref('#3b82f6')

// Avatar colors
const avatarColors = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
  '#8b5cf6', '#06b6d4', '#84cc16', '#f97316',
  '#ec4899', '#6366f1', '#14b8a6', '#eab308'
]

// Computed
const isFormValid = computed(() => {
  return nickname.value.trim().length >= 2 && roomId.value.trim().length >= 3
})

// Methods
const handleLogin = () => {
  if (!isFormValid.value) return

  // ルームページに遷移
  router.push({
    name: 'room',
    params: { roomId: roomId.value },
    query: {
      nickname: nickname.value,
      color: selectedColor.value
    }
  })
}

const createNewRoom = () => {
  // ランダムなルームIDを生成
  const randomRoomId = generateRoomId()
  roomId.value = randomRoomId

  if (nickname.value.trim()) {
    handleLogin()
  }
}

const joinDemo = () => {
  nickname.value = nickname.value || 'ゲストユーザー'
  roomId.value = 'demo-room'
  handleLogin()
}

const goToOffice = () => {
  // ニックネームをローカルストレージに保存
  const nicknameToSave = nickname.value.trim() || 'ゲスト'
  localStorage.setItem('user-nickname', nicknameToSave)
  localStorage.setItem('user-color', selectedColor.value)

  // 2Dオフィスページに直接遷移
  router.push('/office')
}

const copyAccessUrl = async () => {
  const url = 'http://192.168.3.138:3000'
  try {
    await navigator.clipboard.writeText(url)
    alert('URLをクリップボードにコピーしました！')
  } catch (err) {
    console.error('URLのコピーに失敗しました:', err)
    alert('URLのコピーに失敗しました。手動でコピーしてください: ' + url)
  }
}

const generateRoomId = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
</script>

<style scoped>
.login-form {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-4);
}

.login-container {
  width: 100%;
  max-width: 480px;
}

.login-header {
  text-align: center;
  margin-bottom: var(--spacing-8);
  color: white;
}

.login-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 var(--spacing-3) 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-3);
}

.title-icon {
  font-size: 2.8rem;
}

.login-subtitle {
  font-size: var(--text-lg);
  margin: 0;
  opacity: 0.9;
  font-weight: 300;
}

.login-card {
  background: white;
  border-radius: var(--radius-xl);
  padding: var(--spacing-8);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(10px);
  margin-bottom: var(--spacing-6);
}

.login-form-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.form-label {
  font-weight: 600;
  color: var(--color-gray-700);
  font-size: var(--text-sm);
}

.form-input {
  padding: var(--spacing-4);
  border: 2px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  transition: var(--transition-normal);
  background: var(--color-gray-50);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  background: white;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.color-picker-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: var(--spacing-2);
  margin-top: var(--spacing-2);
}

.color-option {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  border: 3px solid transparent;
  transition: var(--transition-normal);
  position: relative;
}

.color-option:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.color-option.selected {
  border-color: var(--color-gray-800);
  transform: scale(1.15);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

.color-option.selected::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-weight: bold;
  font-size: 14px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.login-btn {
  background: linear-gradient(135deg, var(--color-primary), #4f46e5);
  color: white;
  border: none;
  padding: var(--spacing-4) var(--spacing-6);
  border-radius: var(--radius-lg);
  font-size: var(--text-lg);
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-normal);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.5);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.login-options {
  margin-top: var(--spacing-6);
}

.divider {
  position: relative;
  text-align: center;
  margin: var(--spacing-6) 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--color-gray-300);
}

.divider-text {
  background: white;
  padding: 0 var(--spacing-4);
  color: var(--color-gray-500);
  font-size: var(--text-sm);
}

.create-room-btn,
.demo-btn {
  width: 100%;
  background: var(--color-gray-100);
  color: var(--color-gray-700);
  border: 2px solid var(--color-gray-200);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-normal);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-3);
}

.create-room-btn:hover,
.demo-btn:hover {
  background: var(--color-gray-200);
  border-color: var(--color-gray-300);
  transform: translateY(-1px);
}

.demo-btn {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border-color: #10b981;
}

.demo-btn:hover {
  background: linear-gradient(135deg, #059669, #047857);
  border-color: #059669;
}

.office-btn {
  width: 100%;
  background: linear-gradient(135deg, var(--color-primary), #4f46e5);
  color: white;
  border: 2px solid var(--color-primary);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-normal);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-3);
}

.office-btn:hover {
  background: linear-gradient(135deg, #4f46e5, #4338ca);
  border-color: #4f46e5;
  transform: translateY(-1px);
}

.btn-icon {
  font-size: 1.1em;
}

.login-footer {
  color: white;
  text-align: center;
}

.feature-highlights {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-4);
}

.feature {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  background: rgba(255, 255, 255, 0.1);
  padding: var(--spacing-3);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(10px);
}

.feature-icon {
  font-size: 1.2em;
}

.feature-text {
  font-size: var(--text-sm);
  font-weight: 500;
}

/* レスポンシブデザイン */
@media (max-width: 768px) {
  .login-form {
    padding: var(--spacing-2);
  }

  .login-title {
    font-size: 2rem;
  }

  .title-icon {
    font-size: 2.2rem;
  }

  .login-card {
    padding: var(--spacing-6);
  }

  .color-picker-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .feature-highlights {
    grid-template-columns: 1fr;
    gap: var(--spacing-2);
  }

  .feature {
    padding: var(--spacing-2);
  }

  .feature-text {
    font-size: var(--text-xs);
  }
}

@media (max-width: 480px) {
  .login-title {
    font-size: 1.8rem;
    flex-direction: column;
    gap: var(--spacing-2);
  }

  .color-picker-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .color-option {
    width: 35px;
    height: 35px;
  }
}

/* Windows用アクセス情報 */
.access-info {
  margin-top: var(--spacing-6);
  padding: var(--spacing-4);
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.access-info h4 {
  margin: 0 0 var(--spacing-3) 0;
  color: white;
  font-size: var(--text-lg);
  font-weight: 600;
}

.access-details {
  margin-bottom: var(--spacing-3);
}

.access-details p {
  margin: var(--spacing-1) 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: var(--text-sm);
}

.access-details code {
  background: rgba(0, 0, 0, 0.3);
  padding: 2px 8px;
  border-radius: 4px;
  font-family: 'Fira Code', monospace;
  color: #a7f3d0;
}

.copy-url-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: var(--spacing-2);
}

.copy-url-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.access-troubleshooting {
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  padding-top: var(--spacing-3);
}

.access-troubleshooting details {
  color: rgba(255, 255, 255, 0.9);
}

.access-troubleshooting summary {
  cursor: pointer;
  font-weight: 600;
  padding: var(--spacing-2) 0;
  color: #fbbf24;
}

.access-troubleshooting ul {
  margin: var(--spacing-2) 0 0 var(--spacing-4);
  color: rgba(255, 255, 255, 0.8);
}

.access-troubleshooting li {
  margin: var(--spacing-1) 0;
  font-size: var(--text-sm);
}
</style>
