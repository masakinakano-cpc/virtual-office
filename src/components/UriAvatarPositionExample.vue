<template>
  <div class="uri-avatar-position-example">
    <div class="header">
      <h2>🗺️ URI Avatar Position Manager</h2>
      <p>URLベースのアバター位置管理システム</p>
    </div>

    <div class="grid-container">
      <!-- Current State Display -->
      <div class="state-panel">
        <h3>📍 Current State</h3>

        <div class="state-item">
          <label>Current URL:</label>
          <code>{{ currentUrl }}</code>
        </div>

        <div class="state-item">
          <label>Parsed Position:</label>
          <span v-if="parseUrlPosition">
            {{ parseUrlPosition.x }}, {{ parseUrlPosition.y }}
          </span>
          <span v-else class="no-data">No position in URL</span>
        </div>

        <div class="state-item">
          <label>Room ID:</label>
          <span v-if="parseRoomId">{{ parseRoomId }}</span>
          <span v-else class="no-data">Not in room</span>
        </div>

        <div class="state-item">
          <label>Object Connect To:</label>
          <span v-if="parseObjectConnectTo">{{ parseObjectConnectTo }}</span>
          <span v-else class="no-data">None</span>
        </div>

        <div class="state-item">
          <label>Close To:</label>
          <span v-if="parseCloseTo">{{ parseCloseTo }}</span>
          <span v-else class="no-data">None</span>
        </div>
      </div>

      <!-- Workspace Configuration -->
      <div class="config-panel">
        <h3>⚙️ Workspace Configuration</h3>

        <div class="config-group">
          <label>Workspace Size:</label>
          <div class="input-group">
            <input
              v-model.number="workspaceConfig.width"
              type="number"
              min="1"
              @input="updateWorkspaceData({ width: workspaceConfig.width })"
            />
            <span>×</span>
            <input
              v-model.number="workspaceConfig.height"
              type="number"
              min="1"
              @input="updateWorkspaceData({ height: workspaceConfig.height })"
            />
          </div>
        </div>

        <div class="config-group">
          <label>Spawn Point:</label>
          <div class="input-group">
            <input
              v-model.number="workspaceConfig.spawnX"
              type="number"
              @input="updateSpawnConfig"
            />
            <span>,</span>
            <input
              v-model.number="workspaceConfig.spawnY"
              type="number"
              @input="updateSpawnConfig"
            />
          </div>
        </div>

        <div class="config-group">
          <label>Spawn Range:</label>
          <input
            v-model.number="workspaceConfig.spawnRange"
            type="number"
            min="0"
            @input="updateSpawnConfig"
          />
        </div>

        <div class="config-group">
          <label>Home Location URL:</label>
          <input
            v-model="workspaceConfig.homeUrl"
            type="text"
            @input="updateUserData({ space_settings: { homeLocationUrl: workspaceConfig.homeUrl } })"
          />
        </div>
      </div>

      <!-- Navigation Controls -->
      <div class="navigation-panel">
        <h3>🧭 Navigation Controls</h3>

        <div class="nav-group">
          <h4>Move to Coordinates</h4>
          <div class="input-group">
            <input v-model.number="navControls.x" type="number" placeholder="X" />
            <input v-model.number="navControls.y" type="number" placeholder="Y" />
            <button @click="navigateToCoordinates" class="btn-primary">
              Go to Position
            </button>
          </div>
        </div>

        <div class="nav-group">
          <h4>Move to Room</h4>
          <div class="input-group">
            <input v-model.number="navControls.roomId" type="number" placeholder="Room ID" />
            <button @click="navigateToRoom" class="btn-primary">
              Enter Room
            </button>
          </div>
        </div>

        <div class="nav-group">
          <h4>Connect to Object</h4>
          <div class="input-group">
            <input v-model="navControls.objectId" type="text" placeholder="Object ID" />
            <button @click="navigateToObject" class="btn-primary">
              Connect to Object
            </button>
          </div>
        </div>

        <div class="nav-group">
          <h4>Quick Actions</h4>
          <div class="button-group">
            <button @click="navigateToSpawn" class="btn-secondary">
              🏠 Go to Spawn
            </button>
            <button @click="navigateToRandom" class="btn-secondary">
              🎲 Random Position
            </button>
            <button @click="navigateToHome" class="btn-secondary">
              🏡 Go to Home
            </button>
          </div>
        </div>
      </div>

      <!-- Position Resolver Demo -->
      <div class="resolver-panel">
        <h3>🔍 Position Resolver</h3>

        <div class="resolver-item">
          <label>Preferred Position:</label>
          <div class="input-group">
            <input v-model.number="resolverDemo.preferredX" type="number" placeholder="X" />
            <input v-model.number="resolverDemo.preferredY" type="number" placeholder="Y" />
          </div>
        </div>

        <div class="resolver-item">
          <label>Resolved Position:</label>
          <div class="position-display">
            {{ resolvedPosition.x }}, {{ resolvedPosition.y }}
          </div>
        </div>

        <div class="resolver-item">
          <label>Resolution Priority:</label>
          <ol class="priority-list">
            <li :class="{ active: resolverDemo.preferredX && resolverDemo.preferredY }">
              Preferred Position
            </li>
            <li :class="{ active: parseUrlPosition && !(resolverDemo.preferredX && resolverDemo.preferredY) }">
              URL Position
            </li>
            <li :class="{ active: spawnPosition && !parseUrlPosition && !(resolverDemo.preferredX && resolverDemo.preferredY) }">
              Spawn Position
            </li>
            <li :class="{ active: !spawnPosition && !parseUrlPosition && !(resolverDemo.preferredX && resolverDemo.preferredY) }">
              Fallback Position
            </li>
          </ol>
        </div>
      </div>

      <!-- Online Users Simulation -->
      <div class="users-panel">
        <h3>👥 Online Users ({{ onlineUsers.length }})</h3>

        <div class="users-list">
          <div
            v-for="user in onlineUsers"
            :key="user.id"
            class="user-item"
            :class="user.status"
          >
            <span class="user-id">{{ user.id }}</span>
            <span class="user-status">{{ user.status }}</span>
            <button @click="toggleUserStatus(user)" class="btn-small">
              Toggle
            </button>
          </div>
        </div>

        <div class="users-actions">
          <button @click="addUser" class="btn-secondary">
            Add User
          </button>
          <button @click="removeUser" class="btn-secondary">
            Remove User
          </button>
        </div>
      </div>

      <!-- Utilities Demo -->
      <div class="utilities-panel">
        <h3>🛠️ Utilities</h3>

        <div class="utility-item">
          <label>Pixels to Grid Units:</label>
          <div class="input-group">
            <input v-model.number="utilityDemo.pixels" type="number" />
            <span>→</span>
            <span>{{ pixelsToGridUnits(utilityDemo.pixels || 0) }}</span>
          </div>
        </div>

        <div class="utility-item">
          <label>Clamp Value:</label>
          <div class="input-group">
            <input v-model.number="utilityDemo.value" type="number" placeholder="Value" />
            <input v-model.number="utilityDemo.min" type="number" placeholder="Min" />
            <input v-model.number="utilityDemo.max" type="number" placeholder="Max" />
            <span>→</span>
            <span>{{ clamp(utilityDemo.value || 0, utilityDemo.min || 0, utilityDemo.max || 100) }}</span>
          </div>
        </div>

        <div class="utility-item">
          <label>Random Between:</label>
          <div class="input-group">
            <input v-model.number="utilityDemo.randomMin" type="number" placeholder="Min" />
            <input v-model.number="utilityDemo.randomMax" type="number" placeholder="Max" />
            <button @click="generateRandomDemo" class="btn-small">
              Generate
            </button>
            <span>→</span>
            <span>{{ randomResult }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUriAvatarPosition } from '../composables/useUriAvatarPosition'

