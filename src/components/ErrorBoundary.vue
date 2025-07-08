<template>
  <div class="error-boundary">
    <div v-if="hasError" class="error-display">
      <div class="error-icon">⚠️</div>
      <div class="error-content">
        <h2>エラーが発生しました</h2>
        <p v-if="showErrorDetails && errorInfo">{{ errorInfo }}</p>
        <p v-else>申し訳ございませんが、予期しないエラーが発生しました。</p>
        <button @click="handleRetry" class="retry-button">
          再試行
        </button>
      </div>
    </div>
    <slot v-else />
  </div>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'

interface Props {
  logErrors?: boolean
  showErrorDetails?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  logErrors: true,
  showErrorDetails: false
})

const emit = defineEmits<{
  retry: []
}>()

const hasError = ref(false)
const errorInfo = ref('')

onErrorCaptured((error: Error, instance, info) => {
  hasError.value = true
  errorInfo.value = error.message || 'Unknown error'

  if (props.logErrors) {
    console.error('ErrorBoundary caught an error:', error)
    console.error('Component info:', info)
    console.error('Instance:', instance)
  }

  return false
})

const handleRetry = () => {
  hasError.value = false
  errorInfo.value = ''
  emit('retry')
}
</script>

<style scoped>
.error-boundary {
  width: 100%;
  height: 100%;
}

.error-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 2rem;
  text-align: center;
  background: #f8f9fa;
  border-radius: 8px;
  margin: 1rem;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.error-content h2 {
  color: #dc3545;
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.error-content p {
  color: #6c757d;
  margin-bottom: 1.5rem;
  max-width: 500px;
}

.retry-button {
  background: #007bff;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.retry-button:hover {
  background: #0056b3;
}
</style>
