<template>
  <button
    :class="buttonClasses"
    :disabled="disabled"
    :aria-pressed="isSelected"
    @click="handleClick"
    @focus="handleFocus"
    @blur="handleBlur"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue'

// Props
interface Props {
  value: any
  disabled?: boolean
  selected?: boolean
  color?: 'standard' | 'primary' | 'secondary'
  size?: 'small' | 'medium' | 'large'
  fullWidth?: boolean
  disableFocusRipple?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  selected: false,
  color: 'standard',
  size: 'medium',
  fullWidth: false,
  disableFocusRipple: false
})

// Emits
const emit = defineEmits<{
  click: [event: MouseEvent, value: any]
  change: [event: MouseEvent, value: any]
}>()

// Inject from ToggleButtonGroup
const groupContext = inject('toggleButtonGroup', null) as any
const buttonPositionClass = inject('toggleButtonPosition', '') as string

// Reactive state
const isFocused = ref(false)

// Computed properties
const isSelected = computed(() => {
  if (groupContext) {
    return groupContext.isSelected(props.value)
  }
  return props.selected
})

const effectiveColor = computed(() => {
  return groupContext?.color || props.color
})

const effectiveSize = computed(() => {
  return groupContext?.size || props.size
})

const effectiveFullWidth = computed(() => {
  return groupContext?.fullWidth || props.fullWidth
})

const effectiveDisabled = computed(() => {
  return groupContext?.disabled || props.disabled
})

const buttonClasses = computed(() => {
  const classes = [
    'toggle-button',
    `toggle-button--${effectiveColor.value}`,
    `toggle-button--${effectiveSize.value}`
  ]

  if (isSelected.value) {
    classes.push('toggle-button--selected')
  }

  if (effectiveDisabled.value) {
    classes.push('toggle-button--disabled')
  }

  if (effectiveFullWidth.value) {
    classes.push('toggle-button--full-width')
  }

  if (isFocused.value && !props.disableFocusRipple) {
    classes.push('toggle-button--focused')
  }

  if (buttonPositionClass) {
    classes.push(buttonPositionClass)
  }

  return classes
})

// Methods
const handleClick = (event: MouseEvent) => {
  if (effectiveDisabled.value) return

  emit('click', event, props.value)

  if (groupContext) {
    groupContext.onChange(event, props.value)
  } else {
    emit('change', event, props.value)
  }
}

const handleFocus = () => {
  isFocused.value = true
}

const handleBlur = () => {
  isFocused.value = false
}
</script>

<style scoped>
.toggle-button {
  /* Base styles */
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
  font-weight: 500;
  font-size: 0.875rem;
  line-height: 1.75;
  letter-spacing: 0.02857em;
  text-transform: uppercase;
  min-width: 64px;
  padding: 11px 16px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background-color: transparent;
  color: rgba(0, 0, 0, 0.6);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  outline: none;
}

.toggle-button:hover {
  text-decoration: none;
  background-color: rgba(0, 0, 0, 0.04);
}

.toggle-button:focus-visible {
  outline: 2px solid #1976d2;
  outline-offset: 2px;
}

/* Size variants */
.toggle-button--small {
  padding: 7px 12px;
  font-size: 0.8125rem;
  min-width: 48px;
}

.toggle-button--large {
  padding: 15px 24px;
  font-size: 0.9375rem;
  min-width: 80px;
}

/* Color variants */
.toggle-button--standard {
  color: rgba(0, 0, 0, 0.87);
}

.toggle-button--primary {
  color: #1976d2;
}

.toggle-button--secondary {
  color: #dc004e;
}

/* Selected state */
.toggle-button--selected {
  background-color: rgba(25, 118, 210, 0.12);
  color: #1976d2;
}

.toggle-button--selected.toggle-button--primary {
  background-color: rgba(25, 118, 210, 0.12);
  color: #1976d2;
}

.toggle-button--selected.toggle-button--secondary {
  background-color: rgba(220, 0, 78, 0.12);
  color: #dc004e;
}

.toggle-button--selected:hover {
  background-color: rgba(25, 118, 210, 0.16);
}

.toggle-button--selected.toggle-button--primary:hover {
  background-color: rgba(25, 118, 210, 0.16);
}

.toggle-button--selected.toggle-button--secondary:hover {
  background-color: rgba(220, 0, 78, 0.16);
}

/* Disabled state */
.toggle-button--disabled {
  color: rgba(0, 0, 0, 0.26);
  border-color: rgba(0, 0, 0, 0.12);
  cursor: not-allowed;
  pointer-events: none;
}

/* Full width */
.toggle-button--full-width {
  width: 100%;
}

/* Focus ripple effect */
.toggle-button--focused::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: inherit;
  background-color: currentColor;
  opacity: 0.12;
  pointer-events: none;
}

/* Group positioning classes */
.toggle-button-group--horizontal .toggle-button-first {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.toggle-button-group--horizontal .toggle-button-middle {
  border-radius: 0;
  margin-left: -1px;
  border-left: 1px solid transparent;
}

.toggle-button-group--horizontal .toggle-button-last {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  margin-left: -1px;
  border-left: 1px solid transparent;
}

.toggle-button-group--vertical .toggle-button-first {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.toggle-button-group--vertical .toggle-button-middle {
  border-radius: 0;
  margin-top: -1px;
  border-top: 1px solid transparent;
}

.toggle-button-group--vertical .toggle-button-last {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  margin-top: -1px;
  border-top: 1px solid transparent;
}

/* Dark theme support */
@media (prefers-color-scheme: dark) {
  .toggle-button {
    border-color: rgba(255, 255, 255, 0.12);
    color: rgba(255, 255, 255, 0.7);
  }

  .toggle-button:hover {
    background-color: rgba(255, 255, 255, 0.08);
  }

  .toggle-button--disabled {
    color: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.12);
  }
}
</style>
