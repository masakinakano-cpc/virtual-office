import { ref, computed } from 'vue'

export interface UserLocation {
    id: string
    x: number
    y: number
    nickname?: string
}

export interface WebRTCUser {
    id: string
    x: number
    y: number
    nickname?: string
    isConnected: boolean
    lastSeen?: Date
}

export function useLocationUrl() {
    const currentUser = ref<UserLocation | null>(null)
    const webrtcUsers = ref<Map<string, WebRTCUser>>(new Map())
    const baseUrl = ref(window.location.origin)

    /**
     * ユーザーの位置情報からURL生成
     * 元のコード: getCurrentLocationUrl-B_mwu0Ym.js の E 関数を参考
     */
    const generateLocationUrl = (
        user: UserLocation | null,
        webrtc: { getUser: (id: string) => WebRTCUser | null } | null,
        prefix: string = ''
    ): string | undefined => {
        if (!user?.id) return undefined

        const webrtcUser = webrtc?.getUser(user.id)

        // WebRTCユーザーの位置情報が存在しない場合は生成しない
        if (!webrtcUser?.x || !webrtcUser?.y) return undefined

        // プレフィックス@座標の形式でURL生成
        return `${prefix}@${webrtcUser.x},${webrtcUser.y}`
    }

    /**
     * 現在のユーザー位置をURLに反映
     */
    const getCurrentLocationUrl = (prefix: string = 'user'): string | undefined => {
        const mockWebrtc = {
            getUser: (id: string) => webrtcUsers.value.get(id) || null
        }

        return generateLocationUrl(currentUser.value, mockWebrtc, prefix)
    }

    /**
     * URLから位置情報を解析
     */
    const parseLocationFromUrl = (url: string): { x: number, y: number } | null => {
        const match = url.match(/@(\d+(?:\.\d+)?),(\d+(?:\.\d+)?)/)
        if (!match) return null

        return {
            x: parseFloat(match[1]),
            y: parseFloat(match[2])
        }
    }

    /**
     * 位置情報付きURLを生成
     */
    const createLocationShareUrl = (
        x: number,
        y: number,
        roomId?: string,
        message?: string
    ): string => {
        const url = new URL(baseUrl.value)

        // 位置情報をハッシュに追加
        url.hash = `@${x},${y}`

        // ルームIDがある場合はパスに追加
        if (roomId) {
            url.pathname = `/room/${roomId}`
        }

        // メッセージがある場合はクエリパラメータに追加
        if (message) {
            url.searchParams.set('message', encodeURIComponent(message))
        }

        return url.toString()
    }

    /**
     * 現在の位置を共有URLとして生成
     */
    const shareCurrentLocation = (message?: string): string | null => {
        if (!currentUser.value) return null

        const webrtcUser = webrtcUsers.value.get(currentUser.value.id)
        if (!webrtcUser?.x || !webrtcUser?.y) return null

        return createLocationShareUrl(
            webrtcUser.x,
            webrtcUser.y,
            undefined,
            message
        )
    }

    /**
     * ユーザー位置を更新
     */
    const updateUserLocation = (userId: string, x: number, y: number, nickname?: string) => {
        const existingUser = webrtcUsers.value.get(userId)

        webrtcUsers.value.set(userId, {
            id: userId,
            x,
            y,
            nickname: nickname || existingUser?.nickname || `User-${userId.slice(-4)}`,
            isConnected: true,
            lastSeen: new Date()
        })

        // 現在のユーザーの場合は currentUser も更新
        if (currentUser.value?.id === userId) {
            currentUser.value = {
                id: userId,
                x,
                y,
                nickname: nickname || currentUser.value.nickname
            }
        }
    }

    /**
     * ユーザーを削除
     */
    const removeUser = (userId: string) => {
        webrtcUsers.value.delete(userId)

        if (currentUser.value?.id === userId) {
            currentUser.value = null
        }
    }

    /**
     * 現在のユーザーを設定
     */
    const setCurrentUser = (user: UserLocation) => {
        currentUser.value = user

        // WebRTCユーザーリストにも追加
        updateUserLocation(user.id, user.x, user.y, user.nickname)
    }

    /**
     * 接続中のユーザー一覧を取得
     */
    const connectedUsers = computed(() => {
        return Array.from(webrtcUsers.value.values()).filter(user => user.isConnected)
    })

    /**
     * 特定のユーザーの位置情報を取得
     */
    const getUserLocation = (userId: string): WebRTCUser | null => {
        return webrtcUsers.value.get(userId) || null
    }

    /**
     * 距離計算
     */
    const calculateDistance = (
        user1: { x: number, y: number },
        user2: { x: number, y: number }
    ): number => {
        const dx = user1.x - user2.x
        const dy = user1.y - user2.y
        return Math.sqrt(dx * dx + dy * dy)
    }

    /**
     * 近くのユーザーを取得
     */
    const getNearbyUsers = (maxDistance: number = 100): WebRTCUser[] => {
        if (!currentUser.value) return []

        const current = webrtcUsers.value.get(currentUser.value.id)
        if (!current) return []

        return connectedUsers.value.filter(user => {
            if (user.id === currentUser.value?.id) return false

            const distance = calculateDistance(current, user)
            return distance <= maxDistance
        })
    }

    /**
     * URL履歴管理
     */
    const updateUrlWithLocation = (x: number, y: number) => {
        const url = new URL(window.location.href)
        url.hash = `@${x},${y}`

        // ブラウザの履歴を更新（ページリロードなし）
        window.history.replaceState({}, '', url.toString())
    }

    return {
        currentUser,
        webrtcUsers,
        baseUrl,
        connectedUsers,
        generateLocationUrl,
        getCurrentLocationUrl,
        parseLocationFromUrl,
        createLocationShareUrl,
        shareCurrentLocation,
        updateUserLocation,
        removeUser,
        setCurrentUser,
        getUserLocation,
        calculateDistance,
        getNearbyUsers,
        updateUrlWithLocation
    }
}
