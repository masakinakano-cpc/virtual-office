// 音声管理クラス
export class AudioManager {
    constructor() {
        this.localStream = null;
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.dataArray = null;
        this.isMicOn = false;
        this.masterVolume = 0.5;
        this.micSensitivity = 0.5;
        this.voiceRangeDistance = 150;
        this.isAudioInitialized = false;
        this.peerConnections = {};
        this.remoteStreams = {};
        this.onAudioLevelChange = null;
        this.onSpeakingStateChange = null;
    }

    // 音声初期化
    async initializeAudio() {
        try {
            // マイクアクセス許可
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100
                }
            });

            // 音声分析のセットアップ
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.microphone = this.audioContext.createMediaStreamSource(this.localStream);
            
            this.analyser.fftSize = 256;
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);
            
            this.microphone.connect(this.analyser);
            
            this.isMicOn = true;
            this.isAudioInitialized = true;
            
            console.log('音声デバイス初期化成功');
            
            // 音声レベル監視開始
            this.startAudioLevelMonitoring();
            
            return true;
            
        } catch (error) {
            console.error('音声デバイス初期化失敗:', error);
            return false;
        }
    }

    // 音声レベル監視
    startAudioLevelMonitoring() {
        if (!this.analyser || !this.dataArray) return;
        
        const updateAudioLevel = () => {
            this.analyser.getByteFrequencyData(this.dataArray);
            
            // 音声レベル計算
            let sum = 0;
            for (let i = 0; i < this.dataArray.length; i++) {
                sum += this.dataArray[i];
            }
            const average = sum / this.dataArray.length;
            const level = Math.min(100, (average / 255) * 100 * (this.micSensitivity * 2));
            
            // 話し中判定
            const isSpeaking = level > 10;
            
            // コールバック実行
            if (this.onAudioLevelChange) {
                this.onAudioLevelChange(level, isSpeaking);
            }
            
            requestAnimationFrame(updateAudioLevel);
        };
        
        updateAudioLevel();
    }

    // マイク切り替え
    toggleMic() {
        this.isMicOn = !this.isMicOn;
        
        // マイクの実際の有効/無効化
        if (this.localStream) {
            this.localStream.getAudioTracks().forEach(track => {
                track.enabled = this.isMicOn;
            });
        }

        return this.isMicOn;
    }

    // マイク状態設定
    setMicState(enabled) {
        this.isMicOn = enabled;
        if (this.localStream) {
            this.localStream.getAudioTracks().forEach(track => {
                track.enabled = this.isMicOn;
            });
        }
    }

    // マスターボリューム設定
    setMasterVolume(volume) {
        this.masterVolume = volume;
        this.updateAllAudioVolumes();
    }

    // マイク感度設定
    setMicSensitivity(sensitivity) {
        this.micSensitivity = sensitivity;
    }

    // 音声範囲設定
    setVoiceRange(distance) {
        this.voiceRangeDistance = distance;
    }

    // 空間音声計算
    calculateSpatialAudio(userId, users, currentUser) {
        if (!users[userId] || !currentUser) return 0;
        
        const user = users[userId];
        const distance = Math.sqrt(
            Math.pow(user.x - currentUser.x, 2) + 
            Math.pow(user.y - currentUser.y, 2)
        );
        
        // 距離に基づく音量調整
        const maxDistance = this.voiceRangeDistance;
        let volume = 0;
        
        if (distance < maxDistance) {
            volume = Math.pow(1 - (distance / maxDistance), 1.5);
        }
        
        const finalVolume = Math.max(0, Math.min(1, volume * this.masterVolume));
        
        // 音声要素の音量を調整
        const audioElement = document.getElementById(`audio-${userId}`);
        if (audioElement) {
            audioElement.volume = finalVolume;
        }
        
        return finalVolume;
    }

    // 全音声音量更新
    updateAllAudioVolumes(users, currentUser) {
        Object.keys(users).forEach(userId => {
            if (userId !== currentUser?.id) {
                this.calculateSpatialAudio(userId, users, currentUser);
            }
        });
    }

    // リモート音声セットアップ
    setupRemoteAudio(userId, stream) {
        // 既存の音声要素を削除
        const existingAudio = document.getElementById(`audio-${userId}`);
        if (existingAudio) {
            existingAudio.remove();
        }
        
        // 新しい音声要素を作成
        const audio = document.createElement('audio');
        audio.id = `audio-${userId}`;
        audio.srcObject = stream;
        audio.autoplay = true;
        audio.volume = this.masterVolume;
        
        const audioElements = document.getElementById('audioElements');
        if (audioElements) {
            audioElements.appendChild(audio);
        }
        
        console.log(`${userId}の音声ストリームを設定しました`);
    }

    // WebRTC接続のセットアップ
    async setupWebRTC(remoteUserId, database, currentUser) {
        const peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        });
        
        this.peerConnections[remoteUserId] = peerConnection;
        
        // ローカルストリーム追加
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, this.localStream);
            });
        }
        
        // リモートストリーム受信
        peerConnection.ontrack = (event) => {
            const remoteStream = event.streams[0];
            this.remoteStreams[remoteUserId] = remoteStream;
            this.setupRemoteAudio(remoteUserId, remoteStream);
        };
        
        // ICE候補の処理
        peerConnection.onicecandidate = (event) => {
            if (event.candidate && database) {
                database.ref(`webrtc/${currentUser.id}/${remoteUserId}/candidates`).push({
                    candidate: event.candidate,
                    timestamp: Date.now()
                });
            }
        };
        
        return peerConnection;
    }

    // PeerConnection のクリーンアップ
    cleanupPeerConnection(userId) {
        if (this.peerConnections[userId]) {
            this.peerConnections[userId].close();
            delete this.peerConnections[userId];
        }
        if (this.remoteStreams[userId]) {
            delete this.remoteStreams[userId];
        }
        const audioElement = document.getElementById(`audio-${userId}`);
        if (audioElement) {
            audioElement.remove();
        }
    }

    // 全音声接続のクリーンアップ
    cleanup() {
        // 音声デバイスのクリーンアップ
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }
        
        // WebRTC接続のクリーンアップ
        Object.values(this.peerConnections).forEach(pc => pc.close());
        this.peerConnections = {};
        this.remoteStreams = {};
        
        // 音声要素のクリーンアップ
        const audioElements = document.getElementById('audioElements');
        if (audioElements) {
            audioElements.innerHTML = '';
        }
    }

    // 音声レベル取得
    getAudioLevel() {
        if (!this.analyser || !this.dataArray) return 0;
        
        this.analyser.getByteFrequencyData(this.dataArray);
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            sum += this.dataArray[i];
        }
        const average = sum / this.dataArray.length;
        return Math.min(100, (average / 255) * 100 * (this.micSensitivity * 2));
    }

    // 話し中判定
    isSpeaking() {
        const level = this.getAudioLevel();
        return level > 10 && this.isMicOn;
    }
} 