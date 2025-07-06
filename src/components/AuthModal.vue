<template>
  <div v-if="showModal" class="auth-modal-overlay" @click="closeModal">
    <div class="auth-modal" @click.stop>
      <div class="auth-header">
        <h2>{{ isLogin ? 'ログイン' : '新規登録' }}</h2>
        <button @click="closeModal" class="close-btn">✕</button>
      </div>

      <div class="auth-content">
        <!-- OAuth ログイン -->
        <div class="oauth-section">
          <h3>ソーシャルログイン</h3>
          <div class="oauth-buttons">
            <button
              v-for="(provider, key) in oauthProviders"
              :key="key"
              @click="handleOAuthLogin(key)"
              class="oauth-btn"
              :class="`oauth-${key}`"
            >
              <span class="oauth-icon">{{ getOAuthIcon(key) }}</span>
              {{ provider.name }}でログイン
            </button>
          </div>
        </div>

        <div class="divider">
          <span>または</span>
        </div>

        <!-- メールログイン -->
        <form @submit.prevent="handleSubmit" class="auth-form">
          <div class="form-group">
            <label for="email">メールアドレス</label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              required
              :class="{ 'error': emailError }"
              placeholder="your@email.com"
            />
            <span v-if="emailError" class="error-message">{{ emailError }}</span>
          </div>

          <div v-if="!isLogin" class="form-group">
            <label for="name">名前</label>
            <input
              id="name"
              v-model="formData.name"
              type="text"
              required
              placeholder="山田太郎"
            />
          </div>

          <div class="form-group">
            <label for="password">パスワード</label>
            <div class="password-input">
              <input
                id="password"
                v-model="formData.password"
                :type="showPassword ? 'text' : 'password'"
                required
                :class="{ 'error': passwordError }"
                placeholder="••••••••"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="password-toggle"
              >
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </div>
            <span v-if="passwordError" class="error-message">{{ passwordError }}</span>

            <!-- パスワード強度表示 -->
            <div v-if="!isLogin && formData.password" class="password-strength">
              <div class="strength-bar">
                <div
                  class="strength-fill"
                  :class="passwordStrength.level"
                  :style="{ width: passwordStrength.percentage + '%' }"
                ></div>
              </div>
              <span class="strength-text">{{ passwordStrength.text }}</span>
              <ul v-if="passwordStrength.errors.length > 0" class="strength-errors">
                <li v-for="error in passwordStrength.errors" :key="error">{{ error }}</li>
              </ul>
            </div>
          </div>

          <div v-if="!isLogin" class="form-group">
            <label for="confirmPassword">パスワード確認</label>
            <input
              id="confirmPassword"
              v-model="formData.confirmPassword"
              type="password"
              required
              :class="{ 'error': confirmPasswordError }"
              placeholder="••••••••"
            />
            <span v-if="confirmPasswordError" class="error-message">{{ confirmPasswordError }}</span>
          </div>

          <div v-if="isLogin" class="form-options">
            <label class="checkbox-label">
              <input v-model="formData.rememberMe" type="checkbox" />
              ログイン状態を保持する
            </label>
            <button type="button" @click="showForgotPassword = true" class="forgot-password">
              パスワードを忘れた場合
            </button>
          </div>

          <div v-if="error" class="error-message global-error">
            {{ error }}
          </div>

          <button
            type="submit"
            class="submit-btn"
            :disabled="loading || !isFormValid"
          >
            <span v-if="loading" class="loading-spinner">🔄</span>
            {{ isLogin ? 'ログイン' : '新規登録' }}
          </button>
        </form>

        <div class="auth-switch">
          <span>
            {{ isLogin ? 'アカウントをお持ちでない場合' : '既にアカウントをお持ちの場合' }}
          </span>
          <button @click="toggleMode" class="switch-btn">
            {{ isLogin ? '新規登録' : 'ログイン' }}
          </button>
        </div>
      </div>

      <!-- パスワードリセットモーダル -->
      <div v-if="showForgotPassword" class="forgot-password-modal">
        <div class="forgot-password-content">
          <h3>パスワードリセット</h3>
          <p>登録されたメールアドレスにリセットリンクを送信します。</p>
          <form @submit.prevent="handlePasswordReset">
            <div class="form-group">
              <label for="resetEmail">メールアドレス</label>
              <input
                id="resetEmail"
                v-model="resetEmail"
                type="email"
                required
                placeholder="your@email.com"
              />
            </div>
            <div class="form-actions">
              <button type="button" @click="showForgotPassword = false" class="cancel-btn">
                キャンセル
              </button>
              <button type="submit" class="submit-btn" :disabled="loading">
                送信
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import { useAuth } from '../composables/useAuth'

