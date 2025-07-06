<template>
  <div class="p-6 space-y-6">
    <h2 class="text-2xl font-bold">Completed Dialog Examples</h2>

    <!-- Basic Examples -->
    <div>
      <h3 class="text-lg font-semibold mb-4">Basic Examples</h3>
      <div class="flex flex-wrap gap-2">
        <button
          @click="basicDialog = true"
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Basic Dialog
        </button>
        <button
          @click="successDialog = true"
          class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          Success Dialog
        </button>
        <button
          @click="warningDialog = true"
          class="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
        >
          Warning Dialog
        </button>
        <button
          @click="errorDialog = true"
          class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Error Dialog
        </button>
      </div>
    </div>

    <!-- Size Examples -->
    <div>
      <h3 class="text-lg font-semibold mb-4">Different Sizes</h3>
      <div class="flex flex-wrap gap-2">
        <button
          @click="smallDialog = true"
          class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
        >
          Small Dialog
        </button>
        <button
          @click="mediumDialog = true"
          class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
        >
          Medium Dialog
        </button>
        <button
          @click="largeDialog = true"
          class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
        >
          Large Dialog
        </button>
      </div>
    </div>

    <!-- Text Alignment Examples -->
    <div>
      <h3 class="text-lg font-semibold mb-4">Text Alignment</h3>
      <div class="flex flex-wrap gap-2">
        <button
          @click="leftAlignDialog = true"
          class="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
        >
          Left Align
        </button>
        <button
          @click="centerAlignDialog = true"
          class="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
        >
          Center Align
        </button>
        <button
          @click="rightAlignDialog = true"
          class="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
        >
          Right Align
        </button>
      </div>
    </div>

    <!-- Custom Examples -->
    <div>
      <h3 class="text-lg font-semibold mb-4">Custom Examples</h3>
      <div class="flex flex-wrap gap-2">
        <button
          @click="uploadCompleteDialog = true"
          class="px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 transition-colors"
        >
          Upload Complete
        </button>
        <button
          @click="deleteConfirmDialog = true"
          class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Delete Confirmation
        </button>
        <button
          @click="customActionsDialog = true"
          class="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
        >
          Custom Actions
        </button>
        <button
          @click="persistentDialog = true"
          class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        >
          Persistent Dialog
        </button>
      </div>
    </div>

    <!-- Event Log -->
    <div>
      <h3 class="text-lg font-semibold mb-4">Event Log</h3>
      <div class="bg-gray-100 p-3 rounded text-sm max-h-32 overflow-y-auto">
        <div v-if="eventLog.length === 0" class="text-gray-500">
          No events yet. Open a dialog to see events.
        </div>
        <div v-for="event in eventLog" :key="event.id" class="text-gray-700">
          {{ event.timestamp }}: {{ event.message }}
        </div>
      </div>
    </div>

    <!-- Basic Dialog -->
    <CompletedDialog
      v-model="basicDialog"
      title="Operation Completed"
      description="Your request has been processed successfully."
      @close="logEvent('Basic dialog closed')"
      @button-click="logEvent('Basic dialog button clicked')"
    />

    <!-- Success Dialog -->
    <CompletedDialog
      v-model="successDialog"
      title="Success!"
      description="Your file has been uploaded successfully."
      button-label="Continue"
      :icon="SuccessIcon"
      @close="logEvent('Success dialog closed')"
    />

    <!-- Warning Dialog -->
    <CompletedDialog
      v-model="warningDialog"
      title="Warning"
      description="This action cannot be undone. Please proceed with caution."
      button-label="I Understand"
      :icon="WarningIcon"
      @close="logEvent('Warning dialog closed')"
    />

    <!-- Error Dialog -->
    <CompletedDialog
      v-model="errorDialog"
      title="Error Occurred"
      description="Something went wrong. Please try again later."
      button-label="Retry"
      :icon="ErrorIcon"
      @close="logEvent('Error dialog closed')"
    />

    <!-- Small Dialog -->
    <CompletedDialog
      v-model="smallDialog"
      title="Small Dialog"
      description="This is a small dialog."
      size="small"
      @close="logEvent('Small dialog closed')"
    />

    <!-- Medium Dialog -->
    <CompletedDialog
      v-model="mediumDialog"
      title="Medium Dialog"
      description="This is a medium dialog with more content space."
      size="medium"
      @close="logEvent('Medium dialog closed')"
    />

    <!-- Large Dialog -->
    <CompletedDialog
      v-model="largeDialog"
      title="Large Dialog"
      description="This is a large dialog that can accommodate more content and longer descriptions."
      size="large"
      @close="logEvent('Large dialog closed')"
    />

    <!-- Left Align Dialog -->
    <CompletedDialog
      v-model="leftAlignDialog"
      title="Left Aligned"
      description="This dialog has left-aligned text content."
      text-align="left"
      icon="📝"
      @close="logEvent('Left align dialog closed')"
    />

    <!-- Center Align Dialog -->
    <CompletedDialog
      v-model="centerAlignDialog"
      title="Center Aligned"
      description="This dialog has center-aligned text content."
      text-align="center"
      icon="🎯"
      @close="logEvent('Center align dialog closed')"
    />

    <!-- Right Align Dialog -->
    <CompletedDialog
      v-model="rightAlignDialog"
      title="Right Aligned"
      description="This dialog has right-aligned text content."
      text-align="right"
      icon="👉"
      @close="logEvent('Right align dialog closed')"
    />

    <!-- Upload Complete Dialog -->
    <CompletedDialog
      v-model="uploadCompleteDialog"
      title="Upload Complete"
      description="Your files have been uploaded successfully to the server."
      button-label="View Files"
      :icon="UploadIcon"
      @close="logEvent('Upload complete dialog closed')"
      @button-click="logEvent('View files clicked')"
    />

    <!-- Delete Confirmation Dialog -->
    <CompletedDialog
      v-model="deleteConfirmDialog"
      title="Delete Confirmation"
      description="Are you sure you want to delete this item? This action cannot be undone."
      button-label="Delete"
      :icon="TrashIcon"
      @close="logEvent('Delete confirmation closed')"
      @button-click="handleDelete"
    >
      <template #actions>
        <div class="flex gap-2 justify-center">
          <button
            @click="deleteConfirmDialog = false"
            class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
          <button
            @click="handleDelete"
            class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </template>
    </CompletedDialog>

    <!-- Custom Actions Dialog -->
    <CompletedDialog
      v-model="customActionsDialog"
      title="Custom Actions"
      description="This dialog has custom action buttons."
      icon="⚙️"
      @close="logEvent('Custom actions dialog closed')"
    >
      <template #actions>
        <div class="flex gap-2 justify-center">
          <button
            @click="logEvent('Save clicked'); customActionsDialog = false"
            class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            Save
          </button>
          <button
            @click="logEvent('Save & Close clicked'); customActionsDialog = false"
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Save & Close
          </button>
          <button
            @click="logEvent('Cancel clicked'); customActionsDialog = false"
            class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      </template>
    </CompletedDialog>

    <!-- Persistent Dialog -->
    <CompletedDialog
      v-model="persistentDialog"
      title="Persistent Dialog"
      description="This dialog cannot be closed by clicking outside or pressing Escape."
      button-label="Close"
      persistent
      icon="🔒"
      @close="logEvent('Persistent dialog closed')"
      @button-click="logEvent('Persistent dialog button clicked')"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue';
import CompletedDialog from './CompletedDialog.vue';
import { SuccessIcon, WarningIcon, ErrorIcon, UploadIcon, TrashIcon } from './Icons.vue';

// Dialog states
const basicDialog = ref(false);
const successDialog = ref(false);
const warningDialog = ref(false);
const errorDialog = ref(false);
const smallDialog = ref(false);
const mediumDialog = ref(false);
const largeDialog = ref(false);
const leftAlignDialog = ref(false);
const centerAlignDialog = ref(false);
const rightAlignDialog = ref(false);
const uploadCompleteDialog = ref(false);
const deleteConfirmDialog = ref(false);
const customActionsDialog = ref(false);
const persistentDialog = ref(false);

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

const handleDelete = () => {
  logEvent('Item deleted');
  deleteConfirmDialog.value = false;
};
</script>
