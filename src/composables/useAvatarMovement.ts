import { ref, onMounted, onUnmounted } from 'vue'

export interface AvatarPosition {
    x: number
    y: number
}

export interface Avatar {
    id: string
    nickname: string
    color: string
    position: AvatarPosition
    isMoving: boolean
    direction: number // 角度（ラジアン）
    lastUpdate: Date
}

export interface MovementTarget {
    x: number
    y: number
    showArrow: boolean
}

export function useAvatarMovement(
    containerId: string,
    onPositionUpdate?: (position: AvatarPosition) => void
) {
    const avatarPosition = ref<AvatarPosition>({ x: 200, y: 200 })
    const isMoving = ref(false)
    const direction = ref(0)
    const moveSpeed = 150 // ピクセル/秒
    const container = ref<HTMLElement | null>(null)
    const movementTarget = ref<MovementTarget | null>(null)
    const isAutoMoving = ref(false)

    // キーボード入力の状態
    const keys = ref({
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false,
        KeyW: false,
        KeyA: false,
        KeyS: false,
        KeyD: false
    })

    // 移動アニメーション
    let animationFrame: number | null = null
    let lastTime = 0
    let clickTimeout: NodeJS.Timeout | null = null

    // コンテナの境界を取得
    const getContainerBounds = () => {
        if (!container.value) return { width: 800, height: 600 }

        const rect = container.value.getBoundingClientRect()
        return {
            width: rect.width,
            height: rect.height
        }
    }

    // 移動方向の計算
    const calculateMovement = () => {
        let deltaX = 0
        let deltaY = 0

        // 上下移動
        if (keys.value.ArrowUp || keys.value.KeyW) deltaY -= 1
        if (keys.value.ArrowDown || keys.value.KeyS) deltaY += 1

        // 左右移動
        if (keys.value.ArrowLeft || keys.value.KeyA) deltaX -= 1
        if (keys.value.ArrowRight || keys.value.KeyD) deltaX += 1

        // 斜め移動の正規化
        if (deltaX !== 0 && deltaY !== 0) {
            const magnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
            deltaX /= magnitude
            deltaY /= magnitude
        }

        // 移動状態の更新
        isMoving.value = deltaX !== 0 || deltaY !== 0 || isAutoMoving.value

        // 方向の計算
        if (isMoving.value) {
            direction.value = Math.atan2(deltaY, deltaX)
        }

        return { deltaX, deltaY }
    }

    // アバター位置の更新
    const updatePosition = (deltaTime: number) => {
        const { deltaX, deltaY } = calculateMovement()

        if (deltaX === 0 && deltaY === 0) return

        const bounds = getContainerBounds()
        const avatarSize = 60 // アバターのサイズ

        // 新しい位置を計算
        const newX = avatarPosition.value.x + (deltaX * moveSpeed * deltaTime)
        const newY = avatarPosition.value.y + (deltaY * moveSpeed * deltaTime)

        // 境界チェック
        const clampedX = Math.max(
            avatarSize / 2,
            Math.min(bounds.width - avatarSize / 2, newX)
        )
        const clampedY = Math.max(
            avatarSize / 2,
            Math.min(bounds.height - avatarSize / 2, newY)
        )

        // 位置が変更された場合のみ更新
        if (
            Math.abs(clampedX - avatarPosition.value.x) > 0.1 ||
            Math.abs(clampedY - avatarPosition.value.y) > 0.1
        ) {
            avatarPosition.value = { x: clampedX, y: clampedY }

            // 外部コールバックを呼び出し
            if (onPositionUpdate) {
                onPositionUpdate(avatarPosition.value)
            }
        }
    }

    // アニメーションループ
    const animate = (currentTime: number) => {
        if (lastTime === 0) {
            lastTime = currentTime
        }

        const deltaTime = (currentTime - lastTime) / 1000 // 秒に変換
        lastTime = currentTime

        updatePosition(deltaTime)

        animationFrame = requestAnimationFrame(animate)
    }

    // キーボードイベントハンドラー
    const handleKeyDown = (event: KeyboardEvent) => {
        const key = event.code as keyof typeof keys.value
        if (key in keys.value) {
            keys.value[key] = true
            event.preventDefault()

            // キーボード操作時は自動移動を停止
            if (isAutoMoving.value) {
                stopAutoMovement()
            }
        }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
        const key = event.code as keyof typeof keys.value
        if (key in keys.value) {
            keys.value[key] = false
            event.preventDefault()
        }
    }

    // シングルクリックでの移動（矢印表示）
    const handleClick = (event: MouseEvent) => {
        if (!container.value) return

        const rect = container.value.getBoundingClientRect()
        const targetX = event.clientX - rect.left
        const targetY = event.clientY - rect.top

        // 矢印を表示
        showMovementArrow({ x: targetX, y: targetY })
    }

    // ダブルクリックでの移動
    const handleDoubleClick = (event: MouseEvent) => {
        if (!container.value) return

        const rect = container.value.getBoundingClientRect()
        const targetX = event.clientX - rect.left
        const targetY = event.clientY - rect.top

        // 矢印を非表示にして移動開始
        hideMovementArrow()
        moveToPosition({ x: targetX, y: targetY })
    }

    // 移動矢印の表示
    const showMovementArrow = (target: AvatarPosition) => {
        movementTarget.value = {
            x: target.x,
            y: target.y,
            showArrow: true
        }

        // 3秒後に矢印を自動で非表示
        if (clickTimeout) {
            clearTimeout(clickTimeout)
        }
        clickTimeout = setTimeout(() => {
            hideMovementArrow()
        }, 3000)
    }

    // 移動矢印の非表示
    const hideMovementArrow = () => {
        movementTarget.value = null
        if (clickTimeout) {
            clearTimeout(clickTimeout)
            clickTimeout = null
        }
    }

    // 自動移動の停止
    const stopAutoMovement = () => {
        isAutoMoving.value = false
        hideMovementArrow()
    }

    // 指定位置への移動
    const moveToPosition = (target: AvatarPosition) => {
        const startPos = { ...avatarPosition.value }
        const distance = Math.sqrt(
            Math.pow(target.x - startPos.x, 2) + Math.pow(target.y - startPos.y, 2)
        )

        if (distance < 10) return // 移動距離が小さい場合は無視

        isAutoMoving.value = true
        const duration = distance / moveSpeed // 移動時間を計算
        const startTime = performance.now()

        const animateMove = (currentTime: number) => {
            const elapsed = (currentTime - startTime) / 1000
            const progress = Math.min(elapsed / duration, 1)

            // イージング関数（ease-out）
            const easeProgress = 1 - Math.pow(1 - progress, 3)

            avatarPosition.value = {
                x: startPos.x + (target.x - startPos.x) * easeProgress,
                y: startPos.y + (target.y - startPos.y) * easeProgress
            }

            // 方向を更新
            direction.value = Math.atan2(target.y - startPos.y, target.x - startPos.x)
            isMoving.value = progress < 1

            // 位置更新コールバック
            if (onPositionUpdate) {
                onPositionUpdate(avatarPosition.value)
            }

            if (progress < 1) {
                requestAnimationFrame(animateMove)
            } else {
                isAutoMoving.value = false
            }
        }

        requestAnimationFrame(animateMove)
    }

    // タッチイベントハンドラー
    const handleTouchStart = (event: TouchEvent) => {
        if (!container.value || event.touches.length !== 1) return

        const touch = event.touches[0]
        const rect = container.value.getBoundingClientRect()
        const targetX = touch.clientX - rect.left
        const targetY = touch.clientY - rect.top

        moveToPosition({ x: targetX, y: targetY })
        event.preventDefault()
    }

    // 初期位置の設定
    const setInitialPosition = (position: AvatarPosition) => {
        avatarPosition.value = position
    }

    // 衝突検出
    const checkCollision = (otherAvatars: Avatar[], avatarSize = 60) => {
        return otherAvatars.some(avatar => {
            const distance = Math.sqrt(
                Math.pow(avatar.position.x - avatarPosition.value.x, 2) +
                Math.pow(avatar.position.y - avatarPosition.value.y, 2)
            )
            return distance < avatarSize
        })
    }

    // 近くのアバターを取得
    const getNearbyAvatars = (otherAvatars: Avatar[], radius = 100) => {
        return otherAvatars.filter(avatar => {
            const distance = Math.sqrt(
                Math.pow(avatar.position.x - avatarPosition.value.x, 2) +
                Math.pow(avatar.position.y - avatarPosition.value.y, 2)
            )
            return distance <= radius
        })
    }

    // 通話範囲内のアバターを取得
    const getAvatarsInCallRange = (otherAvatars: Avatar[], callRadius = 150) => {
        return getNearbyAvatars(otherAvatars, callRadius)
    }

    // 初期化
    onMounted(() => {
        container.value = document.getElementById(containerId)

        if (container.value) {
            // イベントリスナーの追加
            container.value.addEventListener('click', handleClick)
            container.value.addEventListener('dblclick', handleDoubleClick)
            container.value.addEventListener('touchstart', handleTouchStart)

            // ダブルクリックでのテキスト選択を防ぐ
            container.value.style.userSelect = 'none'
            container.value.style.webkitUserSelect = 'none'
        }

        // キーボードイベントリスナー
        document.addEventListener('keydown', handleKeyDown)
        document.addEventListener('keyup', handleKeyUp)

        // アニメーション開始
        animationFrame = requestAnimationFrame(animate)
    })

    // クリーンアップ
    onUnmounted(() => {
        if (container.value) {
            container.value.removeEventListener('click', handleClick)
            container.value.removeEventListener('dblclick', handleDoubleClick)
            container.value.removeEventListener('touchstart', handleTouchStart)
        }

        document.removeEventListener('keydown', handleKeyDown)
        document.removeEventListener('keyup', handleKeyUp)

        if (animationFrame) {
            cancelAnimationFrame(animationFrame)
        }

        if (clickTimeout) {
            clearTimeout(clickTimeout)
        }
    })

    return {
        avatarPosition,
        isMoving,
        direction,
        movementTarget,
        isAutoMoving,
        moveToPosition,
        setInitialPosition,
        checkCollision,
        getNearbyAvatars,
        getAvatarsInCallRange,
        stopAutoMovement
    }
}
