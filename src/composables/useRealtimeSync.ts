import { ref, onMounted, onUnmounted } from 'vue'
import { useSignalingClient } from './useSignalingClient'

export interface User {
    id: string
    nickname: string
    color: string
    position: { x: number; y: number }
    isActive: boolean
    isSpeaking: boolean
    joinedAt: Date
}

export interface ChatMessage {
    id: string
    userId: string
    username: string
    userColor: string
    text: string
    timestamp: Date
}

export interface RoomState {
    users: Map<string, User>
    messages: ChatMessage[]
    roomId: string
}

export function useRealtimeSync(roomId: string, userId: string, nickname: string) {
    const connectedUsers = ref<User[]>([])
    const chatMessages = ref<ChatMessage[]>([])
    const isConnected = ref(false)
    const connectionError = ref<string | null>(null)

    // シグナリングクライアント
    const signalingClient = useSignalingClient(roomId, userId, nickname)

    // ローカルストレージキー
    const STORAGE_KEY = `virtual-office-room-${roomId}`

    // ローカルストレージからデータを読み込み
    const loadFromStorage = () => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY)
            if (stored) {
                const data = JSON.parse(stored)
                if (data.users) {
                    connectedUsers.value = data.users.map((user: any) => ({
                        ...user,
                        joinedAt: new Date(user.joinedAt)
                    }))
                }
                if (data.messages) {
                    chatMessages.value = data.messages.map((msg: any) => ({
                        ...msg,
                        timestamp: new Date(msg.timestamp)
                    }))
                }
            }
        } catch (error) {
            console.error('Failed to load from storage:', error)
        }
    }

    // ローカルストレージにデータを保存
    const saveToStorage = () => {
        try {
            const data = {
                users: connectedUsers.value,
                messages: chatMessages.value.slice(-50) // 最新50件のみ保存
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
        } catch (error) {
            console.error('Failed to save to storage:', error)
        }
    }

    // WebSocket接続の初期化
    const initializeConnection = () => {
        // シグナリングクライアントの接続状態を監視
        isConnected.value = signalingClient.isConnected.value
        connectionError.value = signalingClient.connectionError.value

        // シグナリングクライアントのイベントリスナーを設定
        setupSignalingListeners()
    }

    // シグナリングクライアントのイベントリスナー設定
    const setupSignalingListeners = () => {
        // ユーザー参加
        signalingClient.on('user-joined', (user) => {
            const newUser: User = {
                id: user.id,
                nickname: user.nickname,
                color: generateRandomColor(),
                position: user.position,
                isActive: true,
                isSpeaking: false,
                joinedAt: new Date()
            }
            addOrUpdateUser(newUser)
        })

        // ユーザー退出
        signalingClient.on('user-left', (userId) => {
            removeUser(userId)
        })

        // 位置更新
        signalingClient.on('user-position-update', (userId, position) => {
            updateUserPosition(userId, position)
        })

        // チャットメッセージ
        signalingClient.on('chat-message', (message) => {
            const newMessage: ChatMessage = {
                id: message.id || generateId(),
                userId: message.userId,
                username: message.nickname || 'Unknown',
                userColor: generateRandomColor(),
                text: message.message,
                timestamp: new Date(message.timestamp)
            }
            chatMessages.value.push(newMessage)
        })

        // 既存ユーザー一覧
        signalingClient.on('room-users', (users) => {
            users.forEach(user => {
                const newUser: User = {
                    id: user.id,
                    nickname: user.nickname,
                    color: generateRandomColor(),
                    position: user.position,
                    isActive: true,
                    isSpeaking: false,
                    joinedAt: new Date()
                }
                addOrUpdateUser(newUser)
            })
        })
    }

    // ランダムな色の生成
    const generateRandomColor = () => {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8']
        return colors[Math.floor(Math.random() * colors.length)]
    }

    // ユーザーの追加/更新
    const addOrUpdateUser = (user: User) => {
        const existingIndex = connectedUsers.value.findIndex(u => u.id === user.id)

        if (existingIndex >= 0) {
            connectedUsers.value[existingIndex] = user
        } else {
            connectedUsers.value.push(user)
        }

        saveToStorage()
        broadcastUserUpdate(user)
    }

    // ユーザーの削除
    const removeUser = (userId: string) => {
        connectedUsers.value = connectedUsers.value.filter(u => u.id !== userId)
        saveToStorage()
        broadcastUserRemoval(userId)
    }

    // ユーザー位置の更新
    const updateUserPosition = (userId: string, position: { x: number; y: number }) => {
        const user = connectedUsers.value.find(u => u.id === userId)
        if (user) {
            user.position = position
            saveToStorage()
            broadcastUserUpdate(user)
        }
    }

    // チャットメッセージの送信
    const sendChatMessage = (messageText: string) => {
        signalingClient.sendChatMessage(messageText)
    }

    // ブロードキャスト関数（実際の実装ではWebSocketを使用）
    const broadcastUserUpdate = (user: User) => {
        // デモ用：他のタブ/ウィンドウに通知
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('user-update', { detail: user }))
        }
    }

    const broadcastUserRemoval = (userId: string) => {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('user-removal', { detail: userId }))
        }
    }

    const broadcastChatMessage = (message: ChatMessage) => {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('chat-message', { detail: message }))
        }
    }

    // IDの生成
    const generateId = () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2)
    }

    // イベントリスナーの設定
    const setupEventListeners = () => {
        if (typeof window === 'undefined') return

        const handleUserUpdate = (event: Event) => {
            const customEvent = event as CustomEvent
            const user = customEvent.detail as User
            const existingIndex = connectedUsers.value.findIndex(u => u.id === user.id)

            if (existingIndex >= 0) {
                connectedUsers.value[existingIndex] = user
            } else {
                connectedUsers.value.push(user)
            }
        }

        const handleUserRemoval = (event: Event) => {
            const customEvent = event as CustomEvent
            const userId = customEvent.detail as string
            connectedUsers.value = connectedUsers.value.filter(u => u.id !== userId)
        }

        const handleChatMessage = (event: Event) => {
            const customEvent = event as CustomEvent
            const message = customEvent.detail as ChatMessage
            if (!chatMessages.value.find(m => m.id === message.id)) {
                chatMessages.value.push(message)
            }
        }

        window.addEventListener('user-update', handleUserUpdate)
        window.addEventListener('user-removal', handleUserRemoval)
        window.addEventListener('chat-message', handleChatMessage)

        // クリーンアップ
        onUnmounted(() => {
            window.removeEventListener('user-update', handleUserUpdate)
            window.removeEventListener('user-removal', handleUserRemoval)
            window.removeEventListener('chat-message', handleChatMessage)
        })
    }

    // 接続状態の監視
    const startHeartbeat = () => {
        const heartbeatInterval = setInterval(() => {
            if (isConnected.value) {
                // ハートビート処理
                console.log('Heartbeat:', new Date().toISOString())
            }
        }, 30000)

        onUnmounted(() => {
            clearInterval(heartbeatInterval)
        })
    }

    // 初期化
    onMounted(() => {
        loadFromStorage()
        initializeConnection()
        setupEventListeners()
        startHeartbeat()
    })

    // クリーンアップ
    onUnmounted(() => {
        // シグナリングクライアントは自動的にクリーンアップされる
    })

    return {
        // 状態
        connectedUsers,
        chatMessages,
        isConnected,
        connectionError,

        // メソッド
        addOrUpdateUser,
        removeUser,
        updateUserPosition,
        sendChatMessage,

        // ユーティリティ
        generateId
    }
}
