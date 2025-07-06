<template>
  <div class="utility-system-example">
    <div class="header">
      <h2>🛠️ Utility System Manager</h2>
      <p>タイムゾーン、画像処理、国際化、削除機能のデモンストレーション</p>
    </div>

    <div class="grid-container">
      <!-- Timezone Management -->
      <div class="timezone-panel">
        <h3>🌍 Timezone Management</h3>

        <div class="current-timezone">
          <div class="timezone-info">
            <div class="timezone-display">
              <strong>{{ currentTimezoneInfo.displayName }}</strong>
              <span class="timezone-offset">(UTC{{ currentOffset >= 0 ? '+' : '' }}{{ currentOffset }})</span>
            </div>
            <div class="current-time">
              {{ currentTime }}
            </div>
          </div>

          <div v-if="timezoneLoading" class="loading">
            Detecting timezone...
          </div>

          <div v-if="timezoneError" class="error">
            {{ timezoneError }}
          </div>
        </div>

        <div class="timezone-selector">
          <h4>Select Timezone</h4>
          <select v-model="selectedTimezone" @change="changeTimezone">
            <option v-for="tz in commonTimezones" :key="tz.name" :value="tz.name">
              {{ tz.displayName }} ({{ tz.abbreviation }})
            </option>
          </select>
        </div>

        <div class="time-examples">
          <h4>Time Format Examples</h4>
          <div class="example-item">
            <label>Current Time:</label>
            <span>{{ formatDateTime(new Date()) }}</span>
          </div>
          <div class="example-item">
            <label>Date Only:</label>
            <span>{{ formatDate(new Date()) }}</span>
          </div>
          <div class="example-item">
            <label>Time Only:</label>
            <span>{{ formatTime(new Date()) }}</span>
          </div>
          <div class="example-item">
            <label>Relative:</label>
            <span>{{ getRelativeTime(new Date(Date.now() - 3600000)) }}</span>
          </div>
        </div>
      </div>

      <!-- Image Processing -->
      <div class="image-panel">
        <h3>🖼️ Image Processing</h3>

        <div class="image-upload">
          <input
            type="file"
            ref="fileInputRef"
            @change="handleFileSelect"
            accept="image/*"
            multiple
          />
          <button @click="fileInputRef?.click()" class="btn-primary">
            Select Images
          </button>
        </div>

        <div v-if="imageProcessing" class="processing-status">
          <div class="spinner"></div>
          <span>Processing images...</span>
        </div>

        <div v-if="imageError" class="error">
          {{ imageError }}
        </div>

        <div v-if="selectedImages.length > 0" class="image-list">
          <h4>Selected Images ({{ selectedImages.length }})</h4>
          <div class="image-grid">
            <div
              v-for="(img, index) in selectedImages"
              :key="index"
              class="image-item"
            >
              <img :src="img.dataUrl" :alt="`Image ${index + 1}`" />
              <div class="image-info">
                <div class="image-size">{{ img.info.width }}×{{ img.info.height }}</div>
                <div class="image-file-size">{{ formatFileSize(img.info.size) }}</div>
              </div>
              <div class="image-actions">
                <button @click="downloadProcessedImage(img, `processed-${index + 1}.jpg`)" class="btn-small">
                  Download
                </button>
                <button @click="removeImage(index)" class="btn-small btn-danger">
                  <DeleteIcon color="#dc3545" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="processing-options">
          <h4>Processing Options</h4>
          <div class="option-group">
            <label>Max Width:</label>
            <input v-model.number="processingOptions.maxWidth" type="number" min="100" max="4000" />
          </div>
          <div class="option-group">
            <label>Max Height:</label>
            <input v-model.number="processingOptions.maxHeight" type="number" min="100" max="4000" />
          </div>
          <div class="option-group">
            <label>Quality:</label>
            <input v-model.number="processingOptions.quality" type="range" min="0.1" max="1" step="0.1" />
            <span>{{ Math.round(processingOptions.quality * 100) }}%</span>
          </div>
          <div class="option-group">
            <label>Format:</label>
            <select v-model="processingOptions.format">
              <option value="jpeg">JPEG</option>
              <option value="png">PNG</option>
              <option value="webp">WebP</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Internationalization -->
      <div class="i18n-panel">
        <h3>🌐 Internationalization</h3>

        <div class="locale-selector">
          <h4>Current Locale: {{ getLocaleDisplayName(currentLocale) }}</h4>
          <div class="locale-buttons">
            <button
              v-for="locale in availableLocales"
              :key="locale"
              @click="setLocale(locale)"
              :class="{ active: locale === currentLocale }"
              class="locale-btn"
            >
              {{ getLocaleDisplayName(locale) }}
            </button>
          </div>
        </div>

        <div class="translation-examples">
          <h4>Translation Examples</h4>
          <div class="example-item">
            <label>Download Message:</label>
            <span>{{ t('download.webrtcstats') }}</span>
          </div>
          <div class="example-item">
            <label>Manual Link:</label>
            <span>{{ t('download.manual_link', { here: t('download.manual_link_here') }) }}</span>
          </div>
          <div class="example-item">
            <label>Reservation Socket:</label>
            <span>{{ t('reservationSocket.add') }}</span>
          </div>
          <div class="example-item">
            <label>Custom Plugin:</label>
            <span>{{ t('customPlugin.add', { name: 'テストプラグイン' }) }}</span>
          </div>
        </div>

        <div class="date-number-formatting">
          <h4>Date & Number Formatting</h4>
          <div class="example-item">
            <label>Formatted Date:</label>
            <span>{{ d(new Date(), { dateStyle: 'full' }) }}</span>
          </div>
          <div class="example-item">
            <label>Formatted Number:</label>
            <span>{{ n(1234567.89) }}</span>
          </div>
          <div class="example-item">
            <label>Currency:</label>
            <span>{{ n(1234.56, { style: 'currency', currency: currentLocale === 'ja' ? 'JPY' : 'USD' }) }}</span>
          </div>
        </div>
      </div>

      <!-- Delete Functionality Demo -->
      <div class="delete-panel">
        <h3>🗑️ Delete Functionality</h3>

        <div class="delete-demo">
          <h4>Deletable Items</h4>
          <div class="item-list">
            <div
              v-for="(item, index) in deletableItems"
              :key="item.id"
              class="deletable-item"
            >
              <div class="item-content">
                <span class="item-icon">{{ item.icon }}</span>
                <span class="item-name">{{ item.name }}</span>
                <span class="item-type">{{ item.type }}</span>
              </div>
              <button
                @click="deleteItem(index)"
                class="delete-btn"
                :title="`Delete ${item.name}`"
              >
                <DeleteIcon color="#dc3545" />
              </button>
            </div>
          </div>

          <button @click="addRandomItem" class="btn-secondary">
            Add Random Item
          </button>
        </div>

        <div class="delete-confirmation">
          <h4>Delete Confirmation Dialog</h4>
          <button @click="showDeleteConfirmation" class="btn-danger">
            Delete with Confirmation
          </button>
        </div>
      </div>

      <!-- System Stats -->
      <div class="stats-panel">
        <h3>📊 System Statistics</h3>

        <div class="stat-item">
          <label>Current Timezone:</label>
          <span>{{ currentTimezoneInfo.name }}</span>
        </div>

        <div class="stat-item">
          <label>Timezone Offset:</label>
          <span>UTC{{ currentOffset >= 0 ? '+' : '' }}{{ currentOffset }}</span>
        </div>

        <div class="stat-item">
          <label>Current Locale:</label>
          <span>{{ currentLocale }}</span>
        </div>

        <div class="stat-item">
          <label>Available Locales:</label>
          <span>{{ availableLocales.length }}</span>
        </div>

        <div class="stat-item">
          <label>Processed Images:</label>
          <span>{{ selectedImages.length }}</span>
        </div>

        <div class="stat-item">
          <label>Deletable Items:</label>
          <span>{{ deletableItems.length }}</span>
        </div>

        <div class="stat-item">
          <label>Browser Language:</label>
          <span>{{ browserLanguage }}</span>
        </div>

        <div class="stat-item">
          <label>System Time:</label>
          <span>{{ systemTime }}</span>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="showDeleteModal = false">
      <div class="modal-content" @click.stop>
        <h3>Confirm Deletion</h3>
        <p>Are you sure you want to delete this item? This action cannot be undone.</p>
        <div class="modal-actions">
          <button @click="showDeleteModal = false" class="btn-secondary">
            Cancel
          </button>
          <button @click="confirmDelete" class="btn-danger">
            <DeleteIcon color="white" />
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTimezone } from '../composables/useTimezone'
import { useImageProcessor } from '../composables/useImageProcessor'
import { useI18n } from '../composables/useI18n'
import DeleteIcon from './DeleteIcon.vue'

