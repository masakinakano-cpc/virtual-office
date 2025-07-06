// echo-cancellation-processor.js

class EchoCancellationProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.bufferSize = 1024;
        this.delayBuffer = new Float32Array(this.bufferSize);
        this.bufferIndex = 0;
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];

        if (input.length > 0) {
            for (let ch = 0; ch < input.length; ch++) {
                const inputChannel = input[ch];
                const outputChannel = output[ch];

                for (let i = 0; i < inputChannel.length; i++) {
                    // 簡易的なエコー除去処理（今後改良予定）
                    // 現在は遅延バッファを使った基本的な処理
                    const currentSample = inputChannel[i];
                    const delayedSample = this.delayBuffer[this.bufferIndex];

                    // エコー除去（適応フィルタリングなどを今後実装）
                    outputChannel[i] = currentSample - (delayedSample * 0.3);

                    // バッファ更新
                    this.delayBuffer[this.bufferIndex] = currentSample;
                    this.bufferIndex = (this.bufferIndex + 1) % this.bufferSize;
                }
            }
        }

        return true;
    }
}

registerProcessor('echo-cancellation-processor', EchoCancellationProcessor);
