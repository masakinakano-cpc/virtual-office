<template>
  <div class="relative w-full" ref="rootRef">
    <!-- Input Field -->
    <div
      class="relative flex items-center border border-gray-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
      :class="[
        disabled && 'bg-gray-100 cursor-not-allowed',
        multiple && 'min-h-[40px] flex-wrap p-1'
      ]"
    >
      <!-- Multiple Selection Tags -->
      <div v-if="multiple && selectedItems.length > 0" class="flex flex-wrap gap-1 mr-2">
        <Chip
          v-for="(item, index) in selectedItems"
          :key="getOptionKey ? getOptionKey(item) : getOptionLabel(item)"
          :label="getOptionLabel(item)"
          :size="size === 'small' ? 'small' : 'medium'"
          color="primary"
          deletable
          :disabled="disabled || readonly"
          @delete="removeItem(index)"
        />
      </div>

      <!-- Input -->
      <input
        ref="inputRef"
        v-model="inputValue"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeyDown"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        class="flex-1 min-w-0 px-3 py-2 bg-transparent border-none outline-none"
        :class="[
          multiple && 'min-w-[100px]',
          disabled && 'cursor-not-allowed'
        ]"
        autocomplete="off"
        role="combobox"
        :aria-expanded="isOpen"
        :aria-autocomplete="'list'"
        :aria-controls="listboxId"
        :aria-activedescendant="highlightedIndex >= 0 ? `${listboxId}-option-${highlightedIndex}` : undefined"
      />

      <!-- Clear Button -->
      <button
        v-if="clearable && (inputValue || selectedItems.length > 0) && !disabled && !readonly"
        @click="clearSelection"
        class="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        type="button"
        tabindex="-1"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Dropdown Arrow -->
      <button
        @click="toggleDropdown"
        class="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        type="button"
        tabindex="-1"
        :disabled="disabled"
      >
        <svg
          class="w-4 h-4 transition-transform"
          :class="{ 'rotate-180': isOpen }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>

    <!-- Dropdown -->
    <Teleport to="body">
      <div
        v-if="isOpen && filteredOptions.length > 0"
        ref="dropdownRef"
        :style="dropdownStyle"
        class="absolute z-50 w-full max-h-60 bg-white border border-gray-200 rounded-lg shadow-lg overflow-auto"
        :id="listboxId"
        role="listbox"
        :aria-label="'Options'"
      >
        <!-- Loading -->
        <div v-if="loading" class="px-3 py-2 text-gray-500 text-sm">
          Loading...
        </div>

        <!-- Options -->
        <template v-else>
          <div
            v-for="(option, index) in filteredOptions"
            :key="getOptionKey ? getOptionKey(option) : getOptionLabel(option)"
            :id="`${listboxId}-option-${index}`"
            @click="selectOption(option)"
            @mouseenter="highlightedIndex = index"
            class="px-3 py-2 cursor-pointer transition-colors"
            :class="[
              index === highlightedIndex && 'bg-blue-50',
              isSelected(option) && 'bg-blue-100 text-blue-800',
              getOptionDisabled && getOptionDisabled(option) && 'opacity-50 cursor-not-allowed'
            ]"
            role="option"
            :aria-selected="isSelected(option)"
            :aria-disabled="getOptionDisabled && getOptionDisabled(option)"
          >
            <slot name="option" :option="option" :index="index">
              {{ getOptionLabel(option) }}
            </slot>
          </div>
        </template>

        <!-- No Options -->
        <div v-if="!loading && filteredOptions.length === 0" class="px-3 py-2 text-gray-500 text-sm">
          {{ noOptionsText }}
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import Chip from './Chip.vue';

interface AutoCompleteProps {
  options: any[];
  modelValue?: any | any[];
  multiple?: boolean;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  clearable?: boolean;
  loading?: boolean;
  noOptionsText?: string;
  size?: 'small' | 'medium';
  getOptionLabel?: (option: any) => string;
  getOptionKey?: (option: any) => string | number;
  getOptionDisabled?: (option: any) => boolean;
  filterOptions?: (options: any[], inputValue: string) => any[];
}

const props = withDefaults(defineProps<AutoCompleteProps>(), {
  multiple: false,
  placeholder: 'Select an option...',
  disabled: false,
  readonly: false,
  clearable: true,
  loading: false,
  noOptionsText: 'No options',
  size: 'medium',
  getOptionLabel: (option: any) => option?.label || option?.name || String(option),
  filterOptions: (options: any[], inputValue: string): any[] => {
    if (!inputValue) return options;
    return options.filter((option: any) =>
      props.getOptionLabel!(option).toLowerCase().includes(inputValue.toLowerCase())
    );
  }
});

