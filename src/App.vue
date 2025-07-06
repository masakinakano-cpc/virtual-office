<template>
  <div id="app">
    <header class="creative-header">
      <div class="header-content">
        <h1 class="text-playful float-animation">🎨 カジュアル・クリエイティブ オフィス</h1>
        <p class="header-subtitle">自由度の高いクリエイティブ空間で、楽しく協力しましょう！</p>
      </div>
      <div class="header-decoration">
        <div class="decoration-circle circle-1"></div>
        <div class="decoration-circle circle-2"></div>
        <div class="decoration-circle circle-3"></div>
      </div>
    </header>
    <main>
      <div class="container mx-auto px-4">
        <!-- Audio Settings -->
        <div class="mb-8">
          <div class="card-creative hover-lift">
            <h2 class="section-title bounce-on-hover">🎵 Audio Settings</h2>
            <AudioSettingsPanel :audioManager="audioManager" />
          </div>
        </div>

        <!-- IconButton -->
        <div class="mb-8">
          <div class="card-creative hover-lift">
            <h2 class="section-title wiggle-on-hover">🔘 IconButton</h2>
            <IconButtonExample />
          </div>
        </div>

        <!-- ListItem -->
        <div class="mb-8">
          <div class="card-creative hover-lift">
            <h2 class="section-title bounce-on-hover">📋 ListItem</h2>
            <ListItemExample />
          </div>
        </div>

        <!-- LoadingState -->
        <div class="mb-8">
          <div class="card-creative hover-lift">
            <h2 class="section-title pulse-creative">⏳ LoadingState</h2>
            <LoadingStateExample />
          </div>
        </div>

        <!-- MenuItem -->
        <div class="mb-8">
          <div class="card-creative hover-lift">
            <h2 class="section-title bounce-on-hover">🍔 MenuItem & Menu</h2>
            <MenuItemExample />
          </div>
        </div>

        <!-- RadioGroup -->
        <div class="mb-8">
          <div class="card-creative hover-lift">
            <h2 class="section-title wiggle-on-hover">🔘 RadioGroup & Radio</h2>
            <RadioGroupExample />
          </div>
        </div>

        <!-- Sidebar -->
        <div class="mb-8">
          <div class="card-creative hover-lift">
            <h2 class="section-title bounce-on-hover">📱 Sidebar</h2>
            <SidebarExample />
          </div>
        </div>

        <!-- TextStaticObject -->
        <div class="mb-8">
          <div class="card-creative hover-lift">
            <h2 class="section-title wiggle-on-hover">📝 TextStaticObject</h2>
            <TextStaticObjectExample />
          </div>
        </div>

        <!-- ToggleButtonGroup -->
        <div class="mb-8">
          <div class="card-creative hover-lift">
            <h2 class="section-title bounce-on-hover">🔄 ToggleButtonGroup</h2>
            <ToggleButtonGroupExample />
          </div>
        </div>

        <!-- UriAvatarPosition -->
        <div class="mb-8">
          <div class="card-creative hover-lift">
            <h2 class="section-title pulse-creative">👤 URI Avatar Position</h2>
            <UriAvatarPositionExample />
          </div>
        </div>

        <!-- WorkspaceLockManager -->
        <div class="mb-8">
          <div class="card-creative hover-lift">
            <h2 class="section-title wiggle-on-hover">🔒 Workspace Lock Manager</h2>
            <WorkspaceLockManager />
          </div>
        </div>

        <!-- UtilitySystemExample -->
        <div class="mb-8">
          <div class="card-creative hover-lift">
            <h2 class="section-title bounce-on-hover">🛠️ Utility System Manager</h2>
            <UtilitySystemExample />
          </div>
        </div>

        <!-- Creative Interactions -->
        <div class="mb-8">
          <div class="card-creative hover-lift">
            <h2 class="section-title pulse-creative">🎮 Creative Interactions</h2>
            <CreativeInteractions />
          </div>
        </div>

        <!-- Virtual Office Space -->
        <div class="mb-8">
          <div class="card-creative hover-lift">
            <h2 class="section-title float-animation">🏢 Virtual Office Space</h2>
            <VirtualOfficeSpace />
          </div>
        </div>

        <!-- Office Customizer -->
        <div class="mb-8">
          <div class="card-creative hover-lift">
            <h2 class="section-title wiggle-on-hover">🎨 Office Customizer</h2>
            <OfficeCustomizer @openSettings="showSettings = true" />
          </div>
        </div>

        <!-- Layout Templates -->
        <div class="mb-8">
          <div class="card-creative hover-lift">
            <h2 class="section-title bounce-gentle">📐 Layout Templates</h2>
            <LayoutTemplates
              @templateSelected="handleTemplateSelected"
              @templateApplied="handleTemplateApplied"
            />
          </div>
        </div>

        <!-- Virtual Backgrounds -->
        <div class="mb-8">
          <div class="card-creative hover-lift">
            <h2 class="section-title wiggle-on-hover">🎨 バーチャル背景</h2>
            <VirtualBackgrounds />
          </div>
        </div>

        <!-- Gamification -->
        <div class="mb-8">
          <div class="card-creative hover-lift">
            <h2 class="section-title wiggle-on-hover">🎮 ゲーミフィケーション</h2>
            <Gamification />
          </div>
        </div>

        <!-- AI Assistant -->
        <div class="mb-8">
          <div class="card-creative hover-lift">
            <h2 class="section-title wiggle-on-hover">🤖 AIアシスタント</h2>
            <AIAssistant />
          </div>
        </div>

        <!-- Service Integrations -->
        <div class="mb-8">
          <div class="card-creative hover-lift">
            <h2 class="section-title wiggle-on-hover">🔗 外部サービス統合</h2>
            <ServiceIntegrations />
          </div>
        </div>

        <!-- Analytics Dashboard -->
        <div class="mb-8">
          <div class="card-creative hover-lift">
            <h2 class="section-title wiggle-on-hover">📊 分析ダッシュボード</h2>
            <AnalyticsDashboard />
          </div>
        </div>

        <!-- Real Time Collaboration -->
        <div class="mb-8">
          <div class="card-creative hover-lift">
            <h2 class="section-title wiggle-on-hover">🤝 リアルタイム協力</h2>
            <RealTimeCollaboration />
          </div>
        </div>

        <!-- Mobile Optimization -->
        <div class="mb-8">
          <div class="card-creative hover-lift">
            <h2 class="section-title wiggle-on-hover">📱 モバイル最適化</h2>
            <MobileOptimization />
          </div>
        </div>

        <!-- Notification System -->
        <div class="mb-8">
          <div class="card-creative hover-lift">
            <h2 class="section-title wiggle-on-hover">🔔 通知システム</h2>
            <NotificationSystem />
          </div>
        </div>

        <!-- Meeting Scheduler -->
        <div class="mb-8">
          <div class="card-creative hover-lift">
            <h2 class="section-title wiggle-on-hover">📅 会議スケジューラー</h2>
            <MeetingScheduler />
          </div>
        </div>
      </div>
    </main>

    <!-- Settings Modal -->
    <OfficeSettings
      v-if="showSettings"
      @close="showSettings = false"
      @settingsChanged="handleSettingsChanged"
      @layoutChanged="handleLayoutChanged"
      @editModeToggled="handleEditModeToggled"
    />
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
import CreativeInteractions from './components/CreativeInteractions.vue';
import VirtualOfficeSpace from './components/VirtualOfficeSpace.vue';
import OfficeCustomizer from './components/OfficeCustomizer.vue';
import OfficeSettings from './components/OfficeSettings.vue';
import LayoutTemplates from './components/LayoutTemplates.vue';
import VirtualBackgrounds from './components/VirtualBackgrounds.vue';
import Gamification from './components/Gamification.vue';
import AIAssistant from './components/AIAssistant.vue';
import ServiceIntegrations from './components/ServiceIntegrations.vue';
import AnalyticsDashboard from './components/AnalyticsDashboard.vue';
import RealTimeCollaboration from './components/RealTimeCollaboration.vue';
import MobileOptimization from './components/MobileOptimization.vue';
import NotificationSystem from './components/NotificationSystem.vue';
import MeetingScheduler from './components/MeetingScheduler.vue';

