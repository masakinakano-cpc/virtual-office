<template>
  <div class="user-permissions">
    <div class="permissions-header">
      <h2>🔐 ユーザー権限管理</h2>
      <button @click="showAddUserModal = true" class="add-user-btn">
        ➕ ユーザーを追加
      </button>
    </div>

    <!-- ユーザー一覧 -->
    <div class="users-list">
      <div class="users-header">
        <div class="search-bar">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="ユーザーを検索..."
            class="search-input"
          />
          <button class="search-btn">🔍</button>
        </div>
        <div class="filter-controls">
          <select v-model="roleFilter" class="role-filter">
            <option value="">すべての役割</option>
            <option value="admin">管理者</option>
            <option value="member">メンバー</option>
            <option value="guest">ゲスト</option>
          </select>
          <select v-model="statusFilter" class="status-filter">
            <option value="">すべてのステータス</option>
            <option value="active">アクティブ</option>
            <option value="inactive">非アクティブ</option>
          </select>
        </div>
      </div>

      <div class="users-table">
        <div class="table-header">
          <div class="col-user">ユーザー</div>
          <div class="col-role">役割</div>
          <div class="col-permissions">権限</div>
          <div class="col-status">ステータス</div>
          <div class="col-actions">操作</div>
        </div>

        <div
          v-for="user in filteredUsers"
          :key="user.id"
          class="table-row"
          :class="{ 'inactive': !user.isActive }"
        >
          <div class="col-user">
            <div class="user-info">
              <div class="user-avatar">
                <img v-if="user.avatar" :src="user.avatar" :alt="user.name" />
                <span v-else class="avatar-placeholder">{{ getInitials(user.name) }}</span>
              </div>
              <div class="user-details">
                <div class="user-name">{{ user.name }}</div>
                <div class="user-email">{{ user.email }}</div>
                <div class="user-last-login">
                  最終ログイン: {{ formatDate(user.lastLogin) }}
                </div>
              </div>
            </div>
          </div>

          <div class="col-role">
            <select
              v-model="user.role"
              @change="updateUserRole(user.id, user.role)"
              class="role-select"
              :disabled="user.id === currentUserId"
            >
              <option value="admin">管理者</option>
              <option value="member">メンバー</option>
              <option value="guest">ゲスト</option>
            </select>
          </div>

          <div class="col-permissions">
            <div class="permissions-list">
              <span
                v-for="permission in user.permissions"
                :key="permission"
                class="permission-tag"
              >
                {{ getPermissionLabel(permission) }}
              </span>
            </div>
            <button
              @click="editPermissions(user)"
              class="edit-permissions-btn"
            >
              編集
            </button>
          </div>

          <div class="col-status">
            <div class="status-toggle">
              <label class="switch">
                <input
                  type="checkbox"
                  v-model="user.isActive"
                  @change="updateUserStatus(user.id, user.isActive)"
                  :disabled="user.id === currentUserId"
                />
                <span class="slider"></span>
              </label>
              <span class="status-text">
                {{ user.isActive ? 'アクティブ' : '非アクティブ' }}
              </span>
            </div>
          </div>

          <div class="col-actions">
            <button
              @click="viewUserDetails(user)"
              class="action-btn view-btn"
              title="詳細を表示"
            >
              👁️
            </button>
            <button
              @click="editUser(user)"
              class="action-btn edit-btn"
              title="編集"
            >
              ✏️
            </button>
            <button
              v-if="user.id !== currentUserId"
              @click="deleteUser(user)"
              class="action-btn delete-btn"
              title="削除"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ユーザー追加モーダル -->
    <div v-if="showAddUserModal" class="modal-overlay" @click="closeAddUserModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>新しいユーザーを追加</h3>
          <button @click="closeAddUserModal" class="close-btn">✕</button>
        </div>
        <div class="modal-content">
          <form @submit.prevent="addUser">
            <div class="form-group">
              <label>名前</label>
              <input v-model="newUser.name" type="text" required />
            </div>
            <div class="form-group">
              <label>メールアドレス</label>
              <input v-model="newUser.email" type="email" required />
            </div>
            <div class="form-group">
              <label>役割</label>
              <select v-model="newUser.role" required>
                <option value="member">メンバー</option>
                <option value="guest">ゲスト</option>
                <option value="admin">管理者</option>
              </select>
            </div>
            <div class="form-group">
              <label>権限</label>
              <div class="permissions-checkboxes">
                <label
                  v-for="permission in availablePermissions"
                  :key="permission.id"
                  class="permission-checkbox"
                >
                  <input
                    type="checkbox"
                    :value="permission.id"
                    v-model="newUser.permissions"
                  />
                  {{ permission.label }}
                </label>
              </div>
            </div>
            <div class="form-actions">
              <button type="button" @click="closeAddUserModal" class="cancel-btn">
                キャンセル
              </button>
              <button type="submit" class="submit-btn">
                追加
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- 権限編集モーダル -->
    <div v-if="showPermissionsModal" class="modal-overlay" @click="closePermissionsModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ editingUser?.name }}の権限を編集</h3>
          <button @click="closePermissionsModal" class="close-btn">✕</button>
        </div>
        <div class="modal-content">
          <div class="permissions-editor">
            <div class="permission-categories">
              <div
                v-for="category in permissionCategories"
                :key="category.id"
                class="permission-category"
              >
                <h4>{{ category.name }}</h4>
                <div class="category-permissions">
                  <label
                    v-for="permission in category.permissions"
                    :key="permission.id"
                    class="permission-item"
                  >
                    <input
                      type="checkbox"
                      :value="permission.id"
                      v-model="editingPermissions"
                    />
                    <div class="permission-info">
                      <span class="permission-name">{{ permission.label }}</span>
                      <span class="permission-description">{{ permission.description }}</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div class="form-actions">
            <button @click="closePermissionsModal" class="cancel-btn">
              キャンセル
            </button>
            <button @click="savePermissions" class="submit-btn">
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'admin' | 'member' | 'guest'
  permissions: string[]
  isActive: boolean
  lastLogin?: Date
}

