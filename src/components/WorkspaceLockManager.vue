<template>
  <div class="workspace-lock-manager">
    <div class="header">
      <h2>🔒 Workspace Lock Manager</h2>
      <p>ワークスペースのロック/アンロック管理システム</p>
    </div>

    <div class="grid-container">
      <!-- Current Lock Status -->
      <div class="status-panel">
        <h3>📊 Current Status</h3>

        <div class="status-display">
          <div class="status-indicator" :class="{ 'locked': isCurrentlyLocked, 'unlocked': !isCurrentlyLocked }">
            <WsLockUnIcon :color="isCurrentlyLocked ? '#dc3545' : '#28a745'" />
            <span class="status-text">{{ getLockStatusText() }}</span>
          </div>

          <div v-if="isCurrentlyLocked" class="lock-details">
            <div class="detail-item">
              <label>Lock Type:</label>
              <span class="lock-type" :class="lockState.lockType">{{ lockState.lockType }}</span>
            </div>

            <div class="detail-item" v-if="lockState.lockedBy">
              <label>Locked By:</label>
              <span>{{ lockState.lockedBy }}</span>
            </div>

            <div class="detail-item" v-if="lockState.reason">
              <label>Reason:</label>
              <span>{{ lockState.reason }}</span>
            </div>

            <div class="detail-item" v-if="lockTimeRemaining">
              <label>Time Remaining:</label>
              <span class="time-remaining">{{ lockTimeRemaining.hours }}h {{ lockTimeRemaining.minutes }}m</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Lock Controls -->
      <div class="controls-panel">
        <h3>🎛️ Lock Controls</h3>

        <div class="control-section">
          <h4>Quick Lock</h4>
          <div class="button-group">
            <button
              @click="quickLock(15, '15分間のクイックロック')"
              :disabled="!permissions.canLock || isCurrentlyLocked"
              class="btn-quick"
            >
              15分
            </button>
            <button
              @click="quickLock(30, '30分間のクイックロック')"
              :disabled="!permissions.canLock || isCurrentlyLocked"
              class="btn-quick"
            >
              30分
            </button>
            <button
              @click="quickLock(60, '1時間のクイックロック')"
              :disabled="!permissions.canLock || isCurrentlyLocked"
              class="btn-quick"
            >
              1時間
            </button>
          </div>
        </div>

        <div class="control-section">
          <h4>Custom Lock</h4>
          <div class="custom-lock-form">
            <div class="form-group">
              <label>Duration (minutes):</label>
              <input
                v-model.number="customLockForm.duration"
                type="number"
                min="1"
                max="10080"
                placeholder="Duration in minutes"
              />
            </div>

            <div class="form-group">
              <label>Reason:</label>
              <input
                v-model="customLockForm.reason"
                type="text"
                placeholder="Reason for locking"
                maxlength="200"
              />
            </div>

            <div class="form-group">
              <label>Lock Type:</label>
              <select v-model="customLockForm.lockType">
                <option value="temporary">Temporary</option>
                <option value="permanent">Permanent</option>
              </select>
            </div>

            <button
              @click="applyCustomLock"
              :disabled="!permissions.canLock || isCurrentlyLocked || !customLockForm.reason"
              class="btn-primary"
            >
              Apply Lock
            </button>
          </div>
        </div>

        <div class="control-section" v-if="isCurrentlyLocked">
          <h4>Lock Management</h4>
          <div class="button-group">
            <button
              @click="extendCurrentLock(15)"
              :disabled="!permissions.canLock || lockState.lockType === 'permanent'"
              class="btn-secondary"
            >
              Extend +15min
            </button>
            <button
              @click="extendCurrentLock(30)"
              :disabled="!permissions.canLock || lockState.lockType === 'permanent'"
              class="btn-secondary"
            >
              Extend +30min
            </button>
            <button
              @click="unlockNow"
              :disabled="!permissions.canUnlock"
              class="btn-danger"
            >
              Unlock Now
            </button>
          </div>
        </div>
      </div>

      <!-- Scheduled Locks -->
      <div class="scheduled-panel" v-if="permissions.canScheduleLock">
        <h3>📅 Scheduled Locks</h3>

        <div class="schedule-form">
          <h4>Schedule New Lock</h4>
          <div class="form-group">
            <label>Start Date & Time:</label>
            <input
              v-model="scheduleForm.startDateTime"
              type="datetime-local"
              :min="new Date().toISOString().slice(0, 16)"
            />
          </div>

          <div class="form-group">
            <label>End Date & Time:</label>
            <input
              v-model="scheduleForm.endDateTime"
              type="datetime-local"
              :min="scheduleForm.startDateTime"
            />
          </div>

          <div class="form-group">
            <label>Reason:</label>
            <input
              v-model="scheduleForm.reason"
              type="text"
              placeholder="Reason for scheduled lock"
              maxlength="200"
            />
          </div>

          <button
            @click="scheduleNewLock"
            :disabled="!isScheduleFormValid"
            class="btn-primary"
          >
            Schedule Lock
          </button>
        </div>

        <div class="scheduled-list" v-if="upcomingScheduledLocks.length > 0">
          <h4>Upcoming Scheduled Locks</h4>
          <div
            v-for="lock in upcomingScheduledLocks"
            :key="lock.id"
            class="scheduled-item"
          >
            <div class="scheduled-info">
              <div class="scheduled-time">
                {{ formatDateTime(lock.startDate) }} - {{ formatDateTime(lock.endDate) }}
              </div>
              <div class="scheduled-reason">{{ lock.reason }}</div>
              <div class="scheduled-meta">
                Created by {{ lock.createdBy }} on {{ formatDateTime(lock.createdAt) }}
              </div>
            </div>
            <button
              @click="cancelScheduledLock(lock.id)"
              class="btn-small btn-danger"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      <!-- Lock History -->
      <div class="history-panel" v-if="permissions.canViewLockHistory">
        <h3>📜 Lock History</h3>

        <div class="history-list">
          <div
            v-for="entry in lockHistory.slice(0, 10)"
            :key="entry.id"
            class="history-item"
            :class="entry.action"
          >
            <div class="history-action">
              <span class="action-icon">{{ getActionIcon(entry.action) }}</span>
              <span class="action-text">{{ getActionText(entry.action) }}</span>
            </div>

            <div class="history-details">
              <div class="history-user">{{ entry.userName }}</div>
              <div class="history-time">{{ formatDateTime(entry.timestamp) }}</div>
              <div v-if="entry.reason" class="history-reason">{{ entry.reason }}</div>
              <div v-if="entry.duration" class="history-duration">
                Duration: {{ formatLockDuration(entry.duration) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Permissions Info -->
      <div class="permissions-panel">
        <h3>🔐 Permissions</h3>

        <div class="permission-list">
          <div class="permission-item" :class="{ granted: permissions.canLock }">
            <span class="permission-icon">{{ permissions.canLock ? '✅' : '❌' }}</span>
            <span>Can Lock Workspace</span>
          </div>

          <div class="permission-item" :class="{ granted: permissions.canUnlock }">
            <span class="permission-icon">{{ permissions.canUnlock ? '✅' : '❌' }}</span>
            <span>Can Unlock Workspace</span>
          </div>

          <div class="permission-item" :class="{ granted: permissions.canScheduleLock }">
            <span class="permission-icon">{{ permissions.canScheduleLock ? '✅' : '❌' }}</span>
            <span>Can Schedule Locks</span>
          </div>

          <div class="permission-item" :class="{ granted: permissions.canViewLockHistory }">
            <span class="permission-icon">{{ permissions.canViewLockHistory ? '✅' : '❌' }}</span>
            <span>Can View Lock History</span>
          </div>
        </div>

        <div class="user-role">
          <label>Current Role:</label>
          <select v-model="currentUser.role" @change="updateUserRole">
            <option value="member">Member</option>
            <option value="moderator">Moderator</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      <!-- Statistics -->
      <div class="stats-panel">
        <h3>📈 Statistics</h3>

        <div class="stat-item">
          <label>Total Lock Events:</label>
          <span>{{ lockHistory.length }}</span>
        </div>

        <div class="stat-item">
          <label>Active Scheduled Locks:</label>
          <span>{{ activeScheduledLocks.length }}</span>
        </div>

        <div class="stat-item">
          <label>Upcoming Scheduled Locks:</label>
          <span>{{ upcomingScheduledLocks.length }}</span>
        </div>

        <div class="stat-item">
          <label>Last Lock Action:</label>
          <span v-if="lockHistory.length > 0">
            {{ getActionText(lockHistory[0].action) }} by {{ lockHistory[0].userName }}
          </span>
          <span v-else>No actions yet</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWorkspaceLock } from '../composables/useWorkspaceLock'
import WsLockUnIcon from './WsLockUnIcon.vue'

// Use the composable
const {
  lockState,
  currentUser,
  permissions,
  lockHistory,
  // scheduledLocks,
  isCurrentlyLocked,
  lockTimeRemaining,
  activeScheduledLocks,
  upcomingScheduledLocks,
  lockWorkspace,
  unlockWorkspace,
  scheduleLock,
  cancelScheduledLock,
  lockForDuration,
  extendLock,
  formatLockDuration,
  getLockStatusText
} = useWorkspaceLock()

// Form data
const customLockForm = ref({
  duration: 60,
  reason: '',
  lockType: 'temporary' as 'temporary' | 'permanent'
})

const scheduleForm = ref({
  startDateTime: '',
  endDateTime: '',
  reason: ''
})

// Computed properties
const isScheduleFormValid = computed(() => {
  return scheduleForm.value.startDateTime &&
         scheduleForm.value.endDateTime &&
         scheduleForm.value.reason &&
         new Date(scheduleForm.value.startDateTime) < new Date(scheduleForm.value.endDateTime)
})

// Methods
const quickLock = (minutes: number, reason: string) => {
  lockForDuration(minutes, reason)
}

const applyCustomLock = () => {
  const form = customLockForm.value
  if (form.lockType === 'permanent') {
    lockWorkspace(form.reason, undefined, 'permanent')
  } else {
    lockForDuration(form.duration, form.reason)
  }

  // Reset form
  customLockForm.value = {
    duration: 60,
    reason: '',
    lockType: 'temporary'
  }
}

const extendCurrentLock = (minutes: number) => {
  extendLock(minutes)
}

const unlockNow = () => {
  unlockWorkspace('Manual unlock')
}

const scheduleNewLock = () => {
  const form = scheduleForm.value
  const startDate = new Date(form.startDateTime)
  const endDate = new Date(form.endDateTime)

  if (scheduleLock(startDate, endDate, form.reason)) {
    // Reset form
    scheduleForm.value = {
      startDateTime: '',
      endDateTime: '',
      reason: ''
    }
  }
}

const updateUserRole = () => {
  // In a real app, this would make an API call
  console.log('User role updated to:', currentUser.value.role)
}

const formatDateTime = (date: Date): string => {
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getActionIcon = (action: string): string => {
  switch (action) {
    case 'lock': return '🔒'
    case 'unlock': return '🔓'
    case 'schedule': return '📅'
    default: return '❓'
  }
}

const getActionText = (action: string): string => {
  switch (action) {
    case 'lock': return 'Locked'
    case 'unlock': return 'Unlocked'
    case 'schedule': return 'Scheduled'
    default: return 'Unknown'
  }
}
</script>

<style scoped>
.workspace-lock-manager {
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
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.status-panel,
.controls-panel,
.scheduled-panel,
.history-panel,
.permissions-panel,
.stats-panel {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e9ecef;
}

.status-panel h3,
.controls-panel h3,
.scheduled-panel h3,
.history-panel h3,
.permissions-panel h3,
.stats-panel h3 {
  margin: 0 0 15px 0;
  color: #495057;
  font-size: 16px;
}

.status-display {
  text-align: center;
}

.status-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.status-indicator.locked {
  background: #f8d7da;
  border: 2px solid #dc3545;
}

.status-indicator.unlocked {
  background: #d4edda;
  border: 2px solid #28a745;
}

.status-text {
  font-weight: 500;
  font-size: 16px;
}

.lock-details {
  text-align: left;
  background: #fff;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-item label {
  font-weight: 500;
  color: #495057;
}

.lock-type {
  text-transform: capitalize;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.lock-type.temporary {
  background: #fff3cd;
  color: #856404;
}

.lock-type.permanent {
  background: #f8d7da;
  color: #721c24;
}

.lock-type.scheduled {
  background: #cce5ff;
  color: #004085;
}

.time-remaining {
  font-family: 'Monaco', 'Menlo', monospace;
  font-weight: 500;
  color: #dc3545;
}

.control-section {
  margin-bottom: 20px;
}

.control-section h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #495057;
}

.button-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-quick,
.btn-primary,
.btn-secondary,
.btn-danger,
.btn-small {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-quick {
  background: #17a2b8;
  color: white;
}

.btn-quick:hover:not(:disabled) {
  background: #138496;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #545b62;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.btn-small {
  padding: 4px 8px;
  font-size: 12px;
  background: #f8f9fa;
  color: #495057;
  border: 1px solid #dee2e6;
}

.btn-small:hover:not(:disabled) {
  background: #e9ecef;
}

.btn-small.btn-danger {
  background: #dc3545;
  color: white;
  border-color: #dc3545;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.custom-lock-form,
.schedule-form {
  background: #fff;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #dee2e6;
  margin-bottom: 15px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 5px;
  color: #495057;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.scheduled-list {
  margin-top: 20px;
}

.scheduled-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #fff;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  margin-bottom: 10px;
}

.scheduled-info {
  flex: 1;
}

.scheduled-time {
  font-weight: 500;
  color: #495057;
  margin-bottom: 4px;
}

.scheduled-reason {
  color: #6c757d;
  margin-bottom: 4px;
}

.scheduled-meta {
  font-size: 12px;
  color: #6c757d;
}

.history-list {
  max-height: 400px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #fff;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  margin-bottom: 10px;
}

.history-item.lock {
  border-left: 4px solid #dc3545;
}

.history-item.unlock {
  border-left: 4px solid #28a745;
}

.history-item.schedule {
  border-left: 4px solid #007bff;
}

.history-action {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 80px;
}

.action-icon {
  font-size: 16px;
}

.action-text {
  font-weight: 500;
}

.history-details {
  flex: 1;
}

.history-user {
  font-weight: 500;
  color: #495057;
}

.history-time {
  font-size: 12px;
  color: #6c757d;
  margin-bottom: 4px;
}

.history-reason {
  color: #6c757d;
  font-size: 14px;
  margin-bottom: 2px;
}

.history-duration {
  color: #6c757d;
  font-size: 12px;
}

.permission-list {
  margin-bottom: 20px;
}

.permission-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid #dee2e6;
}

.permission-item:last-child {
  border-bottom: none;
}

.permission-item.granted {
  color: #28a745;
}

.permission-item:not(.granted) {
  color: #dc3545;
}

.permission-icon {
  font-size: 16px;
}

.user-role {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-role label {
  font-weight: 500;
  color: #495057;
}

.user-role select {
  padding: 6px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #dee2e6;
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-item label {
  font-weight: 500;
  color: #495057;
}

.stat-item span {
  font-weight: 500;
  color: #007bff;
}

@media (max-width: 768px) {
  .grid-container {
    grid-template-columns: 1fr;
  }

  .button-group {
    flex-direction: column;
  }

  .scheduled-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .history-item {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
