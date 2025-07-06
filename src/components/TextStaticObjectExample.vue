<template>
  <div class="text-static-object-example">
    <div class="max-w-7xl mx-auto p-6">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">TextStaticObject Component</h1>
        <p class="text-gray-600">
          Versatile static object system for virtual office environments,
          supporting text, images, and plugins with rich editing capabilities.
        </p>
      </div>

      <!-- Controls -->
      <div class="mb-8 p-6 bg-gray-50 rounded-lg">
        <h2 class="text-lg font-semibold mb-4">Controls</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Object Type
            </label>
            <select
              v-model="objectType"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="text">Text</option>
              <option value="image">Image</option>
              <option value="text-image">Text + Image</option>
              <option value="plugin">Plugin</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Width (px)
            </label>
            <input
              v-model.number="objectWidth"
              type="number"
              min="100"
              max="500"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Height (px)
            </label>
            <input
              v-model.number="objectHeight"
              type="number"
              min="100"
              max="400"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
          </div>
        </div>

        <div class="mt-4 flex flex-wrap gap-4">
          <label class="flex items-center">
            <input
              v-model="allowEdit"
              type="checkbox"
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            >
            <span class="ml-2 text-sm text-gray-700">Allow Edit</span>
          </label>

          <label class="flex items-center">
            <input
              v-model="allowSourceMode"
              type="checkbox"
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            >
            <span class="ml-2 text-sm text-gray-700">Allow Source Mode</span>
          </label>

          <label class="flex items-center">
            <input
              v-model="enableAnimation"
              type="checkbox"
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            >
            <span class="ml-2 text-sm text-gray-700">Click Animation</span>
          </label>

          <button
            @click="resetContent"
            class="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Reset Content
          </button>
        </div>

        <!-- Content Editor -->
        <div v-if="objectType === 'text' || objectType === 'text-image'" class="mt-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            HTML Content
          </label>
          <textarea
            v-model="htmlContent"
            rows="4"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter HTML content..."
          />
        </div>

        <!-- Image URL -->
        <div v-if="objectType === 'image' || objectType === 'text-image'" class="mt-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Image URL
          </label>
          <input
            v-model="imageSrc"
            type="url"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/image.jpg"
          >
        </div>

        <!-- Plugin Settings -->
        <div v-if="objectType === 'plugin'" class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Plugin Name
            </label>
            <input
              v-model="pluginName"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Plugin Name"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Icon URL
            </label>
            <input
              v-model="pluginIcon"
              type="url"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/icon.svg"
            >
          </div>
        </div>
      </div>

      <!-- Demo Canvas -->
      <div class="mb-8">
        <h3 class="text-lg font-semibold mb-4">Interactive Demo</h3>
        <div
          ref="canvasRef"
          class="relative bg-gradient-to-br from-blue-50 to-green-50 border-2 border-gray-200 rounded-lg overflow-hidden"
          :style="canvasStyle"
        >
          <!-- Static Objects -->
          <TextStaticObject
            v-for="(object, index) in staticObjects"
            :key="`object-${index}`"
            :type="object.type"
            :x="object.x"
            :y="object.y"
            :width="object.width"
            :height="object.height"
            :html-content="object.htmlContent"
            :src="object.src"
            :icon="object.icon"
            :name="object.name"
            :allow-edit="object.allowEdit"
            :allow-source-mode="object.allowSourceMode"
            :modal-container="canvasRef"
            :container="canvasRef"
            :animation-on-click="object.animationOnClick"
            :style="object.style"
            @changed="handleContentChanged(index, $event)"
            @click="handleObjectClick(index, $event)"
            @hover-change="handleHoverChange(index, $event)"
          />

          <!-- Add Object Button -->
          <button
            @click="addNewObject"
            class="absolute top-4 right-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add Object
          </button>
        </div>
      </div>

      <!-- Event Log -->
      <div class="mb-8">
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
            No events yet. Interact with the objects above.
          </div>
        </div>
      </div>

      <!-- Feature Information -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Features</h3>
          <ul class="space-y-2 text-sm text-gray-600">
            <li class="flex items-center">
              <svg class="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Rich text editing with HTML support
            </li>
            <li class="flex items-center">
              <svg class="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Image display with click animations
            </li>
            <li class="flex items-center">
              <svg class="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Plugin icon display system
            </li>
            <li class="flex items-center">
              <svg class="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Modal editors with source mode
            </li>
            <li class="flex items-center">
              <svg class="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Hover effects and interactions
            </li>
            <li class="flex items-center">
              <svg class="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Skew transformations support
            </li>
          </ul>
        </div>

        <div>
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Use Cases</h3>
          <ul class="space-y-2 text-sm text-gray-600">
            <li>• Virtual office information boards</li>
            <li>• Interactive workspace elements</li>
            <li>• Digital signage systems</li>
            <li>• Plugin and tool displays</li>
            <li>• Rich content presentations</li>
            <li>• Collaborative editing interfaces</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import TextStaticObject from './TextStaticObject.vue'

