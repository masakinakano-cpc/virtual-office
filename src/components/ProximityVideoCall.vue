<template>
  <div class="proximity-video-call">
    <!-- 通話範囲の可視化 -->
    <div
      v-if="showCallRange"
      class="call-range-circle"
      :style="{
        left: (currentPosition.x - callRadius) + 'px',
        top: (currentPosition.y - callRadius) + 'px',
        width: (callRadius * 2) + 'px',
        height: (callRadius * 2) + 'px'
      }"
    >
      <div class="range-label">通話範囲</div>
    </div>

    <!-- 近接ユーザーの表示 -->
    <div
      v-for="user in nearbyUsers"
      :key="user.id"
      class="nearby-user-indicator"
      :style="{
        left: user.position.x + 'px',
        top: (user.position.y - 40) + 'px'
      }"
    >
      <div class="proximity-badge" @click="startCallWithUser(user)">
        <span class="proximity-icon">📞</span>
        <span class="proximity-text">通話開始</span>
      </div>
    </div>

    <!-- アクティブ通話の表示 -->
    <div v-if="activeCall" class="active-call-overlay" :class="{ minimized: isCallMinimized }" :style="{ left: callPanelPosition.x + 'px', top: callPanelPosition.y + 'px' }">
      <div class="call-header" @mousedown="startDragCallPanel">
        <div class="call-info">
          <span class="call-icon">📹</span>
          <span class="call-status">{{ activeCall.type === 'video' ? 'ビデオ通話中' : '音声通話中' }}</span>
          <span class="call-duration">{{ formatDuration(callDuration) }}</span>
        </div>
        <div class="call-controls-header">
          <button @click="toggleCallMinimized" class="header-control-btn">
            {{ isCallMinimized ? '🔼' : '🔽' }}
          </button>
          <button @click="endCall" class="header-control-btn end-call">
            ❌
          </button>
        </div>
      </div>

      <div v-if="!isCallMinimized">
        <div class="call-participants">
          参加者: {{ activeCall.participants.length }}人
        </div>

        <!-- ビデオグリッド -->
        <div v-if="activeCall.type === 'video'" class="video-grid">
          <!-- ローカルビデオ（自分自身） -->
          <div
            class="video-item local-video draggable-window"
            :class="{ minimized: isLocalVideoMinimized }"
            :style="{
              left: localVideoPosition.x + 'px',
              top: localVideoPosition.y + 'px',
              position: 'absolute',
              zIndex: 1000,
              width: isLocalVideoMinimized ? '150px' : '300px',
              height: isLocalVideoMinimized ? '80px' : 'auto'
            }"
          >
            <div class="video-header" @mousedown="startDragLocalVideo">
              <span class="video-name">{{ currentUserNickname }}</span>
              <div class="video-header-controls">
                <button @click="toggleLocalVideoMinimized" class="header-control-btn">
                  {{ isLocalVideoMinimized ? '🔼' : '🔽' }}
                </button>
                <button @click="closeLocalVideo" class="header-control-btn close-btn">
                  ❌
                </button>
              </div>
            </div>

            <div v-if="!isLocalVideoMinimized" class="video-content">
              <video ref="localVideoRef" autoplay muted playsinline></video>
              <div class="video-overlay">
                <div class="video-controls">
                  <button @click="toggleMicrophone" :class="{ muted: !isMicrophoneOn }" class="video-control-btn">
                    {{ isMicrophoneOn ? '🎤' : '🔇' }}
                  </button>
                  <button @click="toggleCamera" :class="{ disabled: !isCameraOn }" class="video-control-btn">
                    {{ isCameraOn ? '📹' : '📷' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- 最小化時の表示 -->
            <div v-else class="minimized-content">
              <div class="minimized-avatar" :style="{ backgroundColor: getCurrentUserColor() }">
                {{ currentUserNickname.charAt(0).toUpperCase() }}
              </div>
              <div class="minimized-status">
                <span v-if="!isMicrophoneOn" class="status-icon">🔇</span>
                <span v-if="!isCameraOn" class="status-icon">📷</span>
              </div>
            </div>
          </div>

          <!-- リモートビデオ（近接時のみ表示） -->
          <div
            v-for="participant in filteredParticipants"
            :key="participant.id"
            class="video-item remote-video draggable-window"
            :class="{ minimized: isParticipantMinimized(participant.id) }"
            :data-participant-id="participant.id"
            :style="{
              left: getParticipantPosition(participant.id).x + 'px',
              top: getParticipantPosition(participant.id).y + 'px',
              position: 'absolute',
              zIndex: 999,
              width: isParticipantMinimized(participant.id) ? '150px' : '300px',
              height: isParticipantMinimized(participant.id) ? '80px' : 'auto'
            }"
          >
            <div class="video-header" @mousedown="startDragParticipantVideo(participant.id)">
              <span class="video-name">{{ participant.nickname }}</span>
              <div class="video-header-controls">
                <button @click="toggleParticipantMinimized(participant.id)" class="header-control-btn">
                  {{ isParticipantMinimized(participant.id) ? '🔼' : '🔽' }}
                </button>
                <button @click="closeParticipantVideo(participant.id)" class="header-control-btn close-btn">
                  ❌
                </button>
              </div>
            </div>

            <div v-if="!isParticipantMinimized(participant.id)" class="video-content">
              <video :ref="`remoteVideo-${participant.id}`" :data-user-id="participant.id" autoplay playsinline></video>
              <div class="video-overlay">
                <div class="video-status">
                  <span v-if="!participant.isAudioEnabled" class="status-muted">🔇</span>
                  <span v-if="!participant.isVideoEnabled" class="status-no-video">📷</span>
                  <span v-if="participant.isSpeaking" class="status-speaking">🗣️</span>
                </div>
              </div>
            </div>

            <!-- 最小化時の表示 -->
            <div v-else class="minimized-content">
              <div class="minimized-avatar" :style="{ backgroundColor: participant.color }">
                {{ participant.nickname.charAt(0).toUpperCase() }}
              </div>
              <div class="minimized-status">
                <span v-if="!participant.isAudioEnabled" class="status-icon">🔇</span>
                <span v-if="!participant.isVideoEnabled" class="status-icon">📷</span>
                <span v-if="participant.isSpeaking" class="status-icon">🗣️</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 音声のみ通話の表示 -->
        <div v-else class="audio-call-display">
          <div class="audio-participants">
            <div
              v-for="participant in activeCall.participants"
              :key="participant.id"
              class="audio-participant"
              :class="{ speaking: participant.isSpeaking }"
            >
              <div class="participant-avatar" :style="{ backgroundColor: participant.color }">
                {{ participant.nickname.charAt(0).toUpperCase() }}
              </div>
              <div class="participant-info">
                <div class="participant-name">{{ participant.nickname }}</div>
                <div class="participant-status">
                  <span v-if="!participant.isAudioEnabled" class="status-muted">🔇</span>
                  <span v-if="participant.isSpeaking" class="status-speaking">🗣️</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 通話コントロール -->
        <div class="call-controls">
          <button @click="toggleMicrophone" :class="{ active: isMicrophoneOn }" class="call-control-btn">
            {{ isMicrophoneOn ? '🎤' : '🔇' }}
          </button>
          <button
            v-if="activeCall.type === 'video'"
            @click="toggleCamera"
            :class="{ active: isCameraOn }"
            class="call-control-btn"
          >
            {{ isCameraOn ? '📹' : '📷' }}
          </button>
          <button @click="toggleScreenShare" :class="{ active: isScreenSharing }" class="call-control-btn">
            🖥️
          </button>
          <button @click="switchCallType" class="call-control-btn">
            {{ activeCall.type === 'video' ? '🎤' : '📹' }}
          </button>
          <button @click="endCall" class="call-control-btn end-call">
            📞
          </button>
        </div>
      </div>
    </div>

    <!-- 通話招待通知 -->
    <div
      v-for="invitation in callInvitations"
      :key="invitation.id"
      class="call-invitation"
    >
      <div class="invitation-content">
        <div class="invitation-avatar" :style="{ backgroundColor: invitation.from.color }">
          {{ invitation.from.nickname.charAt(0).toUpperCase() }}
        </div>
        <div class="invitation-text">
          <div class="invitation-name">{{ invitation.from.nickname }}</div>
          <div class="invitation-message">{{ invitation.type === 'video' ? 'ビデオ通話' : '音声通話' }}に招待されました</div>
        </div>
        <div class="invitation-actions">
          <button @click="acceptCall(invitation)" class="accept-btn">
            {{ invitation.type === 'video' ? '📹' : '🎤' }}
          </button>
          <button @click="declineCall(invitation)" class="decline-btn">
            ❌
          </button>
        </div>
      </div>
    </div>

    <!-- 通話ステータス表示 -->
    <div v-if="showDebugInfo" class="call-status-panel">
      <h4>通話ステータス</h4>
      <div class="status-info">
        <div class="status-item">
          <span class="status-label">近接ユーザー:</span>
          <span class="status-value">{{ nearbyUsers.length }}人</span>
        </div>
        <div class="status-item">
          <span class="status-label">通話状態:</span>
          <span class="status-value" :class="activeCall ? 'active' : 'inactive'">
            {{ activeCall ? '通話中' : '待機中' }}
          </span>
        </div>
        <div class="status-item">
          <span class="status-label">自動接続:</span>
          <span class="status-value">{{ autoJoinEnabled ? 'ON' : 'OFF' }}</span>
        </div>
        <div class="status-item">
          <span class="status-label">通話範囲:</span>
          <span class="status-value">{{ callRadius }}px</span>
        </div>
        <div v-if="connectionError" class="status-item error">
          <span class="status-label">エラー:</span>
          <span class="status-value">{{ connectionError }}</span>
        </div>
      </div>
      <div class="status-controls">
        <button @click="toggleCallRange" class="status-btn">
          {{ showCallRange ? '範囲非表示' : '範囲表示' }}
        </button>
        <button @click="requestPermissions" class="status-btn">権限確認</button>
        <button @click="refreshConnections" class="status-btn">接続更新</button>
      </div>
    </div>

    <!-- 設定パネル -->
    <div v-if="showSettings" class="settings-panel">
      <h3>近接通話設定</h3>
      <div class="setting-group">
        <label>通話範囲</label>
        <input
          v-model="callRadius"
          type="range"
          min="50"
          max="300"
          step="10"
          @input="updateCallRadius"
          class="setting-slider"
        />
        <span>{{ callRadius }}px</span>
      </div>
      <div class="setting-group">
        <label class="checkbox-label">
          <input
            v-model="autoJoinEnabled"
            type="checkbox"
            @change="updateAutoJoin"
          />
          自動参加を有効にする
        </label>
      </div>
      <div class="setting-group">
        <label class="checkbox-label">
          <input
            v-model="showCallRange"
            type="checkbox"
          />
          通話範囲を表示する
        </label>
      </div>
    </div>

    <!-- テスト用コントロール -->
    <div class="test-controls">
      <div class="test-controls-header">
        <h4>📞 通話テスト</h4>
      </div>
      <button @click="startCall('video')" :disabled="!!activeCall" class="test-btn">
        📹 ビデオ通話開始
      </button>
      <button @click="startCall('audio')" :disabled="!!activeCall" class="test-btn">
        🎤 音声通話開始
      </button>
      <button @click="endCall" :disabled="!activeCall" class="test-btn">
        📞 通話終了
      </button>
      <button @click="showDebugInfo = !showDebugInfo" class="test-btn">
        🐛 デバッグ情報表示
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useSignalingClient } from '@/composables/useSignalingClient'

