import { ref, onMounted, onUnmounted } from 'vue'

export interface TouchGesture {
    type: 'tap' | 'double-tap' | 'swipe' | 'pinch' | 'pan' | 'long-press'
    startPosition: { x: number; y: number }
    currentPosition: { x: number; y: number }
    deltaX: number
    deltaY: number
    distance: number
    duration: number
    scale?: number
    velocity?: { x: number; y: number }
}

export interface TouchControlsOptions {
    element?: HTMLElement
    enableSwipe?: boolean
    enablePinch?: boolean
    enablePan?: boolean
    enableLongPress?: boolean
    swipeThreshold?: number
    longPressDelay?: number
    doubleTapDelay?: number
    preventDefaultEvents?: boolean
}

export function useTouchControls(options: TouchControlsOptions = {}) {
    const {
        element = document.body,
        enableSwipe = true,
        enablePinch = true,
        enablePan = true,
        enableLongPress = true,
        swipeThreshold = 50,
        longPressDelay = 500,
        doubleTapDelay = 300,
        preventDefaultEvents = true
    } = options

    // 状態管理
    const isTouch = ref(false)
    const isTouching = ref(false)
    const touchCount = ref(0)
    const currentGesture = ref<TouchGesture | null>(null)

    // タッチ情報
    const touchStart = ref<{ x: number; y: number; time: number } | null>(null)
    const touchCurrent = ref<{ x: number; y: number; time: number } | null>(null)
    const lastTap = ref<{ x: number; y: number; time: number } | null>(null)
    const longPressTimer = ref<NodeJS.Timeout | null>(null)

    // ピンチ操作用
    const initialDistance = ref(0)
    const currentDistance = ref(0)

    // パン操作用
    const panStartPosition = ref<{ x: number; y: number } | null>(null)
    const panCurrentPosition = ref<{ x: number; y: number } | null>(null)

    // イベントエミッター
    const callbacks = ref<{
        [K in TouchGesture['type']]: ((gesture: TouchGesture) => void)[]
    }>({
        tap: [],
        'double-tap': [],
        swipe: [],
        pinch: [],
        pan: [],
        'long-press': []
    })

    // ユーティリティ関数
    const getTouchPosition = (touch: Touch) => ({
        x: touch.clientX,
        y: touch.clientY
    })

    const getDistance = (touch1: Touch, touch2: Touch) => {
        const dx = touch1.clientX - touch2.clientX
        const dy = touch1.clientY - touch2.clientY
        return Math.sqrt(dx * dx + dy * dy)
    }

    const getVelocity = (start: { x: number; y: number; time: number }, end: { x: number; y: number; time: number }) => {
        const timeDiff = end.time - start.time
        if (timeDiff === 0) return { x: 0, y: 0 }

        return {
            x: (end.x - start.x) / timeDiff,
            y: (end.y - start.y) / timeDiff
        }
    }

    const createGesture = (type: TouchGesture['type'], additionalData: Partial<TouchGesture> = {}): TouchGesture => {
        const start = touchStart.value || { x: 0, y: 0, time: Date.now() }
        const current = touchCurrent.value || start

        return {
            type,
            startPosition: { x: start.x, y: start.y },
            currentPosition: { x: current.x, y: current.y },
            deltaX: current.x - start.x,
            deltaY: current.y - start.y,
            distance: Math.sqrt(Math.pow(current.x - start.x, 2) + Math.pow(current.y - start.y, 2)),
            duration: current.time - start.time,
            velocity: getVelocity(start, current),
            ...additionalData
        }
    }

    const emitGesture = (gesture: TouchGesture) => {
        currentGesture.value = gesture
        callbacks.value[gesture.type].forEach(callback => callback(gesture))
    }

    // タッチイベントハンドラー
    const handleTouchStart = (event: TouchEvent) => {
        if (preventDefaultEvents) {
            event.preventDefault()
        }

        isTouch.value = true
        isTouching.value = true
        touchCount.value = event.touches.length

        const touch = event.touches[0]
        const position = getTouchPosition(touch)
        const time = Date.now()

        touchStart.value = { ...position, time }
        touchCurrent.value = { ...position, time }

        // ピンチ操作の初期化
        if (enablePinch && event.touches.length === 2) {
            initialDistance.value = getDistance(event.touches[0], event.touches[1])
            currentDistance.value = initialDistance.value
        }

        // パン操作の初期化
        if (enablePan) {
            panStartPosition.value = position
            panCurrentPosition.value = position
        }

        // 長押し検出の開始
        if (enableLongPress) {
            longPressTimer.value = setTimeout(() => {
                if (isTouching.value) {
                    const gesture = createGesture('long-press')
                    emitGesture(gesture)
                }
            }, longPressDelay)
        }
    }

    const handleTouchMove = (event: TouchEvent) => {
        if (!isTouching.value) return

        if (preventDefaultEvents) {
            event.preventDefault()
        }

        const touch = event.touches[0]
        const position = getTouchPosition(touch)
        const time = Date.now()

        touchCurrent.value = { ...position, time }

        // 長押しタイマーをクリア（移動があった場合）
        if (longPressTimer.value) {
            clearTimeout(longPressTimer.value)
            longPressTimer.value = null
        }

        // ピンチ操作の処理
        if (enablePinch && event.touches.length === 2) {
            currentDistance.value = getDistance(event.touches[0], event.touches[1])
            const scale = currentDistance.value / initialDistance.value

            const gesture = createGesture('pinch', { scale })
            emitGesture(gesture)
        }

        // パン操作の処理
        if (enablePan && panStartPosition.value) {
            panCurrentPosition.value = position
            const gesture = createGesture('pan')
            emitGesture(gesture)
        }
    }

    const handleTouchEnd = (event: TouchEvent) => {
        if (preventDefaultEvents) {
            event.preventDefault()
        }

        isTouching.value = false
        touchCount.value = event.touches.length

        // 長押しタイマーをクリア
        if (longPressTimer.value) {
            clearTimeout(longPressTimer.value)
            longPressTimer.value = null
        }

        if (!touchStart.value || !touchCurrent.value) return

        const gesture = createGesture('tap')
        const { deltaX, deltaY, distance, duration } = gesture

        // スワイプ検出
        if (enableSwipe && distance > swipeThreshold) {
            let swipeType: TouchGesture['type'] = 'swipe'

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // 水平スワイプ
                swipeType = 'swipe'
            } else {
                // 垂直スワイプ
                swipeType = 'swipe'
            }

            const swipeGesture = createGesture(swipeType)
            emitGesture(swipeGesture)
        }
        // タップ検出
        else if (distance < 20 && duration < 500) {
            // ダブルタップ検出
            if (lastTap.value) {
                const timeDiff = Date.now() - lastTap.value.time
                const tapDistance = Math.sqrt(
                    Math.pow(touchCurrent.value.x - lastTap.value.x, 2) +
                    Math.pow(touchCurrent.value.y - lastTap.value.y, 2)
                )

                if (timeDiff < doubleTapDelay && tapDistance < 50) {
                    const doubleTapGesture = createGesture('double-tap')
                    emitGesture(doubleTapGesture)
                    lastTap.value = null
                    return
                }
            }

            // シングルタップ
            emitGesture(gesture)
            lastTap.value = { ...touchCurrent.value }
        }

        // 状態をリセット
        if (event.touches.length === 0) {
            touchStart.value = null
            touchCurrent.value = null
            panStartPosition.value = null
            panCurrentPosition.value = null
            initialDistance.value = 0
            currentDistance.value = 0
            isTouch.value = false
        }
    }

    // イベントリスナーの登録
    const addEventListener = () => {
        element.addEventListener('touchstart', handleTouchStart, { passive: false })
        element.addEventListener('touchmove', handleTouchMove, { passive: false })
        element.addEventListener('touchend', handleTouchEnd, { passive: false })
        element.addEventListener('touchcancel', handleTouchEnd, { passive: false })
    }

    const removeEventListener = () => {
        element.removeEventListener('touchstart', handleTouchStart)
        element.removeEventListener('touchmove', handleTouchMove)
        element.removeEventListener('touchend', handleTouchEnd)
        element.removeEventListener('touchcancel', handleTouchEnd)
    }

    // コールバック登録
    const on = (type: TouchGesture['type'], callback: (gesture: TouchGesture) => void) => {
        callbacks.value[type].push(callback)

        return () => {
            const index = callbacks.value[type].indexOf(callback)
            if (index > -1) {
                callbacks.value[type].splice(index, 1)
            }
        }
    }

    // ライフサイクル
    onMounted(() => {
        addEventListener()
    })

    onUnmounted(() => {
        removeEventListener()
        if (longPressTimer.value) {
            clearTimeout(longPressTimer.value)
        }
    })

    return {
        // 状態
        isTouch,
        isTouching,
        touchCount,
        currentGesture,

        // メソッド
        on,

        // ユーティリティ
        getTouchPosition,
        getDistance,
        getVelocity
    }
}

