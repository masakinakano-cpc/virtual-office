<template>
  <div class="p-6 space-y-6">
    <h2 class="text-2xl font-bold">External Connection Plugin Examples</h2>

    <!-- Controls -->
    <div class="bg-gray-100 p-4 rounded-lg">
      <h3 class="text-lg font-semibold mb-4">Demo Controls</h3>
      <div class="space-y-4">
        <!-- Role Toggle -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            User Role:
          </label>
          <div class="flex gap-2">
            <button
              @click="isOwner = true"
              :class="[
                'px-4 py-2 rounded transition-colors',
                isOwner
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              ]"
            >
              Owner
            </button>
            <button
              @click="isOwner = false"
              :class="[
                'px-4 py-2 rounded transition-colors',
                !isOwner
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              ]"
            >
              Guest
            </button>
          </div>
        </div>

        <!-- Connection Status Toggle -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Connection Status:
          </label>
          <div class="flex gap-2">
            <button
              @click="isConnected = true"
              :class="[
                'px-4 py-2 rounded transition-colors',
                isConnected
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              ]"
            >
              Connected
            </button>
            <button
              @click="isConnected = false"
              :class="[
                'px-4 py-2 rounded transition-colors',
                !isConnected
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              ]"
            >
              Disconnected
            </button>
          </div>
        </div>

        <!-- Preset URLs -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Preset URLs:
          </label>
          <div class="flex flex-wrap gap-2">
            <button
              @click="url = ''"
              class="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              Clear URL
            </button>
            <button
              @click="url = 'https://www.google.com'"
              class="px-3 py-1 text-sm bg-blue-200 text-blue-700 rounded hover:bg-blue-300 transition-colors"
            >
              Google
            </button>
            <button
              @click="url = 'https://github.com'"
              class="px-3 py-1 text-sm bg-purple-200 text-purple-700 rounded hover:bg-purple-300 transition-colors"
            >
              GitHub
            </button>
            <button
              @click="url = 'https://docs.google.com/spreadsheets'"
              class="px-3 py-1 text-sm bg-green-200 text-green-700 rounded hover:bg-green-300 transition-colors"
            >
              Google Sheets
            </button>
          </div>
        </div>

        <!-- Current State Display -->
        <div class="bg-white p-3 rounded border">
          <h4 class="font-medium mb-2">Current State:</h4>
          <div class="text-sm space-y-1">
            <div><strong>Role:</strong> {{ isOwner ? 'Owner' : 'Guest' }}</div>
            <div><strong>Connection:</strong> {{ isConnected ? 'Connected' : 'Disconnected' }}</div>
            <div><strong>URL:</strong> {{ url || '(No URL set)' }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Plugin Demo -->
    <div class="border border-gray-300 rounded-lg overflow-hidden" style="height: 400px;">
      <ExternalConnectionPlugin
        :url="url"
        :is-owner="isOwner"
        :is-connected="isConnected"
        @url-change="handleUrlChange"
        @save="handleSave"
      />
    </div>

    <!-- Event Log -->
    <div>
      <h3 class="text-lg font-semibold mb-4">Event Log</h3>
      <div class="bg-gray-100 p-3 rounded text-sm max-h-32 overflow-y-auto">
        <div v-if="eventLog.length === 0" class="text-gray-500">
          No events yet. Interact with the plugin to see events.
        </div>
        <div v-for="event in eventLog" :key="event.id" class="text-gray-700">
          {{ event.timestamp }}: {{ event.message }}
        </div>
      </div>
    </div>

    <!-- Usage Examples -->
    <div>
      <h3 class="text-lg font-semibold mb-4">Usage Examples</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Example 1: Owner with URL -->
        <div class="border border-gray-200 rounded-lg p-4">
          <h4 class="font-medium mb-2">Owner with URL Set</h4>
          <div class="h-48 border border-gray-300 rounded overflow-hidden">
            <ExternalConnectionPlugin
              url="https://www.example.com"
              :is-owner="true"
              :is-connected="true"
              @url-change="logEvent('Example 1: URL changed')"
              @save="logEvent('Example 1: URL saved')"
            />
          </div>
        </div>

        <!-- Example 2: Owner without URL -->
        <div class="border border-gray-200 rounded-lg p-4">
          <h4 class="font-medium mb-2">Owner without URL</h4>
          <div class="h-48 border border-gray-300 rounded overflow-hidden">
            <ExternalConnectionPlugin
              url=""
              :is-owner="true"
              :is-connected="false"
              @url-change="logEvent('Example 2: URL changed')"
              @save="logEvent('Example 2: URL saved')"
            />
          </div>
        </div>

        <!-- Example 3: Guest with URL -->
        <div class="border border-gray-200 rounded-lg p-4">
          <h4 class="font-medium mb-2">Guest with URL (Connected)</h4>
          <div class="h-48 border border-gray-300 rounded overflow-hidden">
            <ExternalConnectionPlugin
              url="https://docs.google.com/presentation"
              :is-owner="false"
              :is-connected="true"
            />
          </div>
        </div>

        <!-- Example 4: Guest without URL -->
        <div class="border border-gray-200 rounded-lg p-4">
          <h4 class="font-medium mb-2">Guest without URL</h4>
          <div class="h-48 border border-gray-300 rounded overflow-hidden">
            <ExternalConnectionPlugin
              url=""
              :is-owner="false"
              :is-connected="false"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Use Cases -->
    <div>
      <h3 class="text-lg font-semibold mb-4">Common Use Cases</h3>
      <div class="space-y-4">
        <div class="bg-blue-50 p-4 rounded-lg">
          <h4 class="font-medium text-blue-900 mb-2">📊 Collaborative Documents</h4>
          <p class="text-blue-800 text-sm">
            Share Google Docs, Sheets, or Slides for real-time collaboration during meetings.
          </p>
          <button
            @click="setUseCase('https://docs.google.com/document/d/example')"
            class="mt-2 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
          >
            Try Example
          </button>
        </div>

        <div class="bg-green-50 p-4 rounded-lg">
          <h4 class="font-medium text-green-900 mb-2">🎨 Design Tools</h4>
          <p class="text-green-800 text-sm">
            Connect to Figma, Miro, or other design tools for collaborative design sessions.
          </p>
          <button
            @click="setUseCase('https://www.figma.com/file/example')"
            class="mt-2 px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
          >
            Try Example
          </button>
        </div>

        <div class="bg-purple-50 p-4 rounded-lg">
          <h4 class="font-medium text-purple-900 mb-2">💻 Development Tools</h4>
          <p class="text-purple-800 text-sm">
            Share code repositories, documentation, or development environments.
          </p>
          <button
            @click="setUseCase('https://github.com/example/project')"
            class="mt-2 px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 transition-colors"
          >
            Try Example
          </button>
        </div>

        <div class="bg-orange-50 p-4 rounded-lg">
          <h4 class="font-medium text-orange-900 mb-2">📹 Media Content</h4>
          <p class="text-orange-800 text-sm">
            Stream videos, presentations, or other media content for team viewing.
          </p>
          <button
            @click="setUseCase('https://www.youtube.com/watch?v=example')"
            class="mt-2 px-3 py-1 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 transition-colors"
          >
            Try Example
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue';
import ExternalConnectionPlugin from './ExternalConnectionPlugin.vue';

// State
const url = ref('');
const isOwner = ref(true);
const isConnected = ref(false);

// Event logging
const eventLog = reactive<Array<{ id: number; timestamp: string; message: string }>>([]);
let eventCounter = 0;

const logEvent = (message: string) => {
  const now = new Date();
  const timestamp = now.toLocaleTimeString();
  eventLog.unshift({
    id: ++eventCounter,
    timestamp,
    message,
  });

  // Keep only last 20 events
  if (eventLog.length > 20) {
    eventLog.splice(20);
  }
};

// Event handlers
const handleUrlChange = (newUrl: string) => {
  logEvent(`URL changed: ${newUrl || '(empty)'}`);
};

const handleSave = (savedUrl: string) => {
  url.value = savedUrl;
  logEvent(`URL saved: ${savedUrl}`);
};

// Use case examples
const setUseCase = (exampleUrl: string) => {
  url.value = exampleUrl;
  isOwner.value = true;
  isConnected.value = true;
  logEvent(`Use case example set: ${exampleUrl}`);
};
</script>
