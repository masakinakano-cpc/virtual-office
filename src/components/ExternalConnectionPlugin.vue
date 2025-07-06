<template>
  <div class="flex flex-col h-full w-full">
    <!-- Main Content Area -->
    <div class="flex-1 p-12 bg-white overflow-auto">
      <div class="flex flex-col gap-8 items-center justify-center h-full">
        <!-- Icon and Status Message -->
        <div class="flex flex-row gap-8 items-center">
          <!-- Icon -->
          <div class="flex max-w-[270px] min-w-[100px]">
            <component :is="statusIcon" class="w-full h-full" />
          </div>

          <!-- Status Text -->
          <p class="text-base text-gray-900 whitespace-pre-wrap max-w-md text-center">
            {{ statusMessage }}
          </p>
        </div>

        <!-- URL Display for Guests -->
        <div v-if="!isOwner && url" class="flex flex-row gap-2 max-w-[704px] w-full items-center justify-center">
          <div class="flex-1">
            <input
              :value="url"
              disabled
              class="w-full min-h-[44px] px-3 py-2 bg-white border border-gray-200 rounded-md text-gray-900"
            />
          </div>
          <CopyButton :url="url" />
        </div>
      </div>
    </div>

    <!-- URL Input Area (Owner Only) -->
    <div v-if="isOwner" class="flex flex-row p-1 gap-1.5">
      <!-- URL Input -->
      <div class="flex-1">
        <input
          v-model="inputUrl"
          @input="handleUrlInput"
          type="url"
          :placeholder="$t('workspace.plugin.generalExternalConnection.urlPlaceholder', 'Enter URL...')"
          :class="[
            'w-full min-h-[44px] px-3 py-2 rounded-md border transition-colors',
            urlError
              ? 'bg-white border-red-500 text-red-600'
              : 'bg-white border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
          ]"
        />
      </div>

      <!-- Copy Button -->
      <CopyButton :url="url" :disabled="!isSameUrl || !url" />

      <!-- Save Button -->
      <button
        @click="handleSave"
        :disabled="isDisabled"
        :class="[
          'min-w-[94px] px-4 py-2 rounded-lg text-sm font-medium transition-colors',
          isDisabled
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-cyan-400 text-gray-900 hover:bg-cyan-600'
        ]"
      >
        {{ $t('workspace.plugin.generalExternalConnection.save', 'Save') }}
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import CopyButton from './CopyButton.vue';

// Icons (you would import these from your icon library)
const ConnectedIcon = () => '🔗'; // Connected state icon
const DisconnectedIcon = () => '🔌'; // Disconnected state icon

export interface ExternalConnectionProps {
  url?: string;
  isOwner?: boolean;
  isConnected?: boolean;
}

const props = withDefaults(defineProps<ExternalConnectionProps>(), {
  url: '',
  isOwner: false,
  isConnected: false,
});

const emit = defineEmits<{
  'url-change': [url: string];
  'save': [url: string];
}>();

// State
const inputUrl = ref(props.url);
const urlError = ref(false);

// Utility function to validate URL
const isValidUrl = (urlString: string): boolean => {
  if (!urlString.trim()) return true; // Empty is valid

  try {
    new URL(urlString);
    return true;
  } catch {
    // Try with http:// prefix
    const prefixedUrl = `http://${urlString}`;
    try {
      new URL(prefixedUrl);
      return true;
    } catch {
      return false;
    }
  }
};

// Computed
const statusIcon = computed(() => {
  return props.url ? ConnectedIcon : DisconnectedIcon;
});

const statusMessage = computed(() => {
  if (props.isOwner) {
    return props.url
      ? $t('workspace.plugin.generalExternalConnection.ownerURLSet', 'URL has been set. Participants can access the external content.')
      : $t('workspace.plugin.generalExternalConnection.ownerURLNotSet', 'No URL set. Set a URL to allow participants to access external content.');
  } else {
    if (props.url) {
      return props.isConnected
        ? $t('workspace.plugin.generalExternalConnection.guestURLSetConnected', 'Connected to external content.')
        : $t('workspace.plugin.generalExternalConnection.guestURLSetNotConnected', 'External content is available but not connected.');
    } else {
      return props.isConnected
        ? $t('workspace.plugin.generalExternalConnection.guestURLNotSetConnected', 'Connected but no external content set.')
        : $t('workspace.plugin.generalExternalConnection.guestURLNotSetNotConnected', 'No external content available.');
    }
  }
});

const isSameUrl = computed(() => {
  return inputUrl.value === props.url;
});

const isEmpty = computed(() => {
  return !inputUrl.value && !props.url;
});

const isDisabled = computed(() => {
  return isEmpty.value || urlError.value || isSameUrl.value;
});

// Methods
const handleUrlInput = () => {
  urlError.value = !isValidUrl(inputUrl.value);
  emit('url-change', inputUrl.value);
};

const handleSave = () => {
  if (isDisabled.value) return;

  let finalUrl = inputUrl.value.trim();

  // Add http:// if no protocol specified
  if (finalUrl && !finalUrl.match(/^https?:\/\//)) {
    finalUrl = `http://${finalUrl}`;
  }

  emit('save', finalUrl);
};

// Simple translation function (replace with your i18n solution)
const $t = (_key: string, fallback: string) => {
  // In a real app, this would use your i18n library
  return fallback;
};

// Watch for prop changes
watch(() => props.url, (newUrl) => {
  inputUrl.value = newUrl;
});
</script>
