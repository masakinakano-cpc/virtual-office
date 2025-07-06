<template>
  <component
    :is="component"
    :class="chipClasses"
    :disabled="disabled && (clickable || deletable)"
    :tabindex="tabIndex"
    @click="handleClick"
    @keydown="handleKeyDown"
    @keyup="handleKeyUp"
    ref="chipRef"
  >
    <!-- Avatar -->
    <div
      v-if="avatar"
      :class="avatarClasses"
    >
      <slot name="avatar" :avatar="avatar">
        <img
          v-if="typeof avatar === 'string'"
          :src="avatar"
          :alt="label"
          class="w-full h-full object-cover"
        />
        <span v-else class="text-xs font-medium">
          {{ getAvatarText(avatar) }}
        </span>
      </slot>
    </div>

    <!-- Icon -->
    <div
      v-else-if="icon"
      :class="iconClasses"
    >
      <slot name="icon" :icon="icon">
        <component :is="icon" v-if="typeof icon === 'object'" />
        <span v-else>{{ icon }}</span>
      </slot>
    </div>

    <!-- Label -->
    <span :class="labelClasses">
      <slot>{{ label }}</slot>
    </span>

    <!-- Delete Icon -->
    <button
      v-if="deletable && !disabled"
      :class="deleteIconClasses"
      @click="handleDelete"
      @keydown.stop
      type="button"
      :aria-label="deleteAriaLabel"
    >
      <slot name="deleteIcon">
        <svg
          class="w-full h-full"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
        </svg>
      </slot>
    </button>
  </component>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';

export interface ChipProps {
  label?: string;
  size?: 'small' | 'medium';
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  variant?: 'filled' | 'outlined';
  avatar?: string | { name?: string; src?: string; color?: string };
  icon?: string | object;
  deletable?: boolean;
  clickable?: boolean;
  disabled?: boolean;
  component?: string;
  deleteAriaLabel?: string;
  skipFocusWhenDisabled?: boolean;
}

const props = withDefaults(defineProps<ChipProps>(), {
  size: 'medium',
  color: 'default',
  variant: 'filled',
  deletable: false,
  clickable: false,
  disabled: false,
  component: 'div',
  deleteAriaLabel: 'Delete',
  skipFocusWhenDisabled: false,
});

const emit = defineEmits<{
  click: [event: MouseEvent];
  delete: [event: MouseEvent];
  keydown: [event: KeyboardEvent];
  keyup: [event: KeyboardEvent];
}>();

const chipRef = ref<HTMLElement>();

// Computed Classes
const chipClasses = computed(() => {
  const classes = [
    'inline-flex items-center justify-center font-medium transition-all duration-200',
    'border-0 outline-none cursor-default select-none',
  ];

  // Size classes
  if (props.size === 'small') {
    classes.push('h-6 text-xs rounded-full');
  } else {
    classes.push('h-8 text-sm rounded-full');
  }

  // Color and variant classes
  if (props.variant === 'outlined') {
    classes.push('bg-transparent border');

    switch (props.color) {
      case 'primary':
        classes.push('border-blue-500 text-blue-600');
        if (props.clickable) classes.push('hover:bg-blue-50');
        break;
      case 'secondary':
        classes.push('border-purple-500 text-purple-600');
        if (props.clickable) classes.push('hover:bg-purple-50');
        break;
      case 'success':
        classes.push('border-green-500 text-green-600');
        if (props.clickable) classes.push('hover:bg-green-50');
        break;
      case 'warning':
        classes.push('border-orange-500 text-orange-600');
        if (props.clickable) classes.push('hover:bg-orange-50');
        break;
      case 'error':
        classes.push('border-red-500 text-red-600');
        if (props.clickable) classes.push('hover:bg-red-50');
        break;
      case 'info':
        classes.push('border-cyan-500 text-cyan-600');
        if (props.clickable) classes.push('hover:bg-cyan-50');
        break;
      default:
        classes.push('border-gray-300 text-gray-700');
        if (props.clickable) classes.push('hover:bg-gray-50');
    }
  } else {
    // Filled variant
    switch (props.color) {
      case 'primary':
        classes.push('bg-blue-500 text-white');
        if (props.clickable) classes.push('hover:bg-blue-600');
        break;
      case 'secondary':
        classes.push('bg-purple-500 text-white');
        if (props.clickable) classes.push('hover:bg-purple-600');
        break;
      case 'success':
        classes.push('bg-green-500 text-white');
        if (props.clickable) classes.push('hover:bg-green-600');
        break;
      case 'warning':
        classes.push('bg-orange-500 text-white');
        if (props.clickable) classes.push('hover:bg-orange-600');
        break;
      case 'error':
        classes.push('bg-red-500 text-white');
        if (props.clickable) classes.push('hover:bg-red-600');
        break;
      case 'info':
        classes.push('bg-cyan-500 text-white');
        if (props.clickable) classes.push('hover:bg-cyan-600');
        break;
      default:
        classes.push('bg-gray-200 text-gray-800');
        if (props.clickable) classes.push('hover:bg-gray-300');
    }
  }

  // Clickable
  if (props.clickable && !props.disabled) {
    classes.push('cursor-pointer focus:ring-2 focus:ring-offset-1');

    if (props.color === 'primary') {
      classes.push('focus:ring-blue-500');
    } else if (props.color === 'secondary') {
      classes.push('focus:ring-purple-500');
    } else {
      classes.push('focus:ring-gray-500');
    }
  }

  // Disabled
  if (props.disabled) {
    classes.push('opacity-50 cursor-not-allowed');
  }

  return classes;
});

