import { ref, computed, reactive } from 'vue'

// Types
interface TranslationData {
    [key: string]: string | TranslationData
}

interface LocaleData {
    [locale: string]: TranslationData
}

interface I18nConfig {
    locale: string
    fallbackLocale: string
    messages: LocaleData
}

// Translation data from original file
const translations: LocaleData = {
    en: {
        // Common actions
        common: {
            save: "Save",
            cancel: "Cancel",
            ok: "OK",
            close: "Close",
            delete: "Delete",
            edit: "Edit",
            add: "Add",
            back: "Back",
            next: "Next",
            confirm: "Confirm",
            loading: "Loading...",
            error: "An error occurred",
            success: "Success",
            yes: "Yes",
            no: "No"
        },

        // Header
        header: {
            menu: "Show menu",
            notifications: "Show notifications",
            userList: "Show user list (Ctrl/⌘+F)",
            schedule: "Meeting room / seat reservation",
            chat: "View and send chat",
            reload: "Reload space screen"
        },

        // Call functionality
        call: {
            calling: "👋 Calling {{name}}...",
            cancel: "Cancel",
            failedToAccept: "😢 {{name}} could not respond.",
            receiveCall: "Receiving call",
            accept: "Accept",
            reject: "Reject"
        },

        // Device settings
        deviceSettings: {
            title: "Camera & Audio Settings",
            cameraEffectNone: "Select effect",
            cameraEffectBlur: "Blur background",
            cameraEffectMask: "Gray background",
            cameraEffectBackground: "Virtual background",
            defaultDevice: "Default device",
            notSelected: "Not selected",
            close: "Close",
            save: "Save",
            enter: "Enter space",
            speakerTest: "Test",
            useNoiseFilter: "Use noise cancellation",
            turnOnNoiseCancellation: "Noise cancellation",
            turnOnBVC: "Cancel surrounding voices",
            useAutoGainControl: "Automatic volume adjustment",
            muteOnDisconnectdObject: "Auto mute when leaving object",
            toggleMuteMicShortcutOption: "Microphone operation with shortcut keys"
        },

        // User list
        userlist: {
            title: "User List",
            searchBar: "Search by name",
            openspace: "Open Space",
            away: "Away",
            offline: "Offline",
            chat: "💬 Chat",
            call: "📞 Call",
            tap: "👋 Tap",
            profile: "View profile",
            online: "Online",
            currentSpace: "Current space"
        },

        // Chat
        chat: {
            close: "Close chat",
            inputPlaceholder: "Ctrl/⌘+Enter to send message",
            title: "Chat",
            newMessage: "New message",
            tab: {
                all: "All",
                public: "Public",
                directMessage: "Direct Message"
            },
            readMore: "Read more",
            download: "Download",
            preview: "Open file"
        },

        // Room
        room: {
            leave: "Leave",
            leaveMeetingRoom: "Leave meeting room (ESC)",
            settings: "Personal settings",
            lock: "Lock room",
            unlock: "Unlock room",
            blind: "Blind ON/OFF",
            returnToRoom: "Return to room",
            leftRoom: "{{name}} left the room",
            enteredRoom: "{{name}} entered the room",
            leaveConfirmTitle: "Leave [{{roomName}}]?",
            enterConfirmTitle: "Enter [{{roomName}}]?",
            enterWithMicOn: "Enter with mic ON",
            enterWithMicOff: "Enter with mic OFF",
            returnToSpace: "Return to space",
            roomIsLocked: "Room is locked",
            roomIsFull: "Room is full",
            enterRoom: "Enter {{roomName}}"
        },

        download: {
            webrtcstats: "WebRTC status logs are collected",
            manual_link: "If the download does not start automatically, please click {{here}}.",
            manual_link_here: "here"
        }
    },
    ja: {
        // 基本的な操作
        common: {
            save: "保存",
            cancel: "キャンセル",
            ok: "OK",
            close: "閉じる",
            delete: "削除",
            edit: "編集",
            add: "追加",
            back: "戻る",
            next: "次へ",
            confirm: "確認",
            loading: "読み込み中...",
            error: "エラーが発生しました",
            success: "成功しました",
            yes: "はい",
            no: "いいえ"
        },

        // ヘッダー関連
        header: {
            menu: "メニューを表示",
            notifications: "通知を表示",
            userList: "ユーザーリストを表示 (Ctrl/⌘+F)",
            schedule: "会議室 / 座席の予約",
            chat: "チャットの閲覧と送信",
            reload: "スペース画面のリロード"
        },

        // 通話機能
        call: {
            calling: "👋 {{name}}さんを呼びかけ中...",
            cancel: "キャンセル",
            failedToAccept: "😢 {{name}}さんが応答できませんでした。",
            receiveCall: "呼びかけられています",
            accept: "応答",
            reject: "拒否"
        },

        // デバイス設定
        deviceSettings: {
            title: "カメラ・オーディオ設定",
            cameraEffectNone: "エフェクトを選択",
            cameraEffectBlur: "背景をぼかす",
            cameraEffectMask: "背景をグレーにする",
            cameraEffectBackground: "バーチャル背景",
            defaultDevice: "デフォルトデバイス",
            notSelected: "選択されていません",
            close: "閉じる",
            save: "保存",
            enter: "スペースへアクセス",
            speakerTest: "テスト",
            useNoiseFilter: "ノイズキャンセリングを使う",
            turnOnNoiseCancellation: "ノイズキャンセリング",
            turnOnBVC: "周辺の音声もキャンセル",
            useAutoGainControl: "音量の自動調整",
            muteOnDisconnectdObject: "オブジェクト退出時の自動ミュート",
            toggleMuteMicShortcutOption: "ショートカットキーによるマイク操作"
        },

        // ユーザーリスト
        userlist: {
            title: "ユーザーリスト",
            searchBar: "名前で検索",
            openspace: "オープンスペース",
            away: "離席中",
            offline: "オフライン",
            chat: "💬 チャット",
            call: "📞 呼びかけ",
            tap: "👋 肩ポン",
            profile: "プロフィールを閲覧",
            online: "オンライン",
            currentSpace: "アクセス中のスペース"
        },

        // チャット
        chat: {
            close: "チャットを閉じる",
            inputPlaceholder: "Ctrl/⌘+Enterでメッセージ送信",
            title: "チャット",
            newMessage: "新着のメッセージ",
            tab: {
                all: "すべて",
                public: "パブリック",
                directMessage: "メンション"
            },
            readMore: "続きを表示",
            download: "ダウンロード",
            preview: "ファイルを開く"
        },

        // 会議室
        room: {
            leave: "退室",
            leaveMeetingRoom: "会議室から退室（ESC）",
            settings: "個人設定",
            lock: "会議室をロック",
            unlock: "会議室のロックを解除",
            blind: "ブラインド ON/OFF",
            returnToRoom: "会議室にもどる",
            leftRoom: "{{name}}が退室しました",
            enteredRoom: "{{name}}が入室しました",
            leaveConfirmTitle: "[{{roomName}}]から退室しますか？",
            enterConfirmTitle: "[{{roomName}}]に入室しますか？",
            enterWithMicOn: "マイクONで入室",
            enterWithMicOff: "マイクOFFで入室",
            returnToSpace: "スペースにもどる",
            roomIsLocked: "部屋は施錠されています",
            roomIsFull: "部屋がいっぱいです",
            enterRoom: "{{roomName}}に入室"
        },

        // 個人設定
        personalSettings: {
            title: "個人設定",
            avatar: "アバター",
            name: "表示名",
            language: "表示言語",
            selfIntroduction: "プロフィール",
            successUpdate: "情報がアップデートされました",
            nameRequiredError: "お名前必須",
            basicInfo: "基本情報",
            details: "パーソナルデータ",
            mypreferences: "環境設定",
            location: "所在地",
            timezone: "タイムゾーン"
        },

        // アイテムバー（コントロール）
        itembar: {
            mic: {
                tooltip: {
                    toggleMicrophone: "マイク ON/OFF（スペースキー）"
                },
                menu: {
                    microphone: "マイク",
                    speaker: "スピーカー",
                    audioSettings: "オーディオ設定",
                    noiseCancellation: "ノイズキャンセリング"
                }
            },
            camera: {
                tooltip: "カメラ ON/OFF",
                menu: {
                    device: "カメラ",
                    cameraMode: "カメラモード",
                    videoSettings: "カメラ設定"
                }
            },
            screenshare: {
                tooltip: "画面共有"
            },
            profileSettings: {
                tooltip: "個人設定"
            },
            position: {
                tooltip: "現在地を確認"
            },
            reaction: {
                tooltip: "リアクション"
            },
            meeting: {
                tooltip: "現在地でミーティングを開始する"
            },
            statusMenu: {
                available: "応対可",
                focus: "作業中",
                away: "離席中",
                status: "ステータス / 現在地を確認"
            }
        },

        // 通知
        browserNotifications: {
            poke: "{{username}}が肩ポンしました",
            call: "{{username}}から呼びかけられています",
            approach: "{{username}} が近くにきました。",
            message: "{{username}}からメッセージが届きました \n {{message}}"
        },

        // エラーメッセージ
        errors: {
            disconnected: "通信が切断されました。こちらをクリックして、ページを再読み込みしてください",
            networkUnstable: "お使いのネットワークが不安定です"
        },

        // ステータス
        status: {
            available: "応対可",
            focus: "作業中",
            away: "離席中",
            offline: "オフライン"
        },

        // 時間関連
        time: {
            today: "今日",
            yesterday: "昨日",
            now: "現在",
            minute: "分",
            hour: "時間",
            day: "日",
            week: "週",
            month: "月",
            year: "年"
        },

        // 既存の翻訳データ
        reservationSocket: {
            checkin: {
                title: "利用方法",
                caption: "User will automatically check-in when their reservation starts.",
                methods: {
                    auto: "自動着席",
                    autoBeacon: "自動着席 (ビーコン)",
                    qr: "QR code by ovice GO (Mobile app)"
                }
            },
            add: "座席予約ソケットの追加",
            edit: "座席予約ソケットの編集",
            nameIsRequired: "名前は必須です"
        },
        customPlugin: {
            add: "{{name}}の追加",
            edit: "{{name}}の編集"
        },
        beacon: {
            scatter: "アバターの距離間"
        },
        addObject: {
            reservationSocket: "座席予約ソケット"
        },
        editObject: {
            spaceCustomization: {
                saved: "変更が保存されました。",
                notSaved: "保存せずに編集画面を閉じました。",
                error: {
                    requiredField: "編集中のデータを保存できませんでした。編集内容を確認してください。",
                    unstableNetwork: "現在、通信が不安定なため保存できません。通信状況を確認してもう一度お試しください。"
                }
            }
        },
        incidentWarning: {
            text: "データ集計の不具合が発生した期間が含まれています。\n詳細は{{link}}をご覧ください。",
            link: "https://help.ovice.com/hc/ja/articles/38652188466329",
            linkText: "ヘルプセンター"
        }
    },
    ko: {
        download: {
            webrtcstats: "WebRTC 상태 로그가 수집됩니다.",
            manual_link: "다운로드가 자동으로 시작되지 않으면 {{here}}를 클릭하세요.",
            manual_link_here: "여기"
        }
    }
}

