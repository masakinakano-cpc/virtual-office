<template>
  <div class="workspace-panel h-full flex flex-col">
    <!-- Workspace Info -->
    <div class="p-4 border-b">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m11 0a2 2 0 01-2 2H7a2 2 0 01-2-2m2-16h6m-6 0V3a1 1 0 011-1h4a1 1 0 011 1v2M9 7h6m-6 4h6m-6 4h6" />
          </svg>
        </div>
        <div class="flex-1">
          <h3 class="text-sm font-medium text-gray-900">{{ workspace?.name || 'Workspace' }}</h3>
          <p class="text-xs text-gray-500">{{ workspace?.description || 'Workspace settings and management' }}</p>
        </div>
        <div v-if="workspace?.type === 'private'" class="flex items-center">
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Workspace Menu Items -->
    <div class="flex-1 overflow-y-auto">
      <div class="py-2">
        <!-- Workspace Settings -->
        <MenuItem
          v-if="isAllowedToAccessSettings"
          :icon="SettingsIcon"
          label="Workspace Settings"
          :divider="true"
          @click="openWorkspaceSettings"
          data-testid="spaceSettings"
        />

        <!-- Customize Space -->
        <MenuItem
          v-if="canCustomizeSpace"
          :icon="CustomizeIcon"
          label="Customize Space"
          :divider="true"
          @click="openCustomizeSpace"
          data-testid="customizeSpace"
        />

        <!-- Space Billing -->
        <MenuItem
          v-if="hasSpaceBilling"
          :icon="CreditCardIcon"
          label="Manage Billing Plans"
          :divider="true"
          @click="openSpaceBilling"
          data-testid="spaceBilling"
        />

        <!-- Space Analytics -->
        <MenuItem
          v-if="hasSpaceAnalytics"
          :icon="ChartIcon"
          label="Space Analytics"
          :divider="true"
          @click="openSpaceAnalytics"
          data-testid="space-insights"
        />

        <!-- Download App -->
        <MenuItem
          v-if="showDownloadApp"
          :icon="DownloadIcon"
          label="Download App"
          :divider="true"
          @click="downloadApp"
          data-testid="downloadApp"
        />
      </div>
    </div>

    <!-- Default Sidebar Items -->
    <div class="border-t">
      <DefaultSidebarItems
        :workspace="defaultSidebarItems.workspace"
        :user="defaultSidebarItems.user"
        :is-admin="defaultSidebarItems.isAdmin"
        @leave-workspace="$emit('leaveWorkspace')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MenuItem from './MenuItem.vue'
import DefaultSidebarItems from './DefaultSidebarItems.vue'

// Icons
const SettingsIcon = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
</svg>`

const CustomizeIcon = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
</svg>`

const CreditCardIcon = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
</svg>`

const ChartIcon = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
</svg>`

const DownloadIcon = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
</svg>`

// Props
interface Props {
  workspace?: any
  user?: any
  isAdmin?: boolean
  isAllowedToAccessSettings?: boolean
  defaultSidebarItems?: any
}

const props = withDefaults(defineProps<Props>(), {
  isAdmin: false,
  isAllowedToAccessSettings: false
})

// Emits
// const emit = defineEmits<{
//   leaveWorkspace: []
// }>()

// Computed properties
const canCustomizeSpace = computed(() => {
  return props.isAdmin || props.user?.permissions?.includes('customize_space')
})

const hasSpaceBilling = computed(() => {
  return props.isAdmin && props.workspace?.enabledBillingMethods?.includes('space_billing')
})

const hasSpaceAnalytics = computed(() => {
  return props.user?.permissions?.includes('space_insights') || props.isAdmin
})

const showDownloadApp = computed(() => {
  // Show download app if desktop app is available and user doesn't have it
  return !isDesktopApp() && hasDesktopAppPromotion()
})

// Methods
const openWorkspaceSettings = () => {
  if (!props.workspace || !props.user) return

  const baseUrl = getWorkspaceBaseUrl()
  const settingsPath = props.isAdmin ? '' : 'user_list'
  const url = `${baseUrl}settings/${settingsPath}`
  window.open(url, '_blank')
}

const openCustomizeSpace = () => {
  if (!props.workspace || !props.user) return

  const baseUrl = getWorkspaceBaseUrl()
  const url = `${baseUrl}customize/`
  window.open(url, '_blank')
}

const openSpaceBilling = async () => {
  if (!props.workspace) return

  try {
    if (isLegacyBilling()) {
      const baseUrl = getWorkspaceBaseUrl()
      const url = `${baseUrl}legacy_billing`
      window.open(url, '_blank')
    } else {
      // Handle modern billing portal
      const response = await fetch(`/api/v4/workspaces/${props.workspace.id}/legacy_customer/portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          return_url: window.location.href,
          locale: navigator.language
        })
      })

      const data = await response.json()
      if (data.success) {
        window.open(data.data.session_url, '_blank')
      }
    }
  } catch (error) {
    console.error('Failed to open billing:', error)
  }
}

const openSpaceAnalytics = () => {
  if (!props.workspace || !props.user) return

  const baseUrl = getWorkspaceBaseUrl()
  const url = `${baseUrl}insights/`
  window.open(url, '_blank')
}

const downloadApp = () => {
  const downloadUrl = getDesktopAppDownloadUrl()
  if (downloadUrl) {
    window.open(downloadUrl, '_blank')
  }
}

// Helper methods
const getWorkspaceBaseUrl = () => {
  if (props.workspace?.domain) {
    return `https://${props.workspace.domain}/`
  }
  return `${window.location.origin}/workspace/${props.workspace?.id}/`
}

// const getBaseUrl = () => {
//   return window.location.origin
// }

const isDesktopApp = () => {
  return !!(window as any).electron
}

const hasDesktopAppPromotion = () => {
  // This would typically come from a feature flag or configuration
  return true
}

const isLegacyBilling = () => {
  return props.workspace?.valid_until === null
}

const getDesktopAppDownloadUrl = () => {
  // This would typically come from a configuration service
  return 'https://ovice.in/download'
}
</script>

<style scoped>
.workspace-panel {
  background-color: #ffffff;
}
</style>
