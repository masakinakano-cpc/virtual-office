import { ref, reactive, computed, onUnmounted } from 'vue'

export interface WebRTCConfig {
    iceServers: RTCIceServer[]
    maxBitrate: number
    videoConstraints: MediaStreamConstraints['video']
    audioConstraints: MediaStreamConstraints['audio']
}

export interface Peer {
    id: string
    name: string
    connection: RTCPeerConnection
    dataChannel?: RTCDataChannel
    localStream?: MediaStream
    remoteStream?: MediaStream
    isConnected: boolean
    isVideoEnabled: boolean
    isAudioEnabled: boolean
}

export interface DataMessage {
    type: 'chat' | 'cursor' | 'file' | 'emoji' | 'system'
    data: any
    timestamp: number
    senderId: string
}

export function useWebRTC() {
    const localStream = ref<MediaStream | null>(null)
    const peers = reactive<Map<string, Peer>>(new Map())
    const isInitialized = ref(false)
    const isVideoEnabled = ref(true)
    const isAudioEnabled = ref(true)
    const isScreenSharing = ref(false)
    const connectionState = ref<'disconnected' | 'connecting' | 'connected'>('disconnected')

    const config: WebRTCConfig = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
        ],
        maxBitrate: 1000000, // 1Mbps
        videoConstraints: {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            frameRate: { ideal: 30, max: 60 }
        },
        audioConstraints: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000
        }
    }

    // 統計情報
    const stats = reactive({
        bytesReceived: 0,
        bytesSent: 0,
        packetsLost: 0,
        jitter: 0,
        rtt: 0,
        bandwidth: 0
    })

    // 計算プロパティ
    const connectedPeers = computed(() =>
        Array.from(peers.values()).filter(peer => peer.isConnected)
    )

    const activePeersCount = computed(() => connectedPeers.value.length)

    // メディアストリーム初期化
    const initializeMedia = async (options?: {
        video?: boolean
        audio?: boolean
        screen?: boolean
    }): Promise<boolean> => {
        try {
            const constraints: MediaStreamConstraints = {
                video: options?.video !== false ? config.videoConstraints : false,
                audio: options?.audio !== false ? config.audioConstraints : false
            }

            if (options?.screen) {
                // 画面共有
                localStream.value = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: true
                })
                isScreenSharing.value = true
            } else {
                // カメラ・マイク
                localStream.value = await navigator.mediaDevices.getUserMedia(constraints)
                isScreenSharing.value = false
            }

            isVideoEnabled.value = options?.video !== false
            isAudioEnabled.value = options?.audio !== false
            isInitialized.value = true

            console.log('メディアストリーム初期化完了')
            return true
        } catch (error) {
            console.error('メディアストリーム初期化エラー:', error)
            return false
        }
    }

    // ピア接続作成
    const createPeerConnection = (peerId: string): RTCPeerConnection => {
        const peerConnection = new RTCPeerConnection({
            iceServers: config.iceServers
        })

        // ICE候補の処理
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                sendSignalingMessage(peerId, {
                    type: 'ice-candidate',
                    candidate: event.candidate
                })
            }
        }

        // リモートストリーム受信
        peerConnection.ontrack = (event) => {
            const peer = peers.get(peerId)
            if (peer) {
                peer.remoteStream = event.streams[0]
                console.log(`ピア ${peerId} からストリーム受信`)
            }
        }

        // 接続状態変更
        peerConnection.onconnectionstatechange = () => {
            const peer = peers.get(peerId)
            if (peer) {
                peer.isConnected = peerConnection.connectionState === 'connected'
                console.log(`ピア ${peerId} 接続状態: ${peerConnection.connectionState}`)
            }
        }

        // データチャンネル受信
        peerConnection.ondatachannel = (event) => {
            const dataChannel = event.channel
            setupDataChannel(peerId, dataChannel)
        }

        return peerConnection
    }

    // データチャンネル設定
    const setupDataChannel = (peerId: string, dataChannel: RTCDataChannel) => {
        const peer = peers.get(peerId)
        if (peer) {
            peer.dataChannel = dataChannel
        }

        dataChannel.onopen = () => {
            console.log(`データチャンネル ${peerId} オープン`)
        }

        dataChannel.onmessage = (event) => {
            try {
                const message: DataMessage = JSON.parse(event.data)
                handleDataMessage(peerId, message)
            } catch (error) {
                console.error('データメッセージ解析エラー:', error)
            }
        }

        dataChannel.onerror = (error) => {
            console.error(`データチャンネル ${peerId} エラー:`, error)
        }

        dataChannel.onclose = () => {
            console.log(`データチャンネル ${peerId} クローズ`)
        }
    }

    // ピア接続開始
    const connectToPeer = async (peerId: string, peerName: string): Promise<boolean> => {
        try {
            if (peers.has(peerId)) {
                console.log(`ピア ${peerId} は既に接続済み`)
                return true
            }

            const peerConnection = createPeerConnection(peerId)

            // データチャンネル作成
            const dataChannel = peerConnection.createDataChannel('data', {
                ordered: true
            })

            const peer: Peer = {
                id: peerId,
                name: peerName,
                connection: peerConnection,
                dataChannel,
                isConnected: false,
                isVideoEnabled: true,
                isAudioEnabled: true
            }

            peers.set(peerId, peer)
            setupDataChannel(peerId, dataChannel)

            // ローカルストリームを追加
            if (localStream.value) {
                localStream.value.getTracks().forEach(track => {
                    peerConnection.addTrack(track, localStream.value!)
                })
            }

            // オファー作成
            const offer = await peerConnection.createOffer()
            await peerConnection.setLocalDescription(offer)

            // シグナリングサーバーにオファー送信
            sendSignalingMessage(peerId, {
                type: 'offer',
                offer: offer
            })

            connectionState.value = 'connecting'
            return true
        } catch (error) {
            console.error(`ピア ${peerId} 接続エラー:`, error)
            return false
        }
    }

    // オファー処理
    const handleOffer = async (peerId: string, offer: RTCSessionDescriptionInit) => {
        try {
            const peerConnection = createPeerConnection(peerId)

            const peer: Peer = {
                id: peerId,
                name: `User ${peerId}`,
                connection: peerConnection,
                isConnected: false,
                isVideoEnabled: true,
                isAudioEnabled: true
            }

            peers.set(peerId, peer)

            // ローカルストリームを追加
            if (localStream.value) {
                localStream.value.getTracks().forEach(track => {
                    peerConnection.addTrack(track, localStream.value!)
                })
            }

            await peerConnection.setRemoteDescription(offer)

            // アンサー作成
            const answer = await peerConnection.createAnswer()
            await peerConnection.setLocalDescription(answer)

            // シグナリングサーバーにアンサー送信
            sendSignalingMessage(peerId, {
                type: 'answer',
                answer: answer
            })

            console.log(`ピア ${peerId} にアンサー送信`)
        } catch (error) {
            console.error(`オファー処理エラー (${peerId}):`, error)
        }
    }

    // アンサー処理
    const handleAnswer = async (peerId: string, answer: RTCSessionDescriptionInit) => {
        try {
            const peer = peers.get(peerId)
            if (peer) {
                await peer.connection.setRemoteDescription(answer)
                console.log(`ピア ${peerId} からアンサー受信`)
            }
        } catch (error) {
            console.error(`アンサー処理エラー (${peerId}):`, error)
        }
    }

    // ICE候補処理
    const handleIceCandidate = async (peerId: string, candidate: RTCIceCandidateInit) => {
        try {
            const peer = peers.get(peerId)
            if (peer) {
                await peer.connection.addIceCandidate(candidate)
                console.log(`ピア ${peerId} ICE候補追加`)
            }
        } catch (error) {
            console.error(`ICE候補処理エラー (${peerId}):`, error)
        }
    }

    // データメッセージ送信
    const sendDataMessage = (peerId: string, message: Omit<DataMessage, 'timestamp' | 'senderId'>) => {
        const peer = peers.get(peerId)
        if (peer?.dataChannel && peer.dataChannel.readyState === 'open') {
            const fullMessage: DataMessage = {
                ...message,
                timestamp: Date.now(),
                senderId: 'self'
            }

            peer.dataChannel.send(JSON.stringify(fullMessage))
        }
    }

    // 全ピアにデータメッセージ送信
    const broadcastDataMessage = (message: Omit<DataMessage, 'timestamp' | 'senderId'>) => {
        peers.forEach((_, peerId) => {
            sendDataMessage(peerId, message)
        })
    }

    // データメッセージ処理
    const handleDataMessage = (peerId: string, message: DataMessage) => {
        console.log(`ピア ${peerId} からデータメッセージ:`, message)

        // イベント発火
        window.dispatchEvent(new CustomEvent('webrtc-data-message', {
            detail: { peerId, message }
        }))
    }

    // ビデオ切り替え
    const toggleVideo = async (): Promise<boolean> => {
        if (!localStream.value) return false

        const videoTrack = localStream.value.getVideoTracks()[0]
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled
            isVideoEnabled.value = videoTrack.enabled

            // 全ピアに状態通知
            broadcastDataMessage({
                type: 'system',
                data: { action: 'video-toggle', enabled: isVideoEnabled.value }
            })

            return true
        }
        return false
    }

    // オーディオ切り替え
    const toggleAudio = async (): Promise<boolean> => {
        if (!localStream.value) return false

        const audioTrack = localStream.value.getAudioTracks()[0]
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled
            isAudioEnabled.value = audioTrack.enabled

            // 全ピアに状態通知
            broadcastDataMessage({
                type: 'system',
                data: { action: 'audio-toggle', enabled: isAudioEnabled.value }
            })

            return true
        }
        return false
    }

    // 画面共有開始
    const startScreenShare = async (): Promise<boolean> => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true
            })

            // 既存のビデオトラックを置換
            const videoTrack = screenStream.getVideoTracks()[0]
            if (videoTrack) {
                peers.forEach(peer => {
                    const sender = peer.connection.getSenders().find(s =>
                        s.track && s.track.kind === 'video'
                    )
                    if (sender) {
                        sender.replaceTrack(videoTrack)
                    }
                })
            }

            // 画面共有停止時の処理
            videoTrack.onended = () => {
                stopScreenShare()
            }

            isScreenSharing.value = true

            // 全ピアに通知
            broadcastDataMessage({
                type: 'system',
                data: { action: 'screen-share-start' }
            })

            return true
        } catch (error) {
            console.error('画面共有開始エラー:', error)
            return false
        }
    }

    // 画面共有停止
    const stopScreenShare = async (): Promise<boolean> => {
        try {
            if (!isScreenSharing.value) return false

            // カメラストリームに戻す
            const cameraStream = await navigator.mediaDevices.getUserMedia({
                video: config.videoConstraints,
                audio: false
            })

            const videoTrack = cameraStream.getVideoTracks()[0]
            if (videoTrack) {
                peers.forEach(peer => {
                    const sender = peer.connection.getSenders().find(s =>
                        s.track && s.track.kind === 'video'
                    )
                    if (sender) {
                        sender.replaceTrack(videoTrack)
                    }
                })
            }

            isScreenSharing.value = false

            // 全ピアに通知
            broadcastDataMessage({
                type: 'system',
                data: { action: 'screen-share-stop' }
            })

            return true
        } catch (error) {
            console.error('画面共有停止エラー:', error)
            return false
        }
    }

    // ピア切断
    const disconnectPeer = (peerId: string) => {
        const peer = peers.get(peerId)
        if (peer) {
            peer.connection.close()
            peer.dataChannel?.close()
            peers.delete(peerId)
            console.log(`ピア ${peerId} 切断`)
        }
    }

    // 全ピア切断
    const disconnectAll = () => {
        peers.forEach((_, peerId) => {
            disconnectPeer(peerId)
        })
        connectionState.value = 'disconnected'
    }

    // 統計情報更新
    const updateStats = async () => {
        for (const [peerId, peer] of peers) {
            try {
                const statsReport = await peer.connection.getStats()

                statsReport.forEach(report => {
                    if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
                        stats.bytesReceived = report.bytesReceived || 0
                        stats.packetsLost = report.packetsLost || 0
                        stats.jitter = report.jitter || 0
                    } else if (report.type === 'outbound-rtp' && report.mediaType === 'video') {
                        stats.bytesSent = report.bytesSent || 0
                    } else if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                        stats.rtt = report.currentRoundTripTime || 0
                    }
                })
            } catch (error) {
                console.error(`統計情報取得エラー (${peerId}):`, error)
            }
        }
    }

    // シグナリングメッセージ送信（実装依存）
    const sendSignalingMessage = (peerId: string, message: any) => {
        // WebSocketやSocket.IOを使用してシグナリングサーバーに送信
        console.log(`シグナリングメッセージ送信 (${peerId}):`, message)

        // イベント発火
        window.dispatchEvent(new CustomEvent('webrtc-signaling-send', {
            detail: { peerId, message }
        }))
    }

    // クリーンアップ
    const cleanup = () => {
        disconnectAll()

        if (localStream.value) {
            localStream.value.getTracks().forEach(track => track.stop())
            localStream.value = null
        }

        isInitialized.value = false
    }

    // 統計情報定期更新
    const statsInterval = setInterval(updateStats, 5000)

    onUnmounted(() => {
        cleanup()
        clearInterval(statsInterval)
    })

    return {
        // 状態
        localStream,
        peers,
        isInitialized,
        isVideoEnabled,
        isAudioEnabled,
        isScreenSharing,
        connectionState,
        stats,

        // 計算プロパティ
        connectedPeers,
        activePeersCount,

        // メソッド
        initializeMedia,
        connectToPeer,
        handleOffer,
        handleAnswer,
        handleIceCandidate,
        sendDataMessage,
        broadcastDataMessage,
        toggleVideo,
        toggleAudio,
        startScreenShare,
        stopScreenShare,
        disconnectPeer,
        disconnectAll,
        cleanup
    }
}