interface Permission {
  id: string
  label: string
  description: string
}

interface PermissionCategory {
  id: string
  name: string
  permissions: Permission[]
}

const { authState } = useAuth()

const users = ref<User[]>([])
const searchQuery = ref('')
const roleFilter = ref('')
const statusFilter = ref('')
const showAddUserModal = ref(false)
const showPermissionsModal = ref(false)
const editingUser = ref<User | null>(null)
const editingPermissions = ref<string[]>([])

const newUser = reactive({
  name: '',
  email: '',
  role: 'member' as const,
  permissions: [] as string[]
})

const currentUserId = computed(() => authState.user?.id || '')

const availablePermissions: Permission[] = [
  { id: 'read_users', label: 'ユーザー閲覧', description: 'ユーザー情報を閲覧できます' },
  { id: 'write_users', label: 'ユーザー編集', description: 'ユーザー情報を編集できます' },
  { id: 'delete_users', label: 'ユーザー削除', description: 'ユーザーを削除できます' },
  { id: 'manage_permissions', label: '権限管理', description: 'ユーザー権限を管理できます' },
  { id: 'read_analytics', label: '分析データ閲覧', description: '分析データを閲覧できます' },
  { id: 'manage_settings', label: '設定管理', description: 'システム設定を管理できます' },
  { id: 'moderate_content', label: 'コンテンツ管理', description: 'コンテンツを管理できます' },
  { id: 'create_meetings', label: '会議作成', description: '会議を作成できます' },
  { id: 'manage_meetings', label: '会議管理', description: '会議を管理できます' },
  { id: 'access_reports', label: 'レポート閲覧', description: 'レポートを閲覧できます' }
]

const permissionCategories: PermissionCategory[] = [
  {
    id: 'user_management',
    name: 'ユーザー管理',
    permissions: [
      { id: 'read_users', label: 'ユーザー閲覧', description: 'ユーザー情報を閲覧できます' },
      { id: 'write_users', label: 'ユーザー編集', description: 'ユーザー情報を編集できます' },
      { id: 'delete_users', label: 'ユーザー削除', description: 'ユーザーを削除できます' },
      { id: 'manage_permissions', label: '権限管理', description: 'ユーザー権限を管理できます' }
    ]
  },
  {
    id: 'content_management',
    name: 'コンテンツ管理',
    permissions: [
      { id: 'moderate_content', label: 'コンテンツ管理', description: 'コンテンツを管理できます' },
      { id: 'create_meetings', label: '会議作成', description: '会議を作成できます' },
      { id: 'manage_meetings', label: '会議管理', description: '会議を管理できます' }
    ]
  },
  {
    id: 'system_management',
    name: 'システム管理',
    permissions: [
      { id: 'manage_settings', label: '設定管理', description: 'システム設定を管理できます' },
      { id: 'read_analytics', label: '分析データ閲覧', description: '分析データを閲覧できます' },
      { id: 'access_reports', label: 'レポート閲覧', description: 'レポートを閲覧できます' }
    ]
  }
]

