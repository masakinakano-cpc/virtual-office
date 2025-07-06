<template>
  <div class="p-6 space-y-6">
    <h2 class="text-2xl font-bold">Confirm Dialog Examples</h2>

    <!-- Basic Examples -->
    <div>
      <h3 class="text-lg font-semibold mb-4">Basic Examples</h3>
      <div class="flex flex-wrap gap-2">
        <button
          @click="basicConfirm = true"
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Basic Confirm
        </button>
        <button
          @click="deleteConfirm = true"
          class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Delete Confirm
        </button>
        <button
          @click="warningConfirm = true"
          class="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
        >
          Warning Confirm
        </button>
        <button
          @click="revampedUIConfirm = true"
          class="px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 transition-colors"
        >
          Revamped UI
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
          @click="largeDialog = true"
          class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
        >
          Large Dialog
        </button>
        <button
          @click="customWidthDialog = true"
          class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
        >
          Custom Width
        </button>
      </div>
    </div>

    <!-- Promise-based Examples -->
    <div>
      <h3 class="text-lg font-semibold mb-4">Promise-based Operations</h3>
      <div class="flex flex-wrap gap-2">
        <button
          @click="handlePromiseBasedConfirm"
          class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          Promise Confirm
        </button>
        <button
          @click="handleDeleteItem"
          class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Delete Item
        </button>
        <button
          @click="handleSaveChanges"
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Save Changes
        </button>
        <button
          @click="handleLogout"
          class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>

    <!-- Advanced Examples -->
    <div>
      <h3 class="text-lg font-semibold mb-4">Advanced Examples</h3>
      <div class="flex flex-wrap gap-2">
        <button
          @click="borderDialog = true"
          class="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
        >
          With Border
        </button>
        <button
          @click="counterDialog = true"
          class="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
        >
          With Counter
        </button>
        <button
          @click="persistentDialog = true"
          class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        >
          Persistent Dialog
        </button>
        <button
          @click="customContentDialog = true"
          class="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 transition-colors"
        >
          Custom Content
        </button>
      </div>
    </div>

    <!-- Event Log -->
    <div>
      <h3 class="text-lg font-semibold mb-4">Event Log</h3>
      <div class="bg-gray-100 p-3 rounded text-sm max-h-32 overflow-y-auto">
        <div v-if="eventLog.length === 0" class="text-gray-500">
          No events yet. Interact with dialogs to see events.
        </div>
        <div v-for="event in eventLog" :key="event.id" class="text-gray-700">
          {{ event.timestamp }}: {{ event.message }}
        </div>
      </div>
    </div>

    <!-- Basic Confirm Dialog -->
    <ConfirmDialog
      v-model="basicConfirm"
      title="Confirm Action"
      description="Are you sure you want to proceed with this action?"
      @confirm="logEvent('Basic confirmed')"
      @cancel="logEvent('Basic cancelled')"
    />

    <!-- Delete Confirm Dialog -->
    <ConfirmDialog
      v-model="deleteConfirm"
      title="Delete Item"
      description="This action cannot be undone. Are you sure you want to delete this item?"
      confirm-label="Delete"
      variant="error"
      @confirm="logEvent('Delete confirmed')"
      @cancel="logEvent('Delete cancelled')"
    />

    <!-- Warning Confirm Dialog -->
    <ConfirmDialog
      v-model="warningConfirm"
      title="Warning"
      description="This action may have unexpected consequences. Please proceed with caution."
      confirm-label="Continue"
      variant="warning"
      @confirm="logEvent('Warning confirmed')"
      @cancel="logEvent('Warning cancelled')"
    />

    <!-- Revamped UI Dialog -->
    <ConfirmDialog
      v-model="revampedUIConfirm"
      title="Revamped UI"
      description="This dialog uses the new revamped UI styling."
      revamped-u-i
      @confirm="logEvent('Revamped UI confirmed')"
      @cancel="logEvent('Revamped UI cancelled')"
    />

    <!-- Small Dialog -->
    <ConfirmDialog
      v-model="smallDialog"
      title="Small Dialog"
      description="This is a small dialog."
      size="small"
      @confirm="logEvent('Small dialog confirmed')"
      @cancel="logEvent('Small dialog cancelled')"
    />

    <!-- Large Dialog -->
    <ConfirmDialog
      v-model="largeDialog"
      title="Large Dialog"
      description="This is a large dialog with more space for content. It can accommodate longer descriptions and more complex layouts."
      size="large"
      @confirm="logEvent('Large dialog confirmed')"
      @cancel="logEvent('Large dialog cancelled')"
    />

    <!-- Custom Width Dialog -->
    <ConfirmDialog
      v-model="customWidthDialog"
      title="Custom Width"
      description="This dialog has a custom width setting."
      width="600px"
      @confirm="logEvent('Custom width confirmed')"
      @cancel="logEvent('Custom width cancelled')"
    />

    <!-- Border Dialog -->
    <ConfirmDialog
      v-model="borderDialog"
      title="Dialog with Border"
      description="This dialog includes a border separator between title and content."
      show-border
      @confirm="logEvent('Border dialog confirmed')"
      @cancel="logEvent('Border dialog cancelled')"
    />

    <!-- Counter Dialog -->
    <ConfirmDialog
      v-model="counterDialog"
      title="Dialog with Counter"
      description="This dialog shows a counter in the bottom right."
      :total-count="selectedItems"
      :limit="maxItems"
      @confirm="logEvent('Counter dialog confirmed')"
      @cancel="logEvent('Counter dialog cancelled')"
    >
      <div class="mb-4">
        <p class="text-sm text-gray-600 mb-2">Select items to see counter:</p>
        <div class="space-y-2">
          <label v-for="i in maxItems" :key="i" class="flex items-center">
            <input
              type="checkbox"
              :value="i"
              v-model="selectedItemsList"
              class="mr-2"
            />
            Item {{ i }}
          </label>
        </div>
      </div>
    </ConfirmDialog>

    <!-- Persistent Dialog -->
    <ConfirmDialog
      v-model="persistentDialog"
      title="Persistent Dialog"
      description="This dialog cannot be closed by clicking outside or pressing Escape. You must use the buttons."
      persistent
      show-close-button
      @confirm="logEvent('Persistent dialog confirmed')"
      @cancel="logEvent('Persistent dialog cancelled')"
    />

    <!-- Custom Content Dialog -->
    <ConfirmDialog
      v-model="customContentDialog"
      title="Custom Content"
      description="This dialog contains custom content with form elements."
      @confirm="handleCustomContentConfirm"
      @cancel="logEvent('Custom content cancelled')"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Your Name:
          </label>
          <input
            v-model="customName"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your name"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Reason:
          </label>
          <textarea
            v-model="customReason"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter reason"
          />
        </div>
      </div>
    </ConfirmDialog>

    <!-- Promise-based Dialogs (using composables) -->
    <ConfirmDialog
      v-model="promiseDialog.isOpen.value"
      :title="promiseDialog.title.value"
      :description="promiseDialog.description.value"
      :confirm-label="promiseDialog.confirmLabel.value"
      :cancel-label="promiseDialog.cancelLabel.value"
      :variant="promiseDialog.variant.value"
      @confirm="promiseDialog.handleConfirm"
      @cancel="promiseDialog.handleCancel"
      @close="promiseDialog.handleClose"
    />

    <ConfirmDialog
      v-model="deleteDialog.isOpen.value"
      :title="deleteDialog.title.value"
      :description="deleteDialog.description.value"
      :confirm-label="deleteDialog.confirmLabel.value"
      :cancel-label="deleteDialog.cancelLabel.value"
      :variant="deleteDialog.variant.value"
      @confirm="deleteDialog.handleConfirm"
      @cancel="deleteDialog.handleCancel"
      @close="deleteDialog.handleClose"
    />

    <ConfirmDialog
      v-model="saveDialog.isOpen.value"
      :title="saveDialog.title.value"
      :description="saveDialog.description.value"
      :confirm-label="saveDialog.confirmLabel.value"
      :cancel-label="saveDialog.cancelLabel.value"
      :variant="saveDialog.variant.value"
      @confirm="saveDialog.handleConfirm"
      @cancel="saveDialog.handleCancel"
      @close="saveDialog.handleClose"
    />

    <ConfirmDialog
      v-model="logoutDialog.isOpen.value"
      :title="logoutDialog.title.value"
      :description="logoutDialog.description.value"
      :confirm-label="logoutDialog.confirmLabel.value"
      :cancel-label="logoutDialog.cancelLabel.value"
      :variant="logoutDialog.variant.value"
      @confirm="logoutDialog.handleConfirm"
      @cancel="logoutDialog.handleCancel"
      @close="logoutDialog.handleClose"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed } from 'vue';
