import { ref, reactive, computed } from 'vue'

export interface AIProvider {
    id: string
    name: string
    apiKey?: string
    endpoint: string
    models: AIModel[]
    capabilities: AICapability[]
    rateLimit: number
    enabled: boolean
}

export interface AIModel {
    id: string
    name: string
    description: string
    maxTokens: number
    costPer1kTokens: number
    capabilities: string[]
}

export interface AICapability {
    id: string
    name: string
    description: string
    enabled: boolean
}

export interface AIRequest {
    id: string
    type: 'chat' | 'completion' | 'summary' | 'translation' | 'analysis' | 'generation'
    prompt: string
    context?: any
    options?: AIRequestOptions
    timestamp: number
}

export interface AIRequestOptions {
    model?: string
    maxTokens?: number
    temperature?: number
    topP?: number
    frequencyPenalty?: number
    presencePenalty?: number
    stream?: boolean
}

export interface AIResponse {
    id: string
    requestId: string
    content: string
    model: string
    usage: {
        promptTokens: number
        completionTokens: number
        totalTokens: number
    }
    confidence: number
    timestamp: number
    duration: number
}

export interface MeetingSummary {
    id: string
    meetingId: string
    title: string
    participants: string[]
    duration: number
    keyPoints: string[]
    actionItems: ActionItem[]
    decisions: string[]
    nextSteps: string[]
    sentiment: 'positive' | 'neutral' | 'negative'
    topics: string[]
    timestamp: number
}

export interface ActionItem {
    id: string
    description: string
    assignee?: string
    dueDate?: Date
    priority: 'low' | 'medium' | 'high'
    status: 'pending' | 'in-progress' | 'completed'
}

export interface ProductivityAnalysis {
    userId: string
    period: 'day' | 'week' | 'month'
    metrics: {
        focusTime: number
        meetingTime: number
        breakTime: number
        productivityScore: number
        efficiency: number
        workload: number
    }
    insights: string[]
    recommendations: string[]
    trends: {
        label: string
        value: number
        change: number
    }[]
    timestamp: number
}

export interface SmartSuggestion {
    id: string
    type: 'meeting' | 'task' | 'break' | 'optimization' | 'collaboration'
    title: string
    description: string
    confidence: number
    impact: 'low' | 'medium' | 'high'
    effort: 'low' | 'medium' | 'high'
    actionable: boolean
    timestamp: number
}