const emit = defineEmits<{
  'update:modelValue': [value: any | any[]];
  'input': [inputValue: string];
  'focus': [event: FocusEvent];
  'blur': [event: FocusEvent];
  'select': [option: any];
  'clear': [];
}>();

// Refs
const rootRef = ref<HTMLDivElement>();
const inputRef = ref<HTMLInputElement>();
const dropdownRef = ref<HTMLDivElement>();

// State
const inputValue = ref('');
const isOpen = ref(false);
const highlightedIndex = ref(-1);
const listboxId = `autocomplete-${Math.random().toString(36).substr(2, 9)}`;

// Computed
const selectedItems = computed(() => {
  if (props.multiple) {
    return Array.isArray(props.modelValue) ? props.modelValue : [];
  }
  return props.modelValue ? [props.modelValue] : [];
});

const filteredOptions = computed(() => {
  return props.filterOptions!(props.options, inputValue.value);
});

const dropdownStyle = computed(() => {
  if (!rootRef.value) return {};
  const rect = rootRef.value.getBoundingClientRect();
  return {
    position: 'fixed' as const,
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
  };
});

// Methods
const isSelected = (option: any): boolean => {
  if (props.multiple) {
    return selectedItems.value.some(item =>
      props.getOptionKey ?
        props.getOptionKey(item) === props.getOptionKey(option) :
        props.getOptionLabel!(item) === props.getOptionLabel!(option)
    );
  }
  return props.getOptionKey ?
    props.getOptionKey(props.modelValue) === props.getOptionKey(option) :
    props.getOptionLabel!(props.modelValue) === props.getOptionLabel!(option);
};

const selectOption = (option: any) => {
  if (props.getOptionDisabled && props.getOptionDisabled(option)) return;

  if (props.multiple) {
    const newValue = [...selectedItems.value];
    const existingIndex = newValue.findIndex(item =>
      props.getOptionKey ?
        props.getOptionKey(item) === props.getOptionKey(option) :
        props.getOptionLabel!(item) === props.getOptionLabel!(option)
    );

    if (existingIndex >= 0) {
      newValue.splice(existingIndex, 1);
    } else {
      newValue.push(option);
    }

    emit('update:modelValue', newValue);
  } else {
    emit('update:modelValue', option);
    inputValue.value = props.getOptionLabel!(option);
    isOpen.value = false;
  }

  emit('select', option);
};

const removeItem = (index: number) => {
  if (props.multiple) {
    const newValue = [...selectedItems.value];
    newValue.splice(index, 1);
    emit('update:modelValue', newValue);
  }
};

const clearSelection = () => {
  inputValue.value = '';
  emit('update:modelValue', props.multiple ? [] : null);
  emit('clear');
  inputRef.value?.focus();
};

const toggleDropdown = () => {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    nextTick(() => inputRef.value?.focus());
  }
};

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  inputValue.value = target.value;
  isOpen.value = true;
  highlightedIndex.value = -1;
  emit('input', target.value);
};

const handleFocus = (event: FocusEvent) => {
  if (!props.readonly) {
    isOpen.value = true;
  }
  emit('focus', event);
};

const handleBlur = (event: FocusEvent) => {
  // Delay closing to allow for option selection
  setTimeout(() => {
    if (!dropdownRef.value?.contains(document.activeElement)) {
      isOpen.value = false;
      highlightedIndex.value = -1;
    }
  }, 150);
  emit('blur', event);
};

const handleKeyDown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      if (!isOpen.value) {
        isOpen.value = true;
      } else {
        highlightedIndex.value = Math.min(
          highlightedIndex.value + 1,
          filteredOptions.value.length - 1
        );
      }
      break;

    case 'ArrowUp':
      event.preventDefault();
      if (isOpen.value) {
        highlightedIndex.value = Math.max(highlightedIndex.value - 1, -1);
      }
      break;

    case 'Enter':
      event.preventDefault();
      if (isOpen.value && highlightedIndex.value >= 0) {
        selectOption(filteredOptions.value[highlightedIndex.value]);
      }
      break;

    case 'Escape':
      event.preventDefault();
      isOpen.value = false;
      highlightedIndex.value = -1;
      break;

    case 'Backspace':
      if (props.multiple && !inputValue.value && selectedItems.value.length > 0) {
        removeItem(selectedItems.value.length - 1);
      }
      break;
  }
};

// Click outside to close
const handleClickOutside = (event: Event) => {
  if (!rootRef.value?.contains(event.target as Node) &&
      !dropdownRef.value?.contains(event.target as Node)) {
    isOpen.value = false;
    highlightedIndex.value = -1;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

// Watch for external value changes
watch(() => props.modelValue, (newValue) => {
  if (!props.multiple && newValue) {
    inputValue.value = props.getOptionLabel!(newValue);
  }
});
</script>
