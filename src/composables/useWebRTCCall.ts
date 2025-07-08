import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useSignalingClient } from './useSignalingClient'

export interface CallUser {
    id: string
    nickname: string
    stream?: MediaStream
    peerConnection?: RTCPeerConnection
    isAudioEnabled: boolean
    isVideoEnabled: boolean
    distance?: number
    isInCallRange: boolean
    retryCount?: number
}

export interface ProximityCallOptions {
    audioEnabled: boolean
    videoEnabled: boolean
    callRadius: number
    autoConnect: boolean
}

export interface CallState {
    isCallActive: boolean
    isMicrophoneOn: boolean
    isCameraOn: boolean
    isScreenSharing: boolean
    localStream: MediaStream | null
    remoteUsers: Map<string, CallUser>
}

export function useWebRTCCall(
    roomId: string,
    userId: string,
    nickname: string,
    options: ProximityCallOptions = {
        audioEnabled: true,
        videoEnabled: false,
        callRadius: 150,
        autoConnect: true
    }
) {
    // リアクティブな状態
    const localStream = ref<MediaStream | null>(null)
    const remoteUsers = reactive(new Map<string, CallUser>())
    const isCallActive = ref(false)
    const isMicrophoneOn = ref(options.audioEnabled)
    const isCameraOn = ref(options.videoEnabled)
    const isScreenSharing = ref(false)
    const callRadius = ref(options.callRadius)
    const autoConnect = ref(options.autoConnect)

    // 現在通話中のユーザー
    const activeCallUsers = ref<string[]>([])

    // エラー状態
    const connectionError = ref<string | null>(null)
    const isConnecting = ref(false)

    // シグナリングクライアント
    const signaling = useSignalingClient(roomId, userId, nickname)

    // WebRTC設定
    const rtcConfiguration: RTCConfiguration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    }

    // メディアストリーム制約
    const getMediaConstraints = (includeVideo = false) => ({
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000,
            channelCount: 1
        },
        video: includeVideo ? {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30 }
        } : false
    })

    // ローカルストリームの取得
    const getLocalStream = async (includeVideo = false) => {
        try {
            const constraints = getMediaConstraints(includeVideo)
            const stream = await navigator.mediaDevices.getUserMedia(constraints)

            // 音声トラックの設定
            const audioTrack = stream.getAudioTracks()[0]
            if (audioTrack) {
                audioTrack.enabled = isMicrophoneOn.value
            }

            // ビデオトラックの設定
            const videoTrack = stream.getVideoTracks()[0]
            if (videoTrack) {
                videoTrack.enabled = isCameraOn.value
            }

            return stream
        } catch (error) {
            console.error('メディアストリームの取得に失敗:', error)
            connectionError.value = 'カメラ・マイクへのアクセスに失敗しました'
            throw error
        }
    }

    // ピア接続の作成
    const createPeerConnection = (targetUserId: string): RTCPeerConnection => {
        const peerConnection = new RTCPeerConnection(rtcConfiguration)

        // ICE候補の処理
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                signaling.sendMessage({
                    type: 'ice-candidate',
                    candidate: event.candidate,
                    targetUserId
                })
            }
        }

        // リモートストリームの受信
        peerConnection.ontrack = (event) => {
            const [remoteStream] = event.streams
            const user = remoteUsers.get(targetUserId)
            if (user) {
                user.stream = remoteStream

                // 音声・ビデオの状態を更新
                const audioTrack = remoteStream.getAudioTracks()[0]
                const videoTrack = remoteStream.getVideoTracks()[0]

                user.isAudioEnabled = audioTrack ? audioTrack.enabled : false
                user.isVideoEnabled = videoTrack ? videoTrack.enabled : false
            }
        }

        // 接続状態の監視
        peerConnection.onconnectionstatechange = () => {
            console.log(`接続状態変更 (${targetUserId}):`, peerConnection.connectionState)

            const user = remoteUsers.get(targetUserId)
            if (user) {
                switch (peerConnection.connectionState) {
                    case 'connected':
                        connectionError.value = null
                        console.log(`${targetUserId} との接続が確立されました`)
                        break
                    case 'disconnected':
                        console.log(`${targetUserId} との接続が切断されました`)
                        break
                    case 'failed':
                        console.error(`${targetUserId} との接続が失敗しました`)
                        // 接続失敗時の再試行（最大3回）
                        if (!user.retryCount) user.retryCount = 0
                        if (user.retryCount < 3) {
                            user.retryCount++
                            setTimeout(() => {
                                if (remoteUsers.has(targetUserId)) {
                                    console.log(`${targetUserId} との接続を再試行中... (${user.retryCount}/3)`)
                                    restartConnection(targetUserId)
                                }
                            }, 2000 * user.retryCount)
                        } else {
                            connectionError.value = `${user.nickname}との接続に失敗しました`
                            endCallWithUser(targetUserId)
                        }
                        break
                    case 'closed':
                        console.log(`${targetUserId} との接続が閉じられました`)
                        break
                }
            }
        }

        // ICE接続失敗の監視
        peerConnection.oniceconnectionstatechange = () => {
            console.log(`ICE接続状態変更 (${targetUserId}):`, peerConnection.iceConnectionState)

            if (peerConnection.iceConnectionState === 'failed') {
                console.error(`ICE接続失敗 (${targetUserId})`)
                connectionError.value = 'ネットワーク接続エラーが発生しました'
            }
        }

        return peerConnection
    }

    // 通話開始
    const startCall = async (targetUserIds: string[] = []) => {
        try {
            isConnecting.value = true
            connectionError.value = null

            // ローカルストリームを取得
            localStream.value = await getLocalStream(isCameraOn.value)
            isCallActive.value = true

            // シグナリングサーバーに接続
            await signaling.connect()

            // 指定されたユーザーとの通話を開始
            for (const targetUserId of targetUserIds) {
                await initiateCall(targetUserId)
            }

            console.log('通話開始完了')
        } catch (error) {
            console.error('通話開始エラー:', error)
            connectionError.value = '通話の開始に失敗しました'
        } finally {
            isConnecting.value = false
        }
    }

    // 特定ユーザーとの通話開始
    const initiateCall = async (targetUserId: string) => {
        if (!localStream.value) return

        const peerConnection = createPeerConnection(targetUserId)

        // ローカルストリームを追加
        localStream.value.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream.value!)
        })

        // ユーザー情報を更新
        const existingUser = remoteUsers.get(targetUserId)
        remoteUsers.set(targetUserId, {
            id: targetUserId,
            nickname: existingUser?.nickname || 'Unknown',
            peerConnection,
            isAudioEnabled: true,
            isVideoEnabled: false,
            isInCallRange: true
        })

        // オファーを作成・送信
        const offer = await peerConnection.createOffer()
        await peerConnection.setLocalDescription(offer)

        signaling.sendMessage({
            type: 'offer',
            offer,
            targetUserId
        })

        activeCallUsers.value.push(targetUserId)
    }

    // 通話応答
    const answerCall = async (fromUserId: string, offer: RTCSessionDescriptionInit) => {
        if (!localStream.value) return

        const peerConnection = createPeerConnection(fromUserId)

        // ローカルストリームを追加
        localStream.value.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream.value!)
        })

        // ユーザー情報を更新
        const existingUser = remoteUsers.get(fromUserId)
        remoteUsers.set(fromUserId, {
            id: fromUserId,
            nickname: existingUser?.nickname || 'Unknown',
            peerConnection,
            isAudioEnabled: true,
            isVideoEnabled: false,
            isInCallRange: true
        })

        // オファーを設定し、アンサーを作成
        await peerConnection.setRemoteDescription(offer)
        const answer = await peerConnection.createAnswer()
        await peerConnection.setLocalDescription(answer)

        signaling.sendMessage({
            type: 'answer',
            answer,
            targetUserId: fromUserId
        })

        activeCallUsers.value.push(fromUserId)
    }

    // 近接通話の管理
    const updateProximityCall = (nearbyUsers: { id: string, nickname: string, distance: number }[]) => {
        if (!autoConnect.value) return

        const usersInRange = nearbyUsers.filter(user => user.distance <= callRadius.value)
        const userIdsInRange = usersInRange.map(user => user.id)

        // 範囲内の新しいユーザーとの通話を開始
        for (const user of usersInRange) {
            if (!remoteUsers.has(user.id) && !activeCallUsers.value.includes(user.id)) {
                remoteUsers.set(user.id, {
                    id: user.id,
                    nickname: user.nickname,
                    isAudioEnabled: false,
                    isVideoEnabled: false,
                    distance: user.distance,
                    isInCallRange: true
                })

                // 通話を開始
                initiateCall(user.id)
            }
        }

        // 範囲外のユーザーとの通話を終了
        for (const [userId, user] of remoteUsers.entries()) {
            if (!userIdsInRange.includes(userId)) {
                endCallWithUser(userId)
            } else {
                // 距離を更新
                const userInfo = usersInRange.find(u => u.id === userId)
                if (userInfo) {
                    user.distance = userInfo.distance
                }
            }
        }
    }

    // 特定ユーザーとの通話終了
    const endCallWithUser = (userId: string) => {
        const user = remoteUsers.get(userId)
        if (user?.peerConnection) {
            user.peerConnection.close()
        }
        remoteUsers.delete(userId)

        const index = activeCallUsers.value.indexOf(userId)
        if (index > -1) {
            activeCallUsers.value.splice(index, 1)
        }
    }

    // 接続の再開
    const restartConnection = async (targetUserId: string) => {
        endCallWithUser(targetUserId)
        await initiateCall(targetUserId)
    }

    // マイクのオン/オフ
    const toggleMicrophone = async () => {
        if (!localStream.value) return

        const audioTrack = localStream.value.getAudioTracks()[0]
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled
            isMicrophoneOn.value = audioTrack.enabled

            // 他のユーザーに音声状態を通知
            signaling.sendMessage({
                type: 'audio-toggle',
                enabled: audioTrack.enabled
            })
        }
    }

    // カメラのオン/オフ
    const toggleCamera = async () => {
        try {
            if (!localStream.value) return

            const videoTrack = localStream.value.getVideoTracks()[0]

            if (videoTrack) {
                // 既存のビデオトラックのオン/オフ
                videoTrack.enabled = !videoTrack.enabled
                isCameraOn.value = videoTrack.enabled
            } else if (!isCameraOn.value) {
                // 新しいビデオトラックを追加
                const videoStream = await navigator.mediaDevices.getUserMedia({ video: getMediaConstraints(true).video })
                const newVideoTrack = videoStream.getVideoTracks()[0]

                if (newVideoTrack) {
                    localStream.value.addTrack(newVideoTrack)
                    isCameraOn.value = true

                    // 既存の接続にビデオトラックを追加
                    for (const [_userId, user] of remoteUsers.entries()) {
                        if (user.peerConnection) {
                            user.peerConnection.addTrack(newVideoTrack, localStream.value)
                        }
                    }
                }
            }

            // 他のユーザーにビデオ状態を通知
            signaling.sendMessage({
                type: 'video-toggle',
                enabled: isCameraOn.value
            })
        } catch (error) {
            console.error('カメラ切り替えエラー:', error)
        }
    }

    // 画面共有のオン/オフ
    const toggleScreenShare = async () => {
        try {
            if (!isScreenSharing.value) {
                // 画面共有開始
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: true
                })

                const screenTrack = screenStream.getVideoTracks()[0]

                // 既存のビデオトラックを画面共有に置き換え
                for (const [_userId, user] of remoteUsers.entries()) {
                    if (user.peerConnection) {
                        const sender = user.peerConnection.getSenders().find(s =>
                            s.track && s.track.kind === 'video'
                        )
                        if (sender) {
                            await sender.replaceTrack(screenTrack)
                        }
                    }
                }

                isScreenSharing.value = true

                // 画面共有終了時の処理
                screenTrack.onended = () => {
                    isScreenSharing.value = false
                    // 元のカメラトラックに戻す
                    if (isCameraOn.value) {
                        toggleCamera()
                    }
                }
            } else {
                // 画面共有終了
                isScreenSharing.value = false
                // カメラトラックに戻す処理は onended で実行される
            }
        } catch (error) {
            console.error('画面共有エラー:', error)
        }
    }

    // 通話終了
    const endCall = () => {
        // 全ての接続を閉じる
        for (const [userId] of remoteUsers.entries()) {
            endCallWithUser(userId)
        }

        // ローカルストリームを停止
        if (localStream.value) {
            localStream.value.getTracks().forEach(track => track.stop())
            localStream.value = null
        }

        // シグナリング接続を閉じる
        signaling.disconnect()

        // 状態をリセット
        isCallActive.value = false
        isScreenSharing.value = false
        activeCallUsers.value = []
        connectionError.value = null
    }

    // シグナリングメッセージの処理
    signaling.onMessage((message) => {
        switch (message.type) {
            case 'offer':
                answerCall(message.fromUserId, message.offer)
                break
            case 'answer':
                handleAnswer(message.fromUserId, message.answer)
                break
            case 'ice-candidate':
                handleIceCandidate(message.fromUserId, message.candidate)
                break
            case 'audio-toggle':
                handleAudioToggle(message.fromUserId, message.enabled)
                break
            case 'video-toggle':
                handleVideoToggle(message.fromUserId, message.enabled)
                break
        }
    })

    // アンサー処理
    const handleAnswer = async (fromUserId: string, answer: RTCSessionDescriptionInit) => {
        const user = remoteUsers.get(fromUserId)
        if (user?.peerConnection) {
            await user.peerConnection.setRemoteDescription(answer)
        }
    }

    // ICE候補処理
    const handleIceCandidate = async (fromUserId: string, candidate: RTCIceCandidate) => {
        const user = remoteUsers.get(fromUserId)
        if (user?.peerConnection) {
            await user.peerConnection.addIceCandidate(candidate)
        }
    }

    // 音声状態変更の処理
    const handleAudioToggle = (fromUserId: string, enabled: boolean) => {
        const user = remoteUsers.get(fromUserId)
        if (user) {
            user.isAudioEnabled = enabled
        }
    }

    // ビデオ状態変更の処理
    const handleVideoToggle = (fromUserId: string, enabled: boolean) => {
        const user = remoteUsers.get(fromUserId)
        if (user) {
            user.isVideoEnabled = enabled
        }
    }

    // 初期化
    onMounted(() => {
        startCall()
    })

    // クリーンアップ
    onUnmounted(() => {
        endCall()
    })

    return {
        // 状態
        localStream,
        remoteUsers,
        isCallActive,
        isMicrophoneOn,
        isCameraOn,
        isScreenSharing,
        connectionError,
        isConnecting,
        activeCallUsers,
        callRadius,
        autoConnect,

        // メソッド
        startCall,
        endCall,
        toggleMicrophone,
        toggleCamera,
        toggleScreenShare,
        updateProximityCall,
        endCallWithUser,
        initiateCall
    }
}
