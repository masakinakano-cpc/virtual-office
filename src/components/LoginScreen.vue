<template>
  <div class="login-screen">
    <div class="login-container">
      <div class="login-card">
        <!-- ロゴ・タイトル -->
        <div class="login-header">
          <div class="logo">
            <span class="logo-icon">🏢</span>
            <h1 class="logo-text">Virtual Office</h1>
          </div>
          <p class="subtitle">友達と一緒にバーチャルオフィスで会話しよう</p>
        </div>

        <!-- ログインフォーム -->
        <div class="login-form">
          <div class="form-group">
            <label for="nickname" class="form-label">
              <span class="label-icon">👤</span>
              ニックネーム
            </label>
            <input
              id="nickname"
              v-model="nickname"
              type="text"
              class="form-input"
              placeholder="あなたのニックネームを入力してください"
              required
              maxlength="20"
            />
            <div class="input-helper">
              {{ nickname.length }}/20文字
            </div>
          </div>

          <div class="form-group">
            <label for="roomId" class="form-label">
              <span class="label-icon">🏠</span>
              ルームID（オプション）
            </label>
            <input
              id="roomId"
              v-model="roomId"
              type="text"
              class="form-input"
              placeholder="参加したいルームIDを入力（空白で新規作成）"
              maxlength="50"
            />
            <div class="input-helper">
              空白の場合、新しいルームが作成されます
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">
              <span class="label-icon">🎨</span>
              アバターカラー
            </label>
            <div class="color-picker">
              <button
                v-for="color in avatarColors"
                :key="color.name"
                type="button"
                :class="[
                  'color-option',
                  { active: selectedColor === color.value }
                ]"
                :style="{ backgroundColor: color.value }"
                @click="selectedColor = color.value"
                :title="color.name"
              >
                <span v-if="selectedColor === color.value" class="check-mark">✓</span>
              </button>
            </div>
          </div>

          <!-- ボタンエリア -->
          <div class="button-group">
            <button
              type="button"
              class="login-button primary"
              :disabled="!nickname.trim() || isLoading"
              @click="handleJoinRoom"
            >
              <span v-if="isLoading && actionType === 'join'" class="loading-spinner"></span>
              <span class="button-icon">🏠</span>
              {{ roomId.trim() ? 'ルームに参加' : '新しいルームを作成' }}
            </button>

            <button
              v-if="roomId.trim()"
              type="button"
              class="login-button secondary"
              :disabled="!nickname.trim() || isLoading"
              @click="handleCreateRoom"
            >
              <span v-if="isLoading && actionType === 'create'" class="loading-spinner"></span>
              <span class="button-icon">✨</span>
              新しいルームを作成
            </button>
          </div>
        </div>

        <!-- 機能説明 -->
        <div class="features">
          <h3 class="features-title">できること</h3>
          <ul class="features-list">
            <li><span class="feature-icon">🎯</span>アバターを自由に移動</li>
            <li><span class="feature-icon">🎤</span>音声・ビデオ通話</li>
            <li><span class="feature-icon">💬</span>リアルタイムチャット</li>
            <li><span class="feature-icon">🔗</span>URLでルーム共有</li>
            <li><span class="feature-icon">🎨</span>オフィス環境カスタマイズ</li>
          </ul>
        </div>

        <!-- エラー表示 -->
        <div v-if="error" class="error-message">
          <span class="error-icon">⚠️</span>
          {{ error }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// リアクティブデータ
const nickname = ref('')
const roomId = ref('')
const selectedColor = ref('#3B82F6')
const isLoading = ref(false)
const error = ref('')
const actionType = ref<'join' | 'create' | null>(null)

// アバターカラーオプション
const avatarColors = [
  { name: 'ブルー', value: '#3B82F6' },
  { name: 'グリーン', value: '#10B981' },
  { name: 'パープル', value: '#8B5CF6' },
  { name: 'ピンク', value: '#F59E0B' },
  { name: 'レッド', value: '#EF4444' },
  { name: 'イエロー', value: '#F59E0B' },
  { name: 'インディゴ', value: '#6366F1' },
  { name: 'ティール', value: '#14B8A6' }
]

// Emits
const emit = defineEmits<{
  login: [{ nickname: string; roomId: string; avatarColor: string }]
}>()

// メソッド
const handleJoinRoom = async () => {
  if (!nickname.value.trim()) {
    error.value = 'ニックネームを入力してください'
    return
  }

  actionType.value = 'join'
  isLoading.value = true
  error.value = ''

  try {
    // ルームIDが空の場合、ランダムなIDを生成
    const finalRoomId = roomId.value.trim() || generateRoomId()

    // ログイン情報をエミット
    emit('login', {
      nickname: nickname.value.trim(),
      roomId: finalRoomId,
      avatarColor: selectedColor.value
    })

    // ルーターでメインページに遷移
    await router.push({
      name: 'office',
      params: { roomId: finalRoomId },
      query: {
        nickname: nickname.value.trim(),
        color: selectedColor.value
      }
    })
  } catch (err) {
    error.value = 'ルーム参加に失敗しました。もう一度お試しください。'
    console.error('Join room error:', err)
  } finally {
    isLoading.value = false
    actionType.value = null
  }
}

const handleCreateRoom = async () => {
  if (!nickname.value.trim()) {
    error.value = 'ニックネームを入力してください'
    return
  }

  actionType.value = 'create'
  isLoading.value = true
  error.value = ''

  try {
    // 新しいランダムなルームIDを生成
    const finalRoomId = generateRoomId()

    // ログイン情報をエミット
    emit('login', {
      nickname: nickname.value.trim(),
      roomId: finalRoomId,
      avatarColor: selectedColor.value
    })

    // ルーターでメインページに遷移
    await router.push({
      name: 'office',
      params: { roomId: finalRoomId },
      query: {
        nickname: nickname.value.trim(),
        color: selectedColor.value
      }
    })
  } catch (err) {
    error.value = 'ルーム作成に失敗しました。もう一度お試しください。'
    console.error('Create room error:', err)
  } finally {
    isLoading.value = false
    actionType.value = null
  }
}

const generateRoomId = () => {
  return 'room-' + Math.random().toString(36).substr(2, 9)
}

// ライフサイクル
onMounted(() => {
  // URLパラメータからルームIDを取得
  const urlRoomId = route.params.roomId as string
  if (urlRoomId) {
    roomId.value = urlRoomId
  }
})
</script>

<style scoped>
.login-screen {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.login-container {
  width: 100%;
  max-width: 480px;
}

.login-card {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.logo-icon {
  font-size: 2.5rem;
  animation: bounce 2s infinite;
}

.logo-text {
  font-size: 1.75rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
}

.subtitle {
  color: #6b7280;
  font-size: 1rem;
  margin: 0;
}

.login-form {
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.label-icon {
  font-size: 1.2rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s;
  background: #f9fafb;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input-helper {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.color-picker {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.color-option {
  width: 3rem;
  height: 3rem;
  border: 3px solid transparent;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.color-option:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.color-option.active {
  border-color: #374151;
  transform: scale(1.1);
}

.check-mark {
  color: white;
  font-weight: bold;
  text-shadow: 0 0 3px rgba(0, 0, 0, 0.5);
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.login-button {
  width: 100%;
  padding: 1rem;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.login-button.primary {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
}

.login-button.primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
}

.login-button.secondary {
  background: linear-gradient(135deg, #10b981, #059669);
  font-size: 1rem;
  padding: 0.875rem;
}

.login-button.secondary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid transparent;
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.button-icon {
  font-size: 1.2rem;
}

.features {
  margin-bottom: 1.5rem;
}

.features-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 1rem;
  text-align: center;
}

.features-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.features-list li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.feature-icon {
  font-size: 1.1rem;
}

.error-message {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #dc2626;
  font-size: 0.9rem;
}

.error-icon {
  font-size: 1.1rem;
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

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .login-card {
    padding: 1.5rem;
  }

  .color-picker {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