// 型定義
interface Position {
  x: number
  y: number
}

interface User {
  id: string
  nickname: string
  position: Position
  color: string
  isAudioEnabled: boolean
  isVideoEnabled: boolean
  isSpeaking: boolean
}

interface CallParticipant extends User {
  stream?: MediaStream
  peerConnection?: RTCPeerConnection
}

interface ActiveCall {
  id: string
  type: 'audio' | 'video'
  participants: CallParticipant[]
  startTime: Date
}

interface CallInvitation {
  id: string
  from: User
  type: 'audio' | 'video'
  timestamp: Date
}

// Props
interface Props {
  currentPosition: Position
  connectedUsers: User[]
  callRadius?: number
  autoJoinEnabled?: boolean
  showCallRange?: boolean
  showSettings?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  callRadius: 150,
  autoJoinEnabled: true,
  showCallRange: false,
  showSettings: false
})

// Emits
const emit = defineEmits<{
  callStarted: [call: ActiveCall]
  callEnded: [callId: string]
  userJoinedCall: [userId: string, callId: string]
  userLeftCall: [userId: string, callId: string]
}>()

// Refs
const localVideoRef = ref<HTMLVideoElement>()

// State
const activeCall = ref<ActiveCall | null>(null)
const callInvitations = ref<CallInvitation[]>([])
const callDuration = ref(0)
const isMicrophoneOn = ref(true)
const isCameraOn = ref(false)
const isScreenSharing = ref(false)
const localStream = ref<MediaStream | null>(null)
const callRadius = ref(props.callRadius)
const autoJoinEnabled = ref(props.autoJoinEnabled)
const showCallRange = ref(props.showCallRange)
const isCallMinimized = ref(false)
const callPanelPosition = ref({ x: window.innerWidth - 400, y: 20 })
const isDraggingCallPanel = ref(false)
const callPanelDragOffset = ref({ x: 0, y: 0 })
const showDebugInfo = ref(false)
const connectionError = ref<string | null>(null)