// Main composable
export const useI18n = (config?: Partial<I18nConfig>) => {
    const currentLocale = ref(config?.locale || 'ja')
    const fallbackLocale = ref(config?.fallbackLocale || 'en')
    const messages = reactive<LocaleData>(config?.messages || translations)

    // Computed properties
    const availableLocales = computed(() => Object.keys(messages))

    const currentMessages = computed(() => messages[currentLocale.value] || {})

    const fallbackMessages = computed(() => messages[fallbackLocale.value] || {})

    // Methods
    const setLocale = (locale: string) => {
        if (availableLocales.value.includes(locale)) {
            currentLocale.value = locale

            // Update document language
            if (typeof document !== 'undefined') {
                document.documentElement.lang = locale
            }

            // Store in localStorage
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('i18n-locale', locale)
            }
        } else {
            console.warn(`Locale '${locale}' not available`)
        }
    }

    const addMessages = (locale: string, newMessages: TranslationData) => {
        if (!messages[locale]) {
            messages[locale] = {}
        }

        messages[locale] = deepMerge(messages[locale], newMessages)
    }

    const removeMessages = (locale: string) => {
        delete messages[locale]
    }

    // Deep merge helper
    const deepMerge = (target: any, source: any): any => {
        const result = { ...target }

        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = deepMerge(result[key] || {}, source[key])
            } else {
                result[key] = source[key]
            }
        }

        return result
    }

    // Get nested value from object using dot notation
    const getNestedValue = (obj: any, path: string): any => {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined
        }, obj)
    }

    // Template interpolation
    const interpolate = (template: string, values: Record<string, any>): string => {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return values[key] !== undefined ? String(values[key]) : match
        })
    }

    // Main translation function
    const t = (key: string, values?: Record<string, any>): string => {
        // Try current locale first
        let translation = getNestedValue(currentMessages.value, key)

        // Fallback to fallback locale
        if (translation === undefined) {
            translation = getNestedValue(fallbackMessages.value, key)
        }

        // If still not found, return key
        if (translation === undefined) {
            console.warn(`Translation key '${key}' not found`)
            return key
        }

        // If translation is not a string, return key
        if (typeof translation !== 'string') {
            console.warn(`Translation for '${key}' is not a string`)
            return key
        }

        // Interpolate values if provided
        if (values) {
            return interpolate(translation, values)
        }

        return translation
    }

    // Translation with pluralization
    const tc = (key: string, count: number, values?: Record<string, any>): string => {
        const pluralKey = count === 1 ? `${key}.singular` : `${key}.plural`

        // Try plural key first
        let translation = getNestedValue(currentMessages.value, pluralKey)

        // Fallback to base key
        if (translation === undefined) {
            translation = t(key, { ...values, count })
        } else {
            translation = typeof translation === 'string' ? translation : key
            if (values) {
                translation = interpolate(translation, { ...values, count })
            }
        }

        return translation
    }

    // Check if translation exists
    const te = (key: string): boolean => {
        const current = getNestedValue(currentMessages.value, key)
        const fallback = getNestedValue(fallbackMessages.value, key)

        return current !== undefined || fallback !== undefined
    }

    // Get locale-specific date formatter
    const getDateFormatter = (options?: Intl.DateTimeFormatOptions) => {
        return new Intl.DateTimeFormat(currentLocale.value, options)
    }

    // Get locale-specific number formatter
    const getNumberFormatter = (options?: Intl.NumberFormatOptions) => {
        return new Intl.NumberFormat(currentLocale.value, options)
    }

    // Format date according to current locale
    const d = (date: Date | string | number, options?: Intl.DateTimeFormatOptions): string => {
        const dateObj = new Date(date)
        return getDateFormatter(options).format(dateObj)
    }

    // Format number according to current locale
    const n = (number: number, options?: Intl.NumberFormatOptions): string => {
        return getNumberFormatter(options).format(number)
    }

    // Detect browser locale
    const detectBrowserLocale = (): string => {
        if (typeof navigator !== 'undefined') {
            const browserLocale = navigator.language || (navigator as any).userLanguage
            const shortLocale = browserLocale.split('-')[0]

            // Check if we have exact match
            if (availableLocales.value.includes(browserLocale)) {
                return browserLocale
            }

            // Check if we have short locale match
            if (availableLocales.value.includes(shortLocale)) {
                return shortLocale
            }
        }

        return fallbackLocale.value
    }

    // Initialize locale from localStorage or browser
    const initializeLocale = () => {
        let savedLocale: string | null = null

        // Try to get from localStorage
        if (typeof localStorage !== 'undefined') {
            savedLocale = localStorage.getItem('i18n-locale')
        }

        // Use saved locale if valid, otherwise detect from browser
        const initialLocale = savedLocale && availableLocales.value.includes(savedLocale)
            ? savedLocale
            : detectBrowserLocale()

        setLocale(initialLocale)
    }

    // Get locale display name
    const getLocaleDisplayName = (locale: string): string => {
        const displayNames: Record<string, string> = {
            en: 'English',
            ja: '日本語',
            ko: '한국어',
            zh: '中文',
            'zh-CN': '简体中文',
            'zh-TW': '繁體中文',
            es: 'Español',
            fr: 'Français',
            de: 'Deutsch',
            it: 'Italiano',
            pt: 'Português',
            ru: 'Русский'
        }

        return displayNames[locale] || locale
    }

    // Initialize on first use
    initializeLocale()

    return {
        // State
        currentLocale,
        fallbackLocale,
        messages,

        // Computed
        availableLocales,
        currentMessages,
        fallbackMessages,

        // Methods
        t,
        tc,
        te,
        d,
        n,
        setLocale,
        addMessages,
        removeMessages,
        getDateFormatter,
        getNumberFormatter,
        detectBrowserLocale,
        getLocaleDisplayName
    }
}
