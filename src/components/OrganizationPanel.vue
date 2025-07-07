<template>
  <div class="organization-panel h-full flex flex-col">
    <!-- Organization Info -->
    <div class="p-4 border-b">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m11 0a2 2 0 01-2 2H7a2 2 0 01-2-2m2-16h6m-6 0V3a1 1 0 011-1h4a1 1 0 011 1v2M9 7h6m-6 4h6m-6 4h6" />
          </svg>
        </div>
        <div class="flex-1">
          <h3 class="text-sm font-medium text-gray-900">{{ organization?.name || 'Organization' }}</h3>
          <p class="text-xs text-gray-500">{{ organization?.description || 'Organization settings and management' }}</p>
        </div>
        <div v-if="organization?.type === 'private'" class="flex items-center">
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Organization Menu Items -->
    <div class="flex-1 overflow-y-auto">
      <div class="py-2">
        <!-- Organization Settings -->
        <MenuItem
          v-if="hasOrganizationSettings"
          :icon="SettingsIcon"
          label="Organization Settings"
          :divider="true"
          @click="openOrganizationSettings"
          data-testid="organizationSettings"
        />

        <!-- Analytics -->
        <MenuItem
          v-if="hasAnalytics"
          :icon="ChartIcon"
          label="Analytics"
          :divider="true"
          @click="openAnalytics"
          data-testid="insights"
        />

        <!-- Remote Work Report -->
        <MenuItem
          v-if="hasRemoteWorkReport"
          :icon="ReportIcon"
          label="Remote Work Report"
          :divider="true"
          @click="openRemoteWorkReport"
          data-testid="remoteWorkReport"
        />

        <!-- Meeting Logs -->
        <MenuItem
          v-if="hasMeetingLogs"
          :icon="MeetingIcon"
          label="Meeting Logs"
          :divider="true"
          @click="openMeetingLogs"
          data-testid="meetingLogs"
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

const ChartIcon = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
</svg>`

const ReportIcon = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
</svg>`

const MeetingIcon = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
</svg>`

// Props
interface Props {
  organization?: any
  user?: any
  defaultSidebarItems?: any
}

const props = withDefaults(defineProps<Props>(), {})

// Emits
// const emit = defineEmits<{
//   leaveWorkspace: []
// }>()

// Computed properties
const hasOrganizationSettings = computed(() => {
  return props.user?.permissions?.includes('organization_settings') || props.user?.role === 'admin'
})

const hasAnalytics = computed(() => {
  return props.user?.permissions?.includes('analytics') || props.user?.role === 'admin'
})

const hasRemoteWorkReport = computed(() => {
  return props.user?.permissions?.includes('remote_work_report') || props.user?.role === 'admin'
})

const hasMeetingLogs = computed(() => {
  return props.user?.permissions?.includes('meeting_logs') || props.user?.role === 'admin'
})

// Methods
const openOrganizationSettings = () => {
  const baseUrl = getBaseUrl()
  const url = `${baseUrl}/settings/${props.organization?.id}`
  window.open(url, '_blank')
}

const openAnalytics = () => {
  const baseUrl = getBaseUrl()
  const url = `${baseUrl}/insights`
  window.open(url, '_blank')
}

const openRemoteWorkReport = () => {
  const baseUrl = getBaseUrl()
  const url = `${baseUrl}/remoteWorkReport`
  window.open(url, '_blank')
}

const openMeetingLogs = () => {
  const baseUrl = getBaseUrl()
  const url = `${baseUrl}/meeting_logs`
  window.open(url, '_blank')
}

const getBaseUrl = () => {
  // This would typically come from a configuration service
  return window.location.origin
}
</script>

<style scoped>
.organization-panel {
  background-color: #ffffff;
}
</style>