export function useAI() {
    const isInitialized = ref<boolean>(false)
    const isProcessing = ref<boolean>(false)
    const error = ref<string | null>(null)
    const activeRequests = ref<Map<string, AIRequest>>(new Map())
    const requestHistory = ref<AIRequest[]>([])
    const responseHistory = ref<AIResponse[]>([])

    const settings = reactive({
        enabled: true,
        primaryProvider: 'openai',
        fallbackProvider: 'anthropic',
        defaultModel: 'gpt-3.5-turbo',
        maxTokens: 2000,
        temperature: 0.7,
        enableMeetingSummary: true,
        enableProductivityAnalysis: true,
        enableSmartSuggestions: true,
        enableRealTimeAnalysis: true,
        autoOptimization: true,
        privacyMode: true,
        dataRetention: 30 // days
    })

    // AIプロバイダー設定
    const providers = reactive<Record<string, AIProvider>>({
        openai: {
            id: 'openai',
            name: 'OpenAI',
            apiKey: process.env.VITE_OPENAI_API_KEY,
            endpoint: 'https://api.openai.com/v1',
            models: [
                {
                    id: 'gpt-4',
                    name: 'GPT-4',
                    description: '最も高性能なモデル',
                    maxTokens: 8192,
                    costPer1kTokens: 0.03,
                    capabilities: ['chat', 'completion', 'analysis', 'reasoning']
                },
                {
                    id: 'gpt-3.5-turbo',
                    name: 'GPT-3.5 Turbo',
                    description: '高速で効率的なモデル',
                    maxTokens: 4096,
                    costPer1kTokens: 0.002,
                    capabilities: ['chat', 'completion', 'summary']
                }
            ],
            capabilities: [
                { id: 'chat', name: 'チャット', description: '対話型AI', enabled: true },
                { id: 'summary', name: '要約', description: 'テキスト要約', enabled: true },
                { id: 'analysis', name: '分析', description: 'データ分析', enabled: true },
                { id: 'generation', name: '生成', description: 'コンテンツ生成', enabled: true }
            ],
            rateLimit: 60,
            enabled: true
        },
        anthropic: {
            id: 'anthropic',
            name: 'Anthropic Claude',
            apiKey: process.env.VITE_ANTHROPIC_API_KEY,
            endpoint: 'https://api.anthropic.com/v1',
            models: [
                {
                    id: 'claude-3-opus',
                    name: 'Claude 3 Opus',
                    description: '最高性能のClaude',
                    maxTokens: 4096,
                    costPer1kTokens: 0.015,
                    capabilities: ['chat', 'completion', 'analysis', 'reasoning']
                },
                {
                    id: 'claude-3-sonnet',
                    name: 'Claude 3 Sonnet',
                    description: 'バランスの取れたClaude',
                    maxTokens: 4096,
                    costPer1kTokens: 0.003,
                    capabilities: ['chat', 'completion', 'summary']
                }
            ],
            capabilities: [
                { id: 'chat', name: 'チャット', description: '対話型AI', enabled: true },
                { id: 'summary', name: '要約', description: 'テキスト要約', enabled: true },
                { id: 'analysis', name: '分析', description: 'データ分析', enabled: true }
            ],
            rateLimit: 50,
            enabled: true
        },
        google: {
            id: 'google',
            name: 'Google Gemini',
            apiKey: process.env.VITE_GOOGLE_AI_API_KEY,
            endpoint: 'https://generativelanguage.googleapis.com/v1',
            models: [
                {
                    id: 'gemini-pro',
                    name: 'Gemini Pro',
                    description: 'Googleの高性能モデル',
                    maxTokens: 2048,
                    costPer1kTokens: 0.0005,
                    capabilities: ['chat', 'completion', 'analysis']
                }
            ],
            capabilities: [
                { id: 'chat', name: 'チャット', description: '対話型AI', enabled: true },
                { id: 'analysis', name: '分析', description: 'データ分析', enabled: true }
            ],
            rateLimit: 60,
            enabled: false
        }
    })

    // 計算プロパティ
    const currentProvider = computed(() => providers[settings.primaryProvider])
    const availableModels = computed(() => currentProvider.value?.models || [])
    const totalRequests = computed(() => requestHistory.value.length)
    const averageResponseTime = computed(() => {
        if (responseHistory.value.length === 0) return 0
        const total = responseHistory.value.reduce((sum, response) => sum + response.duration, 0)
        return total / responseHistory.value.length
    })

    // AI リクエストを送信
    const sendRequest = async (
        type: AIRequest['type'],
        prompt: string,
        context?: any,
        options?: AIRequestOptions
    ): Promise<AIResponse> => {
        const requestId = generateRequestId()
        const request: AIRequest = {
            id: requestId,
            type,
            prompt,
            context,
            options,
            timestamp: Date.now()
        }

        activeRequests.value.set(requestId, request)
        requestHistory.value.push(request)

        try {
            isProcessing.value = true
            error.value = null

            const provider = providers[settings.primaryProvider]
            if (!provider || !provider.enabled) {
                throw new Error('利用可能なAIプロバイダーがありません')
            }

            const response = await executeRequest(request, provider)
            responseHistory.value.push(response)

            return response
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'AIリクエストに失敗しました'

            // フォールバックプロバイダーを試行
            if (settings.fallbackProvider && settings.fallbackProvider !== settings.primaryProvider) {
                try {
                    const fallbackProvider = providers[settings.fallbackProvider]
                    if (fallbackProvider?.enabled) {
                        const response = await executeRequest(request, fallbackProvider)
                        responseHistory.value.push(response)
                        return response
                    }
                } catch (fallbackError) {
                    console.error('フォールバックプロバイダーも失敗:', fallbackError)
                }
            }

            throw err
        } finally {
            activeRequests.value.delete(requestId)
            isProcessing.value = false
        }
    }

    // リクエストを実行
    const executeRequest = async (request: AIRequest, provider: AIProvider): Promise<AIResponse> => {
        const startTime = Date.now()

        switch (provider.id) {
            case 'openai':
                return await executeOpenAIRequest(request, provider, startTime)
            case 'anthropic':
                return await executeAnthropicRequest(request, provider, startTime)
            case 'google':
                return await executeGoogleRequest(request, provider, startTime)
            default:
                throw new Error(`サポートされていないプロバイダー: ${provider.id}`)
        }
    }

    // OpenAI リクエスト実行
    const executeOpenAIRequest = async (
        request: AIRequest,
        provider: AIProvider,
        startTime: number
    ): Promise<AIResponse> => {
        const model = request.options?.model || settings.defaultModel
        const maxTokens = request.options?.maxTokens || settings.maxTokens
        const temperature = request.options?.temperature || settings.temperature

        const response = await fetch(`${provider.endpoint}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${provider.apiKey}`
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: 'user', content: request.prompt }
                ],
                max_tokens: maxTokens,
                temperature,
                top_p: request.options?.topP,
                frequency_penalty: request.options?.frequencyPenalty,
                presence_penalty: request.options?.presencePenalty,
                stream: request.options?.stream || false
            })
        })

        if (!response.ok) {
            throw new Error(`OpenAI API エラー: ${response.status}`)
        }

        const data = await response.json()
        const duration = Date.now() - startTime

        return {
            id: generateResponseId(),
            requestId: request.id,
            content: data.choices[0].message.content,
            model,
            usage: data.usage,
            confidence: 0.9,
            timestamp: Date.now(),
            duration
        }
    }

    // Anthropic リクエスト実行
    const executeAnthropicRequest = async (
        request: AIRequest,
        provider: AIProvider,
        startTime: number
    ): Promise<AIResponse> => {
        const model = request.options?.model || 'claude-3-sonnet'
        const maxTokens = request.options?.maxTokens || settings.maxTokens

        const response = await fetch(`${provider.endpoint}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': provider.apiKey!,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model,
                max_tokens: maxTokens,
                messages: [
                    { role: 'user', content: request.prompt }
                ]
            })
        })

        if (!response.ok) {
            throw new Error(`Anthropic API エラー: ${response.status}`)
        }

        const data = await response.json()
        const duration = Date.now() - startTime

        return {
            id: generateResponseId(),
            requestId: request.id,
            content: data.content[0].text,
            model,
            usage: {
                promptTokens: data.usage.input_tokens,
                completionTokens: data.usage.output_tokens,
                totalTokens: data.usage.input_tokens + data.usage.output_tokens
            },
            confidence: 0.85,
            timestamp: Date.now(),
            duration
        }
    }

    // Google リクエスト実行
    const executeGoogleRequest = async (
        request: AIRequest,
        provider: AIProvider,
        startTime: number
    ): Promise<AIResponse> => {
        const model = request.options?.model || 'gemini-pro'

        const response = await fetch(`${provider.endpoint}/models/${model}:generateContent?key=${provider.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: request.prompt }
                        ]
                    }
                ]
            })
        })

        if (!response.ok) {
            throw new Error(`Google AI API エラー: ${response.status}`)
        }

        const data = await response.json()
        const duration = Date.now() - startTime

        return {
            id: generateResponseId(),
            requestId: request.id,
            content: data.candidates[0].content.parts[0].text,
            model,
            usage: {
                promptTokens: 0, // Google AIはトークン数を返さない
                completionTokens: 0,
                totalTokens: 0
            },
            confidence: 0.8,
            timestamp: Date.now(),
            duration
        }
    }

    // 会議要約を生成
    const generateMeetingSummary = async (
        meetingTranscript: string,
        participants: string[],
        duration: number
    ): Promise<MeetingSummary> => {
        const prompt = `
以下の会議の音声転写から要約を作成してください：

参加者: ${participants.join(', ')}
時間: ${duration}分

転写内容:
${meetingTranscript}

以下の形式でJSONとして回答してください：
{
  "title": "会議のタイトル",
  "keyPoints": ["重要なポイント1", "重要なポイント2"],
  "actionItems": [
    {
      "description": "アクション項目",
      "assignee": "担当者",
      "priority": "high|medium|low"
    }
  ],
  "decisions": ["決定事項1", "決定事項2"],
  "nextSteps": ["次のステップ1", "次のステップ2"],
  "sentiment": "positive|neutral|negative",
  "topics": ["トピック1", "トピック2"]
}
`

        const response = await sendRequest('summary', prompt)

        try {
            const summaryData = JSON.parse(response.content)

            return {
                id: generateId(),
                meetingId: generateId(),
                title: summaryData.title,
                participants,
                duration,
                keyPoints: summaryData.keyPoints,
                actionItems: summaryData.actionItems.map((item: any) => ({
                    id: generateId(),
                    description: item.description,
                    assignee: item.assignee,
                    priority: item.priority,
                    status: 'pending' as const
                })),
                decisions: summaryData.decisions,
                nextSteps: summaryData.nextSteps,
                sentiment: summaryData.sentiment,
                topics: summaryData.topics,
                timestamp: Date.now()
            }
        } catch (error) {
            console.error('会議要約の解析エラー:', error)
            throw new Error('会議要約の生成に失敗しました')
        }
    }

    // 生産性分析を実行
    const analyzeProductivity = async (
        userId: string,
        activityData: any,
        period: 'day' | 'week' | 'month'
    ): Promise<ProductivityAnalysis> => {
        const prompt = `
以下のユーザーアクティビティデータを分析して、生産性に関するインサイトを提供してください：

ユーザーID: ${userId}
期間: ${period}
データ: ${JSON.stringify(activityData)}

以下の形式でJSONとして回答してください：
{
  "metrics": {
    "focusTime": 数値（分）,
    "meetingTime": 数値（分）,
    "breakTime": 数値（分）,
    "productivityScore": 数値（0-100）,
    "efficiency": 数値（0-1）,
    "workload": 数値（0-1）
  },
  "insights": ["インサイト1", "インサイト2"],
  "recommendations": ["推奨事項1", "推奨事項2"],
  "trends": [
    {
      "label": "トレンド名",
      "value": 数値,
      "change": 変化率（%）
    }
  ]
}
`

        const response = await sendRequest('analysis', prompt)

        try {
            const analysisData = JSON.parse(response.content)

            return {
                userId,
                period,
                metrics: analysisData.metrics,
                insights: analysisData.insights,
                recommendations: analysisData.recommendations,
                trends: analysisData.trends,
                timestamp: Date.now()
            }
        } catch (error) {
            console.error('生産性分析の解析エラー:', error)
            throw new Error('生産性分析に失敗しました')
        }
    }

    // スマート提案を生成
    const generateSmartSuggestions = async (
        userContext: any,
        currentActivity: string
    ): Promise<SmartSuggestion[]> => {
        const prompt = `
以下のユーザーコンテキストと現在のアクティビティに基づいて、スマートな提案を生成してください：

ユーザーコンテキスト: ${JSON.stringify(userContext)}
現在のアクティビティ: ${currentActivity}

以下の形式でJSONとして回答してください：
[
  {
    "type": "meeting|task|break|optimization|collaboration",
    "title": "提案のタイトル",
    "description": "詳細説明",
    "confidence": 数値（0-1）,
    "impact": "low|medium|high",
    "effort": "low|medium|high",
    "actionable": true|false
  }
]
`

        const response = await sendRequest('generation', prompt)

        try {
            const suggestionsData = JSON.parse(response.content)

            return suggestionsData.map((suggestion: any) => ({
                id: generateId(),
                type: suggestion.type,
                title: suggestion.title,
                description: suggestion.description,
                confidence: suggestion.confidence,
                impact: suggestion.impact,
                effort: suggestion.effort,
                actionable: suggestion.actionable,
                timestamp: Date.now()
            }))
        } catch (error) {
            console.error('スマート提案の解析エラー:', error)
            throw new Error('スマート提案の生成に失敗しました')
        }
    }

    // チャットボット応答を生成
    const generateChatResponse = async (
        message: string,
        context?: string[]
    ): Promise<string> => {
        const contextStr = context ? `\n\n過去のコンテキスト:\n${context.join('\n')}` : ''

        const prompt = `
あなたはバーチャルオフィスのAIアシスタントです。
ユーザーの質問に親切で有用な回答を提供してください。

ユーザーメッセージ: ${message}${contextStr}

自然で親しみやすい日本語で回答してください。
`

        const response = await sendRequest('chat', prompt)
        return response.content
    }

    // 自動最適化を実行
    const performAutoOptimization = async (systemData: any): Promise<string[]> => {
        const prompt = `
以下のシステムデータを分析して、パフォーマンス最適化の提案を行ってください：

${JSON.stringify(systemData)}

最適化提案をJSON配列として回答してください：
["提案1", "提案2", "提案3"]
`

        const response = await sendRequest('analysis', prompt)

        try {
            return JSON.parse(response.content)
        } catch (error) {
            console.error('自動最適化の解析エラー:', error)
            return []
        }
    }

    // ユーティリティ関数
    const generateRequestId = (): string => {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    const generateResponseId = (): string => {
        return `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    const generateId = (): string => {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    // 設定の保存
    const saveSettings = (): void => {
        localStorage.setItem('ai-settings', JSON.stringify(settings))
    }

    // 設定の読み込み
    const loadSettings = (): void => {
        const saved = localStorage.getItem('ai-settings')
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                Object.assign(settings, parsed)
            } catch (error) {
                console.error('AI設定の読み込みエラー:', error)
            }
        }
    }

    // 履歴をクリア
    const clearHistory = (): void => {
        requestHistory.value = []
        responseHistory.value = []
    }

    return {
        // 状態
        isInitialized,
        isProcessing,
        error,
        activeRequests,
        requestHistory,
        responseHistory,
        settings,
        providers,

        // 計算プロパティ
        currentProvider,
        availableModels,
        totalRequests,
        averageResponseTime,

        // メソッド
        sendRequest,
        generateMeetingSummary,
        analyzeProductivity,
        generateSmartSuggestions,
        generateChatResponse,
        performAutoOptimization,
        saveSettings,
        loadSettings,
        clearHistory
    }
}
