import { ref, reactive, computed } from 'vue'

export interface User {
    id: string
    email: string
    name: string
    avatar?: string
    role: 'admin' | 'member' | 'guest'
    permissions: string[]
    lastLogin?: Date
    isActive: boolean
    preferences: UserPreferences
}

export interface UserPreferences {
    theme: 'light' | 'dark' | 'auto'
    language: string
    notifications: boolean
    privacy: 'public' | 'private' | 'friends'
}

export interface AuthState {
    isAuthenticated: boolean
    user: User | null
    token: string | null
    refreshToken: string | null
    sessionExpiry: Date | null
}

export interface LoginCredentials {
    email: string
    password: string
    rememberMe?: boolean
}

export interface RegisterData {
    email: string
    password: string
    name: string
    confirmPassword: string
}

export interface OAuthProvider {
    name: string
    clientId: string
    redirectUri: string
    scope: string[]
}

export function useAuth() {
    const authState = reactive<AuthState>({
        isAuthenticated: false,
        user: null,
        token: null,
        refreshToken: null,
        sessionExpiry: null
    })

    const loading = ref(false)
    const error = ref<string | null>(null)

    // OAuth プロバイダー設定
    const oauthProviders = reactive<Record<string, OAuthProvider>>({
        google: {
            name: 'Google',
            clientId: process.env.VITE_GOOGLE_CLIENT_ID || '',
            redirectUri: `${window.location.origin}/auth/callback/google`,
            scope: ['openid', 'profile', 'email']
        },
        github: {
            name: 'GitHub',
            clientId: process.env.VITE_GITHUB_CLIENT_ID || '',
            redirectUri: `${window.location.origin}/auth/callback/github`,
            scope: ['user:email']
        },
        microsoft: {
            name: 'Microsoft',
            clientId: process.env.VITE_MICROSOFT_CLIENT_ID || '',
            redirectUri: `${window.location.origin}/auth/callback/microsoft`,
            scope: ['openid', 'profile', 'email']
        }
    })

    // 権限チェック
    const hasPermission = (permission: string): boolean => {
        return authState.user?.permissions.includes(permission) || false
    }

    const hasRole = (role: string): boolean => {
        return authState.user?.role === role || false
    }

    const isAdmin = computed(() => hasRole('admin'))
    const isMember = computed(() => hasRole('member'))
    const isGuest = computed(() => hasRole('guest'))

    // パスワード強度チェック
    const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
        const errors: string[] = []

        if (password.length < 8) {
            errors.push('パスワードは8文字以上である必要があります')
        }

        if (!/[A-Z]/.test(password)) {
            errors.push('大文字を含める必要があります')
        }

        if (!/[a-z]/.test(password)) {
            errors.push('小文字を含める必要があります')
        }

        if (!/[0-9]/.test(password)) {
            errors.push('数字を含める必要があります')
        }

        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('特殊文字を含める必要があります')
        }

        return {
            isValid: errors.length === 0,
            errors
        }
    }

    // メールアドレス検証
    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }

    // セッション管理
    const isSessionValid = (): boolean => {
        if (!authState.sessionExpiry) return false
        return new Date() < authState.sessionExpiry
    }

    const refreshSession = async (): Promise<boolean> => {
        if (!authState.refreshToken) return false

        try {
            loading.value = true

            // リフレッシュトークンを使用してセッションを更新
            const response = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    refreshToken: authState.refreshToken
                })
            })

            if (!response.ok) {
                throw new Error('セッションの更新に失敗しました')
            }

            const data = await response.json()

            authState.token = data.token
            authState.refreshToken = data.refreshToken
            authState.sessionExpiry = new Date(data.expiresAt)

            // トークンをローカルストレージに保存
            localStorage.setItem('auth_token', data.token)
            localStorage.setItem('refresh_token', data.refreshToken)

            return true
        } catch (err) {
            console.error('セッション更新エラー:', err)
            await logout()
            return false
        } finally {
            loading.value = false
        }
    }

    // ログイン
    const login = async (credentials: LoginCredentials): Promise<boolean> => {
        try {
            loading.value = true
            error.value = null

            if (!validateEmail(credentials.email)) {
                throw new Error('有効なメールアドレスを入力してください')
            }

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials)
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'ログインに失敗しました')
            }

            const data = await response.json()

            authState.isAuthenticated = true
            authState.user = data.user
            authState.token = data.token
            authState.refreshToken = data.refreshToken
            authState.sessionExpiry = new Date(data.expiresAt)

            // トークンをローカルストレージに保存
            if (credentials.rememberMe) {
                localStorage.setItem('auth_token', data.token)
                localStorage.setItem('refresh_token', data.refreshToken)
            } else {
                sessionStorage.setItem('auth_token', data.token)
            }

            return true
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'ログインエラーが発生しました'
            return false
        } finally {
            loading.value = false
        }
    }

    // OAuth ログイン
    const loginWithOAuth = async (provider: string): Promise<void> => {
        const config = oauthProviders[provider]
        if (!config) {
            throw new Error(`サポートされていないプロバイダー: ${provider}`)
        }

        const params = new URLSearchParams({
            client_id: config.clientId,
            redirect_uri: config.redirectUri,
            scope: config.scope.join(' '),
            response_type: 'code',
            state: generateRandomString(32) // CSRF保護
        })

        // OAuth プロバイダーにリダイレクト
        const authUrl = getOAuthUrl(provider, params)
        window.location.href = authUrl
    }

    // OAuth URL生成
    const getOAuthUrl = (provider: string, params: URLSearchParams): string => {
        const baseUrls: Record<string, string> = {
            google: 'https://accounts.google.com/o/oauth2/v2/auth',
            github: 'https://github.com/login/oauth/authorize',
            microsoft: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'
        }

        return `${baseUrls[provider]}?${params.toString()}`
    }

    // ユーザー登録
    const register = async (userData: RegisterData): Promise<boolean> => {
        try {
            loading.value = true
            error.value = null

            if (!validateEmail(userData.email)) {
                throw new Error('有効なメールアドレスを入力してください')
            }

            if (userData.password !== userData.confirmPassword) {
                throw new Error('パスワードが一致しません')
            }

            const passwordValidation = validatePassword(userData.password)
            if (!passwordValidation.isValid) {
                throw new Error(passwordValidation.errors.join('\n'))
            }

            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: userData.email,
                    password: userData.password,
                    name: userData.name
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || '登録に失敗しました')
            }

            return true
        } catch (err) {
            error.value = err instanceof Error ? err.message : '登録エラーが発生しました'
            return false
        } finally {
            loading.value = false
        }
    }

    // ログアウト
    const logout = async (): Promise<void> => {
        try {
            if (authState.token) {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${authState.token}`,
                        'Content-Type': 'application/json',
                    }
                })
            }
        } catch (err) {
            console.error('ログアウトエラー:', err)
        } finally {
            // 状態をクリア
            authState.isAuthenticated = false
            authState.user = null
            authState.token = null
            authState.refreshToken = null
            authState.sessionExpiry = null

            // ストレージをクリア
            localStorage.removeItem('auth_token')
            localStorage.removeItem('refresh_token')
            sessionStorage.removeItem('auth_token')
        }
    }

    // パスワードリセット
    const requestPasswordReset = async (email: string): Promise<boolean> => {
        try {
            loading.value = true
            error.value = null

            if (!validateEmail(email)) {
                throw new Error('有効なメールアドレスを入力してください')
            }

            const response = await fetch('/api/auth/password-reset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'パスワードリセット要求に失敗しました')
            }

            return true
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'パスワードリセットエラーが発生しました'
            return false
        } finally {
            loading.value = false
        }
    }

    // プロフィール更新
    const updateProfile = async (updates: Partial<User>): Promise<boolean> => {
        try {
            loading.value = true
            error.value = null

            const response = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${authState.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updates)
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'プロフィール更新に失敗しました')
            }

            const updatedUser = await response.json()
            authState.user = updatedUser

            return true
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'プロフィール更新エラーが発生しました'
            return false
        } finally {
            loading.value = false
        }
    }

    // 初期化（ページロード時）
    const initialize = async (): Promise<void> => {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')

        if (token) {
            authState.token = token
            authState.refreshToken = localStorage.getItem('refresh_token')

            try {
                const response = await fetch('/api/auth/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })

                if (response.ok) {
                    const userData = await response.json()
                    authState.isAuthenticated = true
                    authState.user = userData
                    authState.sessionExpiry = new Date(userData.sessionExpiry)
                } else {
                    // トークンが無効な場合、リフレッシュを試行
                    await refreshSession()
                }
            } catch (err) {
                console.error('認証初期化エラー:', err)
                await logout()
            }
        }
    }

    // ユーティリティ関数
    const generateRandomString = (length: number): string => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        let result = ''
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return result
    }

    return {
        // 状態
        authState,
        loading,
        error,
        oauthProviders,

        // 計算プロパティ
        isAdmin,
        isMember,
        isGuest,

        // メソッド
        login,
        loginWithOAuth,
        register,
        logout,
        requestPasswordReset,
        updateProfile,
        hasPermission,
        hasRole,
        validatePassword,
        validateEmail,
        isSessionValid,
        refreshSession,
        initialize
    }
}
