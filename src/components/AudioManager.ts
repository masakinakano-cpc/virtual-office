// AudioManager.ts
// 音声処理の基盤クラス（TypeScript）

export interface IAudioManager {
    initialize(): Promise<boolean>;
    getProcessedStream(): MediaStream | null;
    cleanup(): void;
    setNoiseSuppression(enabled: boolean): Promise<void>;
    setEchoCancellation(enabled: boolean): Promise<void>;
}

export class AudioManager implements IAudioManager {
    private audioContext: AudioContext | null = null;
    private localStream: MediaStream | null = null;
    private sourceNode: MediaStreamAudioSourceNode | null = null;
    private destinationNode: MediaStreamAudioDestinationNode | null = null;
    private isInitialized: boolean = false;
    private noiseCancelNode: AudioWorkletNode | null = null;
    private echoCancelNode: AudioWorkletNode | null = null;
    private noiseSuppressionEnabled: boolean = true;
    private echoCancellationEnabled: boolean = true;

    constructor() { }

    /**
     * 音声デバイスの初期化
     */
    public async initialize(): Promise<boolean> {
        try {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true, // エコー除去
                    noiseSuppression: true, // ノイズ抑制
                    autoGainControl: true,  // 自動ゲイン
                },
            });
            this.sourceNode = this.audioContext.createMediaStreamSource(this.localStream);
            this.destinationNode = this.audioContext.createMediaStreamDestination();

            // AudioWorklet（ノイズサプレッション）をロード
            await this.audioContext.audioWorklet.addModule('src/components/noise-suppression-processor.js');
            this.noiseCancelNode = new AudioWorkletNode(this.audioContext, 'noise-suppression-processor');

            // AudioWorklet（エコー除去）をロード
            await this.audioContext.audioWorklet.addModule('src/components/echo-cancellation-processor.js');
            this.echoCancelNode = new AudioWorkletNode(this.audioContext, 'echo-cancellation-processor');

            // 音声処理チェーンを構築
            this.buildAudioChain();

            this.isInitialized = true;
            return true;
        } catch (e) {
            console.error('AudioManager initialize error:', e);
            return false;
        }
    }

    /**
     * 音声処理チェーンを構築
     */
    private buildAudioChain() {
        if (!this.sourceNode || !this.destinationNode) return;

        // 既存の接続を切断
        this.sourceNode.disconnect();
        if (this.noiseCancelNode) this.noiseCancelNode.disconnect();
        if (this.echoCancelNode) this.echoCancelNode.disconnect();

        let currentNode: AudioNode = this.sourceNode;

        // ノイズ抑制
        if (this.noiseSuppressionEnabled && this.noiseCancelNode) {
            currentNode.connect(this.noiseCancelNode);
            currentNode = this.noiseCancelNode;
        }

        // エコー除去
        if (this.echoCancellationEnabled && this.echoCancelNode) {
            currentNode.connect(this.echoCancelNode);
            currentNode = this.echoCancelNode;
        }

        // 最終出力
        currentNode.connect(this.destinationNode);
    }

    /**
     * 取得した音声ストリームを返す
     */
    public getProcessedStream(): MediaStream | null {
        if (!this.isInitialized || !this.destinationNode) return null;
        return this.destinationNode.stream;
    }

    /**
     * クリーンアップ
     */
    public cleanup() {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
        this.audioContext = null;
        this.localStream = null;
        this.sourceNode = null;
        this.destinationNode = null;
        this.isInitialized = false;
    }

    /**
     * ノイズキャンセリングON/OFF
     */
    public async setNoiseSuppression(enabled: boolean) {
        this.noiseSuppressionEnabled = enabled;
        this.buildAudioChain();
    }

    /**
     * エコー除去ON/OFF
     */
    public async setEchoCancellation(enabled: boolean) {
        this.echoCancellationEnabled = enabled;
        this.buildAudioChain();
    }
}