interface Props {
  showModal: boolean
  initialMode?: 'login' | 'register'
}

interface Emits {
  (e: 'close'): void
  (e: 'success'): void
}

const props = withDefaults(defineProps<Props>(), {
  initialMode: 'login'
})

const emit = defineEmits<Emits>()

const {
  login,
  register,
  loginWithOAuth,
  requestPasswordReset,
  validateEmail,
  validatePassword,
  loading,
  error,
  oauthProviders
} = useAuth()

const isLogin = ref(props.initialMode === 'login')
const showPassword = ref(false)
const showForgotPassword = ref(false)
const resetEmail = ref('')

const formData = reactive({
  email: '',
  password: '',
  confirmPassword: '',
  name: '',
  rememberMe: false
})

// バリデーション
const emailError = computed(() => {
  if (!formData.email) return ''
  return validateEmail(formData.email) ? '' : '有効なメールアドレスを入力してください'
})

const passwordError = computed(() => {
  if (!formData.password) return ''
  if (isLogin.value) return ''
  const validation = validatePassword(formData.password)
  return validation.isValid ? '' : validation.errors[0]
})

const confirmPasswordError = computed(() => {
  if (isLogin.value || !formData.confirmPassword) return ''
  return formData.password === formData.confirmPassword ? '' : 'パスワードが一致しません'
})

const passwordStrength = computed(() => {
  if (!formData.password) return { level: '', percentage: 0, text: '', errors: [] }

  const validation = validatePassword(formData.password)
  let score = 0

  if (formData.password.length >= 8) score += 20
  if (/[A-Z]/.test(formData.password)) score += 20
  if (/[a-z]/.test(formData.password)) score += 20
  if (/[0-9]/.test(formData.password)) score += 20
  if (/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) score += 20

  let level = ''
  let text = ''

  if (score < 40) {
    level = 'weak'
    text = '弱い'
  } else if (score < 80) {
    level = 'medium'
    text = '普通'
  } else {
    level = 'strong'
    text = '強い'
  }

  return {
    level,
    percentage: score,
    text,
    errors: validation.errors
  }
})

const isFormValid = computed(() => {
  if (!formData.email || !formData.password) return false
  if (emailError.value || passwordError.value) return false
  if (!isLogin.value) {
    if (!formData.name || !formData.confirmPassword) return false
    if (confirmPasswordError.value) return false
  }
  return true
})

// メソッド
const closeModal = () => {
  emit('close')
}

const toggleMode = () => {
  isLogin.value = !isLogin.value
  // フォームをリセット
  formData.email = ''
  formData.password = ''
  formData.confirmPassword = ''
  formData.name = ''
  formData.rememberMe = false
}

const handleSubmit = async () => {
  if (!isFormValid.value) return

  let success = false

  if (isLogin.value) {
    success = await login({
      email: formData.email,
      password: formData.password,
      rememberMe: formData.rememberMe
    })
  } else {
    success = await register({
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      name: formData.name
    })
  }

  if (success) {
    emit('success')
    closeModal()
  }
}

const handleOAuthLogin = async (provider: string) => {
  try {
    await loginWithOAuth(provider)
  } catch (err) {
    console.error('OAuth ログインエラー:', err)
  }
}

const handlePasswordReset = async () => {
  if (!resetEmail.value || !validateEmail(resetEmail.value)) return

  const success = await requestPasswordReset(resetEmail.value)
  if (success) {
    showForgotPassword.value = false
    alert('パスワードリセットリンクを送信しました。メールをご確認ください。')
  }
}

const getOAuthIcon = (provider: string): string => {
  const icons: Record<string, string> = {
    google: '🔍',
    github: '🐙',
    microsoft: '🪟'
  }
  return icons[provider] || '🔑'
}

// プロップの変更を監視
watch(() => props.initialMode, (newMode) => {
  isLogin.value = newMode === 'login'
})
</script>

<style scoped>
.auth-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.auth-modal {
  background: white;
  border-radius: var(--radius-xl);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-2xl);
}

.auth-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-6) var(--spacing-6) var(--spacing-4);
  border-bottom: 1px solid var(--border-color);
}

