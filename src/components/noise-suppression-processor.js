// noise-suppression-processor.js

class NoiseSuppressionProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
    }

    process(inputs, outputs, parameters) {
        // 入力: inputs[0][ch]
        // 出力: outputs[0][ch]
        // 今は単純に入力をそのまま出力（今後ノイズ抑制アルゴリズムを追加）
        const input = inputs[0];
        const output = outputs[0];
        for (let ch = 0; ch < input.length; ch++) {
            for (let i = 0; i < input[ch].length; i++) {
                output[ch][i] = input[ch][i];
            }
        }
        return true;
    }
}

registerProcessor('noise-suppression-processor', NoiseSuppressionProcessor);
