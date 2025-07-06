<template>
  <div class="creative-interactions">
    <!-- 楽しいボタン群 -->
    <div class="fun-buttons">
      <button
        class="btn-creative bounce-on-hover"
        @click="triggerConfetti"
      >
        🎉 Confetti!
      </button>

      <button
        class="btn-creative wiggle-on-hover"
        @click="playSound"
      >
        🔊 Sound
      </button>

      <button
        class="btn-creative pulse-creative"
        @click="changeTheme"
      >
        🌈 Theme
      </button>
    </div>

    <!-- 浮遊する要素 -->
    <div class="floating-elements">
      <div
        v-for="(emoji, index) in floatingEmojis"
        :key="index"
        class="floating-emoji"
        :style="{
          left: emoji.x + '%',
          top: emoji.y + '%',
          animationDelay: emoji.delay + 's'
        }"
      >
        {{ emoji.emoji }}
      </div>
    </div>

    <!-- インタラクティブなカード -->
    <div class="interactive-cards">
      <div
        v-for="(card, index) in interactiveCards"
        :key="index"
        class="interactive-card"
        :class="{ 'flipped': card.flipped }"
        @click="flipCard(index)"
      >
        <div class="card-front">
          <div class="card-emoji">{{ card.frontEmoji }}</div>
          <div class="card-text">{{ card.frontText }}</div>
        </div>
        <div class="card-back">
          <div class="card-emoji">{{ card.backEmoji }}</div>
          <div class="card-text">{{ card.backText }}</div>
        </div>
      </div>
    </div>

    <!-- 進捗バー（楽しいスタイル） -->
    <div class="fun-progress">
      <div class="progress-label">楽しさレベル: {{ funLevel }}%</div>
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: funLevel + '%' }"
        ></div>
        <div class="progress-emoji" :style="{ left: funLevel + '%' }">
          🚀
        </div>
      </div>
    </div>

    <!-- カラフルなパーティクル -->
    <div class="particles" v-if="showParticles">
      <div
        v-for="(particle, index) in particles"
        :key="index"
        class="particle"
        :style="{
          left: particle.x + 'px',
          top: particle.y + 'px',
          backgroundColor: particle.color,
          animationDelay: particle.delay + 's'
        }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// 浮遊する絵文字
const floatingEmojis = ref([
  { emoji: '✨', x: 10, y: 20, delay: 0 },
  { emoji: '🎈', x: 80, y: 15, delay: 1 },
  { emoji: '🌟', x: 15, y: 70, delay: 2 },
  { emoji: '🎨', x: 85, y: 60, delay: 3 },
  { emoji: '🚀', x: 50, y: 10, delay: 4 },
  { emoji: '💫', x: 70, y: 80, delay: 5 },
])

// インタラクティブなカード
const interactiveCards = ref([
  {
    frontEmoji: '🎯',
    frontText: 'クリック',
    backEmoji: '🎉',
    backText: '成功！',
    flipped: false
  },
  {
    frontEmoji: '🎲',
    frontText: 'ランダム',
    backEmoji: '🍀',
    backText: 'ラッキー！',
    flipped: false
  },
  {
    frontEmoji: '🎪',
    frontText: '楽しい',
    backEmoji: '🎭',
    backText: '最高！',
    flipped: false
  },
  {
    frontEmoji: '🎨',
    frontText: 'クリエイティブ',
    backEmoji: '🌈',
    backText: '素晴らしい！',
    flipped: false
  }
])

// 楽しさレベル
const funLevel = ref(0)

// パーティクル
const showParticles = ref(false)
const particles = ref<Array<{x: number, y: number, color: string, delay: number}>>([])

// 楽しさレベルのアニメーション
let funLevelInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  // 楽しさレベルを徐々に上げる
  funLevelInterval = setInterval(() => {
    if (funLevel.value < 100) {
      funLevel.value += Math.random() * 5
      if (funLevel.value > 100) funLevel.value = 100
    }
  }, 200)
})

