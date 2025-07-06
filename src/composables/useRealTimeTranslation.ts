import { ref, reactive, computed, watch } from 'vue'

export interface TranslationProvider {
    id: string
    name: string
    apiKey?: string
    endpoint: string
    supportedLanguages: string[]
    rateLimit: number
    maxTextLength: number
    enabled: boolean
}

export interface TranslationRequest {
    id: string
    text: string
    fromLanguage: string
    toLanguage: string
    timestamp: number
    provider: string
}

export interface TranslationResult {
    id: string
    originalText: string
    translatedText: string
    fromLanguage: string
    toLanguage: string
    confidence: number
    provider: string
    timestamp: number
    duration: number
}

export interface TranslationCache {
    [key: string]: TranslationResult
}

export interface TranslationSettings {
    enabled: boolean
    autoDetectLanguage: boolean
    defaultSourceLanguage: string
    defaultTargetLanguage: string
    primaryProvider: string
    fallbackProvider: string
    cacheEnabled: boolean
    cacheExpiry: number
    batchTranslation: boolean
    batchSize: number
    batchDelay: number
    realTimeTranslation: boolean
    translationDelay: number
    showOriginalText: boolean
    showConfidence: boolean
    filterProfanity: boolean
    preserveFormatting: boolean
}

export function useRealTimeTranslation() {
    const isInitialized = ref<boolean>(false)
    const isTranslating = ref<boolean>(false)
    const error = ref<string | null>(null)
    const translationQueue = ref<TranslationRequest[]>([])
    const translationCache = reactive<TranslationCache>({})
    const activeTranslations = ref<Map<string, TranslationRequest>>(new Map())
    const statistics = reactive({
        totalTranslations: 0,
        cacheHits: 0,
        cacheMisses: 0,
        averageLatency: 0,
        errorCount: 0
    })

    const settings = reactive<TranslationSettings>({
        enabled: true,
        autoDetectLanguage: true,
        defaultSourceLanguage: 'auto',
        defaultTargetLanguage: 'ja',
        primaryProvider: 'google',
        fallbackProvider: 'microsoft',
        cacheEnabled: true,
        cacheExpiry: 24 * 60 * 60 * 1000, // 24時間
        batchTranslation: true,
        batchSize: 10,
        batchDelay: 500,
        realTimeTranslation: true,
        translationDelay: 300,
        showOriginalText: true,
        showConfidence: false,
        filterProfanity: false,
        preserveFormatting: true
    })

    // 翻訳プロバイダー設定
    const providers = reactive<Record<string, TranslationProvider>>({
        google: {
            id: 'google',
            name: 'Google Translate',
            apiKey: process.env.VITE_GOOGLE_TRANSLATE_API_KEY,
            endpoint: 'https://translation.googleapis.com/language/translate/v2',
            supportedLanguages: ['ja', 'en', 'zh', 'ko', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ar', 'hi', 'th', 'vi'],
            rateLimit: 100,
            maxTextLength: 5000,
            enabled: true
        },
        microsoft: {
            id: 'microsoft',
            name: 'Microsoft Translator',
            apiKey: process.env.VITE_MICROSOFT_TRANSLATOR_API_KEY,
            endpoint: 'https://api.cognitive.microsofttranslator.com/translate',
            supportedLanguages: ['ja', 'en', 'zh', 'ko', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ar', 'hi', 'th', 'vi'],
            rateLimit: 200,
            maxTextLength: 10000,
            enabled: true
        },
        deepl: {
            id: 'deepl',
            name: 'DeepL',
            apiKey: process.env.VITE_DEEPL_API_KEY,
            endpoint: 'https://api-free.deepl.com/v2/translate',
            supportedLanguages: ['ja', 'en', 'zh', 'ko', 'es', 'fr', 'de', 'it', 'pt', 'ru'],
            rateLimit: 50,
            maxTextLength: 1000,
            enabled: true
        },
        openai: {
            id: 'openai',
            name: 'OpenAI GPT',
            apiKey: process.env.VITE_OPENAI_API_KEY,
            endpoint: 'https://api.openai.com/v1/chat/completions',
            supportedLanguages: ['ja', 'en', 'zh', 'ko', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ar', 'hi', 'th', 'vi'],
            rateLimit: 60,
            maxTextLength: 4000,
            enabled: false
        }
    })

    // 言語設定
    const languages = [
        { code: 'auto', name: '自動検出', nativeName: '自動検出' },
        { code: 'ja', name: 'Japanese', nativeName: '日本語' },
        { code: 'en', name: 'English', nativeName: 'English' },
        { code: 'zh', name: 'Chinese', nativeName: '中文' },
        { code: 'ko', name: 'Korean', nativeName: '한국어' },
        { code: 'es', name: 'Spanish', nativeName: 'Español' },
        { code: 'fr', name: 'French', nativeName: 'Français' },
        { code: 'de', name: 'German', nativeName: 'Deutsch' },
        { code: 'it', name: 'Italian', nativeName: 'Italiano' },
        { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
        { code: 'ru', name: 'Russian', nativeName: 'Русский' },
        { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
        { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
        { code: 'th', name: 'Thai', nativeName: 'ไทย' },
        { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' }
    ]

    // 計算プロパティ
    const availableProviders = computed(() =>
        Object.values(providers).filter(provider => provider.enabled)
    )

    const queueLength = computed(() => translationQueue.value.length)

    const cacheSize = computed(() => Object.keys(translationCache).length)

    const cacheHitRate = computed(() => {
        const total = statistics.cacheHits + statistics.cacheMisses
        return total > 0 ? (statistics.cacheHits / total) * 100 : 0
    })

    // キャッシュキーを生成
    const generateCacheKey = (text: string, fromLang: string, toLang: string): string => {
        const normalizedText = text.trim().toLowerCase()
        return `${fromLang}-${toLang}-${btoa(normalizedText)}`
    }

    // キャッシュから翻訳結果を取得
    const getCachedTranslation = (text: string, fromLang: string, toLang: string): TranslationResult | null => {
        if (!settings.cacheEnabled) return null

        const cacheKey = generateCacheKey(text, fromLang, toLang)
        const cached = translationCache[cacheKey]

        if (cached) {
            const isExpired = Date.now() - cached.timestamp > settings.cacheExpiry
            if (isExpired) {
                delete translationCache[cacheKey]
                return null
            }

            statistics.cacheHits++
            return cached
        }

        statistics.cacheMisses++
        return null
    }

    // 翻訳結果をキャッシュに保存
    const setCachedTranslation = (result: TranslationResult): void => {
        if (!settings.cacheEnabled) return

        const cacheKey = generateCacheKey(result.originalText, result.fromLanguage, result.toLanguage)
        translationCache[cacheKey] = result
    }

    // 言語を自動検出
    const detectLanguage = async (text: string): Promise<string> => {
        try {
            const provider = providers[settings.primaryProvider]
            if (!provider) {
                throw new Error('プライマリプロバイダーが見つかりません')
            }

            // Google Translate APIを使用した言語検出
            if (provider.id === 'google') {
                const response = await fetch(`${provider.endpoint}/detect`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${provider.apiKey}`
                    },
                    body: JSON.stringify({
                        q: text
                    })
                })

                if (!response.ok) {
                    throw new Error(`言語検出エラー: ${response.status}`)
                }

                const data = await response.json()
                return data.data.detections[0][0].language
            }

            // Microsoft Translatorを使用した言語検出
            if (provider.id === 'microsoft') {
                const response = await fetch('https://api.cognitive.microsofttranslator.com/detect', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Ocp-Apim-Subscription-Key': provider.apiKey!
                    },
                    body: JSON.stringify([{ Text: text }])
                })

                if (!response.ok) {
                    throw new Error(`言語検出エラー: ${response.status}`)
                }

                const data = await response.json()
                return data[0].language
            }

            // フォールバック: 簡単な言語検出
            return detectLanguageSimple(text)
        } catch (error) {
            console.error('言語検出エラー:', error)
            return settings.defaultSourceLanguage
        }
    }

    // 簡単な言語検出
    const detectLanguageSimple = (text: string): string => {
        // 日本語の文字が含まれているかチェック
        if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)) {
            return 'ja'
        }

        // 中国語の文字が含まれているかチェック
        if (/[\u4E00-\u9FFF]/.test(text)) {
            return 'zh'
        }

        // 韓国語の文字が含まれているかチェック
        if (/[\uAC00-\uD7AF]/.test(text)) {
            return 'ko'
        }

        // アラビア語の文字が含まれているかチェック
        if (/[\u0600-\u06FF]/.test(text)) {
            return 'ar'
        }

        // デフォルトは英語
        return 'en'
    }

    // 単一テキストを翻訳
    const translateText = async (
        text: string,
        fromLanguage?: string,
        toLanguage?: string,
        provider?: string
    ): Promise<TranslationResult> => {
        const startTime = Date.now()
        const requestId = generateRequestId()

        try {
            // パラメータのデフォルト値を設定
            const sourceLang = fromLanguage || settings.defaultSourceLanguage
            const targetLang = toLanguage || settings.defaultTargetLanguage
            const translationProvider = provider || settings.primaryProvider

            // 言語の自動検出
            let detectedLang = sourceLang
            if (settings.autoDetectLanguage && sourceLang === 'auto') {
                detectedLang = await detectLanguage(text)
            }

            // キャッシュをチェック
            const cached = getCachedTranslation(text, detectedLang, targetLang)
            if (cached) {
                return cached
            }

            // 翻訳を実行
            const result = await executeTranslation(
                requestId,
                text,
                detectedLang,
                targetLang,
                translationProvider
            )

            // キャッシュに保存
            setCachedTranslation(result)

            // 統計を更新
            statistics.totalTranslations++
            const duration = Date.now() - startTime
            statistics.averageLatency = (statistics.averageLatency + duration) / 2

            return result
        } catch (error) {
            statistics.errorCount++
            console.error('翻訳エラー:', error)
            throw error
        }
    }

    // 翻訳を実行
    const executeTranslation = async (
        requestId: string,
        text: string,
        fromLang: string,
        toLang: string,
        providerId: string
    ): Promise<TranslationResult> => {
        const provider = providers[providerId]
        if (!provider) {
            throw new Error(`プロバイダーが見つかりません: ${providerId}`)
        }

        const startTime = Date.now()

        try {
            let translatedText = ''
            let confidence = 1.0

            switch (provider.id) {
                case 'google':
                    ({ translatedText, confidence } = await translateWithGoogle(text, fromLang, toLang, provider))
                    break
                case 'microsoft':
                    ({ translatedText, confidence } = await translateWithMicrosoft(text, fromLang, toLang, provider))
                    break
                case 'deepl':
                    ({ translatedText, confidence } = await translateWithDeepL(text, fromLang, toLang, provider))
                    break
                case 'openai':
                    ({ translatedText, confidence } = await translateWithOpenAI(text, fromLang, toLang, provider))
                    break
                default:
                    throw new Error(`サポートされていないプロバイダー: ${provider.id}`)
            }

            const duration = Date.now() - startTime

            return {
                id: requestId,
                originalText: text,
                translatedText,
                fromLanguage: fromLang,
                toLanguage: toLang,
                confidence,
                provider: provider.id,
                timestamp: Date.now(),
                duration
            }
        } catch (error) {
            // フォールバックプロバイダーを試行
            if (providerId !== settings.fallbackProvider) {
                console.warn(`プライマリプロバイダー失敗、フォールバックを試行: ${error}`)
                return executeTranslation(requestId, text, fromLang, toLang, settings.fallbackProvider)
            }
            throw error
        }
    }

    // Google Translateで翻訳
    const translateWithGoogle = async (
        text: string,
        fromLang: string,
        toLang: string,
        provider: TranslationProvider
    ): Promise<{ translatedText: string; confidence: number }> => {
        const response = await fetch(`${provider.endpoint}?key=${provider.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                q: text,
                source: fromLang,
                target: toLang,
                format: 'text'
            })
        })

        if (!response.ok) {
            throw new Error(`Google Translate API エラー: ${response.status}`)
        }

        const data = await response.json()
        return {
            translatedText: data.data.translations[0].translatedText,
            confidence: 0.95
        }
    }

    // Microsoft Translatorで翻訳
    const translateWithMicrosoft = async (
        text: string,
        fromLang: string,
        toLang: string,
        provider: TranslationProvider
    ): Promise<{ translatedText: string; confidence: number }> => {
        const response = await fetch(`${provider.endpoint}?api-version=3.0&from=${fromLang}&to=${toLang}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Ocp-Apim-Subscription-Key': provider.apiKey!
            },
            body: JSON.stringify([{ Text: text }])
        })

        if (!response.ok) {
            throw new Error(`Microsoft Translator API エラー: ${response.status}`)
        }

        const data = await response.json()
        return {
            translatedText: data[0].translations[0].text,
            confidence: data[0].translations[0].confidence || 0.9
        }
    }

    // DeepLで翻訳
    const translateWithDeepL = async (
        text: string,
        fromLang: string,
        toLang: string,
        provider: TranslationProvider
    ): Promise<{ translatedText: string; confidence: number }> => {
        const response = await fetch(provider.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `DeepL-Auth-Key ${provider.apiKey}`
            },
            body: new URLSearchParams({
                text: text,
                source_lang: fromLang.toUpperCase(),
                target_lang: toLang.toUpperCase()
            })
        })

        if (!response.ok) {
            throw new Error(`DeepL API エラー: ${response.status}`)
        }

        const data = await response.json()
        return {
            translatedText: data.translations[0].text,
            confidence: 0.98
        }
    }

    // OpenAI GPTで翻訳
    const translateWithOpenAI = async (
        text: string,
        fromLang: string,
        toLang: string,
        provider: TranslationProvider
    ): Promise<{ translatedText: string; confidence: number }> => {
        const languageNames: Record<string, string> = {
            ja: '日本語',
            en: '英語',
            zh: '中国語',
            ko: '韓国語',
            es: 'スペイン語',
            fr: 'フランス語',
            de: 'ドイツ語',
            it: 'イタリア語',
            pt: 'ポルトガル語',
            ru: 'ロシア語',
            ar: 'アラビア語',
            hi: 'ヒンディー語',
            th: 'タイ語',
            vi: 'ベトナム語'
        }

        const prompt = `以下のテキストを${languageNames[fromLang]}から${languageNames[toLang]}に翻訳してください。翻訳結果のみを返答してください。\n\n${text}`

        const response = await fetch(provider.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${provider.apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'user', content: prompt }
                ],
                max_tokens: 1000,
                temperature: 0.1
            })
        })

        if (!response.ok) {
            throw new Error(`OpenAI API エラー: ${response.status}`)
        }

        const data = await response.json()
        return {
            translatedText: data.choices[0].message.content.trim(),
            confidence: 0.85
        }
    }

    // バッチ翻訳
    const translateBatch = async (
        texts: string[],
        fromLanguage?: string,
        toLanguage?: string,
        provider?: string
    ): Promise<TranslationResult[]> => {
        const results: TranslationResult[] = []
        const batchSize = settings.batchSize

        for (let i = 0; i < texts.length; i += batchSize) {
            const batch = texts.slice(i, i + batchSize)
            const batchPromises = batch.map(text =>
                translateText(text, fromLanguage, toLanguage, provider)
            )

            const batchResults = await Promise.allSettled(batchPromises)

            batchResults.forEach(result => {
                if (result.status === 'fulfilled') {
                    results.push(result.value)
                } else {
                    console.error('バッチ翻訳エラー:', result.reason)
                }
            })

            // バッチ間の遅延
            if (i + batchSize < texts.length) {
                await new Promise(resolve => setTimeout(resolve, settings.batchDelay))
            }
        }

        return results
    }

    // リアルタイム翻訳
    const startRealTimeTranslation = (
        sourceElement: HTMLElement,
        targetElement: HTMLElement,
        fromLanguage?: string,
        toLanguage?: string
    ): () => void => {
        let debounceTimer: ReturnType<typeof setTimeout>

        const handleInput = async () => {
            const text = sourceElement.textContent || sourceElement.innerText || ''

            if (!text.trim()) {
                targetElement.textContent = ''
                return
            }

            clearTimeout(debounceTimer)
            debounceTimer = setTimeout(async () => {
                try {
                    isTranslating.value = true
                    const result = await translateText(text, fromLanguage, toLanguage)
                    targetElement.textContent = result.translatedText
                } catch (error) {
                    console.error('リアルタイム翻訳エラー:', error)
                    targetElement.textContent = 'Translation error'
                } finally {
                    isTranslating.value = false
                }
            }, settings.translationDelay)
        }

        sourceElement.addEventListener('input', handleInput)
        sourceElement.addEventListener('paste', handleInput)

        // クリーンアップ関数を返す
        return () => {
            sourceElement.removeEventListener('input', handleInput)
            sourceElement.removeEventListener('paste', handleInput)
            clearTimeout(debounceTimer)
        }
    }

    // 設定の保存
    const saveSettings = (): void => {
        localStorage.setItem('translation-settings', JSON.stringify(settings))
    }

    // 設定の読み込み
    const loadSettings = (): void => {
        const saved = localStorage.getItem('translation-settings')
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                Object.assign(settings, parsed)
            } catch (error) {
                console.error('翻訳設定の読み込みエラー:', error)
            }
        }
    }

    // キャッシュをクリア
    const clearCache = (): void => {
        Object.keys(translationCache).forEach(key => {
            delete translationCache[key]
        })
    }

    // 統計をリセット
    const resetStatistics = (): void => {
        statistics.totalTranslations = 0
        statistics.cacheHits = 0
        statistics.cacheMisses = 0
        statistics.averageLatency = 0
        statistics.errorCount = 0
    }

    // ユーティリティ関数
    const generateRequestId = (): string => {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    // 設定の監視
    watch(settings, saveSettings, { deep: true })

    return {
        // 状態
        isInitialized,
        isTranslating,
        error,
        translationQueue,
        translationCache,
        activeTranslations,
        statistics,
        settings,
        providers,
        languages,

        // 計算プロパティ
        availableProviders,
        queueLength,
        cacheSize,
        cacheHitRate,

        // メソッド
        translateText,
        translateBatch,
        startRealTimeTranslation,
        detectLanguage,
        getCachedTranslation,
        setCachedTranslation,
        clearCache,
        resetStatistics,
        saveSettings,
        loadSettings
    }
}