const filteredUsers = computed(() => {
  return users.value.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesRole = !roleFilter.value || user.role === roleFilter.value
    const matchesStatus = !statusFilter.value ||
                         (statusFilter.value === 'active' && user.isActive) ||
                         (statusFilter.value === 'inactive' && !user.isActive)

    return matchesSearch && matchesRole && matchesStatus
  })
})

const getInitials = (name: string): string => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

const getPermissionLabel = (permissionId: string): string => {
  const permission = availablePermissions.find(p => p.id === permissionId)
  return permission?.label || permissionId
}

const formatDate = (date?: Date): string => {
  if (!date) return '未ログイン'
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const updateUserRole = async (userId: string, newRole: string) => {
  try {
    // API call to update user role
    console.log(`Updating user ${userId} role to ${newRole}`)
    // await api.updateUserRole(userId, newRole)
  } catch (error) {
    console.error('役割更新エラー:', error)
  }
}

const updateUserStatus = async (userId: string, isActive: boolean) => {
  try {
    // API call to update user status
    console.log(`Updating user ${userId} status to ${isActive}`)
    // await api.updateUserStatus(userId, isActive)
  } catch (error) {
    console.error('ステータス更新エラー:', error)
  }
}

const editPermissions = (user: User) => {
  editingUser.value = user
  editingPermissions.value = [...user.permissions]
  showPermissionsModal.value = true
}

const savePermissions = async () => {
  if (!editingUser.value) return

  try {
    // API call to update permissions
    console.log(`Updating permissions for user ${editingUser.value.id}:`, editingPermissions.value)
    // await api.updateUserPermissions(editingUser.value.id, editingPermissions.value)

    editingUser.value.permissions = [...editingPermissions.value]
    closePermissionsModal()
  } catch (error) {
    console.error('権限更新エラー:', error)
  }
}

const addUser = async () => {
  try {
    // API call to add user
    console.log('Adding new user:', newUser)
    // const addedUser = await api.addUser(newUser)

    // Demo: Add to local array
    const newUserData: User = {
      id: Date.now().toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      permissions: newUser.permissions,
      isActive: true
    }

    users.value.push(newUserData)
    closeAddUserModal()
  } catch (error) {
    console.error('ユーザー追加エラー:', error)
  }
}

const editUser = (user: User) => {
  console.log('Editing user:', user)
  // Open user edit modal
}

const viewUserDetails = (user: User) => {
  console.log('Viewing user details:', user)
  // Open user details modal
}

const deleteUser = async (user: User) => {
  if (confirm(`${user.name}を削除してもよろしいですか？`)) {
    try {
      // API call to delete user
      console.log('Deleting user:', user.id)
      // await api.deleteUser(user.id)

      users.value = users.value.filter(u => u.id !== user.id)
    } catch (error) {
      console.error('ユーザー削除エラー:', error)
    }
  }
}

const closeAddUserModal = () => {
  showAddUserModal.value = false
  newUser.name = ''
  newUser.email = ''
  newUser.role = 'member'
  newUser.permissions = []
}

const closePermissionsModal = () => {
  showPermissionsModal.value = false
  editingUser.value = null
  editingPermissions.value = []
}

onMounted(() => {
  // Load users from API
  // Demo data
  users.value = [
    {
      id: '1',
      name: '田中太郎',
      email: 'tanaka@example.com',
      role: 'admin',
      permissions: ['read_users', 'write_users', 'delete_users', 'manage_permissions'],
      isActive: true,
      lastLogin: new Date('2024-01-15T10:30:00')
    },
    {
      id: '2',
      name: '佐藤花子',
      email: 'sato@example.com',
      role: 'member',
      permissions: ['read_users', 'create_meetings'],
      isActive: true,
      lastLogin: new Date('2024-01-14T15:20:00')
    },
    {
      id: '3',
      name: '鈴木一郎',
      email: 'suzuki@example.com',
      role: 'guest',
      permissions: ['read_users'],
      isActive: false,
      lastLogin: new Date('2024-01-10T09:15:00')
    }
  ]
})
</script>

<style scoped>
.user-permissions {
  padding: var(--spacing-6);
  background: var(--bg-secondary);
  border-radius: var(--radius-xl);
}

.permissions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-6);
}

