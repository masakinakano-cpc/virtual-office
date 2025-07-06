<template>
  <div class="p-6 space-y-6">
    <h2 class="text-2xl font-bold">AutoComplete Examples</h2>

    <!-- Basic Single Selection -->
    <div>
      <h3 class="text-lg font-semibold mb-2">Basic Single Selection</h3>
      <AutoComplete
        v-model="selectedUser"
        :options="users"
        placeholder="Select a user..."
        :get-option-label="(user) => user.name"
        :get-option-key="(user) => user.id"
      />
      <p class="mt-2 text-sm text-gray-600">Selected: {{ selectedUser?.name || 'None' }}</p>
    </div>

    <!-- Multiple Selection with Tags -->
    <div>
      <h3 class="text-lg font-semibold mb-2">Multiple Selection</h3>
      <AutoComplete
        v-model="selectedUsers"
        :options="users"
        multiple
        placeholder="Select multiple users..."
        :get-option-label="(user) => user.name"
        :get-option-key="(user) => user.id"
      />
      <p class="mt-2 text-sm text-gray-600">
        Selected: {{ selectedUsers.map(u => u.name).join(', ') || 'None' }}
      </p>
    </div>

    <!-- Custom Option Rendering -->
    <div>
      <h3 class="text-lg font-semibold mb-2">Custom Option Rendering</h3>
      <AutoComplete
        v-model="selectedUserWithAvatar"
        :options="users"
        placeholder="Select a user with avatar..."
        :get-option-label="(user) => user.name"
        :get-option-key="(user) => user.id"
      >
        <template #option="{ option }">
          <div class="flex items-center space-x-3">
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
              :style="{ backgroundColor: option.color }"
            >
              {{ option.name.charAt(0).toUpperCase() }}
            </div>
            <div>
              <div class="font-medium">{{ option.name }}</div>
              <div class="text-sm text-gray-500">{{ option.email }}</div>
            </div>
          </div>
        </template>
      </AutoComplete>
    </div>

    <!-- Async Loading -->
    <div>
      <h3 class="text-lg font-semibold mb-2">Async Loading</h3>
      <AutoComplete
        v-model="selectedAsyncUser"
        :options="asyncUsers"
        :loading="isLoading"
        placeholder="Search users..."
        :get-option-label="(user) => user.name"
        :get-option-key="(user) => user.id"
        @input="handleAsyncSearch"
      />
    </div>

    <!-- Channel Search -->
    <div>
      <h3 class="text-lg font-semibold mb-2">Channel Search</h3>
      <AutoComplete
        v-model="selectedChannel"
        :options="channels"
        placeholder="Search channels..."
        :get-option-label="(channel) => `#${channel.name}`"
        :get-option-key="(channel) => channel.id"
      >
        <template #option="{ option }">
          <div class="flex items-center space-x-2">
            <span class="text-gray-500">#</span>
            <span class="font-medium">{{ option.name }}</span>
            <span class="text-sm text-gray-500">{{ option.memberCount }} members</span>
          </div>
        </template>
      </AutoComplete>
    </div>

    <!-- Emoji Picker -->
    <div>
      <h3 class="text-lg font-semibold mb-2">Emoji Picker</h3>
      <AutoComplete
        v-model="selectedEmoji"
        :options="emojis"
        placeholder="Search emojis..."
        :get-option-label="(emoji) => emoji.name"
        :get-option-key="(emoji) => emoji.code"
        :filter-options="filterEmojis"
      >
        <template #option="{ option }">
          <div class="flex items-center space-x-2">
            <span class="text-lg">{{ option.emoji }}</span>
            <span>{{ option.name }}</span>
          </div>
        </template>
      </AutoComplete>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue';
import AutoComplete from './AutoComplete.vue';

// Sample Data
const users = reactive([
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', color: '#3B82F6' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', color: '#EF4444' },
  { id: 3, name: 'Carol Williams', email: 'carol@example.com', color: '#10B981' },
  { id: 4, name: 'David Brown', email: 'david@example.com', color: '#F59E0B' },
  { id: 5, name: 'Eva Davis', email: 'eva@example.com', color: '#8B5CF6' },
]);

const channels = reactive([
  { id: 1, name: 'general', memberCount: 150 },
  { id: 2, name: 'development', memberCount: 25 },
  { id: 3, name: 'design', memberCount: 12 },
  { id: 4, name: 'marketing', memberCount: 30 },
  { id: 5, name: 'random', memberCount: 89 },
]);

const emojis = reactive([
  { code: ':smile:', name: 'smile', emoji: '😄' },
  { code: ':heart:', name: 'heart', emoji: '❤️' },
  { code: ':thumbs_up:', name: 'thumbs up', emoji: '👍' },
  { code: ':fire:', name: 'fire', emoji: '🔥' },
  { code: ':star:', name: 'star', emoji: '⭐' },
  { code: ':rocket:', name: 'rocket', emoji: '🚀' },
  { code: ':coffee:', name: 'coffee', emoji: '☕' },
  { code: ':pizza:', name: 'pizza', emoji: '🍕' },
]);

// Types
interface User {
  id: number;
  name: string;
  email: string;
  color: string;
}

interface Channel {
  id: number;
  name: string;
  memberCount: number;
}

interface Emoji {
  code: string;
  name: string;
  emoji: string;
}

// State
const selectedUser = ref<User | null>(null);
const selectedUsers = ref<User[]>([]);
const selectedUserWithAvatar = ref<User | null>(null);
const selectedAsyncUser = ref<User | null>(null);
const selectedChannel = ref<Channel | null>(null);
const selectedEmoji = ref<Emoji | null>(null);

// Async Loading
const asyncUsers = ref<User[]>([]);
const isLoading = ref(false);
let searchTimeout: NodeJS.Timeout;

const handleAsyncSearch = (inputValue: string) => {
  if (searchTimeout) clearTimeout(searchTimeout);

  if (!inputValue.trim()) {
    asyncUsers.value = [];
    return;
  }

  isLoading.value = true;

  searchTimeout = setTimeout(() => {
    // Simulate API call
    const filtered = users.filter(user =>
      user.name.toLowerCase().includes(inputValue.toLowerCase()) ||
      user.email.toLowerCase().includes(inputValue.toLowerCase())
    );

    asyncUsers.value = filtered;
    isLoading.value = false;
  }, 500);
};

// Custom emoji filter
const filterEmojis = (options: any[], inputValue: string) => {
  if (!inputValue) return options.slice(0, 5); // Show first 5 by default

  return options.filter(emoji =>
    emoji.name.toLowerCase().includes(inputValue.toLowerCase()) ||
    emoji.code.toLowerCase().includes(inputValue.toLowerCase())
  );
};
</script>
