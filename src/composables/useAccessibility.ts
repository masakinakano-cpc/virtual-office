import { ref, reactive, computed, watch, onMounted } from 'vue'

export interface AccessibilitySettings {
    // 視覚的アクセシビリティ
    highContrast: boolean
    fontSize: 'small' | 'medium' | 'large' | 'extra-large'
    fontFamily: 'default' | 'dyslexia-friendly' | 'high-readability'
    lineHeight: number
    letterSpacing: number

    // 動作・アニメーション
    reduceMotion: boolean
    disableAnimations: boolean
    autoplayMedia: boolean

    // 音声・聴覚
    soundEnabled: boolean
    captionsEnabled: boolean
    signLanguageEnabled: boolean
    audioDescriptions: boolean

    // キーボード・入力
    keyboardNavigation: boolean
    focusIndicator: boolean
    stickyKeys: boolean
    slowKeys: boolean

    // 認知・学習支援
    simplifiedInterface: boolean
    readingGuide: boolean
    textToSpeech: boolean
    voiceCommands: boolean

    // 言語・地域
    language: string
    textDirection: 'ltr' | 'rtl'
    dateFormat: string
    timeFormat: '12h' | '24h'
}

export interface ScreenReaderAnnouncement {
    message: string
    priority: 'polite' | 'assertive' | 'off'
    delay?: number
}

export interface KeyboardShortcut {
    id: string
    keys: string[]
    description: string
    action: () => void
    context?: string
}