import ConfirmDialog from './ConfirmDialog.vue';
// Note: In a real app, you would import these from the composables file
// import { useConfirmDialogState, useDeleteConfirm, useSaveConfirm, useLogoutConfirm } from '@/composables/useConfirmDialog';

// Simple implementation for demo purposes
const useConfirmDialogState = () => {
  const isOpen = ref(false);
  const title = ref('');
  const description = ref('');
  const confirmLabel = ref('Confirm');
  const cancelLabel = ref('Cancel');
  const variant = ref<'normal' | 'error' | 'warning' | 'success'>('normal');

  let resolveRef: ((value: boolean) => void) | undefined;

  const confirm = (options: any = {}): Promise<boolean> => {
    title.value = options.title || 'Confirm';
    description.value = options.description || 'Are you sure?';
    confirmLabel.value = options.confirmLabel || 'Confirm';
    cancelLabel.value = options.cancelLabel || 'Cancel';
    variant.value = options.variant || 'normal';

    isOpen.value = true;

    return new Promise((resolve) => {
      resolveRef = resolve;
    });
  };

  const handleConfirm = () => {
    if (resolveRef) resolveRef(true);
    isOpen.value = false;
  };

  const handleCancel = () => {
    if (resolveRef) resolveRef(false);
    isOpen.value = false;
  };

  const handleClose = () => {
    if (resolveRef) resolveRef(false);
    isOpen.value = false;
  };

  return {
    isOpen,
    title,
    description,
    confirmLabel,
    cancelLabel,
    variant,
    confirm,
    handleConfirm,
    handleCancel,
    handleClose,
  };
};

