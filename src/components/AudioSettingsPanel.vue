<template>
  <div class="audio-settings-panel">
    <h3>音声設定</h3>
    <div v-if="props.audioManager" class="settings-content">
      <div class="setting-item">
        <label for="noiseSuppressionSwitch">ノイズ抑制</label>
        <input type="checkbox" id="noiseSuppressionSwitch" v-model="noiseSuppression" @change="onNoiseSuppressionChange" />
      </div>
      <div class="setting-item">
        <label for="echoCancellationSwitch">エコー除去</label>
        <input type="checkbox" id="echoCancellationSwitch" v-model="echoCancellation" @change="onEchoCancellationChange" />
      </div>
      <!-- 他の音声設定項目もここに追加可能 -->
    </div>
    <div v-else class="loading-state">
      <p>音声設定を読み込み中...</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import type { IAudioManager } from './AudioManager';

const props = defineProps<{ audioManager: IAudioManager | null }>();
const noiseSuppression = ref(true);
const echoCancellation = ref(true);

const onNoiseSuppressionChange = () => {
  if (props.audioManager) {
    props.audioManager.setNoiseSuppression(noiseSuppression.value);
  }
};

const onEchoCancellationChange = () => {
  if (props.audioManager) {
    props.audioManager.setEchoCancellation(echoCancellation.value);
  }
};

// 初期値反映
watch(
  () => props.audioManager,
  (manager) => {
    if (manager) {
      // AudioManagerの初期化が完了したら、デフォルト値を設定
      noiseSuppression.value = true;
      echoCancellation.value = true;
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.audio-settings-panel {
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  width: 300px;
}
.setting-item {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.loading-state {
  text-align: center;
  color: #666;
  padding: 20px;
}
</style>