// Reactive state
const canvasRef = ref<HTMLElement>()
const objectType = ref<'text' | 'image' | 'text-image' | 'plugin'>('text')
const objectWidth = ref(200)
const objectHeight = ref(150)
const allowEdit = ref(true)
const allowSourceMode = ref(true)
const enableAnimation = ref(true)
const htmlContent = ref('<h2>Welcome!</h2><p>This is a <strong>rich text</strong> static object. You can edit this content by clicking the edit button when hovering.</p>')
const imageSrc = ref('https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=300&fit=crop')
const pluginName = ref('Sample Plugin')
const pluginIcon = ref('https://cdn.jsdelivr.net/npm/lucide@latest/icons/puzzle.svg')
const eventLog = ref<Array<{ timestamp: string; message: string }>>([])

// Static objects array
const staticObjects = ref([
  {
    type: 'text' as const,
    x: 50,
    y: 50,
    width: 250,
    height: 180,
    htmlContent: '<h3>Information Board</h3><p>Welcome to our virtual office! This is an interactive text board where you can share updates and announcements.</p>',
    allowEdit: true,
    allowSourceMode: true,
    style: {
      backgroundColor: '#ffffff',
      borderColor: '#3b82f6',
      boxShadow: '0 4px 6px rgba(59, 130, 246, 0.1)'
    }
  },
  {
    type: 'image' as const,
    x: 350,
    y: 50,
    width: 200,
    height: 150,
    src: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=300&fit=crop',
    animationOnClick: {
      src: 'https://cdn.jsdelivr.net/npm/lucide@latest/icons/heart.svg',
      duration: 1000
    }
  },
  {
    type: 'plugin' as const,
    x: 600,
    y: 80,
    width: 80,
    height: 80,
    name: 'Calendar',
    icon: 'https://cdn.jsdelivr.net/npm/lucide@latest/icons/calendar.svg'
  }
])

// Computed properties
const canvasStyle = computed(() => ({
  width: '100%',
  height: '400px',
  minHeight: '400px'
}))

// Methods
const addNewObject = () => {
  const baseObject = {
    type: objectType.value,
    x: Math.random() * 300 + 50,
    y: Math.random() * 200 + 50,
    width: objectWidth.value,
    height: objectHeight.value,
    allowEdit: allowEdit.value,
    allowSourceMode: allowSourceMode.value,
    style: {
      backgroundColor: '#ffffff',
      borderColor: '#e0e0e0',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }
  }

  let newObject: any = { ...baseObject }

  if (objectType.value === 'text' || objectType.value === 'text-image') {
    newObject.htmlContent = htmlContent.value
  }

  if (objectType.value === 'image' || objectType.value === 'text-image') {
    newObject.src = imageSrc.value
    if (enableAnimation.value) {
      newObject.animationOnClick = {
        src: 'https://cdn.jsdelivr.net/npm/lucide@latest/icons/sparkles.svg',
        duration: 800
      }
    }
  }

  if (objectType.value === 'plugin') {
    newObject.name = pluginName.value
    newObject.icon = pluginIcon.value
  }

  staticObjects.value.push(newObject)
  addEvent(`Added new ${objectType.value} object`)
}

const handleContentChanged = (index: number, newContent: string) => {
  staticObjects.value[index].htmlContent = newContent
  addEvent(`Object ${index + 1} content updated`)
}

const handleObjectClick = (index: number, _event: MouseEvent) => {
  addEvent(`Object ${index + 1} (${staticObjects.value[index].type}) clicked`)
}

const handleHoverChange = (index: number, isHovered: boolean) => {
  if (isHovered) {
    addEvent(`Object ${index + 1} hovered`)
  }
}

const resetContent = () => {
  htmlContent.value = '<h2>Welcome!</h2><p>This is a <strong>rich text</strong> static object. You can edit this content by clicking the edit button when hovering.</p>'
  imageSrc.value = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=300&fit=crop'
  pluginName.value = 'Sample Plugin'
  pluginIcon.value = 'https://cdn.jsdelivr.net/npm/lucide@latest/icons/puzzle.svg'
  addEvent('Content reset to defaults')
}

const addEvent = (message: string) => {
  const timestamp = new Date().toLocaleTimeString()
  eventLog.value.unshift({ timestamp, message })

  // Keep only last 20 events
  if (eventLog.value.length > 20) {
    eventLog.value = eventLog.value.slice(0, 20)
  }
}

// Watch for changes
watch(objectType, (newValue) => {
  addEvent(`Object type changed to: ${newValue}`)
})

// Initialize
addEvent('TextStaticObject example initialized')
</script>

<style scoped>
.text-static-object-example {
  min-height: 100vh;
  background-color: #f9fafb;
}
</style>