.permissions-header h2 {
  margin: 0;
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--text-primary);
}

.add-user-btn {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-weight: 500;
  transition: var(--transition-normal);
}

.add-user-btn:hover {
  background: var(--color-primary-dark);
}

.users-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-4);
  gap: var(--spacing-4);
}

.search-bar {
  display: flex;
  flex: 1;
  max-width: 400px;
}

.search-input {
  flex: 1;
  padding: var(--spacing-3);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg) 0 0 var(--radius-lg);
  font-size: var(--text-base);
}

.search-btn {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: var(--spacing-3);
  border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
  cursor: pointer;
}

.filter-controls {
  display: flex;
  gap: var(--spacing-3);
}

.role-filter,
.status-filter {
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  background: white;
}

.users-table {
  background: white;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 1fr 2fr 1fr 1fr;
  gap: var(--spacing-4);
  padding: var(--spacing-4);
  background: var(--bg-muted);
  font-weight: 600;
  color: var(--text-primary);
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 2fr 1fr 1fr;
  gap: var(--spacing-4);
  padding: var(--spacing-4);
  border-bottom: 1px solid var(--border-color);
  align-items: center;
}

.table-row.inactive {
  opacity: 0.6;
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  color: white;
  font-weight: 600;
  font-size: var(--text-sm);
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.user-name {
  font-weight: 500;
  color: var(--text-primary);
}

.user-email {
  color: var(--text-muted);
  font-size: var(--text-sm);
}

.user-last-login {
  color: var(--text-muted);
  font-size: var(--text-xs);
}

.role-select {
  padding: var(--spacing-2);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: white;
}

.permissions-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-2);
}

.permission-tag {
  background: var(--bg-muted);
  color: var(--text-primary);
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
}

.edit-permissions-btn {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--text-xs);
}

.status-toggle {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--color-primary);
}

input:checked + .slider:before {
  transform: translateX(20px);
}

.status-text {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.col-actions {
  display: flex;
  gap: var(--spacing-2);
}

.action-btn {
  background: none;
  border: none;
  padding: var(--spacing-2);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--text-base);
  transition: var(--transition-fast);
}

.action-btn:hover {
  background: var(--bg-muted);
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.1);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: var(--radius-xl);
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-6) var(--spacing-6) var(--spacing-4);
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  font-size: var(--text-xl);
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: var(--text-xl);
  cursor: pointer;
  color: var(--text-muted);
}

.modal-content {
  padding: var(--spacing-6);
}

.form-group {
  margin-bottom: var(--spacing-4);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-2);
  font-weight: 500;
  color: var(--text-primary);
}

.form-group input,
.form-group select {
  width: 100%;
  padding: var(--spacing-3);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
}

.permissions-checkboxes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-2);
}

.permission-checkbox {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  cursor: pointer;
}

.permissions-editor {
  max-height: 400px;
  overflow-y: auto;
}

.permission-categories {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.permission-category h4 {
  margin: 0 0 var(--spacing-3) 0;
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
}

.category-permissions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.permission-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-3);
  cursor: pointer;
  padding: var(--spacing-2);
  border-radius: var(--radius-md);
  transition: var(--transition-fast);
}

.permission-item:hover {
  background: var(--bg-muted);
}

.permission-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.permission-name {
  font-weight: 500;
  color: var(--text-primary);
}

.permission-description {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
  margin-top: var(--spacing-6);
}

.cancel-btn {
  background: var(--bg-muted);
  color: var(--text-primary);
  border: none;
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition-fast);
}

.cancel-btn:hover {
  background: var(--bg-muted-dark);
}

.submit-btn {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-weight: 500;
  transition: var(--transition-normal);
}

.submit-btn:hover {
  background: var(--color-primary-dark);
}
</style>
