<template>
  <div class="toggle-button-group-example">
    <div class="max-w-7xl mx-auto p-6">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">ToggleButtonGroup Component</h1>
        <p class="text-gray-600">
          Material-UI inspired toggle button groups with exclusive and multiple selection modes,
          supporting various layouts and styling options.
        </p>
      </div>

      <!-- Controls -->
      <div class="mb-8 p-6 bg-gray-50 rounded-lg">
        <h2 class="text-lg font-semibold mb-4">Controls</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Selection Mode
            </label>
            <select
              v-model="exclusive"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option :value="true">Exclusive (Single)</option>
              <option :value="false">Multiple</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Orientation
            </label>
            <select
              v-model="orientation"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="horizontal">Horizontal</option>
              <option value="vertical">Vertical</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Size
            </label>
            <select
              v-model="size"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <select
              v-model="color"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="standard">Standard</option>
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
            </select>
          </div>
        </div>

        <div class="mt-4 flex flex-wrap gap-4">
          <label class="flex items-center">
            <input
              v-model="disabled"
              type="checkbox"
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            >
            <span class="ml-2 text-sm text-gray-700">Disabled</span>
          </label>

          <label class="flex items-center">
            <input
              v-model="fullWidth"
              type="checkbox"
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            >
            <span class="ml-2 text-sm text-gray-700">Full Width</span>
          </label>

          <button
            @click="resetSelection"
            class="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Reset Selection
          </button>
        </div>
      </div>

      <!-- Demo Sections -->
      <div class="space-y-8">
        <!-- Basic Text Alignment -->
        <div class="demo-section">
          <h3 class="text-lg font-semibold mb-4">Text Alignment</h3>
          <div class="demo-container">
            <ToggleButtonGroup
              v-model:value="textAlignment"
              :exclusive="exclusive"
              :orientation="orientation"
              :size="size"
              :color="color"
              :disabled="disabled"
              :full-width="fullWidth"
              @change="handleAlignmentChange"
              aria-label="text alignment"
            >
              <ToggleButton value="left">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h8m-8 6h16" />
                </svg>
                <span class="ml-2">Left</span>
              </ToggleButton>
              <ToggleButton value="center">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M8 12h8m-8 6h16" />
                </svg>
                <span class="ml-2">Center</span>
              </ToggleButton>
              <ToggleButton value="right">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M12 12h8M4 18h16" />
                </svg>
                <span class="ml-2">Right</span>
              </ToggleButton>
              <ToggleButton value="justify">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span class="ml-2">Justify</span>
              </ToggleButton>
            </ToggleButtonGroup>
          </div>
        </div>

        <!-- Text Formatting -->
        <div class="demo-section">
          <h3 class="text-lg font-semibold mb-4">Text Formatting</h3>
          <div class="demo-container">
            <ToggleButtonGroup
              v-model:value="textFormatting"
              :exclusive="false"
              :orientation="orientation"
              :size="size"
              :color="color"
              :disabled="disabled"
              :full-width="fullWidth"
              @change="handleFormattingChange"
              aria-label="text formatting"
            >
              <ToggleButton value="bold">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
                </svg>
                <span class="ml-1">Bold</span>
              </ToggleButton>
              <ToggleButton value="italic">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 4l4 16m-4-8h8" />
                </svg>
                <span class="ml-1">Italic</span>
              </ToggleButton>
              <ToggleButton value="underline">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 20h12M8 4v8a4 4 0 008 0V4" />
                </svg>
                <span class="ml-1">Underline</span>
              </ToggleButton>
            </ToggleButtonGroup>
          </div>
        </div>

        <!-- View Modes -->
        <div class="demo-section">
          <h3 class="text-lg font-semibold mb-4">View Modes</h3>
          <div class="demo-container">
            <ToggleButtonGroup
              v-model:value="viewMode"
              :exclusive="true"
              :orientation="orientation"
              :size="size"
              :color="color"
              :disabled="disabled"
              :full-width="fullWidth"
              @change="handleViewModeChange"
              aria-label="view mode"
            >
              <ToggleButton value="list">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                <span class="ml-2">List</span>
              </ToggleButton>
              <ToggleButton value="grid">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span class="ml-2">Grid</span>
              </ToggleButton>
              <ToggleButton value="card">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span class="ml-2">Card</span>
              </ToggleButton>
            </ToggleButtonGroup>
          </div>
        </div>

        <!-- Icon Only Buttons -->
        <div class="demo-section">
          <h3 class="text-lg font-semibold mb-4">Icon Only Buttons</h3>
          <div class="demo-container">
            <ToggleButtonGroup
              v-model:value="selectedTools"
              :exclusive="false"
              :orientation="orientation"
              :size="size"
              :color="color"
              :disabled="disabled"
              :full-width="fullWidth"
              @change="handleToolsChange"
              aria-label="tools"
            >
              <ToggleButton value="pen">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </ToggleButton>
              <ToggleButton value="brush">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                </svg>
              </ToggleButton>
              <ToggleButton value="eraser">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </ToggleButton>
              <ToggleButton value="text">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </ToggleButton>
            </ToggleButtonGroup>
          </div>
        </div>
      </div>

      <!-- Current State Display -->
      <div class="mt-8 p-6 bg-white rounded-lg shadow-sm">
        <h3 class="text-lg font-semibold mb-4">Current State</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 class="font-medium text-gray-700 mb-2">Text Alignment</h4>
            <code class="text-sm bg-gray-100 p-2 rounded">{{ JSON.stringify(textAlignment) }}</code>
          </div>
          <div>
            <h4 class="font-medium text-gray-700 mb-2">Text Formatting</h4>
            <code class="text-sm bg-gray-100 p-2 rounded">{{ JSON.stringify(textFormatting) }}</code>
          </div>
          <div>
            <h4 class="font-medium text-gray-700 mb-2">View Mode</h4>
            <code class="text-sm bg-gray-100 p-2 rounded">{{ JSON.stringify(viewMode) }}</code>
          </div>
          <div>
            <h4 class="font-medium text-gray-700 mb-2">Selected Tools</h4>
            <code class="text-sm bg-gray-100 p-2 rounded">{{ JSON.stringify(selectedTools) }}</code>
          </div>
        </div>
      </div>

      <!-- Event Log -->
      <div class="mt-8">
        <h3 class="text-lg font-semibold mb-4">Event Log</h3>
        <div class="bg-white rounded-lg shadow-sm p-4 max-h-64 overflow-y-auto">
          <div
            v-for="(event, index) in eventLog"
            :key="index"
            class="text-sm p-2 mb-2 bg-gray-50 rounded"
          >
            <span class="text-gray-500">{{ event.timestamp }}</span>
            <span class="ml-2 text-gray-900">{{ event.message }}</span>
          </div>
          <div v-if="eventLog.length === 0" class="text-gray-500 text-center py-4">
            No events yet. Interact with the toggle buttons above.
          </div>
        </div>
      </div>

      <!-- Feature Information -->
      <div class="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Features</h3>
          <ul class="space-y-2 text-sm text-gray-600">
            <li class="flex items-center">
              <svg class="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Exclusive and multiple selection modes
            </li>
            <li class="flex items-center">
              <svg class="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Horizontal and vertical orientations
            </li>
            <li class="flex items-center">
              <svg class="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Three size variants (small, medium, large)
            </li>
            <li class="flex items-center">
              <svg class="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Color theming (standard, primary, secondary)
            </li>
            <li class="flex items-center">
              <svg class="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Full accessibility support
            </li>
            <li class="flex items-center">
              <svg class="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Material-UI compatible styling
            </li>
          </ul>
        </div>

        <div>
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Use Cases</h3>
          <ul class="space-y-2 text-sm text-gray-600">
            <li>• Text editor toolbars</li>
            <li>• View mode switchers</li>
            <li>• Filter and sort controls</li>
            <li>• Settings panels</li>
            <li>• Drawing tool palettes</li>
            <li>• Navigation tabs</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import ToggleButtonGroup from './ToggleButtonGroup.vue'
