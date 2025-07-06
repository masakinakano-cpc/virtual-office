<template>
  <div id="app">
    <header>
      <h1>エンタープライズバーチャルオフィス</h1>
    </header>
    <main>
      <div class="container mx-auto px-4">
        <!-- Audio Settings -->
        <div class="mb-8">
          <h2 class="text-2xl font-semibold mb-4 text-gray-700">Audio Settings</h2>
          <AudioSettingsPanel :audioManager="audioManager" />
        </div>

        <!-- IconButton -->
        <div class="mb-8">
          <h2 class="text-2xl font-semibold mb-4 text-gray-700">IconButton</h2>
          <IconButtonExample />
        </div>

        <!-- ListItem -->
        <div class="mb-8">
          <h2 class="text-2xl font-semibold mb-4 text-gray-700">ListItem</h2>
          <ListItemExample />
        </div>

        <!-- LoadingState -->
        <div class="mb-8">
          <h2 class="text-2xl font-semibold mb-4 text-gray-700">LoadingState</h2>
          <LoadingStateExample />
        </div>

        <!-- MenuItem -->
        <div class="mb-8">
          <h2 class="text-2xl font-semibold mb-4 text-gray-700">MenuItem & Menu</h2>
          <MenuItemExample />
        </div>

        <!-- RadioGroup -->
        <div class="mb-8">
          <h2 class="text-2xl font-semibold mb-4 text-gray-700">RadioGroup & Radio</h2>
          <RadioGroupExample />
        </div>

        <!-- Sidebar -->
        <div class="mb-8">
          <h2 class="text-2xl font-semibold mb-4 text-gray-700">Sidebar</h2>
          <SidebarExample />
        </div>

        <!-- TextStaticObject -->
        <div class="mb-8">
          <h2 class="text-2xl font-semibold mb-4 text-gray-700">TextStaticObject</h2>
          <TextStaticObjectExample />
        </div>

        <!-- ToggleButtonGroup -->
        <div class="mb-8">
          <h2 class="text-2xl font-semibold mb-4 text-gray-700">ToggleButtonGroup</h2>
          <ToggleButtonGroupExample />
        </div>

        <!-- UriAvatarPosition -->
        <div class="mb-8">
          <h2 class="text-2xl font-semibold mb-4 text-gray-700">URI Avatar Position</h2>
          <UriAvatarPositionExample />
        </div>

        <!-- WorkspaceLockManager -->
        <div class="mb-8">
          <h2 class="text-2xl font-semibold mb-4 text-gray-700">Workspace Lock Manager</h2>
          <WorkspaceLockManager />
        </div>

        <!-- UtilitySystemExample -->
        <div class="mb-8">
          <h2 class="text-2xl font-semibold mb-4 text-gray-700">Utility System Manager</h2>
          <UtilitySystemExample />
        </div>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { AudioManager, type IAudioManager } from './components/AudioManager';
import AudioSettingsPanel from './components/AudioSettingsPanel.vue';
import IconButtonExample from './components/IconButtonExample.vue';
import ListItemExample from './components/ListItemExample.vue';
import LoadingStateExample from './components/LoadingStateExample.vue';
import MenuItemExample from './components/MenuItemExample.vue';
import RadioGroupExample from './components/RadioGroupExample.vue';
import SidebarExample from './components/SidebarExample.vue';
import TextStaticObjectExample from './components/TextStaticObjectExample.vue';
import ToggleButtonGroupExample from './components/ToggleButtonGroupExample.vue';
import UriAvatarPositionExample from './components/UriAvatarPositionExample.vue';
import WorkspaceLockManager from './components/WorkspaceLockManager.vue';
import UtilitySystemExample from './components/UtilitySystemExample.vue';

const audioManager = ref<IAudioManager | null>(null);

onMounted(async () => {
  audioManager.value = new AudioManager();
  await audioManager.value.initialize();
});
</script>

<style scoped>
#app {
  font-family: 'Inter', sans-serif;
  background: #f8fafc;
  min-height: 100vh;
}
header {
  background: #3b82f6;
  color: #fff;
  padding: 16px 0;
  text-align: center;
  font-size: 1.5rem;
  font-weight: bold;
}
main {
  padding: 32px 0;
}
</style>