// 新しいビデオウィンドウ管理用のstate
const isLocalVideoMinimized = ref(false)
const localVideoPosition = ref({ x: 20, y: 20 })
const isDraggingLocalVideo = ref(false)
const localVideoDragOffset = ref({ x: 0, y: 0 })
const participantMinimizedStates = ref<Record<string, boolean>>({})
const participantPositions = ref<Record<string, Position>>({})
const isDraggingParticipant = ref<Record<string, boolean>>({})
const participantDragOffsets = ref<Record<string, Position>>({})

// WebSocket通信の初期化
const currentUserId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
const roomId = 'office-main'
const nickname = localStorage.getItem('user-nickname') || 'ゲスト'
const currentUserNickname = ref(nickname)

const signalingClient = useSignalingClient(roomId, currentUserId, nickname)

// WebRTC設定
const rtcConfiguration: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
}

// ピア接続の管理
const peerConnections = new Map<string, RTCPeerConnection>()

// WebRTCシグナリングハンドラーの設定
const setupSignalingHandlers = () => {
  signalingClient.on('webrtc-signal', async (fromUserId: string, signal: any) => {
    console.log('WebRTCシグナル受信:', signal.type, 'from:', fromUserId)

    try {
      switch (signal.type) {
        case 'offer':
          await handleOffer(fromUserId, signal.offer)
          break
        case 'answer':
          await handleAnswer(fromUserId, signal.answer)
          break
        case 'ice-candidate':
          await handleIceCandidate(fromUserId, signal.candidate)
          break
      }
    } catch (error) {
      console.error('WebRTCシグナル処理エラー:', error)
    }
  })
}

// ピア接続の作成
const createPeerConnection = (userId: string): RTCPeerConnection => {
  const pc = new RTCPeerConnection(rtcConfiguration)

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      console.log('ICE候補送信 to:', userId)
      signalingClient.sendWebRTCSignal(userId, {
        type: 'ice-candidate',
        candidate: event.candidate
      })
    }
  }

  pc.ontrack = (event) => {
    console.log('リモートストリーム受信 from:', userId)
    const participant = activeCall.value?.participants.find(p => p.id === userId)
    if (participant) {
      participant.stream = event.streams[0]
      // リモートビデオ要素にストリームを設定
      setTimeout(() => {
        const videoElement = document.querySelector(`[data-user-id="${userId}"]`) as HTMLVideoElement
        if (videoElement) {
          videoElement.srcObject = event.streams[0]
        }
      }, 100)
    }
  }

  pc.onconnectionstatechange = () => {
    console.log('接続状態変更:', userId, pc.connectionState)
    if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
      removeParticipant(userId)
    }
  }

  return pc
}

// オファーの処理
const handleOffer = async (fromUserId: string, offer: RTCSessionDescriptionInit) => {
  console.log('オファー処理:', fromUserId)

  let pc = peerConnections.get(fromUserId)
  if (!pc) {
    pc = createPeerConnection(fromUserId)
    peerConnections.set(fromUserId, pc)
  }

  await pc.setRemoteDescription(offer)

  // ローカルストリームを追加
  if (localStream.value) {
    localStream.value.getTracks().forEach(track => {
      pc!.addTrack(track, localStream.value!)
    })
  }

  const answer = await pc.createAnswer()
  await pc.setLocalDescription(answer)

  console.log('アンサー送信 to:', fromUserId)
  signalingClient.sendWebRTCSignal(fromUserId, {
    type: 'answer',
    answer: answer
  })
}

// アンサーの処理
const handleAnswer = async (fromUserId: string, answer: RTCSessionDescriptionInit) => {
  console.log('アンサー処理:', fromUserId)

  const pc = peerConnections.get(fromUserId)
  if (pc) {
    await pc.setRemoteDescription(answer)
  }
}

// ICE候補の処理
const handleIceCandidate = async (fromUserId: string, candidate: RTCIceCandidateInit) => {
  console.log('ICE候補処理:', fromUserId)

  const pc = peerConnections.get(fromUserId)
  if (pc) {
    await pc.addIceCandidate(new RTCIceCandidate(candidate))
  }
}

// 参加者の削除
const removeParticipant = (userId: string) => {
  console.log('参加者を削除:', userId)

  if (activeCall.value) {
    activeCall.value.participants = activeCall.value.participants.filter(p => p.id !== userId)
  }

  const pc = peerConnections.get(userId)
  if (pc) {
    pc.close()
    peerConnections.delete(userId)
  }

  emit('userLeftCall', userId, activeCall.value?.id || '')
}