const audioManager = ref<IAudioManager | null>(null);
const showSettings = ref(false);

// イベントハンドラー
const handleSettingsChanged = (settings: any) => {
  console.log('設定が変更されました:', settings);
  // 設定をアプリケーション全体に適用
};

const handleLayoutChanged = (layoutId: string) => {
  console.log('レイアウトが変更されました:', layoutId);
  // レイアウトの変更を処理
};

const handleEditModeToggled = (enabled: boolean) => {
  console.log('編集モードが切り替わりました:', enabled);
  // 編集モードの状態を処理
};

const handleTemplateSelected = (template: any) => {
  console.log('テンプレートが選択されました:', template);
  // テンプレート選択の処理
};

const handleTemplateApplied = (template: any) => {
  console.log('テンプレートが適用されました:', template);
  // テンプレート適用の処理
};

onMounted(async () => {
  audioManager.value = new AudioManager();
  await audioManager.value.initialize();
});
</script>

<style scoped>
#app {
  font-family: var(--font-family-primary);
  background: var(--bg-secondary);
  min-height: 100vh;
}

.creative-header {
  background: var(--bg-creative);
  color: white;
  padding: var(--spacing-8) 0;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.header-content {
  position: relative;
  z-index: 2;
}

.header-content h1 {
  font-size: var(--text-4xl);
  font-weight: 700;
  margin-bottom: var(--spacing-2);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.header-subtitle {
  font-size: var(--text-lg);
  opacity: 0.9;
  font-weight: 400;
}

.header-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.circle-1 {
  width: 100px;
  height: 100px;
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}

.circle-2 {
  width: 60px;
  height: 60px;
  top: 60%;
  right: 15%;
  animation-delay: 2s;
}

.circle-3 {
  width: 80px;
  height: 80px;
  bottom: 10%;
  left: 20%;
  animation-delay: 4s;
}

main {
  padding: var(--spacing-8) 0;
}

.section-title {
  font-size: var(--text-2xl);
  font-weight: 600;
  margin-bottom: var(--spacing-4);
  color: var(--color-gray-800);
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
  .creative-header {
    padding: var(--spacing-6) var(--spacing-4);
  }

  .header-content h1 {
    font-size: var(--text-3xl);
  }

  .header-subtitle {
    font-size: var(--text-base);
  }

  .decoration-circle {
    display: none;
  }
}
</style>
