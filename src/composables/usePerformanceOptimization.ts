import { ref, readonly, onMounted, onUnmounted, nextTick } from 'vue'

export interface PerformanceMetrics {
    fps: number
    memoryUsage: number
    loadTime: number
    renderTime: number
    componentCount: number
}

export interface OptimizationConfig {
    enableVirtualScrolling: boolean
    enableLazyLoading: boolean
    enableResourcePreloading: boolean
    enableComponentCaching: boolean
    debounceDelay: number
    throttleDelay: number
}

export function usePerformanceOptimization(config: Partial<OptimizationConfig> = {}) {
    // デフォルト設定
    const defaultConfig: OptimizationConfig = {
        enableVirtualScrolling: true,
        enableLazyLoading: true,
        enableResourcePreloading: true,
        enableComponentCaching: true,
        debounceDelay: 300,
        throttleDelay: 100
    }

    const settings = { ...defaultConfig, ...config }

    // パフォーマンスメトリクス
    const metrics = ref<PerformanceMetrics>({
        fps: 0,
        memoryUsage: 0,
        loadTime: 0,
        renderTime: 0,
        componentCount: 0
    })

    const isOptimizing = ref(false)
    const warnings = ref<string[]>([])

    // FPS監視
    let frameCount = 0
    let lastTime = performance.now()
    let animationId: number

    const measureFPS = () => {
        frameCount++
        const now = performance.now()

        if (now - lastTime >= 1000) {
            metrics.value.fps = Math.round((frameCount * 1000) / (now - lastTime))
            frameCount = 0
            lastTime = now

            // FPS警告
            if (metrics.value.fps < 30) {
                addWarning('FPSが30を下回っています。パフォーマンスの最適化を検討してください。')
            }
        }

        animationId = requestAnimationFrame(measureFPS)
    }

    // メモリ使用量監視
    const measureMemoryUsage = () => {
        if ('memory' in performance) {
            const memory = (performance as any).memory
            metrics.value.memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024)

            // メモリ使用量警告
            if (metrics.value.memoryUsage > 100) {
                addWarning(`メモリ使用量が${metrics.value.memoryUsage}MBです。メモリリークの可能性があります。`)
            }
        }
    }

    // レンダリング時間測定
    const measureRenderTime = async () => {
        const start = performance.now()
        await nextTick()
        const end = performance.now()
        metrics.value.renderTime = Math.round(end - start)

        if (metrics.value.renderTime > 16) {
            addWarning(`レンダリング時間が${metrics.value.renderTime}msです。60FPSを維持できない可能性があります。`)
        }
    }

    // 警告の追加
    const addWarning = (message: string) => {
        if (!warnings.value.includes(message)) {
            warnings.value.push(message)
            console.warn(`Performance Warning: ${message}`)

            // 最大10個の警告を保持
            if (warnings.value.length > 10) {
                warnings.value.shift()
            }
        }
    }

    // 警告のクリア
    const clearWarnings = () => {
        warnings.value = []
    }

    // デバウンス関数
    const debounce = <T extends (...args: any[]) => any>(
        func: T,
        delay: number = settings.debounceDelay
    ): T => {
        let timeoutId: NodeJS.Timeout
        return ((...args: any[]) => {
            clearTimeout(timeoutId)
            timeoutId = setTimeout(() => func.apply(null, args), delay)
        }) as T
    }

    // スロットル関数
    const throttle = <T extends (...args: any[]) => any>(
        func: T,
        delay: number = settings.throttleDelay
    ): T => {
        let inThrottle = false
        return ((...args: any[]) => {
            if (!inThrottle) {
                func.apply(null, args)
                inThrottle = true
                setTimeout(() => (inThrottle = false), delay)
            }
        }) as T
    }

    // 画像の遅延読み込み
    const lazyLoadImage = (img: HTMLImageElement, src: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (!settings.enableLazyLoading) {
                img.src = src
                img.onload = () => resolve()
                img.onerror = reject
                return
            }

            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const image = entry.target as HTMLImageElement
                        image.src = src
                        image.onload = () => {
                            observer.unobserve(image)
                            resolve()
                        }
                        image.onerror = () => {
                            observer.unobserve(image)
                            reject()
                        }
                    }
                })
            })

            observer.observe(img)
        })
    }

    // リソースのプリロード
    const preloadResource = (url: string, type: 'image' | 'script' | 'style'): Promise<void> => {
        if (!settings.enableResourcePreloading) {
            return Promise.resolve()
        }

        return new Promise((resolve, reject) => {
            const link = document.createElement('link')
            link.rel = 'preload'
            link.href = url

            switch (type) {
                case 'image':
                    link.as = 'image'
                    break
                case 'script':
                    link.as = 'script'
                    break
                case 'style':
                    link.as = 'style'
                    break
            }

            link.onload = () => resolve()
            link.onerror = reject

            document.head.appendChild(link)
        })
    }

    // コンポーネントキャッシュ
    const componentCache = new Map<string, any>()

    const cacheComponent = (key: string, component: any) => {
        if (settings.enableComponentCaching) {
            componentCache.set(key, component)
        }
    }

    const getCachedComponent = (key: string) => {
        if (settings.enableComponentCaching) {
            return componentCache.get(key)
        }
        return null
    }

    const clearComponentCache = () => {
        componentCache.clear()
    }

    // バーチャルスクロール用のヘルパー
    const createVirtualScrollConfig = (itemHeight: number, containerHeight: number) => {
        if (!settings.enableVirtualScrolling) {
            return null
        }

        return {
            itemHeight,
            containerHeight,
            visibleCount: Math.ceil(containerHeight / itemHeight) + 2, // バッファ付き
            startIndex: ref(0),
            endIndex: ref(0),

            updateVisibleRange: (scrollTop: number) => {
                const startIndex = Math.floor(scrollTop / itemHeight)
                const endIndex = Math.min(
                    startIndex + Math.ceil(containerHeight / itemHeight) + 2,
                    // 実際のアイテム数で制限
                )

                return { startIndex, endIndex }
            }
        }
    }

    // パフォーマンス最適化の実行
    const optimize = async () => {
        isOptimizing.value = true

        try {
            // 不要なリスナーの削除
            const unusedListeners = document.querySelectorAll('[data-unused-listener]')
            unusedListeners.forEach(el => {
                el.removeEventListener('click', () => { })
                el.removeEventListener('mouseover', () => { })
            })

            // 未使用のコンポーネントキャッシュをクリア
            if (componentCache.size > 50) {
                componentCache.clear()
            }

            // DOM要素の最適化
            const unusedElements = document.querySelectorAll('[data-unused]')
            unusedElements.forEach(el => el.remove())

            console.log('パフォーマンス最適化が完了しました')
        } catch (error) {
            console.error('パフォーマンス最適化中にエラーが発生しました:', error)
        } finally {
            isOptimizing.value = false
        }
    }

    // レポート生成
    const generateReport = () => {
        const report = {
            timestamp: new Date().toISOString(),
            metrics: { ...metrics.value },
            warnings: [...warnings.value],
            config: { ...settings },
            recommendations: []
        }

        // 推奨事項の生成
        const recommendations: string[] = []

        if (metrics.value.fps < 30) {
            recommendations.push('FPS向上のため、重い処理を最適化してください')
        }

        if (metrics.value.memoryUsage > 100) {
            recommendations.push('メモリ使用量削減のため、不要なオブジェクトを削除してください')
        }

        if (metrics.value.renderTime > 16) {
            recommendations.push('レンダリング最適化のため、仮想スクロールを使用してください')
        }

        return { ...report, recommendations }
    }

    // ライフサイクル
    onMounted(() => {
        // パフォーマンス監視開始
        measureFPS()

        // 定期的なメトリクス更新
        const metricsInterval = setInterval(() => {
            measureMemoryUsage()
            measureRenderTime()
        }, 5000)

        // ページロード時間の測定
        if (performance.timing) {
            const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart
            metrics.value.loadTime = loadTime
        }

        // クリーンアップ用
        onUnmounted(() => {
            if (animationId) {
                cancelAnimationFrame(animationId)
            }
            clearInterval(metricsInterval)
            clearComponentCache()
        })
    })

    return {
        // メトリクス
        metrics: readonly(metrics),
        warnings: readonly(warnings),
        isOptimizing: readonly(isOptimizing),

        // ユーティリティ関数
        debounce,
        throttle,
        lazyLoadImage,
        preloadResource,

        // キャッシュ管理
        cacheComponent,
        getCachedComponent,
        clearComponentCache,

        // バーチャルスクロール
        createVirtualScrollConfig,

        // 最適化
        optimize,
        generateReport,
        clearWarnings,

        // 設定
        updateConfig: (newConfig: Partial<OptimizationConfig>) => {
            Object.assign(settings, newConfig)
        }
    }
}