// 通話相手にオファーを送信
const sendOfferToUser = async (userId: string) => {
  console.log('オファー送信準備:', userId)

  let pc = peerConnections.get(userId)
  if (!pc) {
    pc = createPeerConnection(userId)
    peerConnections.set(userId, pc)
  }

  // ローカルストリームを追加
  if (localStream.value) {
    localStream.value.getTracks().forEach(track => {
      pc!.addTrack(track, localStream.value!)
    })
  }

  const offer = await pc.createOffer()
  await pc.setLocalDescription(offer)

  console.log('オファー送信 to:', userId)
  signalingClient.sendWebRTCSignal(userId, {
    type: 'offer',
    offer: offer
  })
}

// 計算プロパティ
const nearbyUsers = computed(() => {
  return props.connectedUsers.filter(user => {
    const distance = calculateDistance(props.currentPosition, user.position)
    console.log(`ユーザー ${user.nickname} との距離: ${distance}px (通話範囲: ${callRadius.value}px)`)
    return distance <= callRadius.value && !isUserInCall(user.id)
  })
})

// 距離計算
const calculateDistance = (pos1: Position, pos2: Position): number => {
  return Math.sqrt(
    Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2)
  )
}

// ユーザーが通話中かチェック
const isUserInCall = (userId: string): boolean => {
  return activeCall.value?.participants.some(p => p.id === userId) || false
}

// 通話時間のフォーマット
const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// 新しいビデオウィンドウ管理関数
const getCurrentUserColor = (): string => {
  return '#6366f1' // デフォルトカラー
}

const filteredParticipants = computed(() => {
  if (!activeCall.value) return []

  // 近接時のみ表示する参加者をフィルタリング（自分自身を除外）
  return activeCall.value.participants.filter(participant => {
    // 自分自身は除外
    if (participant.id === currentUserId) {
      return false
    }

    // 参加者の位置情報が存在しない場合は、connectedUsersから取得
    const participantUser = props.connectedUsers.find(user => user.id === participant.id)
    if (!participantUser) {
      console.log(`参加者 ${participant.id} の位置情報が見つかりません`)
      return false // 位置情報がない場合は表示しない
    }

    const distance = calculateDistance(props.currentPosition, participantUser.position)
    console.log(`参加者 ${participant.nickname} との距離: ${distance}px (表示範囲: ${callRadius.value}px)`)
    return distance <= callRadius.value
  })
})

const isParticipantMinimized = (participantId: string): boolean => {
  return participantMinimizedStates.value[participantId] || false
}

const getParticipantPosition = (participantId: string): Position => {
  if (!participantPositions.value[participantId]) {
    // デフォルト位置を設定
    const index = Object.keys(participantPositions.value).length
    participantPositions.value[participantId] = {
      x: 300 + (index * 250),
      y: 20
    }
  }
  return participantPositions.value[participantId]
}

// ローカルビデオのドラッグ開始
const startDragLocalVideo = (event: MouseEvent) => {
  event.preventDefault()
  isDraggingLocalVideo.value = true

  // ドラッグ開始時の要素とマウスの相対位置を記録
  const videoElement = (event.currentTarget as HTMLElement).closest('.draggable-window') as HTMLElement
  if (!videoElement) return

  const rect = videoElement.getBoundingClientRect()
  localVideoDragOffset.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }

  document.addEventListener('mousemove', dragLocalVideo)
  document.addEventListener('mouseup', stopDragLocalVideo)

  // ドラッグ中のスタイル
  videoElement.style.cursor = 'grabbing'
  videoElement.style.zIndex = '9999'
}

// ローカルビデオのドラッグ処理
const dragLocalVideo = (event: MouseEvent) => {
  if (!isDraggingLocalVideo.value) return

  event.preventDefault()

  // 画面境界内に制限
  const maxX = window.innerWidth - 200 // 最小幅を考慮
  const maxY = window.innerHeight - 100 // 最小高さを考慮

  const newX = Math.max(0, Math.min(maxX, event.clientX - localVideoDragOffset.value.x))
  const newY = Math.max(0, Math.min(maxY, event.clientY - localVideoDragOffset.value.y))

  localVideoPosition.value = { x: newX, y: newY }
}

// ローカルビデオのドラッグ終了
const stopDragLocalVideo = () => {
  isDraggingLocalVideo.value = false
  document.removeEventListener('mousemove', dragLocalVideo)
  document.removeEventListener('mouseup', stopDragLocalVideo)

  // ドラッグ終了時のスタイルをリセット
  const videoElement = document.querySelector('.local-video') as HTMLElement
  if (videoElement) {
    videoElement.style.cursor = ''
    videoElement.style.zIndex = '1000'
  }
}

// 参加者ビデオのドラッグ開始
const startDragParticipantVideo = (participantId: string) => (event: MouseEvent) => {
  event.preventDefault()
  isDraggingParticipant.value[participantId] = true

  // ドラッグ開始時の要素とマウスの相対位置を記録
  const videoElement = (event.currentTarget as HTMLElement).closest('.draggable-window') as HTMLElement
  if (!videoElement) return

  const rect = videoElement.getBoundingClientRect()
  participantDragOffsets.value[participantId] = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }

  const dragHandler = (e: MouseEvent) => dragParticipantVideo(participantId, e)
  const stopHandler = () => stopDragParticipantVideo(participantId, dragHandler, stopHandler)

  document.addEventListener('mousemove', dragHandler)
  document.addEventListener('mouseup', stopHandler)

  // ドラッグ中のスタイル
  videoElement.style.cursor = 'grabbing'
  videoElement.style.zIndex = '9999'
}

// 参加者ビデオのドラッグ処理
const dragParticipantVideo = (participantId: string, event: MouseEvent) => {
  if (!isDraggingParticipant.value[participantId]) return

  event.preventDefault()

  // 画面境界内に制限
  const maxX = window.innerWidth - 200 // 最小幅を考慮
  const maxY = window.innerHeight - 100 // 最小高さを考慮

  const newX = Math.max(0, Math.min(maxX, event.clientX - participantDragOffsets.value[participantId].x))
  const newY = Math.max(0, Math.min(maxY, event.clientY - participantDragOffsets.value[participantId].y))

  participantPositions.value[participantId] = { x: newX, y: newY }
}