.auth-header h2 {
  margin: 0;
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--color-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: var(--text-xl);
  cursor: pointer;
  color: var(--text-muted);
  padding: var(--spacing-2);
  border-radius: var(--radius-md);
  transition: var(--transition-fast);
}

.close-btn:hover {
  background: var(--bg-muted);
}

.auth-content {
  padding: var(--spacing-6);
}

.oauth-section {
  margin-bottom: var(--spacing-6);
}

.oauth-section h3 {
  margin: 0 0 var(--spacing-4) 0;
  font-size: var(--text-lg);
  font-weight: 500;
  text-align: center;
  color: var(--text-secondary);
}

.oauth-buttons {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.oauth-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-4);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  background: white;
  color: var(--text-primary);
  cursor: pointer;
  transition: var(--transition-normal);
  font-weight: 500;
}

.oauth-btn:hover {
  background: var(--bg-muted);
  border-color: var(--color-primary);
}

.oauth-google:hover {
  background: #f8f9fa;
  border-color: #4285f4;
}

.oauth-github:hover {
  background: #f6f8fa;
  border-color: #24292e;
}

.oauth-microsoft:hover {
  background: #f3f2f1;
  border-color: #0078d4;
}

.oauth-icon {
  font-size: var(--text-lg);
}

.divider {
  display: flex;
  align-items: center;
  margin: var(--spacing-6) 0;
  color: var(--text-muted);
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-color);
}

.divider span {
  padding: 0 var(--spacing-4);
  font-size: var(--text-sm);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.form-group label {
  font-weight: 500;
  color: var(--text-primary);
  font-size: var(--text-sm);
}

.form-group input {
  padding: var(--spacing-3);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  transition: var(--transition-fast);
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group input.error {
  border-color: var(--color-error);
}

.password-input {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: var(--spacing-3);
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: var(--text-lg);
}

.password-strength {
  margin-top: var(--spacing-2);
}

.strength-bar {
  height: 4px;
  background: var(--bg-muted);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: var(--spacing-2);
}

.strength-fill {
  height: 100%;
  transition: var(--transition-normal);
}

.strength-fill.weak {
  background: var(--color-error);
}

.strength-fill.medium {
  background: var(--color-warning);
}

.strength-fill.strong {
  background: var(--color-success);
}

.strength-text {
  font-size: var(--text-sm);
  font-weight: 500;
}

.strength-errors {
  list-style: none;
  padding: 0;
  margin: var(--spacing-2) 0 0 0;
}

.strength-errors li {
  font-size: var(--text-xs);
  color: var(--color-error);
  margin-bottom: var(--spacing-1);
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: var(--spacing-2) 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--text-sm);
  cursor: pointer;
}

.forgot-password {
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: var(--text-sm);
  cursor: pointer;
  text-decoration: underline;
}

.error-message {
  color: var(--color-error);
  font-size: var(--text-sm);
  margin-top: var(--spacing-1);
}

.global-error {
  padding: var(--spacing-3);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid var(--color-error);
  border-radius: var(--radius-md);
  text-align: center;
}

.submit-btn {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-normal);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
}

.submit-btn:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.auth-switch {
  text-align: center;
  margin-top: var(--spacing-6);
  padding-top: var(--spacing-4);
  border-top: 1px solid var(--border-color);
}

.auth-switch span {
  color: var(--text-muted);
  font-size: var(--text-sm);
}

.switch-btn {
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  text-decoration: underline;
  margin-left: var(--spacing-2);
}

.forgot-password-modal {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: var(--radius-xl);
}

.forgot-password-content {
  background: white;
  padding: var(--spacing-6);
  border-radius: var(--radius-lg);
  max-width: 400px;
  width: 90%;
}

.forgot-password-content h3 {
  margin: 0 0 var(--spacing-4) 0;
  font-size: var(--text-lg);
  font-weight: 600;
}

.forgot-password-content p {
  margin: 0 0 var(--spacing-4) 0;
  color: var(--text-muted);
  font-size: var(--text-sm);
}

.form-actions {
  display: flex;
  gap: var(--spacing-3);
  margin-top: var(--spacing-4);
}

.cancel-btn {
  background: var(--bg-muted);
  color: var(--text-primary);
  border: none;
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition-fast);
}

.cancel-btn:hover {
  background: var(--bg-muted-dark);
}
</style>
