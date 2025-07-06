import { ref, reactive, onMounted } from 'vue'

export interface CacheStrategy {
    name: string
    pattern: RegExp
    strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate'
    maxAge?: number
    maxEntries?: number
}

export interface SyncTask {
    id: string
    type: 'chat' | 'file-upload' | 'settings' | 'user-action'
    data: any
    timestamp: number
    retryCount: number
    maxRetries: number
}

export interface ServiceWorkerState {
    isSupported: boolean
    isRegistered: boolean
    isOnline: boolean
    isUpdating: boolean
    hasUpdate: boolean
    syncQueue: SyncTask[]
    cacheSize: number
}

export function useServiceWorker() {
    const state = reactive<ServiceWorkerState>({
        isSupported: 'serviceWorker' in navigator,
        isRegistered: false,
        isOnline: navigator.onLine,
        isUpdating: false,
        hasUpdate: false,
        syncQueue: [],
        cacheSize: 0
    })

    const registration = ref<ServiceWorkerRegistration | null>(null)
    const error = ref<string | null>(null)

    // キャッシュ戦略設定
    const cacheStrategies: CacheStrategy[] = [
        {
            name: 'static-assets',
            pattern: /\.(js|css|png|jpg|jpeg|gif|svg|woff2|woff)$/,
            strategy: 'cache-first',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7日
            maxEntries: 100
        },
        {
            name: 'api-calls',
            pattern: /\/api\//,
            strategy: 'network-first',
            maxAge: 5 * 60 * 1000, // 5分
            maxEntries: 50
        },
        {
            name: 'html-pages',
            pattern: /\.html$/,
            strategy: 'stale-while-revalidate',
            maxAge: 24 * 60 * 60 * 1000, // 1日
            maxEntries: 20
        },
        {
            name: 'user-avatars',
            pattern: /\/avatars\//,
            strategy: 'cache-first',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30日
            maxEntries: 200
        }
    ]

    // Service Worker登録
    const register = async (): Promise<boolean> => {
        if (!state.isSupported) {
            error.value = 'Service Workerがサポートされていません'
            return false
        }

        try {
            registration.value = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            })

            state.isRegistered = true

            // 更新チェック
            registration.value.addEventListener('updatefound', () => {
                const newWorker = registration.value?.installing
                if (newWorker) {
                    state.isUpdating = true

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            state.hasUpdate = true
                            state.isUpdating = false
                        }
                    })
                }
            })

            // メッセージ受信
            navigator.serviceWorker.addEventListener('message', handleMessage)

            // オンライン状態監視
            window.addEventListener('online', () => {
                state.isOnline = true
                processSyncQueue()
            })

            window.addEventListener('offline', () => {
                state.isOnline = false
            })

            console.log('Service Worker登録完了')
            return true
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Service Worker登録に失敗しました'
            console.error('Service Worker登録エラー:', err)
            return false
        }
    }

    // Service Worker更新
    const update = async (): Promise<boolean> => {
        if (!registration.value) return false

        try {
            await registration.value.update()
            return true
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Service Worker更新に失敗しました'
            return false
        }
    }

    // 新しいService Workerを有効化
    const skipWaiting = async (): Promise<void> => {
        if (registration.value?.waiting) {
            registration.value.waiting.postMessage({ type: 'SKIP_WAITING' })
        }
    }

    // メッセージハンドラー
    const handleMessage = (event: MessageEvent) => {
        const { type, payload } = event.data

        switch (type) {
            case 'CACHE_UPDATED':
                updateCacheSize()
                break
            case 'SYNC_COMPLETE':
                handleSyncComplete(payload.taskId)
                break
            case 'SYNC_FAILED':
                handleSyncFailed(payload.taskId, payload.error)
                break
            case 'OFFLINE_FALLBACK':
                console.log('オフライン時のフォールバック:', payload)
                break
        }
    }

    // キャッシュサイズ更新
    const updateCacheSize = async (): Promise<void> => {
        try {
            if ('storage' in navigator && 'estimate' in navigator.storage) {
                const estimate = await navigator.storage.estimate()
                state.cacheSize = estimate.usage || 0
            }
        } catch (err) {
            console.error('キャッシュサイズ取得エラー:', err)
        }
    }

    // データをキャッシュに保存
    const cacheData = async (key: string, data: any, strategy?: string): Promise<boolean> => {
        try {
            const message = {
                type: 'CACHE_DATA',
                payload: { key, data, strategy }
            }

            await sendMessage(message)
            return true
        } catch (err) {
            console.error('データキャッシュエラー:', err)
            return false
        }
    }

    // キャッシュからデータを取得
    const getCachedData = async (key: string): Promise<any> => {
        try {
            const message = {
                type: 'GET_CACHED_DATA',
                payload: { key }
            }

            const response = await sendMessage(message)
            return response.data
        } catch (err) {
            console.error('キャッシュデータ取得エラー:', err)
            return null
        }
    }

    // キャッシュをクリア
    const clearCache = async (cacheName?: string): Promise<boolean> => {
        try {
            const message = {
                type: 'CLEAR_CACHE',
                payload: { cacheName }
            }

            await sendMessage(message)
            await updateCacheSize()
            return true
        } catch (err) {
            console.error('キャッシュクリアエラー:', err)
            return false
        }
    }

    // 同期タスクを追加
    const addSyncTask = (task: Omit<SyncTask, 'id' | 'timestamp' | 'retryCount'>): string => {
        const syncTask: SyncTask = {
            id: generateTaskId(),
            timestamp: Date.now(),
            retryCount: 0,
            ...task
        }

        state.syncQueue.push(syncTask)

        // オンライン時は即座に処理
        if (state.isOnline) {
            processSyncQueue()
        }

        return syncTask.id
    }

    // 同期キューを処理
    const processSyncQueue = async (): Promise<void> => {
        if (!state.isOnline || state.syncQueue.length === 0) return

        const tasks = [...state.syncQueue]

        for (const task of tasks) {
            try {
                await processTask(task)
                removeSyncTask(task.id)
            } catch (err) {
                task.retryCount++

                if (task.retryCount >= task.maxRetries) {
                    console.error(`同期タスク ${task.id} 最大リトライ回数に達しました:`, err)
                    removeSyncTask(task.id)
                } else {
                    console.warn(`同期タスク ${task.id} リトライ (${task.retryCount}/${task.maxRetries}):`, err)
                }
            }
        }
    }

    // 個別タスク処理
    const processTask = async (task: SyncTask): Promise<void> => {
        const message = {
            type: 'PROCESS_SYNC_TASK',
            payload: task
        }

        await sendMessage(message)
    }

    // 同期タスクを削除
    const removeSyncTask = (taskId: string): void => {
        const index = state.syncQueue.findIndex(task => task.id === taskId)
        if (index !== -1) {
            state.syncQueue.splice(index, 1)
        }
    }

    // 同期完了ハンドラー
    const handleSyncComplete = (taskId: string): void => {
        removeSyncTask(taskId)
        console.log(`同期タスク ${taskId} 完了`)
    }

    // 同期失敗ハンドラー
    const handleSyncFailed = (taskId: string, error: string): void => {
        const task = state.syncQueue.find(t => t.id === taskId)
        if (task) {
            task.retryCount++
            console.error(`同期タスク ${taskId} 失敗:`, error)
        }
    }

    // Service Workerにメッセージを送信
    const sendMessage = async (message: any): Promise<any> => {
        return new Promise((resolve, reject) => {
            if (!navigator.serviceWorker.controller) {
                reject(new Error('Service Workerが利用できません'))
                return
            }

            const messageChannel = new MessageChannel()

            messageChannel.port1.onmessage = (event) => {
                if (event.data.error) {
                    reject(new Error(event.data.error))
                } else {
                    resolve(event.data)
                }
            }

            navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2])
        })
    }

    // プリロード
    const preloadResources = async (urls: string[]): Promise<void> => {
        const message = {
            type: 'PRELOAD_RESOURCES',
            payload: { urls }
        }

        await sendMessage(message)
    }

    // オフライン時のフォールバック設定
    const setOfflineFallback = async (route: string, fallbackUrl: string): Promise<void> => {
        const message = {
            type: 'SET_OFFLINE_FALLBACK',
            payload: { route, fallbackUrl }
        }

        await sendMessage(message)
    }

    // バックグラウンド同期登録
    const registerBackgroundSync = async (tag: string): Promise<boolean> => {
        try {
            if (registration.value && 'sync' in registration.value) {
                await (registration.value as any).sync.register(tag)
                return true
            }
            return false
        } catch (err) {
            console.error('バックグラウンド同期登録エラー:', err)
            return false
        }
    }

    // プッシュ通知購読
    const subscribeToPush = async (publicKey: string): Promise<PushSubscription | null> => {
        try {
            if (!registration.value) return null

            const subscription = await registration.value.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey)
            })

            return subscription
        } catch (err) {
            console.error('プッシュ通知購読エラー:', err)
            return null
        }
    }

    // プッシュ通知購読解除
    const unsubscribeFromPush = async (): Promise<boolean> => {
        try {
            if (!registration.value) return false

            const subscription = await registration.value.pushManager.getSubscription()
            if (subscription) {
                await subscription.unsubscribe()
                return true
            }
            return false
        } catch (err) {
            console.error('プッシュ通知購読解除エラー:', err)
            return false
        }
    }

    // ユーティリティ関数
    const generateTaskId = (): string => {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4)
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/')

        const rawData = window.atob(base64)
        const outputArray = new Uint8Array(rawData.length)

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i)
        }
        return outputArray
    }

    // 初期化
    onMounted(async () => {
        if (state.isSupported) {
            await register()
            await updateCacheSize()

            // 既存の同期タスクを処理
            if (state.isOnline) {
                processSyncQueue()
            }
        }
    })

    return {
        // 状態
        state,
        registration,
        error,
        cacheStrategies,

        // メソッド
        register,
        update,
        skipWaiting,
        cacheData,
        getCachedData,
        clearCache,
        addSyncTask,
        processSyncQueue,
        preloadResources,
        setOfflineFallback,
        registerBackgroundSync,
        subscribeToPush,
        unsubscribeFromPush,
        updateCacheSize
    }
}
