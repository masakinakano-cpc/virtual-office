<template>
  <div
    :class="groupClasses"
    role="group"
    :aria-label="ariaLabel"
  >
    <component
      v-for="(child, index) in validChildren"
      :key="getChildKey(child, index)"
      :is="child"
      v-bind="getChildProps(index)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, provide, useSlots, VNode } from 'vue'

// Props
interface Props {
  value?: any | any[]
  exclusive?: boolean
  disabled?: boolean
  fullWidth?: boolean
  orientation?: 'horizontal' | 'vertical'
  size?: 'small' | 'medium' | 'large'
  color?: 'standard' | 'primary' | 'secondary'
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  exclusive: false,
  disabled: false,
  fullWidth: false,
  orientation: 'horizontal',
  size: 'medium',
  color: 'standard'
})

// Emits
const emit = defineEmits<{
  change: [event: MouseEvent, value: any | any[]]
}>()

// Slots
const slots = useSlots()

// Computed properties
const validChildren = computed(() => {
  const children: VNode[] = []

  if (slots.default) {
    const slotContent = slots.default()

    const processNode = (node: VNode) => {
      if (node.type && typeof node.type === 'object' && 'name' in node.type) {
        // This is a component
        children.push(node)
      } else if (node.children && Array.isArray(node.children)) {
        // Process nested children
        node.children.forEach((child: any) => {
          if (typeof child === 'object' && child.type) {
            processNode(child)
          }
        })
      }
    }

    slotContent.forEach(processNode)
  }

  return children
})

const groupClasses = computed(() => {
  const classes = [
    'toggle-button-group',
    `toggle-button-group--${props.orientation}`
  ]

  if (props.fullWidth) {
    classes.push('toggle-button-group--full-width')
  }

  if (props.disabled) {
    classes.push('toggle-button-group--disabled')
  }

  return classes
})

// Methods
const isSelected = (value: any): boolean => {
  if (props.value === undefined || props.value === null) {
    return false
  }

  if (props.exclusive) {
    return props.value === value
  } else {
    return Array.isArray(props.value) && props.value.includes(value)
  }
}

const handleChange = (event: MouseEvent, value: any) => {
  if (props.disabled) return

  let newValue: any

  if (props.exclusive) {
    // Exclusive mode: only one can be selected
    newValue = props.value === value ? null : value
  } else {
    // Multiple mode: toggle in array
    if (!Array.isArray(props.value)) {
      newValue = [value]
    } else {
      const currentIndex = props.value.indexOf(value)
      if (currentIndex >= 0) {
        // Remove from selection
        newValue = props.value.filter((_, index) => index !== currentIndex)
      } else {
        // Add to selection
        newValue = [...props.value, value]
      }
    }
  }

  emit('change', event, newValue)
}

const getButtonPosition = (index: number): string => {
  const totalChildren = validChildren.value.length

  if (totalChildren === 1) {
    return ''
  }

  if (index === 0) {
    return 'toggle-button-first'
  } else if (index === totalChildren - 1) {
    return 'toggle-button-last'
  } else {
    return 'toggle-button-middle'
  }
}

const getChildKey = (child: VNode, index: number): string | number => {
  return (child.key as string | number) ?? index
}

const getChildProps = (index: number) => {
  return {
    // Inject position class for styling
    class: getButtonPosition(index)
  }
}

// Provide context to child ToggleButton components
const groupContext = {
  isSelected,
  onChange: handleChange,
  color: props.color,
  size: props.size,
  fullWidth: props.fullWidth,
  disabled: props.disabled,
  orientation: props.orientation
}

provide('toggleButtonGroup', groupContext)

// Provide position classes to children
validChildren.value.forEach((_, index) => {
  provide(`toggleButtonPosition-${index}`, getButtonPosition(index))
})
</script>

<style scoped>
.toggle-button-group {
  display: inline-flex;
  border-radius: 4px;
  overflow: hidden;
}

.toggle-button-group--vertical {
  flex-direction: column;
}

.toggle-button-group--full-width {
  width: 100%;
}

.toggle-button-group--disabled {
  pointer-events: none;
}

/* Horizontal layout */
.toggle-button-group--horizontal :deep(.toggle-button-first) {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.toggle-button-group--horizontal :deep(.toggle-button-middle) {
  border-radius: 0;
  margin-left: -1px;
  border-left: 1px solid transparent;
}

.toggle-button-group--horizontal :deep(.toggle-button-last) {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  margin-left: -1px;
  border-left: 1px solid transparent;
}

/* Vertical layout */
.toggle-button-group--vertical :deep(.toggle-button-first) {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.toggle-button-group--vertical :deep(.toggle-button-middle) {
  border-radius: 0;
  margin-top: -1px;
  border-top: 1px solid transparent;
}

.toggle-button-group--vertical :deep(.toggle-button-last) {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  margin-top: -1px;
  border-top: 1px solid transparent;
}

/* Selected button spacing adjustments */
.toggle-button-group--horizontal :deep(.toggle-button--selected + .toggle-button--selected) {
  border-left: 0;
  margin-left: 0;
}

.toggle-button-group--vertical :deep(.toggle-button--selected + .toggle-button--selected) {
  border-top: 0;
  margin-top: 0;
}

/* Disabled button border adjustments */
.toggle-button-group--horizontal :deep(.toggle-button-last.toggle-button--disabled),
.toggle-button-group--horizontal :deep(.toggle-button-middle.toggle-button--disabled) {
  border-left: 1px solid transparent;
}

.toggle-button-group--vertical :deep(.toggle-button-last.toggle-button--disabled),
.toggle-button-group--vertical :deep(.toggle-button-middle.toggle-button--disabled) {
  border-top: 1px solid transparent;
}
</style>