// Use the composable
const {
  parseUrlPosition,
  parseRoomId,
  parseObjectConnectTo,
  parseCloseTo,
  getPositionResolver,
  navigateToPosition,
  generateFallbackPosition,
  parseSpawnPosition,
  pixelsToGridUnits,
  workspaceData,
  userData,
  onlineUsers,
  updateWorkspaceData,
  updateUserData,
  clamp,
  randomBetween,
  // generateRandomPosition
} = useUriAvatarPosition()

const route = useRoute()

// Current URL display
const currentUrl = computed(() => {
  return `${route.path}${route.query ? '?' + new URLSearchParams(route.query as Record<string, string>).toString() : ''}`
})

// Workspace configuration
const workspaceConfig = ref({
  width: workspaceData.value.width,
  height: workspaceData.value.height,
  spawnX: typeof workspaceData.value.spawn?.x === 'number' ? workspaceData.value.spawn.x : 10,
  spawnY: typeof workspaceData.value.spawn?.y === 'number' ? workspaceData.value.spawn.y : 7,
  spawnRange: workspaceData.value.spawn?.range || 3,
  homeUrl: userData.value.space_settings?.homeLocationUrl || '/@10,7'
})

// Navigation controls
const navControls = ref({
  x: 5,
  y: 5,
  roomId: 1,
  objectId: 'desk_1'
})

// Position resolver demo
const resolverDemo = ref({
  preferredX: null as number | null,
  preferredY: null as number | null
})

// Utility demo
const utilityDemo = ref({
  pixels: 64,
  value: 50,
  min: 0,
  max: 100,
  randomMin: 1,
  randomMax: 10
})

const randomResult = ref(0)