// タッチデバイス検出
export function useTouchDevice() {
    const isTouchDevice = ref(false)
    const hasTouch = ref(false)
    const hasMouse = ref(false)
    const isTablet = ref(false)
    const isMobile = ref(false)

    const detectTouchDevice = () => {
        // タッチサポートの検出
        hasTouch.value = 'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            (navigator as any).msMaxTouchPoints > 0

        // マウスサポートの検出
        hasMouse.value = window.matchMedia('(hover: hover) and (pointer: fine)').matches

        // デバイスタイプの推定
        const userAgent = navigator.userAgent.toLowerCase()
        const isTabletUA = /tablet|ipad|playbook|silk/.test(userAgent)
        const isMobileUA = /mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/.test(userAgent)

        // 画面サイズも考慮
        const screenWidth = window.innerWidth
        const screenHeight = window.innerHeight
        const maxDimension = Math.max(screenWidth, screenHeight)
        const minDimension = Math.min(screenWidth, screenHeight)

        // タブレット判定（7-13インチ程度）
        isTablet.value = isTabletUA || (
            hasTouch.value &&
            maxDimension >= 768 &&
            maxDimension <= 1366 &&
            minDimension >= 600
        )

        // モバイル判定（6インチ以下程度）
        isMobile.value = isMobileUA || (
            hasTouch.value &&
            !isTablet.value &&
            maxDimension <= 768
        )

        // タッチデバイス総合判定
        isTouchDevice.value = hasTouch.value && (isMobile.value || isTablet.value)
    }

    onMounted(() => {
        detectTouchDevice()

        // 画面サイズ変更時の再検出
        window.addEventListener('resize', detectTouchDevice)
    })

    onUnmounted(() => {
        window.removeEventListener('resize', detectTouchDevice)
    })

    return {
        isTouchDevice,
        hasTouch,
        hasMouse,
        isTablet,
        isMobile,
        detectTouchDevice
    }
}