// Use composables
const {
  currentTimezone,
  currentTimezoneInfo,
  currentOffset,
  commonTimezones,
  isLoading: timezoneLoading,
  error: timezoneError,
  setTimezone,
  formatDateTime,
  formatDate,
  formatTime,
  getRelativeTime
} = useTimezone()

const {
  isProcessing: imageProcessing,
  error: imageError,
  // resizeImage,
  // validateImageFile,
  batchProcess,
  downloadImage
} = useImageProcessor()

const {
  currentLocale,
  availableLocales,
  t,
  d,
  n,
  setLocale,
  getLocaleDisplayName
} = useI18n()

// State
const selectedTimezone = ref(currentTimezone.value)
const currentTime = ref('')
const systemTime = ref('')
const selectedImages = ref<any[]>([])
const showDeleteModal = ref(false)
const fileInputRef = ref<HTMLInputElement>()

const processingOptions = ref({
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  format: 'jpeg' as 'jpeg' | 'png' | 'webp'
})

const deletableItems = ref([
  { id: 1, name: 'Document 1', type: 'PDF', icon: '📄' },
  { id: 2, name: 'Image 1', type: 'JPG', icon: '🖼️' },
  { id: 3, name: 'Video 1', type: 'MP4', icon: '🎥' },
  { id: 4, name: 'Audio 1', type: 'MP3', icon: '🎵' }
])

