<template>
  <div class="relative">
    <!-- Tooltip Wrapper -->
    <div
      class="group relative"
      @mouseenter="showTooltip = true"
      @mouseleave="showTooltip = false"
    >
      <!-- Copy Button -->
      <button
        @click="handleCopy"
        :disabled="disabled || !url"
        :class="[
          'p-2 rounded-lg transition-colors',
          disabled || !url
            ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
            : 'bg-gray-50 text-gray-600 hover:bg-gray-200 hover:text-blue-600'
        ]"
        :aria-label="tooltipText"
      >
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      </button>

      <!-- Tooltip -->
      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0 translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-1"
      >
        <div
          v-if="showTooltip && !disabled && url"
          class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-10"
        >
          {{ tooltipText }}
          <!-- Tooltip Arrow -->
          <div class="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      </Transition>
    </div>

    <!-- Success Message -->
    <Transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="showSuccess"
        class="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-green-500 text-white text-sm rounded-md shadow-lg z-20"
      >
        {{ successMessage }}
      </div>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';

export interface CopyButtonProps {
  url?: string;
  disabled?: boolean;
  tooltipText?: string;
  successMessage?: string;
}

const props = withDefaults(defineProps<CopyButtonProps>(), {
  url: '',
  disabled: false,
  tooltipText: 'Copy URL to clipboard',
  successMessage: 'URL copied to clipboard!',
});

const emit = defineEmits<{
  'copy': [url: string];
  'copy-success': [url: string];
  'copy-error': [error: Error];
}>();

// State
const showTooltip = ref(false);
const showSuccess = ref(false);

// Computed
const tooltipText = computed(() => {
  return props.tooltipText || 'Copy URL to clipboard';
});

// Methods
const handleCopy = async () => {
  if (!props.url || props.disabled) return;

  try {
    // Use the modern Clipboard API
    await navigator.clipboard.writeText(props.url);

    emit('copy', props.url);
    emit('copy-success', props.url);

    // Show success message
    showSuccess.value = true;
    setTimeout(() => {
      showSuccess.value = false;
    }, 2000);

  } catch (error) {
    console.error('Failed to copy URL:', error);

    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = props.url;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        emit('copy', props.url);
        emit('copy-success', props.url);

        showSuccess.value = true;
        setTimeout(() => {
          showSuccess.value = false;
        }, 2000);
      } else {
        throw new Error('Copy command failed');
      }
    } catch (fallbackError) {
      emit('copy-error', fallbackError as Error);
    }
  }
};
</script>
