import { ref, onMounted, onUnmounted } from 'vue'

export interface SignalingMessage {
    type: string
    [key: string]: any
}

export interface WebRTCSignal {
    type: 'offer' | 'answer' | 'ice-candidate'
    offer?: RTCSessionDescriptionInit
    answer?: RTCSessionDescriptionInit
    candidate?: RTCIceCandidateInit
}

export interface RoomUser {
    id: string
    nickname: string
    position: { x: number; y: number }
    isVideoEnabled: boolean
    isAudioEnabled: boolean
}

export function useSignalingClient(roomId: string, userId: string, nickname: string) {
    const ws = ref<WebSocket | null>(null)
    const isConnected = ref(false)
    const connectionError = ref<string | null>(null)
    const roomUsers = ref<RoomUser[]>([])
    const reconnectAttempts = ref(0)
    const maxReconnectAttempts = 5

    // イベントハンドラー
    const eventHandlers = {
        'user-joined': new Set<(user: RoomUser) => void>(),
        'user-left': new Set<(userId: string) => void>(),
        'user-position-update': new Set<(userId: string, position: { x: number; y: number }) => void>(),
        'user-media-update': new Set<(userId: string, mediaState: { isVideoEnabled: boolean; isAudioEnabled: boolean }) => void>(),
        'webrtc-signal': new Set<(fromUserId: string, signal: WebRTCSignal) => void>(),
        'chat-message': new Set<(message: any) => void>(),
        'room-users': new Set<(users: RoomUser[]) => void>()
    }

    // WebSocket接続の初期化
    const connect = () => {
        if (ws.value?.readyState === WebSocket.OPEN) {
            return
        }

        const wsUrl = `ws://localhost:8080?roomId=${encodeURIComponent(roomId)}&userId=${encodeURIComponent(userId)}&nickname=${encodeURIComponent(nickname)}`

        try {
            ws.value = new WebSocket(wsUrl)

            ws.value.onopen = () => {
                console.log('WebSocket接続成功')
                isConnected.value = true
                connectionError.value = null
                reconnectAttempts.value = 0
            }

            ws.value.onmessage = (event) => {
                try {
                    const message: SignalingMessage = JSON.parse(event.data)
                    handleMessage(message)
                } catch (error) {
                    console.error('メッセージ解析エラー:', error)
                }
            }

            ws.value.onclose = (event) => {
                console.log('WebSocket接続終了:', event.code, event.reason)
                isConnected.value = false

                // 異常終了の場合は再接続を試行
                if (event.code !== 1000 && reconnectAttempts.value < maxReconnectAttempts) {
                    setTimeout(() => {
                        reconnectAttempts.value++
                        console.log(`再接続試行 ${reconnectAttempts.value}/${maxReconnectAttempts}`)
                        connect()
                    }, Math.pow(2, reconnectAttempts.value) * 1000)
                }
            }

            ws.value.onerror = (error) => {
                console.error('WebSocketエラー:', error)
                connectionError.value = 'WebSocket接続エラー'
            }

        } catch (error) {
            console.error('WebSocket接続失敗:', error)
            connectionError.value = 'WebSocket接続に失敗しました'
        }
    }

    // メッセージの処理
    const handleMessage = (message: SignalingMessage) => {
        switch (message.type) {
            case 'connection-success':
                console.log('サーバー接続成功:', message)
                break

            case 'room-users':
                roomUsers.value = message.users
                eventHandlers['room-users'].forEach(handler => handler(message.users))
                break

            case 'user-joined':
                const newUser: RoomUser = {
                    id: message.userId,
                    nickname: message.nickname,
                    position: message.position,
                    isVideoEnabled: true,
                    isAudioEnabled: true
                }
                roomUsers.value.push(newUser)
                eventHandlers['user-joined'].forEach(handler => handler(newUser))
                break

            case 'user-left':
                roomUsers.value = roomUsers.value.filter(user => user.id !== message.userId)
                eventHandlers['user-left'].forEach(handler => handler(message.userId))
                break

            case 'user-position-update':
                const userIndex = roomUsers.value.findIndex(user => user.id === message.userId)
                if (userIndex !== -1) {
                    roomUsers.value[userIndex].position = message.position
                }
                eventHandlers['user-position-update'].forEach(handler =>
                    handler(message.userId, message.position)
                )
                break

            case 'user-media-update':
                const mediaUserIndex = roomUsers.value.findIndex(user => user.id === message.userId)
                if (mediaUserIndex !== -1) {
                    roomUsers.value[mediaUserIndex].isVideoEnabled = message.mediaState.isVideoEnabled
                    roomUsers.value[mediaUserIndex].isAudioEnabled = message.mediaState.isAudioEnabled
                }
                eventHandlers['user-media-update'].forEach(handler =>
                    handler(message.userId, message.mediaState)
                )
                break

            case 'webrtc-signal':
                // 新しいサーバー形式に対応
                const signal = message.signal || message
                eventHandlers['webrtc-signal'].forEach(handler =>
                    handler(message.fromUserId, signal)
                )
                console.log('WebRTCシグナル受信:', message.signalType || signal.type, 'from:', message.fromUserId)
                break

            case 'chat-message':
                eventHandlers['chat-message'].forEach(handler => handler(message))
                break

            case 'pong':
                // ハートビート応答
                break

            default:
                console.log('未知のメッセージタイプ:', message.type)
        }
    }

    // メッセージの送信
    const sendMessage = (message: SignalingMessage) => {
        if (ws.value?.readyState === WebSocket.OPEN) {
            ws.value.send(JSON.stringify(message))
        } else {
            console.error('WebSocket未接続のため送信できません')
        }
    }

    // WebRTCシグナリングメッセージの送信
    const sendWebRTCSignal = (targetUserId: string, signal: WebRTCSignal) => {
        // 直接的なWebRTCメッセージとして送信
        const message = {
            ...signal,
            targetUserId: targetUserId
        }
        sendMessage(message as any)
        console.log('WebRTCシグナル送信:', signal.type, 'to:', targetUserId)
    }

    // 位置更新の送信
    const sendPositionUpdate = (position: { x: number; y: number }) => {
        sendMessage({
            type: 'position-update',
            position
        })
    }

    // メディア状態更新の送信
    const sendMediaUpdate = (mediaState: { isVideoEnabled: boolean; isAudioEnabled: boolean }) => {
        sendMessage({
            type: 'media-update',
            mediaState
        })
    }

    // チャットメッセージの送信
    const sendChatMessage = (message: string) => {
        sendMessage({
            type: 'chat-message',
            message
        })
    }

    // イベントリスナーの登録
    const on = <T extends keyof typeof eventHandlers>(
        event: T,
        handler: T extends 'user-joined' ? (user: RoomUser) => void :
            T extends 'user-left' ? (userId: string) => void :
            T extends 'user-position-update' ? (userId: string, position: { x: number; y: number }) => void :
            T extends 'user-media-update' ? (userId: string, mediaState: { isVideoEnabled: boolean; isAudioEnabled: boolean }) => void :
            T extends 'webrtc-signal' ? (fromUserId: string, signal: WebRTCSignal) => void :
            T extends 'chat-message' ? (message: any) => void :
            T extends 'room-users' ? (users: RoomUser[]) => void :
            never
    ) => {
        eventHandlers[event].add(handler as any)
    }

    // メッセージリスナーの追加（WebRTC用）
    const onMessage = (handler: (message: any) => void) => {
        const allMessageHandler = (message: SignalingMessage) => {
            handler(message)
        }

        // 全てのメッセージタイプに対してハンドラーを追加
        ws.value?.addEventListener('message', (event) => {
            try {
                const message: SignalingMessage = JSON.parse(event.data)
                allMessageHandler(message)
            } catch (error) {
                console.error('メッセージ解析エラー:', error)
            }
        })
    }

    // イベントリスナーの削除
    const off = <T extends keyof typeof eventHandlers>(
        event: T,
        handler: T extends 'user-joined' ? (user: RoomUser) => void :
            T extends 'user-left' ? (userId: string) => void :
            T extends 'user-position-update' ? (userId: string, position: { x: number; y: number }) => void :
            T extends 'user-media-update' ? (userId: string, mediaState: { isVideoEnabled: boolean; isAudioEnabled: boolean }) => void :
            T extends 'webrtc-signal' ? (fromUserId: string, signal: WebRTCSignal) => void :
            T extends 'chat-message' ? (message: any) => void :
            T extends 'room-users' ? (users: RoomUser[]) => void :
            never
    ) => {
        eventHandlers[event].delete(handler as any)
    }

    // 接続の切断
    const disconnect = () => {
        if (ws.value) {
            ws.value.close(1000, 'Client disconnect')
            ws.value = null
        }
        isConnected.value = false
    }

    // ハートビートの送信
    const sendHeartbeat = () => {
        sendMessage({ type: 'ping' })
    }

    // 初期化
    onMounted(() => {
        connect()

        // 定期的なハートビート
        const heartbeatInterval = setInterval(() => {
            if (isConnected.value) {
                sendHeartbeat()
            }
        }, 30000)

        onUnmounted(() => {
            clearInterval(heartbeatInterval)
            disconnect()
        })
    })

    return {
        // 状態
        isConnected,
        connectionError,
        roomUsers,

        // メソッド
        connect,
        disconnect,
        sendMessage,
        sendWebRTCSignal,
        sendPositionUpdate,
        sendMediaUpdate,
        sendChatMessage,
        on,
        off,
        onMessage
    }
}
