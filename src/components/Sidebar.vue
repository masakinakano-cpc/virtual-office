<template>
  <div class="sidebar-container">
    <!-- Mobile Sidebar Overlay -->
    <div
      v-if="isMobileOpen"
      class="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
      @click="closeMobileSidebar"
    />

    <!-- Sidebar -->
    <div
      :class="[
        'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      ]"
    >
      <!-- Sidebar Header -->
      <div class="flex items-center justify-between p-4 border-b">
        <h2 class="text-lg font-semibold text-gray-800">
          {{ currentTab === 'organization' ? 'Organization' : 'Workspace' }}
        </h2>
        <button
          @click="closeMobileSidebar"
          class="lg:hidden p-1 rounded-md hover:bg-gray-100"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Tab Navigation -->
      <div class="flex border-b" v-if="showTabs">
        <button
          @click="currentTab = 'organization'"
          :class="[
            'flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors',
            currentTab === 'organization'
              ? 'border-blue-500 text-blue-600 bg-blue-50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          ]"
        >
          Organization
        </button>
        <button
          @click="currentTab = 'workspace'"
          :class="[
            'flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors',
            currentTab === 'workspace'
              ? 'border-blue-500 text-blue-600 bg-blue-50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          ]"
        >
          Workspace
        </button>
      </div>

      <!-- Sidebar Content -->
      <div class="flex flex-col h-full">
        <!-- Organization Tab -->
        <div v-if="currentTab === 'organization' && showTabs" class="flex-1 overflow-y-auto">
          <OrganizationPanel
            :organization="organization"
            :user="user"
            :default-sidebar-items="defaultSidebarItems"
            @leave-workspace="handleLeaveWorkspace"
          />
        </div>

        <!-- Workspace Tab -->
        <div v-if="currentTab === 'workspace' || !showTabs" class="flex-1 overflow-y-auto">
          <WorkspacePanel
            :workspace="workspace"
            :user="user"
            :is-admin="isAdmin"
            :is-allowed-to-access-settings="isAllowedToAccessSettings"
            :default-sidebar-items="defaultSidebarItems"
            @leave-workspace="handleLeaveWorkspace"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
// import { useRouter } from 'vue-router'
import OrganizationPanel from './OrganizationPanel.vue'
import WorkspacePanel from './WorkspacePanel.vue'
// import DefaultSidebarItems from './DefaultSidebarItems.vue'

// Props
interface Props {
  open?: boolean
  variant?: 'persistent' | 'temporary'
  workspace?: any
  user?: any
  organization?: any
  isAdmin?: boolean
  isAllowedToAccessSettings?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  variant: 'persistent',
  isAdmin: false,
  isAllowedToAccessSettings: false
})

// Emits
const emit = defineEmits<{
  close: []
  leaveWorkspace: []
}>()

// Reactive state
const currentTab = ref<'organization' | 'workspace'>('workspace')
const isMobileOpen = ref(false)
// const router = useRouter()

// Computed properties
const showTabs = computed(() => {
  return props.organization && props.workspace && hasOrganizationFeatures.value
})

const hasOrganizationFeatures = computed(() => {
  if (!props.organization || !props.workspace) return false

  // Check if user has access to organization features
  const hasOrgSettings = props.user?.permissions?.includes('organization_settings')
  const hasBilling = props.workspace?.enabledBillingMethods?.includes('user_billing')
  const hasAnalytics = props.user?.permissions?.includes('analytics')
  const hasMeetingLogs = props.user?.permissions?.includes('meeting_logs')

  return hasOrgSettings || hasBilling || hasAnalytics || hasMeetingLogs
})

const defaultSidebarItems = computed(() => {
  return {
    workspace: props.workspace,
    user: props.user,
    isAdmin: props.isAdmin
  }
})

// Methods
const closeMobileSidebar = () => {
  isMobileOpen.value = false
  emit('close')
}

const handleLeaveWorkspace = async () => {
  try {
    // Implement leave workspace logic
    console.log('Leaving workspace...')
    emit('leaveWorkspace')
  } catch (error) {
    console.error('Failed to leave workspace:', error)
  }
}

// Lifecycle
onMounted(() => {
  // Set initial tab based on available features
  if (showTabs.value) {
    currentTab.value = 'workspace'
  }
})

// Watch for mobile sidebar state
import { watch } from 'vue'
watch(() => props.open, (newValue) => {
  if (props.variant === 'temporary') {
    isMobileOpen.value = newValue
  }
})
</script>

<style scoped>
.sidebar-container {
  position: relative;
}

/* Custom scrollbar */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
</style>