// Computed
const browserLanguage = computed(() => {
  return typeof window !== 'undefined' ? window.navigator.language : 'unknown'
})

// Methods
const changeTimezone = () => {
  setTimezone(selectedTimezone.value)
}

const updateTime = () => {
  const now = new Date()
  currentTime.value = formatDateTime(now)
  systemTime.value = now.toLocaleString()
}

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || [])

  if (files.length === 0) return

  try {
    const results = await batchProcess(files, processingOptions.value)
    selectedImages.value = results
  } catch (error) {
    console.error('Failed to process images:', error)
  }
}

const removeImage = (index: number) => {
  selectedImages.value.splice(index, 1)
}

const downloadProcessedImage = (image: any, filename: string) => {
  downloadImage(image, filename)
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const deleteItem = (index: number) => {
  deletableItems.value.splice(index, 1)
}

const addRandomItem = () => {
  const types = [
    { name: 'Document', type: 'PDF', icon: '📄' },
    { name: 'Image', type: 'JPG', icon: '🖼️' },
    { name: 'Video', type: 'MP4', icon: '🎥' },
    { name: 'Audio', type: 'MP3', icon: '🎵' },
    { name: 'Archive', type: 'ZIP', icon: '📦' },
    { name: 'Text', type: 'TXT', icon: '📝' }
  ]

  const randomType = types[Math.floor(Math.random() * types.length)]
  const newId = Math.max(...deletableItems.value.map(item => item.id)) + 1

  deletableItems.value.push({
    id: newId,
    name: `${randomType.name} ${newId}`,
    type: randomType.type,
    icon: randomType.icon
  })
}

const showDeleteConfirmation = () => {
  showDeleteModal.value = true
}

const confirmDelete = () => {
  console.log('Item deleted with confirmation')
  showDeleteModal.value = false
}

// Lifecycle
let timeInterval: ReturnType<typeof setInterval>

onMounted(() => {
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>

<style scoped>
.utility-system-example {
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
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  max-width: 1600px;
  margin: 0 auto;
}

.timezone-panel,
.image-panel,
.i18n-panel,
.delete-panel,
.stats-panel {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e9ecef;
}

.timezone-panel h3,
.image-panel h3,
.i18n-panel h3,
.delete-panel h3,
.stats-panel h3 {
  margin: 0 0 15px 0;
  color: #495057;
  font-size: 16px;
}

.current-timezone {
  background: #fff;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #dee2e6;
  margin-bottom: 20px;
}

.timezone-info {
  text-align: center;
}

.timezone-display {
  font-size: 18px;
  margin-bottom: 10px;
}

.timezone-offset {
  color: #6c757d;
  font-size: 14px;
  margin-left: 8px;
}

.current-time {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 24px;
  font-weight: bold;
  color: #007bff;
}

.timezone-selector {
  margin-bottom: 20px;
}

.timezone-selector h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #495057;
}

.timezone-selector select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
}

.time-examples {
  background: #fff;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.time-examples h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #495057;
}

.example-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 4px 0;
  border-bottom: 1px solid #f8f9fa;
}