// 参加者ビデオのドラッグ終了
const stopDragParticipantVideo = (participantId: string, dragHandler: any, stopHandler: any) => {
  isDraggingParticipant.value[participantId] = false
  document.removeEventListener('mousemove', dragHandler)
  document.removeEventListener('mouseup', stopHandler)

  // ドラッグ終了時のスタイルをリセット
  const videoElement = document.querySelector(`[data-participant-id="${participantId}"]`) as HTMLElement
  if (videoElement) {
    videoElement.style.cursor = ''
    videoElement.style.zIndex = '999'
  }
}

// 最小化/復元
const toggleLocalVideoMinimized = () => {
  isLocalVideoMinimized.value = !isLocalVideoMinimized.value
}

const toggleParticipantMinimized = (participantId: string) => {
  participantMinimizedStates.value[participantId] = !participantMinimizedStates.value[participantId]
}

// ウィンドウ閉じる
const closeLocalVideo = () => {
  // ローカルビデオを非表示にする（実際には最小化）
  isLocalVideoMinimized.value = true
}

const closeParticipantVideo = (participantId: string) => {
  // 参加者ビデオを閉じる（通話から削除）
  removeParticipant(participantId)
}

// ローカルストリームの取得
const getLocalStream = async (includeVideo: boolean = false): Promise<MediaStream | null> => {
  try {
    const constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      video: includeVideo ? {
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 30 }
      } : false
    }

    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    localStream.value = stream

    // ローカルビデオの表示
    if (includeVideo && localVideoRef.value) {
      localVideoRef.value.srcObject = stream
    }

    return stream
  } catch (error) {
    console.error('ローカルストリームの取得に失敗:', error)
    return null
  }
}

// 通話の開始
const startCall = async (type: 'audio' | 'video', targetUsers: User[] = []) => {
  if (activeCall.value) return

  console.log('通話を開始しています...', type, targetUsers)

  try {
    // メディアアクセス許可をリクエスト
    const stream = await getLocalStream(type === 'video')
    if (!stream) {
      console.error('メディアストリームの取得に失敗しました')
      return
    }

    console.log('メディアストリームを取得しました:', stream)

    const newCall: ActiveCall = {
      id: `call-${Date.now()}`,
      type,
      participants: [],
      startTime: new Date()
    }

    activeCall.value = newCall

    // 近接ユーザーに通話を開始
    const usersToCall = targetUsers.length > 0 ? targetUsers : nearbyUsers.value
    console.log('通話開始対象ユーザー:', usersToCall)

    // 各ユーザーにWebRTCオファーを送信
    for (const user of usersToCall) {
      // 参加者に追加
      newCall.participants.push({ ...user, stream: undefined })

      // WebRTCオファーを送信
      await sendOfferToUser(user.id)

      emit('userJoinedCall', user.id, newCall.id)
    }

    // 通話時間のカウント開始
    startCallTimer()

    console.log('通話が開始されました:', newCall)
    emit('callStarted', newCall)
  } catch (error) {
    console.error('通話開始エラー:', error)
    // ユーザーに分かりやすいエラーメッセージを表示
    alert('通話を開始できませんでした。マイクやカメラのアクセス許可を確認してください。')
  }
}

// 通話招待の送信
const sendCallInvitation = (user: User, type: 'audio' | 'video') => {
  // 実際の実装ではWebSocketやWebRTCシグナリングを使用
  console.log(`${user.nickname}に${type}通話の招待を送信`)
}

// 通話の受諾
const acceptCall = async (invitation: CallInvitation) => {
  if (activeCall.value) {
    declineCall(invitation)
    return
  }

  const stream = await getLocalStream(invitation.type === 'video')
  if (!stream) return

  // 通話に参加
  const newCall: ActiveCall = {
    id: `call-${Date.now()}`,
    type: invitation.type,
    participants: [invitation.from],
    startTime: new Date()
  }

  activeCall.value = newCall
  startCallTimer()

  // 招待を削除
  callInvitations.value = callInvitations.value.filter(inv => inv.id !== invitation.id)

  emit('userJoinedCall', 'current-user', newCall.id)
}

// 通話の拒否
const declineCall = (invitation: CallInvitation) => {
  callInvitations.value = callInvitations.value.filter(inv => inv.id !== invitation.id)
  console.log(`${invitation.from.nickname}からの通話を拒否しました`)
}

// 通話の終了
const endCall = () => {
  if (!activeCall.value) return

  // ローカルストリームを停止
  if (localStream.value) {
    localStream.value.getTracks().forEach(track => track.stop())
    localStream.value = null
  }

  // 通話を終了
  const callId = activeCall.value.id
  activeCall.value = null
  callDuration.value = 0

  emit('callEnded', callId)
}

// マイクの切り替え
const toggleMicrophone = () => {
  if (!localStream.value) return

  const audioTrack = localStream.value.getAudioTracks()[0]
  if (audioTrack) {
    audioTrack.enabled = !audioTrack.enabled
    isMicrophoneOn.value = audioTrack.enabled
  }
}

// カメラの切り替え
const toggleCamera = async () => {
  if (!localStream.value) return

  const videoTrack = localStream.value.getVideoTracks()[0]

  if (videoTrack) {
    videoTrack.enabled = !videoTrack.enabled
    isCameraOn.value = videoTrack.enabled
  } else if (activeCall.value?.type === 'video') {
    // ビデオトラックを新たに追加
    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({ video: true })
      const newVideoTrack = videoStream.getVideoTracks()[0]
      localStream.value.addTrack(newVideoTrack)
      isCameraOn.value = true

      if (localVideoRef.value) {
        localVideoRef.value.srcObject = localStream.value
      }
    } catch (error) {
      console.error('カメラの有効化に失敗:', error)
    }
  }
}

