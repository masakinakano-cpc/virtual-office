<template>
  <div class="p-6 space-y-8">
    <h2 class="text-2xl font-bold">Chip Component Examples</h2>

    <!-- Basic Chips -->
    <div>
      <h3 class="text-lg font-semibold mb-4">Basic Chips</h3>
      <div class="flex flex-wrap gap-2">
        <Chip label="Default" />
        <Chip label="Primary" color="primary" />
        <Chip label="Secondary" color="secondary" />
        <Chip label="Success" color="success" />
        <Chip label="Warning" color="warning" />
        <Chip label="Error" color="error" />
        <Chip label="Info" color="info" />
      </div>
    </div>

    <!-- Outlined Chips -->
    <div>
      <h3 class="text-lg font-semibold mb-4">Outlined Chips</h3>
      <div class="flex flex-wrap gap-2">
        <Chip label="Default" variant="outlined" />
        <Chip label="Primary" color="primary" variant="outlined" />
        <Chip label="Secondary" color="secondary" variant="outlined" />
        <Chip label="Success" color="success" variant="outlined" />
        <Chip label="Warning" color="warning" variant="outlined" />
        <Chip label="Error" color="error" variant="outlined" />
        <Chip label="Info" color="info" variant="outlined" />
      </div>
    </div>

    <!-- Sizes -->
    <div>
      <h3 class="text-lg font-semibold mb-4">Sizes</h3>
      <div class="flex flex-wrap items-center gap-2">
        <Chip label="Small Primary" color="primary" size="small" />
        <Chip label="Medium Primary" color="primary" size="medium" />
        <Chip label="Small Outlined" color="secondary" variant="outlined" size="small" />
        <Chip label="Medium Outlined" color="secondary" variant="outlined" size="medium" />
      </div>
    </div>

    <!-- With Avatars -->
    <div>
      <h3 class="text-lg font-semibold mb-4">With Avatars</h3>
      <div class="flex flex-wrap gap-2">
        <Chip
          label="Alice Johnson"
          color="primary"
          :avatar="{ name: 'Alice Johnson' }"
        />
        <Chip
          label="Bob Smith"
          color="secondary"
          :avatar="{ name: 'Bob Smith' }"
        />
        <Chip
          label="Carol Williams"
          color="success"
          variant="outlined"
          :avatar="{ name: 'Carol Williams' }"
        />
        <Chip
          label="David Brown"
          color="warning"
          size="small"
          :avatar="{ name: 'David Brown' }"
        />
      </div>
    </div>

    <!-- With Icons -->
    <div>
      <h3 class="text-lg font-semibold mb-4">With Icons</h3>
      <div class="flex flex-wrap gap-2">
        <Chip label="Home" color="primary" icon="🏠" />
        <Chip label="Settings" color="secondary" icon="⚙️" />
        <Chip label="Notifications" color="info" variant="outlined" icon="🔔" />
        <Chip label="Favorite" color="error" size="small" icon="❤️" />
      </div>
    </div>

    <!-- Deletable Chips -->
    <div>
      <h3 class="text-lg font-semibold mb-4">Deletable Chips</h3>
      <div class="flex flex-wrap gap-2">
        <Chip
          v-for="tag in tags"
          :key="tag.id"
          :label="tag.name"
          :color="tag.color"
          deletable
          @delete="removeTag(tag.id)"
        />
      </div>
      <button
        @click="addTag"
        class="mt-2 px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
      >
        Add Tag
      </button>
    </div>

    <!-- Clickable Chips -->
    <div>
      <h3 class="text-lg font-semibold mb-4">Clickable Chips</h3>
      <div class="flex flex-wrap gap-2">
        <Chip
          v-for="filter in filters"
          :key="filter.id"
          :label="filter.name"
          :color="filter.active ? 'primary' : 'default'"
          clickable
          @click="toggleFilter(filter.id)"
        />
      </div>
      <p class="mt-2 text-sm text-gray-600">
        Active filters: {{ activeFilters.join(', ') || 'None' }}
      </p>
    </div>

    <!-- User Selection Example -->
    <div>
      <h3 class="text-lg font-semibold mb-4">User Selection Example</h3>
      <div class="space-y-2">
        <div class="flex flex-wrap gap-2">
          <Chip
            v-for="user in selectedUsers"
            :key="user.id"
            :label="user.name"
            color="primary"
            :avatar="{ name: user.name }"
            deletable
            @delete="removeUser(user.id)"
          />
        </div>
        <div class="flex flex-wrap gap-2">
          <Chip
            v-for="user in availableUsers"
            :key="user.id"
            :label="user.name"
            variant="outlined"
            :avatar="{ name: user.name }"
            clickable
            @click="addUser(user)"
          />
        </div>
      </div>
    </div>

    <!-- Disabled State -->
    <div>
      <h3 class="text-lg font-semibold mb-4">Disabled State</h3>
      <div class="flex flex-wrap gap-2">
        <Chip label="Disabled" disabled />
        <Chip label="Disabled Primary" color="primary" disabled />
        <Chip label="Disabled Deletable" color="secondary" deletable disabled />
        <Chip label="Disabled Clickable" color="success" clickable disabled />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import Chip from './Chip.vue';

// Tags for deletable example
const tags = ref([
  { id: 1, name: 'JavaScript', color: 'primary' as const },
  { id: 2, name: 'Vue.js', color: 'success' as const },
  { id: 3, name: 'TypeScript', color: 'info' as const },
  { id: 4, name: 'TailwindCSS', color: 'secondary' as const },
]);

let tagCounter = 5;

const removeTag = (id: number) => {
  const index = tags.value.findIndex(tag => tag.id === id);
  if (index > -1) {
    tags.value.splice(index, 1);
  }
};

const addTag = () => {
  const colors = ['primary', 'secondary', 'success', 'info'] as const;
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  tags.value.push({
    id: tagCounter++,
    name: `Tag ${tagCounter - 1}`,
    color: randomColor,
  });
};

// Filters for clickable example
const filters = ref([
  { id: 1, name: 'All', active: true },
  { id: 2, name: 'Active', active: false },
  { id: 3, name: 'Completed', active: false },
  { id: 4, name: 'Pending', active: false },
]);

const toggleFilter = (id: number) => {
  const filter = filters.value.find(f => f.id === id);
  if (filter) {
    filter.active = !filter.active;
  }
};

const activeFilters = computed(() => {
  return filters.value.filter(f => f.active).map(f => f.name);
});

// Users for selection example
const allUsers = [
  { id: 1, name: 'Alice Johnson' },
  { id: 2, name: 'Bob Smith' },
  { id: 3, name: 'Carol Williams' },
  { id: 4, name: 'David Brown' },
  { id: 5, name: 'Eva Davis' },
];

const selectedUsers = ref([allUsers[0]]);

const availableUsers = computed(() => {
  return allUsers.filter(user =>
    !selectedUsers.value.some(selected => selected.id === user.id)
  );
});

const addUser = (user: typeof allUsers[0]) => {
  selectedUsers.value.push(user);
};

const removeUser = (id: number) => {
  const index = selectedUsers.value.findIndex(user => user.id === id);
  if (index > -1) {
    selectedUsers.value.splice(index, 1);
  }
};
</script>
