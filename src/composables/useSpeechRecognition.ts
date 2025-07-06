import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'

// Web Speech API型定義
interface SpeechRecognition extends EventTarget {
    continuous: boolean
    interimResults: boolean
    lang: string
    maxAlternatives: number
    start(): void
    stop(): void
    abort(): void
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null
    onend: ((this: SpeechRecognition, ev: Event) => any) | null
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
    onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null
    onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null
    onnomatch: ((this: SpeechRecognition, ev: Event) => any) | null
    onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null
    onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null
}

interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList
    resultIndex: number
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string
    message: string
}

interface SpeechRecognitionResultList {
    length: number
    item(index: number): SpeechRecognitionResult
    [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
    length: number
    isFinal: boolean
    item(index: number): SpeechRecognitionAlternative
    [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
    transcript: string
    confidence: number
}

declare global {
    interface Window {
        SpeechRecognition: {
            new(): SpeechRecognition
        }
        webkitSpeechRecognition: {
            new(): SpeechRecognition
        }
    }
}

export interface SpeechRecognitionConfig {
    language: string
    continuous: boolean
    interimResults: boolean
    maxAlternatives: number
    confidenceThreshold: number
    autoStart: boolean
    grammars?: string[]
}

export interface SpeechResult {
    transcript: string
    confidence: number
    isFinal: boolean
    alternatives: SpeechAlternative[]
    timestamp: number
}

export interface SpeechAlternative {
    transcript: string
    confidence: number
}

export interface VoiceCommand {
    id: string
    phrases: string[]
    action: (transcript: string, confidence: number) => void
    description: string
    enabled: boolean
    confidence: number
}

export interface SpeechSettings {
    enabled: boolean
    language: string
    continuous: boolean
    interimResults: boolean
    confidenceThreshold: number
    noiseReduction: boolean
    echoCancellation: boolean
    autoGainControl: boolean
    voiceCommands: boolean
    wakeWord: string
    pushToTalk: boolean
    pushToTalkKey: string
}

export function useSpeechRecognition() {
    const isSupported = ref<boolean>('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
    const isListening = ref<boolean>(false)
    const isInitialized = ref<boolean>(false)
    const error = ref<string | null>(null)
    const lastResult = ref<SpeechResult | null>(null)
    const results = ref<SpeechResult[]>([])
    const recognition = ref<SpeechRecognition | null>(null)
    const voiceCommands = ref<VoiceCommand[]>([])
    const isWakeWordActive = ref<boolean>(false)
    const isPushToTalkActive = ref<boolean>(false)

    const settings = reactive<SpeechSettings>({
        enabled: true,
        language: 'ja-JP',
        continuous: true,
        interimResults: true,
        confidenceThreshold: 0.7,
        noiseReduction: true,
        echoCancellation: true,
        autoGainControl: true,
        voiceCommands: true,
        wakeWord: 'こんにちは',
        pushToTalk: false,
        pushToTalkKey: 'Space'
    })

    const config = reactive<SpeechRecognitionConfig>({
        language: settings.language,
        continuous: settings.continuous,
        interimResults: settings.interimResults,
        maxAlternatives: 3,
        confidenceThreshold: settings.confidenceThreshold,
        autoStart: false
    })

    // 計算プロパティ
    const currentTranscript = computed(() => lastResult.value?.transcript || '')
    const confidence = computed(() => lastResult.value?.confidence || 0)
    const isHighConfidence = computed(() => confidence.value >= settings.confidenceThreshold)
    const availableLanguages = computed(() => [
        { code: 'ja-JP', name: '日本語', nativeName: '日本語' },
        { code: 'en-US', name: 'English (US)', nativeName: 'English (US)' },
        { code: 'en-GB', name: 'English (UK)', nativeName: 'English (UK)' },
        { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '中文(简体)' },
        { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '中文(繁體)' },
        { code: 'ko-KR', name: 'Korean', nativeName: '한국어' },
        { code: 'es-ES', name: 'Spanish', nativeName: 'Español' },
        { code: 'fr-FR', name: 'French', nativeName: 'Français' },
        { code: 'de-DE', name: 'German', nativeName: 'Deutsch' },
        { code: 'it-IT', name: 'Italian', nativeName: 'Italiano' },
        { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)' },
        { code: 'ru-RU', name: 'Russian', nativeName: 'Русский' },
        { code: 'ar-SA', name: 'Arabic', nativeName: 'العربية' },
        { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी' },
        { code: 'th-TH', name: 'Thai', nativeName: 'ไทย' },
        { code: 'vi-VN', name: 'Vietnamese', nativeName: 'Tiếng Việt' }
    ])

    // 音声認識の初期化
    const initialize = async (): Promise<boolean> => {
        if (!isSupported.value) {
            error.value = '音声認識がサポートされていません'
            return false
        }

        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
            recognition.value = new SpeechRecognition()

            // 設定を適用
            recognition.value.lang = config.language
            recognition.value.continuous = config.continuous
            recognition.value.interimResults = config.interimResults
            recognition.value.maxAlternatives = config.maxAlternatives

            // イベントリスナーを設定
            recognition.value.onstart = handleStart
            recognition.value.onend = handleEnd
            recognition.value.onerror = handleError
            recognition.value.onresult = handleResult
            recognition.value.onspeechstart = handleSpeechStart
            recognition.value.onspeechend = handleSpeechEnd
            recognition.value.onnomatch = handleNoMatch
            recognition.value.onaudiostart = handleAudioStart
            recognition.value.onaudioend = handleAudioEnd

            isInitialized.value = true
            console.log('音声認識を初期化しました')
            return true
        } catch (err) {
            error.value = err instanceof Error ? err.message : '音声認識の初期化に失敗しました'
            console.error('音声認識初期化エラー:', err)
            return false
        }
    }

    // 音声認識開始
    const start = async (): Promise<boolean> => {
        if (!isInitialized.value) {
            await initialize()
        }

        if (!recognition.value || isListening.value) {
            return false
        }

        try {
            recognition.value.start()
            return true
        } catch (err) {
            error.value = err instanceof Error ? err.message : '音声認識の開始に失敗しました'
            console.error('音声認識開始エラー:', err)
            return false
        }
    }

    // 音声認識停止
    const stop = (): boolean => {
        if (!recognition.value || !isListening.value) {
            return false
        }

        try {
            recognition.value.stop()
            return true
        } catch (err) {
            error.value = err instanceof Error ? err.message : '音声認識の停止に失敗しました'
            console.error('音声認識停止エラー:', err)
            return false
        }
    }

    // 音声認識中断
    const abort = (): boolean => {
        if (!recognition.value) {
            return false
        }

        try {
            recognition.value.abort()
            return true
        } catch (err) {
            error.value = err instanceof Error ? err.message : '音声認識の中断に失敗しました'
            console.error('音声認識中断エラー:', err)
            return false
        }
    }

    // 言語設定
    const setLanguage = (language: string): boolean => {
        if (!recognition.value) {
            return false
        }

        try {
            recognition.value.lang = language
            config.language = language
            settings.language = language
            return true
        } catch (err) {
            error.value = err instanceof Error ? err.message : '言語設定に失敗しました'
            console.error('言語設定エラー:', err)
            return false
        }
    }

    // 音声コマンドを登録
    const registerVoiceCommand = (command: VoiceCommand): void => {
        const existingIndex = voiceCommands.value.findIndex(cmd => cmd.id === command.id)

        if (existingIndex !== -1) {
            voiceCommands.value[existingIndex] = command
        } else {
            voiceCommands.value.push(command)
        }
    }

    // 音声コマンドを削除
    const unregisterVoiceCommand = (commandId: string): boolean => {
        const index = voiceCommands.value.findIndex(cmd => cmd.id === commandId)

        if (index !== -1) {
            voiceCommands.value.splice(index, 1)
            return true
        }

        return false
    }

    // 音声コマンドを実行
    const executeVoiceCommand = (transcript: string, confidence: number): boolean => {
        if (!settings.voiceCommands) {
            return false
        }

        const matchedCommand = voiceCommands.value.find(command => {
            if (!command.enabled || confidence < command.confidence) {
                return false
            }

            return command.phrases.some(phrase => {
                const normalizedTranscript = transcript.toLowerCase().trim()
                const normalizedPhrase = phrase.toLowerCase().trim()

                // 完全一致
                if (normalizedTranscript === normalizedPhrase) {
                    return true
                }

                // 部分一致
                if (normalizedTranscript.includes(normalizedPhrase)) {
                    return true
                }

                // 類似度チェック
                const similarity = calculateSimilarity(normalizedTranscript, normalizedPhrase)
                return similarity > 0.8
            })
        })

        if (matchedCommand) {
            try {
                matchedCommand.action(transcript, confidence)
                console.log(`音声コマンド実行: ${matchedCommand.id}`)
                return true
            } catch (err) {
                console.error(`音声コマンド実行エラー (${matchedCommand.id}):`, err)
            }
        }

        return false
    }

    // ウェイクワード検出
    const detectWakeWord = (transcript: string): boolean => {
        if (!settings.wakeWord) {
            return false
        }

        const normalizedTranscript = transcript.toLowerCase().trim()
        const normalizedWakeWord = settings.wakeWord.toLowerCase().trim()

        return normalizedTranscript.includes(normalizedWakeWord)
    }

    // 文字列類似度計算
    const calculateSimilarity = (str1: string, str2: string): number => {
        const longer = str1.length > str2.length ? str1 : str2
        const shorter = str1.length > str2.length ? str2 : str1

        if (longer.length === 0) {
            return 1.0
        }

        const distance = levenshteinDistance(longer, shorter)
        return (longer.length - distance) / longer.length
    }

    // レーベンシュタイン距離計算
    const levenshteinDistance = (str1: string, str2: string): number => {
        const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))

        for (let i = 0; i <= str1.length; i++) {
            matrix[0][i] = i
        }

        for (let j = 0; j <= str2.length; j++) {
            matrix[j][0] = j
        }

        for (let j = 1; j <= str2.length; j++) {
            for (let i = 1; i <= str1.length; i++) {
                const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
                matrix[j][i] = Math.min(
                    matrix[j][i - 1] + 1,
                    matrix[j - 1][i] + 1,
                    matrix[j - 1][i - 1] + indicator
                )
            }
        }

        return matrix[str2.length][str1.length]
    }

    // Push-to-Talk処理
    const handlePushToTalk = (event: KeyboardEvent): void => {
        if (!settings.pushToTalk) {
            return
        }

        const isTargetKey = event.code === settings.pushToTalkKey || event.key === settings.pushToTalkKey

        if (event.type === 'keydown' && isTargetKey && !isPushToTalkActive.value) {
            isPushToTalkActive.value = true
            start()
        } else if (event.type === 'keyup' && isTargetKey && isPushToTalkActive.value) {
            isPushToTalkActive.value = false
            stop()
        }
    }

    // イベントハンドラー
    const handleStart = (): void => {
        isListening.value = true
        error.value = null
        console.log('音声認識開始')
    }

    const handleEnd = (): void => {
        isListening.value = false
        isPushToTalkActive.value = false
        console.log('音声認識終了')
    }

    const handleError = (event: SpeechRecognitionErrorEvent): void => {
        isListening.value = false
        isPushToTalkActive.value = false

        const errorMessages: Record<string, string> = {
            'no-speech': '音声が検出されませんでした',
            'audio-capture': 'マイクへのアクセスに失敗しました',
            'not-allowed': 'マイクへのアクセスが拒否されました',
            'network': 'ネットワークエラーが発生しました',
            'service-not-allowed': 'サービスへのアクセスが拒否されました',
            'bad-grammar': '文法エラーが発生しました',
            'language-not-supported': '言語がサポートされていません'
        }

        error.value = errorMessages[event.error] || `音声認識エラー: ${event.error}`
        console.error('音声認識エラー:', event.error)
    }

    const handleResult = (event: SpeechRecognitionEvent): void => {
        const result = event.results[event.resultIndex]
        const transcript = result[0].transcript
        const confidence = result[0].confidence
        const isFinal = result.isFinal

        // 代替候補を取得
        const alternatives: SpeechAlternative[] = []
        for (let i = 0; i < result.length; i++) {
            alternatives.push({
                transcript: result[i].transcript,
                confidence: result[i].confidence
            })
        }

        const speechResult: SpeechResult = {
            transcript,
            confidence,
            isFinal,
            alternatives,
            timestamp: Date.now()
        }

        lastResult.value = speechResult
        results.value.push(speechResult)

        // 結果が確定した場合の処理
        if (isFinal && confidence >= settings.confidenceThreshold) {
            // ウェイクワード検出
            if (detectWakeWord(transcript)) {
                isWakeWordActive.value = true
                console.log('ウェイクワード検出:', transcript)
            }

            // 音声コマンド実行
            if (isWakeWordActive.value || !settings.wakeWord) {
                executeVoiceCommand(transcript, confidence)
            }

            // カスタムイベント発火
            window.dispatchEvent(new CustomEvent('speech-recognition-result', {
                detail: speechResult
            }))
        }

        console.log('音声認識結果:', transcript, `(信頼度: ${confidence})`)
    }

    const handleSpeechStart = (): void => {
        console.log('音声検出開始')
    }

    const handleSpeechEnd = (): void => {
        console.log('音声検出終了')
    }

    const handleNoMatch = (): void => {
        console.log('音声認識結果が見つかりません')
    }

    const handleAudioStart = (): void => {
        console.log('音声入力開始')
    }

    const handleAudioEnd = (): void => {
        console.log('音声入力終了')
    }

    // 設定の保存
    const saveSettings = (): void => {
        localStorage.setItem('speech-recognition-settings', JSON.stringify(settings))
    }

    // 設定の読み込み
    const loadSettings = (): void => {
        const saved = localStorage.getItem('speech-recognition-settings')
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                Object.assign(settings, parsed)

                // 設定を音声認識に反映
                config.language = settings.language
                config.continuous = settings.continuous
                config.interimResults = settings.interimResults
                config.confidenceThreshold = settings.confidenceThreshold
            } catch (err) {
                console.error('音声認識設定の読み込みエラー:', err)
            }
        }
    }

    // 結果をクリア
    const clearResults = (): void => {
        results.value = []
        lastResult.value = null
    }

    // デフォルト音声コマンドを登録
    const registerDefaultCommands = (): void => {
        // 基本コマンド
        registerVoiceCommand({
            id: 'start-listening',
            phrases: ['聞いて', '開始', 'スタート', 'はじめて'],
            action: () => start(),
            description: '音声認識を開始',
            enabled: true,
            confidence: 0.7
        })

        registerVoiceCommand({
            id: 'stop-listening',
            phrases: ['停止', 'ストップ', '終了', 'やめて'],
            action: () => stop(),
            description: '音声認識を停止',
            enabled: true,
            confidence: 0.7
        })

        // ナビゲーションコマンド
        registerVoiceCommand({
            id: 'go-home',
            phrases: ['ホームに移動', 'ホーム', 'トップページ'],
            action: () => window.location.href = '/',
            description: 'ホームページに移動',
            enabled: true,
            confidence: 0.8
        })

        registerVoiceCommand({
            id: 'open-settings',
            phrases: ['設定を開く', '設定', 'せってい'],
            action: () => {
                const settingsButton = document.querySelector('[aria-label*="設定"]') as HTMLElement
                settingsButton?.click()
            },
            description: '設定を開く',
            enabled: true,
            confidence: 0.8
        })

        // 会議コマンド
        registerVoiceCommand({
            id: 'mute-microphone',
            phrases: ['マイクをミュート', 'ミュート', 'マイクオフ'],
            action: () => {
                window.dispatchEvent(new CustomEvent('voice-command-mute'))
            },
            description: 'マイクをミュート',
            enabled: true,
            confidence: 0.8
        })

        registerVoiceCommand({
            id: 'unmute-microphone',
            phrases: ['マイクのミュート解除', 'ミュート解除', 'マイクオン'],
            action: () => {
                window.dispatchEvent(new CustomEvent('voice-command-unmute'))
            },
            description: 'マイクのミュート解除',
            enabled: true,
            confidence: 0.8
        })

        registerVoiceCommand({
            id: 'turn-off-camera',
            phrases: ['カメラをオフ', 'カメラ停止', 'ビデオオフ'],
            action: () => {
                window.dispatchEvent(new CustomEvent('voice-command-camera-off'))
            },
            description: 'カメラをオフ',
            enabled: true,
            confidence: 0.8
        })

        registerVoiceCommand({
            id: 'turn-on-camera',
            phrases: ['カメラをオン', 'カメラ開始', 'ビデオオン'],
            action: () => {
                window.dispatchEvent(new CustomEvent('voice-command-camera-on'))
            },
            description: 'カメラをオン',
            enabled: true,
            confidence: 0.8
        })
    }

    // 初期化処理
    onMounted(() => {
        loadSettings()
        registerDefaultCommands()

        if (settings.pushToTalk) {
            document.addEventListener('keydown', handlePushToTalk)
            document.addEventListener('keyup', handlePushToTalk)
        }
    })

    // クリーンアップ
    onUnmounted(() => {
        if (isListening.value) {
            stop()
        }

        document.removeEventListener('keydown', handlePushToTalk)
        document.removeEventListener('keyup', handlePushToTalk)
    })

    return {
        // 状態
        isSupported,
        isListening,
        isInitialized,
        error,
        lastResult,
        results,
        voiceCommands,
        isWakeWordActive,
        isPushToTalkActive,
        settings,
        config,

        // 計算プロパティ
        currentTranscript,
        confidence,
        isHighConfidence,
        availableLanguages,

        // メソッド
        initialize,
        start,
        stop,
        abort,
        setLanguage,
        registerVoiceCommand,
        unregisterVoiceCommand,
        executeVoiceCommand,
        detectWakeWord,
        clearResults,
        saveSettings,
        loadSettings,
        registerDefaultCommands
    }
}