// 画面共有の切り替え
const toggleScreenShare = async () => {
  if (!isScreenSharing.value) {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      })

      // 既存のビデオトラックを画面共有に置き換え
      const videoTrack = screenStream.getVideoTracks()[0]
      if (videoTrack && localStream.value) {
        // const sender = activeCall.value?.participants.find(p => p.peerConnection)
        // WebRTCの実装が必要
      }

      isScreenSharing.value = true

      // 画面共有終了時の処理
      videoTrack.onended = () => {
        isScreenSharing.value = false
      }
    } catch (error) {
      console.error('画面共有の開始に失敗:', error)
    }
  } else {
    isScreenSharing.value = false
    // カメラに戻す処理
  }
}

// 通話タイプの切り替え
const switchCallType = async () => {
  if (!activeCall.value) return

  const newType = activeCall.value.type === 'video' ? 'audio' : 'video'
  activeCall.value.type = newType

  if (newType === 'video') {
    // ビデオを有効にする
    await getLocalStream(true)
  } else {
    // ビデオを無効にする
    if (localStream.value) {
      const videoTrack = localStream.value.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.stop()
        localStream.value.removeTrack(videoTrack)
      }
    }
  }
}

// 通話タイマーの開始
const startCallTimer = () => {
  const interval = setInterval(() => {
    if (activeCall.value) {
      callDuration.value++
    } else {
      clearInterval(interval)
    }
  }, 1000)
}

// 設定の更新
const updateCallRadius = () => {
  // 通話範囲の更新
}

const updateAutoJoin = () => {
  // 自動参加設定の更新
}

// デバッグ用関数
const testCall = () => {
  console.log('テスト通話を開始')
  startCall('audio', nearbyUsers.value)
}

const toggleCallRange = () => {
  showCallRange.value = !showCallRange.value
}

const requestPermissions = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    console.log('メディア権限を取得しました:', stream)
    connectionError.value = null
    alert('メディア権限を取得しました！')
    stream.getTracks().forEach(track => track.stop())
  } catch (error) {
    console.error('メディア権限の取得に失敗:', error)
    connectionError.value = 'メディア権限の取得に失敗しました'
    alert('メディア権限の取得に失敗しました。ブラウザの設定を確認してください。')
  }
}

const refreshConnections = () => {
  console.log('接続をリフレッシュしています...')

  // すべてのピア接続をリセット
  peerConnections.forEach((pc, userId) => {
    pc.close()
    peerConnections.delete(userId)
  })

  // エラー状態をクリア
  connectionError.value = null

  // アクティブな通話を再開
  if (activeCall.value && activeCall.value.participants.length > 0) {
    activeCall.value.participants.forEach(participant => {
      if (participant.id !== currentUserId) {
        // 新しい接続を開始
        console.log(`${participant.nickname}との接続を再開中...`)
        // 実際の実装では WebRTC 接続の再開処理を行う
      }
    })
  }

  console.log('接続のリフレッシュが完了しました')
}

// 近接ユーザーの監視
watch(nearbyUsers, (newNearbyUsers, oldNearbyUsers) => {
  if (!autoJoinEnabled.value || activeCall.value) return

  // 新しく近接したユーザーがいる場合
  const newUsers = newNearbyUsers.filter(user =>
    !oldNearbyUsers?.some(oldUser => oldUser.id === user.id)
  )

  if (newUsers.length > 0 && !activeCall.value) {
    // 自動で音声通話を開始
    startCall('audio', newUsers)
  }
}, { deep: true })

// 外部からの招待受信（デモ用）
const receiveCallInvitation = (from: User, type: 'audio' | 'video') => {
  const invitation: CallInvitation = {
    id: `invitation-${Date.now()}`,
    from,
    type,
    timestamp: new Date()
  }

  callInvitations.value.push(invitation)

  // 10秒後に自動で削除
  setTimeout(() => {
    declineCall(invitation)
  }, 10000)
}

// 特定のユーザーとの通話開始
const startCallWithUser = (user: User) => {
  console.log('ユーザーとの通話を開始:', user.nickname)
  startCall('audio', [user])
}

// 近接ユーザーの監視
const checkProximityUsers = () => {
  if (autoJoinEnabled.value && !activeCall.value && nearbyUsers.value.length > 0) {
    console.log('近接ユーザーを検出、自動通話を開始:', nearbyUsers.value.map(u => u.nickname))
    startCall('audio', nearbyUsers.value)
  }
}

// 初期化
onMounted(() => {
  console.log('ProximityVideoCall初期化中...')

  // WebRTCシグナリングハンドラーを設定
  setupSignalingHandlers()

  console.log('ProximityVideoCall初期化完了')
})

// 後始末
onUnmounted(() => {
  console.log('ProximityVideoCall後始末中...')

  // アクティブな通話を終了
  if (activeCall.value) {
    endCall()
  }

  // ローカルストリームを停止
  if (localStream.value) {
    localStream.value.getTracks().forEach(track => track.stop())
  }

  // ピア接続をクリーンアップ
  peerConnections.forEach(pc => pc.close())
  peerConnections.clear()

  // ドラッグイベントリスナーをクリーンアップ
  document.removeEventListener('mousemove', handleCallPanelDrag)
  document.removeEventListener('mouseup', stopDragCallPanel)

  console.log('ProximityVideoCall後始末完了')
})

// 外部から呼び出し可能なメソッドを露出
defineExpose({
  startCall,
  endCall,
  toggleMicrophone,
  toggleCamera,
  requestPermissions,
  activeCall
})

// 通話パネルのドラッグ開始
const startDragCallPanel = (event: MouseEvent) => {
  event.preventDefault()
  isDraggingCallPanel.value = true

  const rect = (event.target as HTMLElement).closest('.active-call-overlay')?.getBoundingClientRect()
  if (rect) {
    callPanelDragOffset.value = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }
  }

  // マウスイベントリスナーを追加
  document.addEventListener('mousemove', handleCallPanelDrag)
  document.addEventListener('mouseup', stopDragCallPanel)
}

// 通話パネルのドラッグ中
const handleCallPanelDrag = (event: MouseEvent) => {
  if (!isDraggingCallPanel.value) return

  const newX = Math.max(0, Math.min(window.innerWidth - 350, event.clientX - callPanelDragOffset.value.x))
  const newY = Math.max(0, Math.min(window.innerHeight - 200, event.clientY - callPanelDragOffset.value.y))

  callPanelPosition.value = { x: newX, y: newY }
}