const avatarClasses = computed(() => {
  const classes = [
    'flex items-center justify-center rounded-full overflow-hidden bg-gray-100',
  ];

  if (props.size === 'small') {
    classes.push('w-4 h-4 -ml-1 mr-1');
  } else {
    classes.push('w-6 h-6 -ml-1.5 mr-1.5');
  }

  // Avatar color for filled variant
  if (props.variant === 'filled' && props.color !== 'default') {
    classes.push('bg-black bg-opacity-20');
  }

  return classes;
});

const iconClasses = computed(() => {
  const classes = ['flex items-center justify-center'];

  if (props.size === 'small') {
    classes.push('w-4 h-4 -ml-1 mr-1');
  } else {
    classes.push('w-5 h-5 -ml-1.5 mr-1.5');
  }

  return classes;
});

const labelClasses = computed(() => {
  const classes = ['truncate'];

  if (props.size === 'small') {
    classes.push('px-2');
  } else {
    classes.push('px-3');
  }

  // Adjust padding when avatar/icon exists
  if (props.avatar || props.icon) {
    classes.push('pl-0');
  }

  // Adjust padding when deletable
  if (props.deletable) {
    classes.push('pr-0');
  }

  return classes;
});

const deleteIconClasses = computed(() => {
  const classes = [
    'flex items-center justify-center rounded-full transition-colors',
    'hover:bg-black hover:bg-opacity-10 focus:outline-none focus:bg-black focus:bg-opacity-20',
  ];

  if (props.size === 'small') {
    classes.push('w-4 h-4 -mr-1 ml-1');
  } else {
    classes.push('w-5 h-5 -mr-1.5 ml-1.5');
  }

  // Color-specific hover states
  if (props.variant === 'filled' && props.color !== 'default') {
    classes.push('text-white text-opacity-70 hover:text-opacity-100');
  } else {
    classes.push('text-gray-500 hover:text-gray-700');
  }

  return classes;
});

const tabIndex = computed(() => {
  if (props.skipFocusWhenDisabled && props.disabled) {
    return -1;
  }
  return props.clickable ? 0 : -1;
});

// Methods
const getAvatarText = (avatar: any): string => {
  if (typeof avatar === 'string') return avatar.charAt(0).toUpperCase();
  if (avatar?.name) return avatar.name.charAt(0).toUpperCase();
  return '?';
};

const handleClick = (event: MouseEvent) => {
  if (props.disabled) return;
  emit('click', event);
};

const handleDelete = (event: MouseEvent) => {
  event.stopPropagation();
  if (props.disabled) return;
  emit('delete', event);
};

const handleKeyDown = (event: KeyboardEvent) => {
  // Prevent default for Backspace and Delete to avoid form submission
  if (event.currentTarget === event.target && isDeleteKey(event)) {
    event.preventDefault();
  }
  emit('keydown', event);
};

const handleKeyUp = (event: KeyboardEvent) => {
  if (event.currentTarget === event.target) {
    if (props.deletable && isDeleteKey(event)) {
      handleDelete(event as any);
    } else if (event.key === 'Escape' && chipRef.value) {
      chipRef.value.blur();
    }
  }
  emit('keyup', event);
};

const isDeleteKey = (event: KeyboardEvent): boolean => {
  return event.key === 'Backspace' || event.key === 'Delete';
};
</script>