export function useAccessibility() {
    const settings = reactive<AccessibilitySettings>({
        // 視覚的アクセシビリティ
        highContrast: false,
        fontSize: 'medium',
        fontFamily: 'default',
        lineHeight: 1.5,
        letterSpacing: 0,

        // 動作・アニメーション
        reduceMotion: false,
        disableAnimations: false,
        autoplayMedia: true,

        // 音声・聴覚
        soundEnabled: true,
        captionsEnabled: false,
        signLanguageEnabled: false,
        audioDescriptions: false,

        // キーボード・入力
        keyboardNavigation: true,
        focusIndicator: true,
        stickyKeys: false,
        slowKeys: false,

        // 認知・学習支援
        simplifiedInterface: false,
        readingGuide: false,
        textToSpeech: false,
        voiceCommands: false,

        // 言語・地域
        language: 'ja',
        textDirection: 'ltr',
        dateFormat: 'YYYY/MM/DD',
        timeFormat: '24h'
    })

    const isScreenReaderActive = ref(false)
    const currentFocus = ref<HTMLElement | null>(null)
    const keyboardShortcuts = ref<KeyboardShortcut[]>([])
    const announcements = ref<ScreenReaderAnnouncement[]>([])

    // 計算プロパティ
    const cssVariables = computed(() => {
        const fontSizeMap = {
            small: '0.875rem',
            medium: '1rem',
            large: '1.125rem',
            'extra-large': '1.25rem'
        }

        const fontFamilyMap = {
            default: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
            'dyslexia-friendly': 'OpenDyslexic, Arial, sans-serif',
            'high-readability': 'Atkinson Hyperlegible, Arial, sans-serif'
        }

        return {
            '--font-size-base': fontSizeMap[settings.fontSize],
            '--font-family-base': fontFamilyMap[settings.fontFamily],
            '--line-height-base': settings.lineHeight.toString(),
            '--letter-spacing-base': `${settings.letterSpacing}px`,
            '--animation-duration': settings.reduceMotion ? '0.01ms' : '200ms',
            '--focus-ring-width': settings.focusIndicator ? '2px' : '0px',
            '--focus-ring-color': settings.highContrast ? '#ffff00' : '#3b82f6'
        }
    })

    // 高コントラストテーマ
    const contrastTheme = computed(() => {
        if (!settings.highContrast) return {}

        return {
            '--bg-primary': '#000000',
            '--bg-secondary': '#1a1a1a',
            '--text-primary': '#ffffff',
            '--text-secondary': '#e0e0e0',
            '--color-primary': '#ffff00',
            '--color-error': '#ff6b6b',
            '--color-success': '#51cf66',
            '--border-color': '#ffffff'
        }
    })

    // スクリーンリーダー検出
    const detectScreenReader = (): boolean => {
        // navigator.userAgent による検出
        const userAgent = navigator.userAgent.toLowerCase()
        const screenReaders = ['nvda', 'jaws', 'dragon', 'zoomtext', 'fusion']

        const hasScreenReader = screenReaders.some(sr => userAgent.includes(sr))

        // アクセシビリティAPIの確認
        const hasAccessibilityAPI = 'speechSynthesis' in window

        // 設定からの推測
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches

        return hasScreenReader || (hasAccessibilityAPI && (prefersReducedMotion || prefersHighContrast))
    }

    // スクリーンリーダーアナウンス
    const announce = (message: string, priority: 'polite' | 'assertive' = 'polite', delay = 0) => {
        const announcement: ScreenReaderAnnouncement = {
            message,
            priority,
            delay
        }

        announcements.value.push(announcement)

        setTimeout(() => {
            const ariaLive = document.getElementById('aria-live-region')
            if (ariaLive) {
                ariaLive.setAttribute('aria-live', priority)
                ariaLive.textContent = message

                // 一定時間後にクリア
                setTimeout(() => {
                    ariaLive.textContent = ''
                }, 5000)
            }

            // 音声合成
            if (settings.textToSpeech && 'speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(message)
                utterance.lang = settings.language
                speechSynthesis.speak(utterance)
            }

            // アナウンス履歴から削除
            const index = announcements.value.indexOf(announcement)
            if (index > -1) {
                announcements.value.splice(index, 1)
            }
        }, delay)
    }

    // キーボードショートカット登録
    const registerShortcut = (shortcut: KeyboardShortcut) => {
        keyboardShortcuts.value.push(shortcut)
    }

    // キーボードショートカット削除
    const unregisterShortcut = (id: string) => {
        const index = keyboardShortcuts.value.findIndex(s => s.id === id)
        if (index > -1) {
            keyboardShortcuts.value.splice(index, 1)
        }
    }

    // キーボードイベントハンドラー
    const handleKeyDown = (event: KeyboardEvent) => {
        // ESCキーでフォーカストラップを解除
        if (event.key === 'Escape') {
            const focusedElement = document.activeElement as HTMLElement
            if (focusedElement?.closest('[role="dialog"]')) {
                const dialog = focusedElement.closest('[role="dialog"]') as HTMLElement
                const closeButton = dialog.querySelector('[aria-label*="閉じる"], [aria-label*="close"]') as HTMLElement
                closeButton?.click()
            }
        }

        // ショートカットキーの処理
        const pressedKeys: string[] = []
        if (event.ctrlKey) pressedKeys.push('Ctrl')
        if (event.altKey) pressedKeys.push('Alt')
        if (event.shiftKey) pressedKeys.push('Shift')
        if (event.metaKey) pressedKeys.push('Meta')
        pressedKeys.push(event.key)

        const shortcut = keyboardShortcuts.value.find(s =>
            s.keys.length === pressedKeys.length &&
            s.keys.every(key => pressedKeys.includes(key))
        )

        if (shortcut) {
            event.preventDefault()
            shortcut.action()
            announce(`ショートカット実行: ${shortcut.description}`)
        }
    }

    // フォーカス管理
    const manageFocus = () => {
        const focusableElements = document.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )

        focusableElements.forEach((element) => {
            element.addEventListener('focus', () => {
                currentFocus.value = element as HTMLElement

                if (settings.readingGuide) {
                    highlightElement(element as HTMLElement)
                }
            })

            element.addEventListener('blur', () => {
                if (settings.readingGuide) {
                    removeHighlight()
                }
            })
        })
    }

    // 要素のハイライト
    const highlightElement = (element: HTMLElement) => {
        removeHighlight()

        const highlight = document.createElement('div')
        highlight.id = 'focus-highlight'
        highlight.style.cssText = `
      position: absolute;
      pointer-events: none;
      border: 2px solid var(--color-primary);
      border-radius: 4px;
      background: rgba(59, 130, 246, 0.1);
      z-index: 9999;
      transition: all 0.2s ease;
    `

        const rect = element.getBoundingClientRect()
        highlight.style.top = `${rect.top + window.scrollY - 2}px`
        highlight.style.left = `${rect.left + window.scrollX - 2}px`
        highlight.style.width = `${rect.width + 4}px`
        highlight.style.height = `${rect.height + 4}px`

        document.body.appendChild(highlight)
    }

    // ハイライト削除
    const removeHighlight = () => {
        const highlight = document.getElementById('focus-highlight')
        if (highlight) {
            highlight.remove()
        }
    }

    // フォーカストラップ
    const trapFocus = (container: HTMLElement) => {
        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as NodeListOf<HTMLElement>

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        const handleTabKey = (event: KeyboardEvent) => {
            if (event.key !== 'Tab') return

            if (event.shiftKey) {
                if (document.activeElement === firstElement) {
                    event.preventDefault()
                    lastElement.focus()
                }
            } else {
                if (document.activeElement === lastElement) {
                    event.preventDefault()
                    firstElement.focus()
                }
            }
        }

        container.addEventListener('keydown', handleTabKey)
        firstElement?.focus()

        return () => {
            container.removeEventListener('keydown', handleTabKey)
        }
    }

    // 色のコントラスト比計算
    const calculateContrastRatio = (color1: string, color2: string): number => {
        const getLuminance = (color: string): number => {
            const rgb = color.match(/\d+/g)?.map(Number) || [0, 0, 0]
            const [r, g, b] = rgb.map(c => {
                c = c / 255
                return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
            })
            return 0.2126 * r + 0.7152 * g + 0.0722 * b
        }

        const lum1 = getLuminance(color1)
        const lum2 = getLuminance(color2)
        const brightest = Math.max(lum1, lum2)
        const darkest = Math.min(lum1, lum2)

        return (brightest + 0.05) / (darkest + 0.05)
    }

    // ARIA属性の自動設定
    const setupAriaAttributes = () => {
        // ボタンにaria-labelを自動追加
        document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])').forEach(button => {
            const text = button.textContent?.trim()
            if (text) {
                button.setAttribute('aria-label', text)
            }
        })

        // フォーム要素にaria-describedbyを自動追加
        document.querySelectorAll('input, select, textarea').forEach(input => {
            const helpText = input.parentElement?.querySelector('.help-text, .error-message')
            if (helpText && !input.getAttribute('aria-describedby')) {
                const id = helpText.id || `help-${Math.random().toString(36).substr(2, 9)}`
                helpText.id = id
                input.setAttribute('aria-describedby', id)
            }
        })

        // 見出しレベルの確認
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
        let currentLevel = 0

        headings.forEach(heading => {
            const level = parseInt(heading.tagName.charAt(1))
            if (level > currentLevel + 1) {
                console.warn(`見出しレベルがスキップされています: ${heading.textContent}`)
            }
            currentLevel = level
        })
    }

    // 設定の保存
    const saveSettings = () => {
        localStorage.setItem('accessibility-settings', JSON.stringify(settings))
    }

    // 設定の読み込み
    const loadSettings = () => {
        const saved = localStorage.getItem('accessibility-settings')
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                Object.assign(settings, parsed)
            } catch (error) {
                console.error('アクセシビリティ設定の読み込みエラー:', error)
            }
        }
    }

    // システム設定の検出
    const detectSystemPreferences = () => {
        // 動作の軽減
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            settings.reduceMotion = true
            settings.disableAnimations = true
        }

        // 高コントラスト
        if (window.matchMedia('(prefers-contrast: high)').matches) {
            settings.highContrast = true
        }

        // カラースキーム
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            settings.highContrast = true
        }

        // 言語設定
        settings.language = navigator.language.split('-')[0] || 'ja'
    }

    // 初期化
    const initialize = () => {
        loadSettings()
        detectSystemPreferences()
        isScreenReaderActive.value = detectScreenReader()

        // ARIA Live Regionを作成
        if (!document.getElementById('aria-live-region')) {
            const liveRegion = document.createElement('div')
            liveRegion.id = 'aria-live-region'
            liveRegion.setAttribute('aria-live', 'polite')
            liveRegion.setAttribute('aria-atomic', 'true')
            liveRegion.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      `
            document.body.appendChild(liveRegion)
        }

        // イベントリスナー設定
        document.addEventListener('keydown', handleKeyDown)

        // 設定変更の監視
        watch(settings, saveSettings, { deep: true })

        // CSS変数の適用
        watch(cssVariables, (newVars) => {
            Object.entries(newVars).forEach(([key, value]) => {
                document.documentElement.style.setProperty(key, value)
            })
        }, { immediate: true })

        watch(contrastTheme, (newTheme) => {
            Object.entries(newTheme).forEach(([key, value]) => {
                document.documentElement.style.setProperty(key, value)
            })
        }, { immediate: true })

        // デフォルトのキーボードショートカット
        registerShortcut({
            id: 'skip-to-main',
            keys: ['Alt', 'M'],
            description: 'メインコンテンツにスキップ',
            action: () => {
                const main = document.querySelector('main, [role="main"]') as HTMLElement
                main?.focus()
            }
        })

        registerShortcut({
            id: 'toggle-high-contrast',
            keys: ['Alt', 'H'],
            description: '高コントラストモード切り替え',
            action: () => {
                settings.highContrast = !settings.highContrast
                announce(`高コントラストモード${settings.highContrast ? '有効' : '無効'}`)
            }
        })

        registerShortcut({
            id: 'increase-font-size',
            keys: ['Ctrl', '+'],
            description: 'フォントサイズを大きく',
            action: () => {
                const sizes = ['small', 'medium', 'large', 'extra-large'] as const
                const currentIndex = sizes.indexOf(settings.fontSize)
                if (currentIndex < sizes.length - 1) {
                    settings.fontSize = sizes[currentIndex + 1]
                    announce(`フォントサイズ: ${settings.fontSize}`)
                }
            }
        })

        registerShortcut({
            id: 'decrease-font-size',
            keys: ['Ctrl', '-'],
            description: 'フォントサイズを小さく',
            action: () => {
                const sizes = ['small', 'medium', 'large', 'extra-large'] as const
                const currentIndex = sizes.indexOf(settings.fontSize)
                if (currentIndex > 0) {
                    settings.fontSize = sizes[currentIndex - 1]
                    announce(`フォントサイズ: ${settings.fontSize}`)
                }
            }
        })

        // DOM変更の監視
        const observer = new MutationObserver(() => {
            setupAriaAttributes()
            manageFocus()
        })

        observer.observe(document.body, {
            childList: true,
            subtree: true
        })

        // 初期設定
        setupAriaAttributes()
        manageFocus()
    }

    onMounted(() => {
        initialize()
    })

    return {
        // 状態
        settings,
        isScreenReaderActive,
        currentFocus,
        keyboardShortcuts,
        announcements,

        // 計算プロパティ
        cssVariables,
        contrastTheme,

        // メソッド
        announce,
        registerShortcut,
        unregisterShortcut,
        trapFocus,
        calculateContrastRatio,
        saveSettings,
        loadSettings,
        detectSystemPreferences,
        initialize
    }
}