// 通話パネルのドラッグ終了
const stopDragCallPanel = () => {
  isDraggingCallPanel.value = false

  // マウスイベントリスナーを削除
  document.removeEventListener('mousemove', handleCallPanelDrag)
  document.removeEventListener('mouseup', stopDragCallPanel)
}

// 通話パネルの最小化
const toggleCallMinimized = () => {
  isCallMinimized.value = !isCallMinimized.value
}
</script>

<style scoped>
.proximity-video-call {
  position: relative;
}

.call-range-circle {
  position: absolute;
  border: 2px dashed rgba(33, 150, 243, 0.6);
  border-radius: 50%;
  background: rgba(33, 150, 243, 0.1);
  pointer-events: none;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.range-label {
  background: rgba(33, 150, 243, 0.9);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.nearby-user-indicator {
  position: absolute;
  z-index: 10;
  pointer-events: none;
}

.proximity-badge {
  background: rgba(76, 175, 80, 0.9);
  color: white;
  padding: 4px 8px;
  border-radius: 16px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  animation: bounce-gentle 2s infinite;
  cursor: pointer;
  transition: var(--transition-normal);
}

.proximity-badge:hover {
  background: rgba(76, 175, 80, 1);
  transform: scale(1.05);
}

.active-call-overlay {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 350px;
  min-height: 200px;
  background: rgba(0, 0, 0, 0.95);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.active-call-overlay.minimized {
  min-height: auto;
  height: 60px;
  overflow: hidden;
}

.call-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.8), rgba(139, 92, 246, 0.8));
  color: white;
  border-radius: 12px 12px 0 0;
  cursor: grab;
  user-select: none;
  min-height: 36px;
}

.call-header:active {
  cursor: grabbing;
}

.call-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.call-controls-header {
  display: flex;
  gap: 8px;
}

.header-control-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 6px;
  padding: 4px 8px;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;
}

.header-control-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.header-control-btn.end-call {
  background: rgba(239, 68, 68, 0.8);
}

.header-control-btn.end-call:hover {
  background: rgba(239, 68, 68, 1);
}

.video-grid {
  position: relative;
  flex: 1;
  min-height: 400px;
  padding: var(--spacing-4);
  overflow: visible;
}

/* ドラッグ可能なビデオウィンドウ */
.draggable-window {
  width: 280px;
  background: #000;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.draggable-window:hover {
  transform: scale(1.02);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
}

.draggable-window.minimized {
  width: 120px;
  height: 80px;
}

/* ビデオヘッダー */
.video-header {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.9), rgba(139, 92, 246, 0.9));
  color: white;
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: grab;
  user-select: none;
  font-size: 14px;
  font-weight: 500;
}

.video-header:active {
  cursor: grabbing;
}

.video-header-controls {
  display: flex;
  gap: 4px;
}

.header-control-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 4px;
  padding: 2px 6px;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 10px;
}

.header-control-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.header-control-btn.close-btn {
  background: rgba(239, 68, 68, 0.7);
}

.header-control-btn.close-btn:hover {
  background: rgba(239, 68, 68, 0.9);
}

/* ビデオコンテンツ */
.video-content {
  position: relative;
  aspect-ratio: 16/9;
}

.video-content video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 最小化時のコンテンツ */
.minimized-content {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  gap: 8px;
  height: 60px;
}

.minimized-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 14px;
}

.minimized-status {
  display: flex;
  gap: 4px;
}

.status-icon {
  font-size: 12px;
}

.video-item {
  position: relative;
  background: #000;
  border-radius: var(--radius-lg);
  overflow: hidden;
  aspect-ratio: 16/9;
}

.video-item video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.local-video {
  border: 3px solid #4CAF50;
}

.video-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  color: white;
  padding: var(--spacing-3);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.video-name {
  font-weight: 600;
}

.video-controls {
  display: flex;
  gap: var(--spacing-2);
}

.video-control-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  color: white;
  cursor: pointer;
  transition: var(--transition-normal);
}

.video-control-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.video-control-btn.muted,
.video-control-btn.disabled {
  background: rgba(244, 67, 54, 0.8);
}

.audio-call-display {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-8);
}

.audio-participants {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-6);
  max-width: 800px;
}

.audio-participant {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  color: white;
  padding: var(--spacing-4);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.1);
  transition: var(--transition-normal);
}

.audio-participant.speaking {
  background: rgba(76, 175, 80, 0.3);
  box-shadow: 0 0 20px rgba(76, 175, 80, 0.5);
}

.participant-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: bold;
  color: white;
  margin-bottom: var(--spacing-3);
}

.participant-name {
  font-size: var(--text-lg);
  font-weight: 600;
  margin-bottom: var(--spacing-2);
}

.call-controls {
  display: flex;
  justify-content: center;
  gap: var(--spacing-3);
  padding: var(--spacing-6);
  background: rgba(255, 255, 255, 0.1);
}

.call-control-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  transition: var(--transition-normal);
}

.call-control-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.call-control-btn.active {
  background: rgba(76, 175, 80, 0.8);
}

.call-control-btn.end-call {
  background: rgba(244, 67, 54, 0.8);
}

.call-invitation {
  position: fixed;
  top: var(--spacing-4);
  right: var(--spacing-4);
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  padding: var(--spacing-4);
  z-index: 1001;
  animation: slideInRight 0.3s ease-out;
}

.invitation-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.invitation-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
}

.invitation-text {
  flex: 1;
}

.invitation-name {
  font-weight: 600;
  margin-bottom: 2px;
}

.invitation-message {
  font-size: var(--text-sm);
  color: var(--color-gray-600);
}

.invitation-actions {
  display: flex;
  gap: var(--spacing-2);
}

.accept-btn,
.decline-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  transition: var(--transition-normal);
}

.accept-btn {
  background: #4CAF50;
  color: white;
}

.decline-btn {
  background: #f44336;
  color: white;
}

