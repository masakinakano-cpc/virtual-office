<template>
  <div class="default-sidebar-items">
    <div class="py-2">
      <!-- Download App (if available) -->
      <MenuItem
        v-if="showDownloadApp"
        :icon="DownloadIcon"
        label="Download App"
        :divider="true"
        @click="downloadApp"
        data-testid="downloadApp"
      />

      <!-- Help Center -->
      <MenuItem
        :icon="HelpIcon"
        label="Help Center"
        :divider="isAdmin"
        @click="openHelpCenter"
        data-testid="helpCenter"
      />

      <!-- Contact Support (Admin only) -->
      <MenuItem
        v-if="isAdmin"
        :icon="SupportIcon"
        label="Contact Support"
        @click="openContactSupport"
        data-testid="contactSupport"
      />

      <!-- Divider before Leave Workspace -->
      <div v-if="user?.status !== 'away'" class="border-t my-2"></div>

      <!-- Leave Workspace -->
      <MenuItem
        v-if="user?.status !== 'away'"
        :icon="LeaveIcon"
        label="Leave the Space"
        variant="error"
        :disabled="leaveLoading"
        @click="handleLeaveWorkspace"
        data-testid="leaveSpace"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import MenuItem from './MenuItem.vue'

// Icons
const DownloadIcon = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
</svg>`

const HelpIcon = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
</svg>`

const SupportIcon = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5zM12 6.75a5.25 5.25 0 100 10.5 5.25 5.25 0 000-10.5z" />
</svg>`

const LeaveIcon = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
</svg>`

// Props
interface Props {
  workspace?: any
  user?: any
  isAdmin?: boolean
}

withDefaults(defineProps<Props>(), {
  isAdmin: false
})

// Emits
const emit = defineEmits<{
  leaveWorkspace: []
}>()

// Reactive state
const leaveLoading = ref(false)

// Computed properties
const showDownloadApp = computed(() => {
  // Show download app if desktop app is available and user doesn't have it
  return !isDesktopApp() && hasDesktopAppPromotion()
})

// Methods
const downloadApp = () => {
  const downloadUrl = getDesktopAppDownloadUrl()
  if (downloadUrl) {
    window.open(downloadUrl, '_blank')
  }
}

const openHelpCenter = () => {
  const helpUrl = getHelpCenterUrl()
  window.open(helpUrl, '_blank')
}

const openContactSupport = () => {
  const supportUrl = getContactSupportUrl()
  window.open(supportUrl, '_blank')
}

const handleLeaveWorkspace = async () => {
  if (leaveLoading.value) return

  try {
    leaveLoading.value = true

    // Show confirmation dialog
    const confirmed = await showConfirmDialog()
    if (!confirmed) return

    // Close any active connections
    await closeConnections()

    // Emit leave workspace event
    emit('leaveWorkspace')

  } catch (error) {
    console.error('Failed to leave workspace:', error)
  } finally {
    leaveLoading.value = false
  }
}

// Helper methods
const isDesktopApp = () => {
  return !!(window as any).electron
}

const hasDesktopAppPromotion = () => {
  // This would typically come from a feature flag or configuration
  return true
}

const getDesktopAppDownloadUrl = () => {
  // This would typically come from a configuration service
  return 'https://ovice.in/download'
}

const getHelpCenterUrl = () => {
  return 'https://help.ovice.in'
}

const getContactSupportUrl = () => {
  return 'https://ovice.in/contact'
}

const showConfirmDialog = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const confirmed = window.confirm('Are you sure you want to leave this workspace?')
    resolve(confirmed)
  })
}

const closeConnections = async () => {
  // Close WebRTC connections, websockets, etc.
  try {
    // This would typically interact with your connection manager
    if ((window as any).connectionManager) {
      await (window as any).connectionManager.close()
    }
  } catch (error) {
    console.error('Failed to close connections:', error)
  }
}
</script>

<style scoped>
.default-sidebar-items {
  background-color: #ffffff;
}
</style>