.example-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.example-item label {
  font-weight: 500;
  color: #495057;
}

.image-upload {
  margin-bottom: 20px;
}

.image-upload input[type="file"] {
  display: none;
}

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

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
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

.btn-small.btn-danger {
  background: #dc3545;
  color: white;
  border-color: #dc3545;
}

.processing-status {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding: 10px;
  background: #cce5ff;
  border-radius: 4px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error,
.loading {
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 10px;
}

.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.loading {
  background: #cce5ff;
  color: #004085;
  border: 1px solid #b3d7ff;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
}

.image-item {
  background: #fff;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  overflow: hidden;
}

.image-item img {
  width: 100%;
  height: 100px;
  object-fit: cover;
}

.image-info {
  padding: 8px;
  font-size: 12px;
  color: #6c757d;
}

.image-actions {
  display: flex;
  gap: 4px;
  padding: 8px;
}

.locale-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.locale-btn {
  padding: 6px 12px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.locale-btn:hover {
  background: #e9ecef;
}

.locale-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.translation-examples,
.date-number-formatting {
  background: #fff;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #dee2e6;
  margin-bottom: 20px;
}

.translation-examples h4,
.date-number-formatting h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #495057;
}

.item-list {
  margin-bottom: 20px;
}

.deletable-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #fff;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  margin-bottom: 10px;
}

.item-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.item-icon {
  font-size: 20px;
}

.item-name {
  font-weight: 500;
  color: #495057;
}

.item-type {
  color: #6c757d;
  font-size: 12px;
  background: #f8f9fa;
  padding: 2px 6px;
  border-radius: 3px;
}

.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.2s;
}

.delete-btn:hover {
  background: #f8d7da;
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

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  max-width: 400px;
  width: 90%;
}

.modal-content h3 {
  margin: 0 0 10px 0;
  color: #495057;
}

.modal-content p {
  margin: 0 0 20px 0;
  color: #6c757d;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.processing-options {
  background: #fff;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #dee2e6;
  margin-bottom: 20px;
}

.processing-options h4 {
  margin: 0 0 15px 0;
  font-size: 14px;
  color: #495057;
}

.option-group {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.option-group label {
  min-width: 80px;
  font-weight: 500;
  color: #495057;
}

.option-group input,
.option-group select {
  padding: 4px 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
}

@media (max-width: 768px) {
  .grid-container {
    grid-template-columns: 1fr;
  }

  .locale-buttons {
    flex-direction: column;
  }

  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
}
</style>