.debug-panel {
  position: fixed;
  top: var(--spacing-4);
  left: var(--spacing-4);
  background: rgba(255, 255, 255, 0.95);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
  box-shadow: var(--shadow-lg);
  z-index: 100;
  min-width: 200px;
}

.debug-panel h4 {
  margin: 0 0 var(--spacing-3) 0;
  font-size: var(--text-base);
  color: var(--color-gray-800);
}

.debug-info {
  margin-bottom: var(--spacing-3);
}

.debug-info p {
  margin: 0 0 var(--spacing-1) 0;
  font-size: var(--text-sm);
  color: var(--color-gray-600);
}

.debug-controls {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.debug-btn {
  padding: var(--spacing-2) var(--spacing-3);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: var(--transition-normal);
}

.debug-btn:hover {
  background: var(--color-primary-dark);
}

.settings-panel {
  position: fixed;
  bottom: var(--spacing-4);
  left: var(--spacing-4);
  background: rgba(255, 255, 255, 0.95);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
  box-shadow: var(--shadow-lg);
  z-index: 100;
}

.settings-panel h3 {
  margin: 0 0 var(--spacing-3) 0;
  font-size: var(--text-base);
}

.setting-group {
  margin-bottom: var(--spacing-3);
}

.setting-group label {
  display: block;
  margin-bottom: var(--spacing-1);
  font-size: var(--text-sm);
  font-weight: 500;
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: var(--spacing-2);
}

.setting-slider {
  width: 100%;
  margin-bottom: var(--spacing-1);
}

.status-muted,
.status-no-video,
.status-speaking {
  margin-left: var(--spacing-1);
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* ドラッグ可能なビデオウィンドウのスタイル */
.draggable-window {
  background: rgba(255, 255, 255, 0.95);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
  transition: var(--transition-normal);
  min-width: 200px;
  max-width: 400px;
  user-select: none;
}

.draggable-window:hover {
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.draggable-window.minimized {
  width: 150px !important;
  height: 80px !important;
}

.video-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: var(--spacing-2) var(--spacing-3);
  cursor: move;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--text-sm);
  font-weight: 600;
}

.video-header:hover {
  background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
}

.video-name {
  flex: 1;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.video-header-controls {
  display: flex;
  gap: var(--spacing-1);
}

.header-control-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: var(--radius-sm);
  color: white;
  cursor: pointer;
  padding: 4px 8px;
  font-size: 12px;
  transition: var(--transition-normal);
}

.header-control-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.header-control-btn.close-btn:hover {
  background: rgba(244, 67, 54, 0.8);
}

.video-content {
  position: relative;
  width: 100%;
  height: 200px;
  background: #000;
  overflow: hidden;
}

.video-content video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.minimized-content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  position: relative;
}

.minimized-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
  margin-right: var(--spacing-2);
}

.minimized-status {
  position: absolute;
  top: 4px;
  right: 4px;
  display: flex;
  gap: 2px;
}

.status-icon {
  font-size: 12px;
  background: rgba(0, 0, 0, 0.5);
  padding: 2px 4px;
  border-radius: var(--radius-sm);
}

/* ローカルビデオ専用スタイル */
.local-video .video-header {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
}

.local-video .video-header:hover {
  background: linear-gradient(135deg, #45a049 0%, #3d8b40 100%);
}

/* リモートビデオ専用スタイル */
.remote-video .video-header {
  background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
}

.remote-video .video-header:hover {
  background: linear-gradient(135deg, #1976D2 0%, #1565C0 100%);
}

/* ビデオ制御ボタンのスタイル改善 */
.video-controls {
  position: absolute;
  bottom: var(--spacing-2);
  left: var(--spacing-2);
  right: var(--spacing-2);
  display: flex;
  justify-content: center;
  gap: var(--spacing-2);
}

.video-control-btn {
  background: rgba(0, 0, 0, 0.7);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  color: white;
  cursor: pointer;
  transition: var(--transition-normal);
  font-size: 14px;
}

.video-control-btn:hover {
  background: rgba(0, 0, 0, 0.9);
  transform: scale(1.1);
}

.video-control-btn.muted,
.video-control-btn.disabled {
  background: rgba(244, 67, 54, 0.8);
}

.video-control-btn.muted:hover,
.video-control-btn.disabled:hover {
  background: rgba(244, 67, 54, 1);
}

/* ビデオステータス表示 */
.video-status {
  position: absolute;
  top: var(--spacing-2);
  right: var(--spacing-2);
  display: flex;
  gap: var(--spacing-1);
}

.status-muted,
.status-no-video,
.status-speaking {
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-size: 12px;
}

.status-speaking {
  background: rgba(76, 175, 80, 0.8);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}

/* テスト用コントロール */
.test-controls {
  position: fixed;
  bottom: var(--spacing-4);
  right: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  background: rgba(255, 255, 255, 0.98);
  border: 2px solid #10b981;
  border-radius: var(--radius-lg);
  padding: var(--spacing-3);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
  z-index: 10000;
  backdrop-filter: blur(15px);
}

.test-controls-header {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  padding: var(--spacing-2);
  margin: calc(-1 * var(--spacing-3)) calc(-1 * var(--spacing-3)) var(--spacing-2) calc(-1 * var(--spacing-3));
  border-radius: calc(var(--radius-lg) - 2px) calc(var(--radius-lg) - 2px) 0 0;
  text-align: center;
}

.test-controls-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.test-btn {
  padding: var(--spacing-2) var(--spacing-3);
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-normal);
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.test-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.test-btn:disabled {
  background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
  cursor: not-allowed;
  opacity: 0.6;
  box-shadow: none;
}

/* レスポンシブデザイン */
@media (max-width: 768px) {
  .draggable-window {
    min-width: 150px;
    max-width: 280px;
  }

  .video-content {
    height: 150px;
  }

  .video-header {
    padding: var(--spacing-1) var(--spacing-2);
    font-size: 12px;
  }

  .minimized-content {
    height: 50px;
  }

  .minimized-avatar {
    width: 32px;
    height: 32px;
    font-size: 1rem;
  }

  .test-controls {
    bottom: var(--spacing-2);
    right: var(--spacing-2);
  }
}
</style>
