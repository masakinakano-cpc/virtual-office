import { ref, onMounted, onUnmounted } from 'vue'
import { useSignalingClient } from './useSignalingClient'

export interface CallUser {
    id: string
    nickname: string
    stream?: MediaStream
    peerConnection?: RTCPeerConnection
}

export interface CallState {
    isCallActive: boolean
    isMicrophoneOn: boolean
    isCameraOn: boolean
    isScreenSharing: boolean
    localStream: MediaStream | null
    remoteUsers: Map<string, CallUser>
}

export function useWebRTCCall(roomId: string, userId: string, nickname: string) {
    // 状態管理
    const isCallActive = ref(false)
    const isMicrophoneOn = ref(false)
    const isCameraOn = ref(false)
    const isScreenSharing = ref(false)
    const localStream = ref<MediaStream | null>(null)
    const screenStream = ref<MediaStream | null>(null)
    const remoteUsers = ref<Map<string, CallUser>>(new Map())
    const callError = ref<string | null>(null)

    // WebRTC設定
    const rtcConfiguration: RTCConfiguration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    }

    // ピア接続のマップ
    const peerConnections = new Map<string, RTCPeerConnection>()

    // シグナリングクライアント
    const signalingClient = useSignalingClient(roomId, userId, nickname)

    // ローカルメディアの取得
    const getLocalMedia = async (constraints: MediaStreamConstraints = { video: true, audio: true }) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints)
            localStream.value = stream

            // 音声トラックの状態を更新
            const audioTracks = stream.getAudioTracks()
            if (audioTracks.length > 0) {
                isMicrophoneOn.value = audioTracks[0].enabled
            }

            // ビデオトラックの状態を更新
            const videoTracks = stream.getVideoTracks()
            if (videoTracks.length > 0) {
                isCameraOn.value = videoTracks[0].enabled
            }

            return stream
        } catch (error) {
            console.error('Failed to get local media:', error)
            callError.value = 'カメラまたはマイクへのアクセスに失敗しました'
            throw error
        }
    }

    // 通話開始
    const startCall = async () => {
        try {
            if (!localStream.value) {
                await getLocalMedia()
            }

            isCallActive.value = true
            callError.value = null

            // 既存の接続されたユーザーに対してピア接続を作成
            // 実際の実装では、シグナリングサーバーから他のユーザー情報を取得

            return true
        } catch (error) {
            console.error('Failed to start call:', error)
            callError.value = '通話の開始に失敗しました'
            return false
        }
    }

    // 通話終了
    const endCall = () => {
        // すべてのピア接続を閉じる
        peerConnections.forEach(pc => {
            pc.close()
        })
        peerConnections.clear()

        // ローカルストリームを停止
        if (localStream.value) {
            localStream.value.getTracks().forEach(track => track.stop())
            localStream.value = null
        }

        // 画面共有ストリームを停止
        if (screenStream.value) {
            screenStream.value.getTracks().forEach(track => track.stop())
            screenStream.value = null
        }

        // 状態をリセット
        isCallActive.value = false
        isMicrophoneOn.value = false
        isCameraOn.value = false
        isScreenSharing.value = false
        remoteUsers.value.clear()
        callError.value = null
    }

    // マイクのオン/オフ
    const toggleMicrophone = async () => {
        if (!localStream.value) {
            await getLocalMedia({ audio: true, video: isCameraOn.value })
        }

        if (localStream.value) {
            const audioTracks = localStream.value.getAudioTracks()
            audioTracks.forEach(track => {
                track.enabled = !track.enabled
            })
            isMicrophoneOn.value = !isMicrophoneOn.value
        }
    }

    // カメラのオン/オフ
    const toggleCamera = async () => {
        if (!localStream.value) {
            await getLocalMedia({ audio: isMicrophoneOn.value, video: true })
        }

        if (localStream.value) {
            const videoTracks = localStream.value.getVideoTracks()
            videoTracks.forEach(track => {
                track.enabled = !track.enabled
            })
            isCameraOn.value = !isCameraOn.value
        }
    }

    // 画面共有の開始/停止
    const toggleScreenShare = async () => {
        if (isScreenSharing.value) {
            await stopScreenShare()
        } else {
            await startScreenShare()
        }
    }

    // 画面共有開始
    const startScreenShare = async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true
            })

            screenStream.value = stream
            isScreenSharing.value = true

            // 画面共有が終了したときの処理
            stream.getVideoTracks()[0].addEventListener('ended', () => {
                stopScreenShare()
            })

            // 既存のピア接続のビデオトラックを画面共有に置き換え
            peerConnections.forEach(async (pc, _userId) => {
                const sender = pc.getSenders().find(s =>
                    s.track && s.track.kind === 'video'
                )

                if (sender && stream.getVideoTracks().length > 0) {
                    await sender.replaceTrack(stream.getVideoTracks()[0])
                }
            })

        } catch (error) {
            console.error('Failed to start screen share:', error)
            callError.value = '画面共有の開始に失敗しました'
        }
    }

    // 画面共有停止
    const stopScreenShare = async () => {
        if (screenStream.value) {
            screenStream.value.getTracks().forEach(track => track.stop())
            screenStream.value = null
        }

        isScreenSharing.value = false

        // カメラストリームに戻す
        if (localStream.value && isCameraOn.value) {
            const videoTrack = localStream.value.getVideoTracks()[0]

            peerConnections.forEach(async (pc, _userId) => {
                const sender = pc.getSenders().find(s =>
                    s.track && s.track.kind === 'video'
                )

                if (sender && videoTrack) {
                    await sender.replaceTrack(videoTrack)
                }
            })
        }
    }

    // ピア接続の作成
    const createPeerConnection = (remoteUserId: string): RTCPeerConnection => {
        const pc = new RTCPeerConnection(rtcConfiguration)

        // ICE候補の処理
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                // 実際の実装では、シグナリングサーバーを通じて相手に送信
                console.log('ICE candidate:', event.candidate)
                sendSignalingMessage(remoteUserId, {
                    type: 'ice-candidate',
                    candidate: event.candidate
                })
            }
        }

        // リモートストリームの受信
        pc.ontrack = (event) => {
            console.log('Received remote stream:', event.streams[0])
            const remoteUser = remoteUsers.value.get(remoteUserId)
            if (remoteUser) {
                remoteUser.stream = event.streams[0]
                remoteUsers.value.set(remoteUserId, remoteUser)
            }
        }

        // 接続状態の監視
        pc.onconnectionstatechange = () => {
            console.log(`Connection state with ${remoteUserId}:`, pc.connectionState)
            if (pc.connectionState === 'failed') {
                // 接続失敗時の処理
                removePeerConnection(remoteUserId)
            }
        }

        // ローカルストリームを追加
        if (localStream.value) {
            localStream.value.getTracks().forEach(track => {
                pc.addTrack(track, localStream.value!)
            })
        }

        peerConnections.set(remoteUserId, pc)
        return pc
    }

    // ピア接続の削除
    const removePeerConnection = (userId: string) => {
        const pc = peerConnections.get(userId)
        if (pc) {
            pc.close()
            peerConnections.delete(userId)
        }

        remoteUsers.value.delete(userId)
    }

    // オファーの作成と送信
    const createOffer = async (remoteUserId: string) => {
        const pc = createPeerConnection(remoteUserId)

        try {
            const offer = await pc.createOffer()
            await pc.setLocalDescription(offer)

            // 実際の実装では、シグナリングサーバーを通じて送信
            sendSignalingMessage(remoteUserId, {
                type: 'offer',
                offer: offer
            })

        } catch (error) {
            console.error('Failed to create offer:', error)
            callError.value = 'オファーの作成に失敗しました'
        }
    }

    // オファーの処理
    const handleOffer = async (remoteUserId: string, offer: RTCSessionDescriptionInit) => {
        const pc = createPeerConnection(remoteUserId)

        try {
            await pc.setRemoteDescription(offer)
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)

            sendSignalingMessage(remoteUserId, {
                type: 'answer',
                answer: answer
            })

        } catch (error) {
            console.error('Failed to handle offer:', error)
            callError.value = 'オファーの処理に失敗しました'
        }
    }

    // アンサーの処理
    const handleAnswer = async (remoteUserId: string, answer: RTCSessionDescriptionInit) => {
        const pc = peerConnections.get(remoteUserId)
        if (pc) {
            try {
                await pc.setRemoteDescription(answer)
            } catch (error) {
                console.error('Failed to handle answer:', error)
                callError.value = 'アンサーの処理に失敗しました'
            }
        }
    }

    // ICE候補の処理
    const handleIceCandidate = async (remoteUserId: string, candidate: RTCIceCandidateInit) => {
        const pc = peerConnections.get(remoteUserId)
        if (pc) {
            try {
                await pc.addIceCandidate(candidate)
            } catch (error) {
                console.error('Failed to add ICE candidate:', error)
            }
        }
    }

    // シグナリングメッセージの送信
    const sendSignalingMessage = (targetUserId: string, message: any) => {
        signalingClient.sendWebRTCSignal(targetUserId, message)
    }

    // シグナリングメッセージの受信監視
    const startSignalingListener = () => {
        signalingClient.on('webrtc-signal', async (fromUserId: string, signal: any) => {
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
        })

        // 新しいユーザーが参加したときの処理
        signalingClient.on('user-joined', (user) => {
            addUser({
                id: user.id,
                nickname: user.nickname
            })
        })

        // ユーザーが退出したときの処理
        signalingClient.on('user-left', (userId) => {
            removeUser(userId)
        })

        // 既存のユーザー一覧を受信したときの処理
        signalingClient.on('room-users', (users) => {
            users.forEach(user => {
                addUser({
                    id: user.id,
                    nickname: user.nickname
                })
            })
        })
    }

    // 新しいユーザーの追加
    const addUser = (user: CallUser) => {
        remoteUsers.value.set(user.id, user)

        // 通話中の場合、新しいユーザーとのピア接続を作成
        if (isCallActive.value) {
            createOffer(user.id)
        }
    }

    // ユーザーの削除
    const removeUser = (userId: string) => {
        removePeerConnection(userId)
    }

    // 初期化
    onMounted(() => {
        startSignalingListener()
    })

    // クリーンアップ
    onUnmounted(() => {
        endCall()
    })

    return {
        // 状態
        isCallActive,
        isMicrophoneOn,
        isCameraOn,
        isScreenSharing,
        localStream,
        remoteUsers,
        callError,

        // メソッド
        startCall,
        endCall,
        toggleMicrophone,
        toggleCamera,
        toggleScreenShare,
        addUser,
        removeUser,

        // WebRTC固有
        createOffer,
        handleOffer,
        handleAnswer,
        handleIceCandidate
    }
}
