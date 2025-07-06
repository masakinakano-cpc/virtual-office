import { ref, reactive, computed } from 'vue'

export interface Position {
    x: number
    y: number
}

export interface AudioSource {
    id: string
    position: Position
    volume: number
    isPlaying: boolean
    audioContext?: AudioContext
    sourceNode?: AudioBufferSourceNode
    gainNode?: GainNode
    pannerNode?: PannerNode
}

export interface SpatialAudioConfig {
    maxDistance: number
    rolloffFactor: number
    coneInnerAngle: number
    coneOuterAngle: number
    coneOuterGain: number
}

export function useSpatialAudio() {
    const audioContext = ref<AudioContext | null>(null)
    const listenerPosition = reactive<Position>({ x: 0, y: 0 })
    const audioSources = reactive<Map<string, AudioSource>>(new Map())

    const config = reactive<SpatialAudioConfig>({
        maxDistance: 500,
        rolloffFactor: 2,
        coneInnerAngle: 60,
        coneOuterAngle: 90,
        coneOuterGain: 0.1
    })

    // Web Audio APIの初期化
    const initializeAudio = async () => {
        try {
            audioContext.value = new (window.AudioContext || (window as any).webkitAudioContext)()

            // AudioContextが suspended状態の場合、ユーザーインタラクションで再開
            if (audioContext.value.state === 'suspended') {
                await audioContext.value.resume()
            }

            // リスナーの設定
            if (audioContext.value.listener) {
                audioContext.value.listener.setPosition(0, 0, 0)
                audioContext.value.listener.setOrientation(0, 0, -1, 0, 1, 0)
            }

            console.log('空間音響システムが初期化されました')
            return true
        } catch (error) {
            console.error('音響システムの初期化に失敗しました:', error)
            return false
        }
    }

    // 音源の追加
    const addAudioSource = (id: string, position: Position, volume: number = 1.0) => {
        if (!audioContext.value) return false

        const source: AudioSource = {
            id,
            position: { ...position },
            volume,
            isPlaying: false
        }

        audioSources.set(id, source)
        console.log(`音源 ${id} を追加しました:`, position)
        return true
    }

    // 音源の削除
    const removeAudioSource = (id: string) => {
        const source = audioSources.get(id)
        if (source) {
            stopAudio(id)
            audioSources.delete(id)
            console.log(`音源 ${id} を削除しました`)
        }
    }

    // 音源の位置更新
    const updateAudioSourcePosition = (id: string, position: Position) => {
        const source = audioSources.get(id)
        if (source) {
            source.position = { ...position }

            // 3D音響の位置を更新
            if (source.pannerNode) {
                source.pannerNode.setPosition(position.x / 100, 0, position.y / 100)
            }
        }
    }

    // リスナー位置の更新
    const updateListenerPosition = (position: Position) => {
        listenerPosition.x = position.x
        listenerPosition.y = position.y

        if (audioContext.value?.listener) {
            audioContext.value.listener.setPosition(position.x / 100, 0, position.y / 100)
        }

        // 全ての音源の音量を距離に基づいて調整
        updateAllAudioVolumes()
    }

    // 距離に基づく音量計算
    const calculateVolumeByDistance = (sourcePosition: Position, listenerPosition: Position): number => {
        const distance = Math.sqrt(
            Math.pow(sourcePosition.x - listenerPosition.x, 2) +
            Math.pow(sourcePosition.y - listenerPosition.y, 2)
        )

        if (distance >= config.maxDistance) return 0

        // 逆二乗法則による音量減衰
        const normalizedDistance = distance / config.maxDistance
        return Math.max(0, 1 - Math.pow(normalizedDistance, config.rolloffFactor))
    }

    // 全ての音源の音量を更新
    const updateAllAudioVolumes = () => {
        audioSources.forEach((source) => {
            if (source.gainNode) {
                const volume = calculateVolumeByDistance(source.position, listenerPosition)
                source.gainNode.gain.setValueAtTime(volume * source.volume, audioContext.value!.currentTime)
            }
        })
    }

    // 音声の再生
    const playAudio = async (id: string) => {
        if (!audioContext.value) return false

        const source = audioSources.get(id)
        if (!source) return false

        try {
            // 既存の音声を停止
            if (source.isPlaying) {
                stopAudio(id)
            }

            // 音声データの取得（デモ用に合成音を使用）
            const audioBuffer = await createSynthAudioBuffer(audioContext.value)

            // AudioBufferSourceNodeの作成
            source.sourceNode = audioContext.value.createBufferSource()
            source.sourceNode.buffer = audioBuffer
            source.sourceNode.loop = true

            // GainNodeの作成
            source.gainNode = audioContext.value.createGain()

            // PannerNodeの作成（3D音響）
            source.pannerNode = audioContext.value.createPanner()
            source.pannerNode.panningModel = 'HRTF'
            source.pannerNode.distanceModel = 'inverse'
            source.pannerNode.refDistance = 1
            source.pannerNode.maxDistance = config.maxDistance
            source.pannerNode.rolloffFactor = config.rolloffFactor
            source.pannerNode.coneInnerAngle = config.coneInnerAngle
            source.pannerNode.coneOuterAngle = config.coneOuterAngle
            source.pannerNode.coneOuterGain = config.coneOuterGain

            // 位置の設定
            source.pannerNode.setPosition(
                source.position.x / 100,
                0,
                source.position.y / 100
            )

            // 音量の設定
            const volume = calculateVolumeByDistance(source.position, listenerPosition)
            source.gainNode.gain.setValueAtTime(volume * source.volume, audioContext.value.currentTime)

            // ノードの接続
            source.sourceNode.connect(source.gainNode)
            source.gainNode.connect(source.pannerNode)
            source.pannerNode.connect(audioContext.value.destination)

            // 再生開始
            source.sourceNode.start()
            source.isPlaying = true

            console.log(`音源 ${id} の再生を開始しました`)
            return true
        } catch (error) {
            console.error(`音源 ${id} の再生に失敗しました:`, error)
            return false
        }
    }

    // 音声の停止
    const stopAudio = (id: string) => {
        const source = audioSources.get(id)
        if (source && source.sourceNode) {
            try {
                source.sourceNode.stop()
                source.sourceNode.disconnect()
                source.sourceNode = undefined
                source.gainNode = undefined
                source.pannerNode = undefined
                source.isPlaying = false
                console.log(`音源 ${id} を停止しました`)
            } catch (error) {
                console.error(`音源 ${id} の停止に失敗しました:`, error)
            }
        }
    }

    // 合成音声の作成（デモ用）
    const createSynthAudioBuffer = async (context: AudioContext): Promise<AudioBuffer> => {
        const sampleRate = context.sampleRate
        const duration = 2 // 2秒
        const frameCount = sampleRate * duration

        const audioBuffer = context.createBuffer(1, frameCount, sampleRate)
        const channelData = audioBuffer.getChannelData(0)

        // 簡単な正弦波を生成
        const frequency = 440 // A4
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.1
        }

        return audioBuffer
    }

    // 環境音の追加
    const addAmbientSound = (id: string, position: Position) => {
        addAudioSource(id, position, 0.3)

        // 環境音を再生
        playAudio(id)

        console.log(`環境音 ${id} を追加しました`)
    }

    // 通知音の再生
    const playNotificationSound = (position: Position) => {
        const id = `notification_${Date.now()}`
        addAudioSource(id, position, 0.5)

        // 通知音を再生
        playAudio(id).then(() => {
            // 3秒後に自動削除
            setTimeout(() => {
                removeAudioSource(id)
            }, 3000)
        })
    }

    // 音響設定の更新
    const updateConfig = (newConfig: Partial<SpatialAudioConfig>) => {
        Object.assign(config, newConfig)
        console.log('音響設定を更新しました:', config)
    }

    // 現在の音響状態
    const audioState = computed(() => ({
        isInitialized: audioContext.value !== null,
        listenerPosition: listenerPosition,
        activeSourcesCount: Array.from(audioSources.values()).filter(s => s.isPlaying).length,
        totalSourcesCount: audioSources.size
    }))

    return {
        // 状態
        audioState,
        listenerPosition,
        audioSources,
        config,

        // メソッド
        initializeAudio,
        addAudioSource,
        removeAudioSource,
        updateAudioSourcePosition,
        updateListenerPosition,
        playAudio,
        stopAudio,
        addAmbientSound,
        playNotificationSound,
        updateConfig,
        calculateVolumeByDistance
    }
}