// アバター移動用のタッチコントロール
export function useAvatarTouchControls() {
    const { on } = useTouchControls({
        enableSwipe: true,
        enablePan: true,
        enableLongPress: false,
        swipeThreshold: 30
    })

    const position = ref({ x: 0, y: 0 })
    const isMoving = ref(false)
    const moveDirection = ref({ x: 0, y: 0 })

    // パン操作でアバターを移動
    const unsubscribePan = on('pan', (gesture) => {
        isMoving.value = true
        const sensitivity = 1.5

        moveDirection.value = {
            x: gesture.deltaX * sensitivity,
            y: gesture.deltaY * sensitivity
        }

        position.value = {
            x: position.value.x + moveDirection.value.x,
            y: position.value.y + moveDirection.value.y
        }
    })

    // スワイプ操作でアバターを移動
    const unsubscribeSwipe = on('swipe', (gesture) => {
        const moveDistance = 100
        const { deltaX, deltaY } = gesture

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // 水平移動
            position.value.x += deltaX > 0 ? moveDistance : -moveDistance
        } else {
            // 垂直移動
            position.value.y += deltaY > 0 ? moveDistance : -moveDistance
        }
    })

    // タップ操作でアバターを移動
    const unsubscribeTap = on('tap', (gesture) => {
        const targetPosition = {
            x: gesture.currentPosition.x,
            y: gesture.currentPosition.y
        }

        // スムーズに移動
        const duration = 500
        const startTime = Date.now()
        const startPosition = { ...position.value }

        const animate = () => {
            const elapsed = Date.now() - startTime
            const progress = Math.min(elapsed / duration, 1)

            // イージング関数（ease-out）
            const easeOut = 1 - Math.pow(1 - progress, 3)

            position.value = {
                x: startPosition.x + (targetPosition.x - startPosition.x) * easeOut,
                y: startPosition.y + (targetPosition.y - startPosition.y) * easeOut
            }

            if (progress < 1) {
                requestAnimationFrame(animate)
            } else {
                isMoving.value = false
            }
        }

        isMoving.value = true
        animate()
    })

    onUnmounted(() => {
        unsubscribePan()
        unsubscribeSwipe()
        unsubscribeTap()
    })

    return {
        position,
        isMoving,
        moveDirection
    }
}