import ToggleButton from './ToggleButton.vue'

// Reactive state
const exclusive = ref(true)
const orientation = ref<'horizontal' | 'vertical'>('horizontal')
const size = ref<'small' | 'medium' | 'large'>('medium')
const color = ref<'standard' | 'primary' | 'secondary'>('standard')
const disabled = ref(false)
const fullWidth = ref(false)

// Demo values
const textAlignment = ref<string | string[] | null>('left')
const textFormatting = ref<string[]>(['bold'])
const viewMode = ref<string | null>('list')
const selectedTools = ref<string[]>(['pen', 'brush'])
const eventLog = ref<Array<{ timestamp: string; message: string }>>([])

// Methods
const handleAlignmentChange = (_event: MouseEvent, value: any) => {
  textAlignment.value = value
  addEvent(`Text alignment changed to: ${JSON.stringify(value)}`)
}

const handleFormattingChange = (_event: MouseEvent, value: any) => {
  textFormatting.value = value
  addEvent(`Text formatting changed to: ${JSON.stringify(value)}`)
}

const handleViewModeChange = (_event: MouseEvent, value: any) => {
  viewMode.value = value
  addEvent(`View mode changed to: ${JSON.stringify(value)}`)
}

const handleToolsChange = (_event: MouseEvent, value: any) => {
  selectedTools.value = value
  addEvent(`Selected tools changed to: ${JSON.stringify(value)}`)
}

const resetSelection = () => {
  textAlignment.value = exclusive.value ? null : []
  textFormatting.value = []
  viewMode.value = null
  selectedTools.value = []
  addEvent('All selections reset')
}

const addEvent = (message: string) => {
  const timestamp = new Date().toLocaleTimeString()
  eventLog.value.unshift({ timestamp, message })

  // Keep only last 10 events
  if (eventLog.value.length > 10) {
    eventLog.value = eventLog.value.slice(0, 10)
  }
}

// Watch for control changes
watch(exclusive, (newValue) => {
  addEvent(`Selection mode changed to: ${newValue ? 'exclusive' : 'multiple'}`)
  if (newValue) {
    // Convert array values to single values for exclusive mode
    if (Array.isArray(textAlignment.value)) {
      textAlignment.value = textAlignment.value[0] || null
    }
  } else {
    // Convert single values to arrays for multiple mode
    if (!Array.isArray(textAlignment.value)) {
      textAlignment.value = textAlignment.value ? [textAlignment.value] : []
    }
  }
})

watch(orientation, (newValue) => {
  addEvent(`Orientation changed to: ${newValue}`)
})

watch(size, (newValue) => {
  addEvent(`Size changed to: ${newValue}`)
})

watch(color, (newValue) => {
  addEvent(`Color changed to: ${newValue}`)
})

watch(disabled, (newValue) => {
  addEvent(`Disabled state changed to: ${newValue}`)
})

watch(fullWidth, (newValue) => {
  addEvent(`Full width changed to: ${newValue}`)
})

// Initialize
addEvent('ToggleButtonGroup example initialized')
</script>

<style scoped>
.toggle-button-group-example {
  min-height: 100vh;
  background-color: #f9fafb;
}

.demo-section {
  padding: 24px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.demo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px dashed #dee2e6;
}
</style>