// Dialog states
const basicConfirm = ref(false);
const deleteConfirm = ref(false);
const warningConfirm = ref(false);
const revampedUIConfirm = ref(false);
const smallDialog = ref(false);
const largeDialog = ref(false);
const customWidthDialog = ref(false);
const borderDialog = ref(false);
const counterDialog = ref(false);
const persistentDialog = ref(false);
const customContentDialog = ref(false);

// Custom content form data
const customName = ref('');
const customReason = ref('');

// Counter example
const selectedItemsList = ref<number[]>([]);
const maxItems = 5;
const selectedItems = computed(() => selectedItemsList.value.length);

// Promise-based dialogs
const promiseDialog = useConfirmDialogState();
const deleteDialog = useConfirmDialogState();
const saveDialog = useConfirmDialogState();
const logoutDialog = useConfirmDialogState();

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

  if (eventLog.length > 20) {
    eventLog.splice(20);
  }
};

// Promise-based handlers
const handlePromiseBasedConfirm = async () => {
  try {
    const result = await promiseDialog.confirm({
      title: 'Promise Confirmation',
      description: 'This dialog uses Promise-based confirmation. Click confirm or cancel to see the result.',
      confirmLabel: 'Yes, Proceed',
      cancelLabel: 'No, Cancel',
    });

    logEvent(`Promise result: ${result ? 'Confirmed' : 'Cancelled'}`);
  } catch (error) {
    logEvent('Promise error occurred');
  }
};

const handleDeleteItem = async () => {
  try {
    const result = await deleteDialog.confirm({
      title: 'Delete Confirmation',
      description: 'Are you sure you want to delete "Important Document.pdf"? This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'error',
    });

    if (result) {
      logEvent('Item deleted successfully');
    } else {
      logEvent('Delete cancelled');
    }
  } catch (error) {
    logEvent('Delete error occurred');
  }
};

const handleSaveChanges = async () => {
  try {
    const result = await saveDialog.confirm({
      title: 'Unsaved Changes',
      description: 'You have unsaved changes. Do you want to save them before continuing?',
      confirmLabel: 'Save',
      cancelLabel: 'Discard',
      variant: 'warning',
    });

    if (result) {
      logEvent('Changes saved');
    } else {
      logEvent('Changes discarded');
    }
  } catch (error) {
    logEvent('Save error occurred');
  }
};

const handleLogout = async () => {
  try {
    const result = await logoutDialog.confirm({
      title: 'Confirm Logout',
      description: 'Are you sure you want to log out? You will need to sign in again to access your account.',
      confirmLabel: 'Logout',
      cancelLabel: 'Stay Logged In',
    });

    if (result) {
      logEvent('User logged out');
    } else {
      logEvent('Logout cancelled');
    }
  } catch (error) {
    logEvent('Logout error occurred');
  }
};

const handleCustomContentConfirm = () => {
  logEvent(`Custom content confirmed - Name: ${customName.value}, Reason: ${customReason.value}`);
  customContentDialog.value = false;
  customName.value = '';
  customReason.value = '';
};
</script>
