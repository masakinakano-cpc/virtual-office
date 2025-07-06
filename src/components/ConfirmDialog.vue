<template>
  <Teleport to="body">
    <Transition
      name="dialog"
      @enter="onEnter"
      @after-enter="onAfterEnter"
      @leave="onLeave"
      @after-leave="onAfterLeave"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center"
        @click="handleBackdropClick"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black bg-opacity-50 transition-opacity" />

        <!-- Dialog -->
        <div
          ref="dialogRef"
          :class="dialogClasses"
          :style="dialogStyle"
          @click.stop
          role="dialog"
          :aria-labelledby="titleId"
          :aria-describedby="descriptionId"
          aria-modal="true"
        >
          <!-- Close Button -->
          <button
            v-if="showCloseButton"
            @click="() => handleClose('close-button')"
            class="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            :aria-label="closeAriaLabel"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <!-- Title -->
          <h2
            v-if="title || $slots.title"
            :id="titleId"
            :class="titleClasses"
          >
            <slot name="title">{{ title }}</slot>
          </h2>

          <!-- Border -->
          <div
            v-if="showBorder"
            class="h-px bg-gray-200 mb-5"
          />

          <!-- Description -->
          <div
            v-if="description || $slots.description"
            :id="descriptionId"
            :class="descriptionClasses"
          >
            <slot name="description">
              <p class="whitespace-pre-wrap">{{ description }}</p>
            </slot>
          </div>

          <!-- Content -->
          <div v-if="$slots.default" :class="contentClasses">
            <slot />

            <!-- Counter -->
            <div
              v-if="totalCount !== undefined && limit !== undefined"
              class="text-right text-sm text-gray-600 mt-2"
            >
              {{ totalCount }} / {{ limit }}
            </div>
          </div>

          <!-- Actions -->
          <div :class="actionsClasses">
            <!-- Cancel Button -->
            <button
              v-if="cancelLabel"
              @click="handleCancel"
              :class="cancelButtonClasses"
              :disabled="cancelButtonDisabled"
              data-testid="cancel-button"
            >
              {{ cancelLabel }}
            </button>

            <!-- Confirm Button -->
            <button
              @click="handleConfirm"
              :class="confirmButtonClasses"
              :disabled="confirmButtonDisabled"
              data-testid="confirm-button"
            >
              {{ confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';

export interface ConfirmDialogProps {
  modelValue?: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'normal' | 'error' | 'warning' | 'success';
  size?: 'small' | 'medium' | 'large';
  width?: string;
  showBorder?: boolean;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  closeAriaLabel?: string;
  confirmButtonDisabled?: boolean;
  cancelButtonDisabled?: boolean;
  totalCount?: number;
  limit?: number;
  revampedUI?: boolean;
  persistent?: boolean;
}

const props = withDefaults(defineProps<ConfirmDialogProps>(), {
  modelValue: false,
  size: 'medium',
  variant: 'normal',
  showBorder: false,
  showCloseButton: false,
  closeOnBackdrop: true,
  closeOnEscape: true,
  closeAriaLabel: 'Close dialog',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  confirmButtonDisabled: false,
  cancelButtonDisabled: false,
  revampedUI: false,
  persistent: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'confirm': [];
  'cancel': [];
  'close': [reason: 'backdrop' | 'escape' | 'close-button'];
  'open': [];
  'opened': [];
  'closed': [];
}>();

// Refs
const dialogRef = ref<HTMLElement>();
const isOpen = ref(props.modelValue);

// Computed
const titleId = computed(() => `dialog-title-${Math.random().toString(36).substr(2, 9)}`);
const descriptionId = computed(() => `dialog-description-${Math.random().toString(36).substr(2, 9)}`);

const dialogClasses = computed(() => {
  const classes = [
    'relative bg-white rounded-2xl shadow-xl w-full mx-4 p-10',
    'transform transition-all duration-300 ease-out',
  ];

  // Size classes
  switch (props.size) {
    case 'small':
      classes.push('max-w-sm');
      break;
    case 'large':
      classes.push('max-w-2xl');
      break;
    default:
      classes.push('max-w-md');
  }

  return classes;
});

const dialogStyle = computed(() => {
  const style: Record<string, string> = {};

  if (props.width) {
    style.width = props.width;
    style.maxWidth = 'none';
  }

  return style;
});

const titleClasses = computed(() => {
  return [
    'text-2xl font-medium text-gray-900 mb-5',
  ];
});

const descriptionClasses = computed(() => {
  return [
    'text-gray-600 text-base font-normal mb-6',
  ];
});

const contentClasses = computed(() => {
  return [
    'mb-6',
  ];
});

const actionsClasses = computed(() => {
  return [
    'flex justify-end gap-0 mt-6',
  ];
});

const cancelButtonClasses = computed(() => {
  return [
    'min-w-[110px] px-4 py-2 bg-white text-blue-700 border border-blue-700 rounded',
    'hover:bg-blue-700 hover:text-white hover:border-blue-700',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'transition-colors duration-200',
    'mr-2',
  ];
});

const confirmButtonClasses = computed(() => {
  const baseClasses = [
    'min-w-[110px] px-4 py-2 rounded',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'transition-colors duration-200',
  ];

  if (props.variant === 'error') {
    baseClasses.push(
      'bg-transparent text-red-600 hover:bg-red-50',
      'focus:ring-red-500'
    );
  } else if (props.revampedUI) {
    baseClasses.push(
      'bg-cyan-400 text-gray-900 hover:bg-cyan-600',
      'focus:ring-cyan-500'
    );
  } else {
    // Default/normal variant
    baseClasses.push(
      'bg-red-500 text-white hover:bg-red-600',
      'focus:ring-red-500'
    );
  }

  return baseClasses;
});

// Methods
const handleClose = (reason: 'backdrop' | 'escape' | 'close-button' = 'close-button') => {
  if (props.persistent && (reason === 'backdrop' || reason === 'escape')) {
    return;
  }

  isOpen.value = false;
  emit('update:modelValue', false);
  emit('close', reason);
};

const handleBackdropClick = () => {
  if (props.closeOnBackdrop) {
    handleClose('backdrop');
  }
};

const handleConfirm = () => {
  if (props.confirmButtonDisabled) return;

  emit('confirm');
  isOpen.value = false;
  emit('update:modelValue', false);
};

const handleCancel = () => {
  if (props.cancelButtonDisabled) return;

  emit('cancel');
  isOpen.value = false;
  emit('update:modelValue', false);
};

const handleEscapeKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.closeOnEscape && isOpen.value) {
    handleClose('escape');
  }
};

// Transition handlers
const onEnter = () => {
  emit('open');
  document.body.style.overflow = 'hidden';
};

const onAfterEnter = () => {
  emit('opened');
  nextTick(() => {
    dialogRef.value?.focus();
  });
};

const onLeave = () => {
  // Animation start
};

const onAfterLeave = () => {
  document.body.style.overflow = '';
  emit('closed');
};

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  isOpen.value = newValue;
});

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleEscapeKey);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscapeKey);
  document.body.style.overflow = '';
});

// Expose methods
defineExpose({
  open: () => {
    isOpen.value = true;
    emit('update:modelValue', true);
  },
  close: (reason?: 'backdrop' | 'escape' | 'close-button') => {
    handleClose(reason);
  },
  confirm: handleConfirm,
  cancel: handleCancel,
  isOpen: computed(() => isOpen.value),
});
</script>

<style scoped>
/* Dialog transitions */
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.3s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-active .relative,
.dialog-leave-active .relative {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.dialog-enter-from .relative,
.dialog-leave-to .relative {
  transform: scale(0.9) translateY(-10px);
  opacity: 0;
}
</style>
