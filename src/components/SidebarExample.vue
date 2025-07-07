<template>
  <div class="sidebar-example">
    <div class="max-w-7xl mx-auto p-6">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Sidebar Component</h1>
        <p class="text-gray-600">
          Enterprise-grade sidebar with organization and workspace management,
          based on Ovice's sidebar system.
        </p>
      </div>

      <!-- Controls -->
      <div class="mb-8 p-6 bg-gray-50 rounded-lg">
        <h2 class="text-lg font-semibold mb-4">Controls</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Sidebar Variant
            </label>
            <select
              v-model="sidebarVariant"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="persistent">Persistent</option>
              <option value="temporary">Temporary</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              User Role
            </label>
            <select
              v-model="userRole"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="guest">Guest</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              User Status
            </label>
            <select
              v-model="userStatus"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="online">Online</option>
              <option value="away">Away</option>
              <option value="busy">Busy</option>
            </select>
          </div>
        </div>

        <div class="mt-4 flex flex-wrap gap-4">
          <label class="flex items-center">
            <input
              v-model="showOrganization"
              type="checkbox"
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            >
            <span class="ml-2 text-sm text-gray-700">Show Organization</span>
          </label>

          <label class="flex items-center">
            <input
              v-model="hasSettings"
              type="checkbox"
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            >
            <span class="ml-2 text-sm text-gray-700">Has Settings Access</span>
          </label>

          <button
            @click="toggleSidebar"
            class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {{ sidebarOpen ? 'Close' : 'Open' }} Sidebar
          </button>
        </div>
      </div>

      <!-- Demo Layout -->
      <div class="flex h-96 border border-gray-200 rounded-lg overflow-hidden">
        <!-- Sidebar -->
        <div class="relative">
          <Sidebar
            :open="sidebarOpen"
            :variant="sidebarVariant"
            :workspace="mockWorkspace"
            :user="mockUser"
            :organization="showOrganization ? mockOrganization : null"
            :is-admin="isAdmin"
            :is-allowed-to-access-settings="hasSettings"
            @close="sidebarOpen = false"
            @leave-workspace="handleLeaveWorkspace"
          />
        </div>

        <!-- Main Content -->
        <div class="flex-1 p-6 bg-gray-50">
          <div class="h-full flex flex-col">
            <div class="mb-4">
              <h3 class="text-lg font-semibold text-gray-900">Main Content Area</h3>
              <p class="text-gray-600">This is where your main application content would go.</p>
            </div>

            <div class="flex-1 bg-white rounded-lg shadow-sm p-4">
              <h4 class="font-medium text-gray-900 mb-2">Event Log</h4>
              <div class="space-y-2 max-h-64 overflow-y-auto">
                <div
                  v-for="(event, index) in eventLog"
                  :key="index"
                  class="text-sm p-2 bg-gray-50 rounded"
                >
                  <span class="text-gray-500">{{ event.timestamp }}</span>
                  <span class="ml-2 text-gray-900">{{ event.message }}</span>
                </div>
              </div>
            </div>
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
              Organization and Workspace tabs
            </li>
            <li class="flex items-center">
              <svg class="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Role-based access control
            </li>
            <li class="flex items-center">
              <svg class="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Settings and management
            </li>
            <li class="flex items-center">
              <svg class="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Analytics and reporting
            </li>
            <li class="flex items-center">
              <svg class="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Mobile responsive design
            </li>
            <li class="flex items-center">
              <svg class="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Persistent and temporary variants
            </li>
          </ul>
        </div>

        <div>
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Use Cases</h3>
          <ul class="space-y-2 text-sm text-gray-600">
            <li>• Enterprise workspace management</li>
            <li>• Multi-tenant organization systems</li>
            <li>• SaaS application navigation</li>
            <li>• Admin dashboard interfaces</li>
            <li>• Collaboration platform menus</li>
            <li>• Virtual office applications</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Sidebar from './Sidebar.vue'

// Reactive state
const sidebarOpen = ref(false)
const sidebarVariant = ref<'persistent' | 'temporary'>('persistent')
const userRole = ref<'admin' | 'member' | 'guest'>('admin')
const userStatus = ref<'online' | 'away' | 'busy'>('online')
const showOrganization = ref(true)
const hasSettings = ref(true)
const eventLog = ref<Array<{ timestamp: string; message: string }>>([])

// Mock data
const mockOrganization = ref({
  id: 'org-1',
  name: 'Acme Corporation',
  description: 'Enterprise organization',
  type: 'private'
})

const mockWorkspace = ref({
  id: 'workspace-1',
  name: 'Main Office',
  description: 'Primary workspace for team collaboration',
  type: 'private',
  domain: 'acme-office.ovice.in',
  valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
})

const mockUser = computed(() => ({
  id: 'user-1',
  name: 'John Doe',
  email: 'john@acme.com',
  role: userRole.value,
  status: userStatus.value,
  permissions: [
    'organization_settings',
    'analytics',
    'remote_work_report',
    'meeting_logs',
    'space_insights',
    'customize_space'
  ]
}))

// Computed properties
const isAdmin = computed(() => userRole.value === 'admin')

// Methods
const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
  addEvent(`Sidebar ${sidebarOpen.value ? 'opened' : 'closed'}`)
}

const handleLeaveWorkspace = () => {
  addEvent('User left workspace')
  // Simulate leaving workspace
  setTimeout(() => {
    addEvent('Redirecting to workspace selection...')
  }, 1000)
}

const addEvent = (message: string) => {
  const timestamp = new Date().toLocaleTimeString()
  eventLog.value.unshift({ timestamp, message })

  // Keep only last 10 events
  if (eventLog.value.length > 10) {
    eventLog.value = eventLog.value.slice(0, 10)
  }
}

// Watch for changes
watch(sidebarVariant, (newValue) => {
  addEvent(`Sidebar variant changed to: ${newValue}`)
})

watch(userRole, (newValue) => {
  addEvent(`User role changed to: ${newValue}`)
})

watch(userStatus, (newValue) => {
  addEvent(`User status changed to: ${newValue}`)
})

watch(showOrganization, (newValue) => {
  addEvent(`Organization tab ${newValue ? 'enabled' : 'disabled'}`)
})

// Initialize
addEvent('Sidebar component initialized')
</script>

<style scoped>
.sidebar-example {
  min-height: 100vh;
  background-color: #f9fafb;
}
</style>
