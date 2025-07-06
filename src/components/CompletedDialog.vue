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
            class="absolute top-2 right-2 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            :aria-label="closeAriaLabel"
          >
            <slot name="closeIcon">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </slot>
          </button>

          <!-- Icon -->
          <div v-if="icon || $slots.icon" :class="iconClasses">
            <slot name="icon">
              <component :is="icon" v-if="typeof icon === 'object'" />
              <span v-else class="text-4xl">{{ icon }}</span>
            </slot>
          </div>

          <!-- Title -->
          <h2
            v-if="title || $slots.title"
            :id="titleId"
            :class="titleClasses"
          >
            <slot name="title">{{ title }}</slot>
          </h2>

          <!-- Description -->
          <div
            v-if="description || $slots.description"
            :id="descriptionId"
            :class="descriptionClasses"
          >
            <slot name="description">
              <p>{{ description }}</p>
            </slot>
          </div>

          <!-- Content Slot -->
          <div v-if="$slots.default" class="mt-4">
            <slot />
          </div>

          <!-- Actions -->
          <div v-if="buttonLabel || $slots.actions" :class="actionsClasses">
            <slot name="actions">
              <button
                v-if="buttonLabel"
                @click="handleButtonClick"
                :class="buttonClasses"
                :disabled="buttonDisabled"
                data-testid="complete-button"
              >
                {{ buttonLabel }}
              </button>
            </slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';

export interface CompletedDialogProps {
  modelValue?: boolean;
  title?: string;
  description?: string;
  buttonLabel?: string;
  buttonDisabled?: boolean;
  icon?: string | object;
  size?: 'small' | 'medium' | 'large';
  textAlign?: 'left' | 'center' | 'right';
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  closeAriaLabel?: string;
  persistent?: boolean;
}

const props = withDefaults(defineProps<CompletedDialogProps>(), {
  modelValue: false,
  size: 'medium',
  textAlign: 'center',
  showCloseButton: true,
  closeOnBackdrop: true,
  closeOnEscape: true,
  closeAriaLabel: 'Close dialog',
  buttonLabel: 'OK',
  buttonDisabled: false,
  persistent: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'close': [reason: 'backdrop' | 'escape' | 'button' | 'close-button'];
  'button-click': [];
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
    'relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6',
    'transform transition-all duration-300 ease-out',
  ];

  // Size classes
  switch (props.size) {
    case 'small':
      classes.push('max-w-sm');
      break;
    case 'large':
      classes.push('max-w-lg');
      break;
    default:
      classes.push('max-w-md');
  }

  return classes;
});

const iconClasses = computed(() => {
  const classes = ['flex justify-center mb-4'];

  if (props.textAlign === 'left') {
    classes.push('justify-start');
  } else if (props.textAlign === 'right') {
    classes.push('justify-end');
  }

  return classes;
});

const titleClasses = computed(() => {
  const classes = [
    'text-xl font-semibold text-gray-900 mb-2',
  ];

  switch (props.textAlign) {
    case 'left':
      classes.push('text-left');
      break;
    case 'right':
      classes.push('text-right');
      break;
    default:
      classes.push('text-center');
  }

  return classes;
});

const descriptionClasses = computed(() => {
  const classes = [
    'text-gray-600 mb-6',
  ];

  switch (props.textAlign) {
    case 'left':
      classes.push('text-left');
      break;
    case 'right':
      classes.push('text-right');
      break;
    default:
      classes.push('text-center');
  }

  return classes;
});

const actionsClasses = computed(() => {
  const classes = ['flex gap-2'];

  switch (props.textAlign) {
    case 'left':
      classes.push('justify-start');
      break;
    case 'right':
      classes.push('justify-end');
      break;
    default:
      classes.push('justify-center');
  }

  return classes;
});

const buttonClasses = computed(() => {
  return [
    'px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-500',
    'transition-colors duration-200',
  ];
});

// Methods
const handleClose = (reason: 'backdrop' | 'escape' | 'button' | 'close-button' = 'close-button') => {
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

const handleButtonClick = () => {
  emit('button-click');
  handleClose('button');
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
  // Focus the dialog for accessibility
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
  close: (reason?: 'backdrop' | 'escape' | 'button' | 'close-button') => {
    handleClose(reason);
  },
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