// Computed properties
const spawnPosition = computed(() => parseSpawnPosition(workspaceData.value))

const resolvedPosition = computed(() => {
  const resolver = getPositionResolver()
  const preferred = resolverDemo.value.preferredX && resolverDemo.value.preferredY
    ? { x: resolverDemo.value.preferredX, y: resolverDemo.value.preferredY }
    : undefined
  return resolver(preferred)
})

// Methods
const updateSpawnConfig = () => {
  updateWorkspaceData({
    spawn: {
      x: workspaceConfig.value.spawnX,
      y: workspaceConfig.value.spawnY,
      range: workspaceConfig.value.spawnRange
    }
  })
}

const navigateToCoordinates = () => {
  navigateToPosition({
    x: navControls.value.x,
    y: navControls.value.y
  })
}

const navigateToRoom = () => {
  navigateToPosition({
    roomId: navControls.value.roomId
  })
}

const navigateToObject = () => {
  navigateToPosition({
    x: navControls.value.x,
    y: navControls.value.y,
    objectId: navControls.value.objectId
  })
}

const navigateToSpawn = () => {
  const spawn = spawnPosition.value
  if (spawn) {
    navigateToPosition({ x: spawn.x, y: spawn.y })
  }
}

const navigateToRandom = () => {
  const fallback = generateFallbackPosition()
  navigateToPosition({ x: fallback.x, y: fallback.y })
}

const navigateToHome = () => {
  const homeUrl = userData.value.space_settings?.homeLocationUrl
  if (homeUrl) {
    const coords = homeUrl.substring(homeUrl.lastIndexOf('/') + 1).replace('@', '').split(',')
    if (coords.length === 2) {
      navigateToPosition({ x: parseInt(coords[0]), y: parseInt(coords[1]) })
    }
  }
}

const toggleUserStatus = (user: any) => {
  user.status = user.status === 'online' ? 'away' : 'online'
}

const addUser = () => {
  const newId = Math.max(...onlineUsers.value.map(u => u.id)) + 1
  onlineUsers.value.push({ id: newId, status: 'online' })
}

const removeUser = () => {
  if (onlineUsers.value.length > 1) {
    onlineUsers.value.pop()
  }
}

const generateRandomDemo = () => {
  randomResult.value = randomBetween(
    utilityDemo.value.randomMin || 1,
    utilityDemo.value.randomMax || 10
  )
}

// Initialize random result
generateRandomDemo()
</script>

<style scoped>
.uri-avatar-position-example {
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h2 {
  margin: 0 0 10px 0;
  color: #333;
}

.header p {
  margin: 0;
  color: #666;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.state-panel,
.config-panel,
.navigation-panel,
.resolver-panel,
.users-panel,
.utilities-panel {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e9ecef;
}

.state-panel h3,
.config-panel h3,
.navigation-panel h3,
.resolver-panel h3,
.users-panel h3,
.utilities-panel h3 {
  margin: 0 0 15px 0;
  color: #495057;
  font-size: 16px;
}

.state-item,
.config-group,
.nav-group,
.resolver-item,
.utility-item {
  margin-bottom: 15px;
}

.state-item label,
.config-group label,
.resolver-item label,
.utility-item label {
  display: block;
  font-weight: 500;
  margin-bottom: 5px;
  color: #495057;
}

.state-item code {
  background: #e9ecef;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
}

.no-data {
  color: #6c757d;
  font-style: italic;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.input-group input {
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
  min-width: 80px;
}

.input-group input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.btn-primary,
.btn-secondary,
.btn-small {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

.btn-small {
  padding: 4px 8px;
  font-size: 12px;
  background: #f8f9fa;
  color: #495057;
  border: 1px solid #dee2e6;
}

.btn-small:hover {
  background: #e9ecef;
}

.button-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.nav-group h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #495057;
}

.position-display {
  background: #e9ecef;
  padding: 8px 12px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 14px;
  color: #495057;
}

.priority-list {
  margin: 0;
  padding-left: 20px;
}

.priority-list li {
  padding: 4px 0;
  color: #6c757d;
}

.priority-list li.active {
  color: #007bff;
  font-weight: 500;
}

.users-list {
  margin-bottom: 15px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #dee2e6;
}

.user-item:last-child {
  border-bottom: none;
}

.user-id {
  font-weight: 500;
  min-width: 30px;
}

.user-status {
  flex: 1;
  text-transform: capitalize;
}

.user-item.online .user-status {
  color: #28a745;
}

.user-item.away .user-status {
  color: #ffc107;
}

.users-actions {
  display: flex;
  gap: 8px;
}

@media (max-width: 768px) {
  .grid-container {
    grid-template-columns: 1fr;
  }

  .input-group {
    flex-direction: column;
    align-items: stretch;
  }

  .button-group {
    flex-direction: column;
  }
}
</style>