onUnmounted(() => {
  if (funLevelInterval) {
    clearInterval(funLevelInterval)
  }
})

// カードをフリップ
const flipCard = (index: number) => {
  interactiveCards.value[index].flipped = !interactiveCards.value[index].flipped

  // 楽しさレベルを上げる
  funLevel.value = Math.min(100, funLevel.value + 10)
}

// 紙吹雪効果
const triggerConfetti = () => {
  showParticles.value = true

  // パーティクルを生成
  particles.value = []
  const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#a8e6cf', '#ff8b94']

  for (let i = 0; i < 50; i++) {
    particles.value.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 2
    })
  }

  // 楽しさレベルを上げる
  funLevel.value = Math.min(100, funLevel.value + 20)

  // 3秒後にパーティクルを非表示
  setTimeout(() => {
    showParticles.value = false
  }, 3000)
}

// 音を鳴らす（Web Audio API）
const playSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime) // C5
    oscillator.frequency.exponentialRampToValueAtTime(1046.5, audioContext.currentTime + 0.1) // C6

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.3)

    // 楽しさレベルを上げる
    funLevel.value = Math.min(100, funLevel.value + 15)
  } catch (error) {
    console.log('音声再生がサポートされていません')
  }
}

// テーマを変更
const changeTheme = () => {
  const themes = [
    { primary: '#ff6b6b', secondary: '#4ecdc4' },
    { primary: '#a8e6cf', secondary: '#ff8b94' },
    { primary: '#ffd93d', secondary: '#6c5ce7' },
    { primary: '#fd79a8', secondary: '#fdcb6e' },
  ]

  const randomTheme = themes[Math.floor(Math.random() * themes.length)]

  document.documentElement.style.setProperty('--color-primary', randomTheme.primary)
  document.documentElement.style.setProperty('--color-secondary', randomTheme.secondary)

  // 楽しさレベルを上げる
  funLevel.value = Math.min(100, funLevel.value + 25)
}
</script>

<style scoped>
.creative-interactions {
  padding: var(--spacing-6);
  position: relative;
  overflow: hidden;
}

.fun-buttons {
  display: flex;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-8);
  flex-wrap: wrap;
  justify-content: center;
}

.floating-elements {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.floating-emoji {
  position: absolute;
  font-size: 2rem;
  animation: float 6s ease-in-out infinite;
  opacity: 0.7;
}

.interactive-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-8);
  perspective: 1000px;
}

.interactive-card {
  position: relative;
  width: 100%;
  height: 120px;
  cursor: pointer;
  transform-style: preserve-3d;
  transition: transform 0.6s;
}

.interactive-card.flipped {
  transform: rotateY(180deg);
}

.card-front,
.card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: var(--radius-xl);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
  transition: var(--transition-normal);
}

.card-front {
  background: var(--bg-creative);
  color: white;
}

.card-back {
  background: var(--bg-playful);
  color: white;
  transform: rotateY(180deg);
}

.card-emoji {
  font-size: 2rem;
  margin-bottom: var(--spacing-2);
}

.card-text {
  font-weight: 600;
  font-size: var(--text-sm);
}

.fun-progress {
  margin-bottom: var(--spacing-8);
}

.progress-label {
  font-weight: 600;
  margin-bottom: var(--spacing-2);
  color: var(--color-gray-700);
  text-align: center;
}

.progress-bar {
  position: relative;
  height: 20px;
  background: var(--color-gray-200);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: shimmer 2s infinite;
}

.progress-emoji {
  position: absolute;
  top: -5px;
  transform: translateX(-50%);
  font-size: 1.5rem;
  transition: left 0.3s ease;
}

.particles {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
}

.particle {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: fall 3s ease-in forwards;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@keyframes fall {
  0% {
    transform: translateY(-100px) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(360deg);
    opacity: 0;
  }
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
  .fun-buttons {
    flex-direction: column;
    align-items: center;
  }

  .interactive-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .floating-emoji {
    font-size: 1.5rem;
  }
}
</style>
