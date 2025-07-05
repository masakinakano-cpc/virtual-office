// リアルタイム通信管理クラス
export class RealtimeManager {
    constructor(database, isFirebaseEnabled) {
        this.database = database;
        this.isFirebaseEnabled = isFirebaseEnabled;
        this.onUserUpdate = null;
        this.onUserJoin = null;
        this.onUserLeave = null;
        this.onAudioLevelUpdate = null;
        this.updateInterval = null;
    }

    // リアルタイム更新開始
    startRealtimeUpdates(currentUser, audioManager, userManager) {
        if (this.isFirebaseEnabled) {
            this.startFirebaseUpdates(currentUser, audioManager, userManager);
        } else {
            this.startDemoUpdates(userManager);
        }
    }

    // Firebase更新開始
    startFirebaseUpdates(currentUser, audioManager, userManager) {
        const usersRef = this.database.ref('users');

        // ユーザー一覧監視
        usersRef.on('value', (snapshot) => {
            const newUsers = snapshot.val() || {};
            const previousUsers = { ...userManager.getAllUsers() };

            // 非アクティブユーザーの自動削除
            this.cleanupInactiveUsers(newUsers);

            // 新規ユーザーのWebRTC接続開始
            Object.keys(newUsers).forEach(userId => {
                if (userId !== currentUser.id && !previousUsers[userId] && !audioManager.peerConnections[userId]) {
                    console.log(`新しいユーザー ${userId} が参加しました`);
                    setTimeout(() => {
                        audioManager.setupWebRTC(userId, this.database, currentUser);
                    }, 1000);
                }
            });

            // 退出ユーザーのクリーンアップ
            Object.keys(previousUsers).forEach(userId => {
                if (!newUsers[userId] && userId !== currentUser.id) {
                    console.log(`ユーザー ${userId} が退出しました`);
                    audioManager.cleanupPeerConnection(userId);
                }
            });

            userManager.updateAllUsers(newUsers);
            audioManager.updateAllAudioVolumes(newUsers, currentUser);
        });

        // 定期的にアクティブ状態更新
        this.updateInterval = setInterval(() => {
            if (currentUser) {
                this.database.ref(`users/${currentUser.id}`).update({
                    lastActive: firebase.database.ServerValue.TIMESTAMP
                });
            }
        }, 30000);
    }

    // デモ更新開始
    startDemoUpdates(userManager) {
        this.updateInterval = setInterval(() => {
            Object.keys(userManager.getAllUsers()).forEach(userId => {
                if (userId !== userManager.getCurrentUser()?.id) {
                    const audioLevel = Math.random() * 30;
                    const isSpeaking = Math.random() > 0.8;
                    userManager.updateUserAudioLevel(userId, audioLevel, isSpeaking);
                }
            });

            if (this.onUserUpdate) {
                this.onUserUpdate(userManager.getAllUsers());
            }
        }, 2000);
    }

    // ユーザー情報をFirebaseに保存
    async saveUserToFirebase(user) {
        if (!this.isFirebaseEnabled) return;

        try {
            await this.database.ref(`users/${user.id}`).set({
                ...user,
                lastActive: firebase.database.ServerValue.TIMESTAMP
            });
        } catch (error) {
            console.error('ユーザー保存エラー:', error);
        }
    }

    // ユーザー情報をFirebaseから削除
    async removeUserFromFirebase(userId) {
        if (!this.isFirebaseEnabled) return;

        try {
            await this.database.ref(`users/${userId}`).remove();
            console.log('Firebaseからユーザーを削除しました:', userId);
        } catch (error) {
            console.error('ユーザー削除エラー:', error);
        }
    }

    // 非アクティブユーザーの自動削除
    async cleanupInactiveUsers(users) {
        if (!this.isFirebaseEnabled) return;

        const now = Date.now();
        const inactiveThreshold = 5 * 60 * 1000; // 5分間アクティブでない場合

        Object.keys(users).forEach(async (userId) => {
            const user = users[userId];
            if (user && user.lastActive) {
                const lastActive = user.lastActive;
                const timeDiff = now - lastActive;

                if (timeDiff > inactiveThreshold) {
                    console.log(`非アクティブユーザーを削除: ${userId} (${timeDiff}ms 非アクティブ)`);
                    try {
                        await this.database.ref(`users/${userId}`).remove();
                    } catch (error) {
                        console.error('非アクティブユーザー削除エラー:', error);
                    }
                }
            }
        });
    }

    // ユーザー位置更新
    async updateUserPosition(userId, x, y) {
        if (!this.isFirebaseEnabled) return;

        try {
            await this.database.ref(`users/${userId}`).update({
                x: x,
                y: y,
                lastActive: firebase.database.ServerValue.TIMESTAMP
            });
        } catch (error) {
            console.error('位置更新エラー:', error);
        }
    }

    // ユーザーステータス更新
    async updateUserStatus(userId, status, micOn) {
        if (!this.isFirebaseEnabled) return;

        try {
            await this.database.ref(`users/${userId}`).update({
                status: status,
                micOn: micOn,
                lastActive: firebase.database.ServerValue.TIMESTAMP
            });
        } catch (error) {
            console.error('ステータス更新エラー:', error);
        }
    }

    // 音声レベル更新
    async updateAudioLevel(userId, audioLevel, isSpeaking) {
        if (!this.isFirebaseEnabled) return;

        try {
            await this.database.ref(`users/${userId}`).update({
                audioLevel: audioLevel,
                isSpeaking: isSpeaking
            });
        } catch (error) {
            console.error('音声レベル更新エラー:', error);
        }
    }

    // WebRTC接続のセットアップ
    async setupWebRTCConnection(remoteUserId, currentUser, audioManager) {
        if (!this.isFirebaseEnabled) return;

        try {
            const peerConnection = await audioManager.setupWebRTC(remoteUserId, this.database, currentUser);

            // オファー作成
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            // オファーをFirebaseに保存
            await this.database.ref(`webrtc/${currentUser.id}/${remoteUserId}/offer`).set({
                sdp: offer,
                timestamp: Date.now()
            });

            // オファー監視
            this.database.ref(`webrtc/${remoteUserId}/${currentUser.id}/offer`).on('value', async (snapshot) => {
                const offerData = snapshot.val();
                if (offerData && !peerConnection.remoteDescription) {
                    await peerConnection.setRemoteDescription(new RTCSessionDescription(offerData.sdp));

                    // アンサー作成
                    const answer = await peerConnection.createAnswer();
                    await peerConnection.setLocalDescription(answer);

                    // アンサーをFirebaseに保存
                    await this.database.ref(`webrtc/${currentUser.id}/${remoteUserId}/answer`).set({
                        sdp: answer,
                        timestamp: Date.now()
                    });
                }
            });

            // アンサー監視
            this.database.ref(`webrtc/${remoteUserId}/${currentUser.id}/answer`).on('value', async (snapshot) => {
                const answerData = snapshot.val();
                if (answerData && !peerConnection.remoteDescription) {
                    await peerConnection.setRemoteDescription(new RTCSessionDescription(answerData.sdp));
                }
            });

            // ICE候補監視
            this.database.ref(`webrtc/${remoteUserId}/${currentUser.id}/candidates`).on('child_added', async (snapshot) => {
                const candidateData = snapshot.val();
                if (candidateData && peerConnection.remoteDescription) {
                    await peerConnection.addIceCandidate(new RTCIceCandidate(candidateData.candidate));
                }
            });

        } catch (error) {
            console.error('WebRTC接続エラー:', error);
        }
    }

    // リアルタイム更新停止
    stopRealtimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        if (this.isFirebaseEnabled && this.database) {
            this.database.ref('users').off();
            this.database.ref('webrtc').off();
        }
    }

    // 接続状態確認
    isConnected() {
        return this.isFirebaseEnabled && this.database;
    }

    // エラーハンドリング
    handleError(error, context) {
        console.error(`${context} エラー:`, error);

        // ネットワークエラーの場合はローカルモードに切り替え
        if (error.code === 'PERMISSION_DENIED' || error.code === 'UNAVAILABLE') {
            console.log('Firebase接続が利用できないため、ローカルモードに切り替えます');
            this.isFirebaseEnabled = false;
            return false;
        }

        return true;
    }

    // 接続テスト
    async testConnection() {
        if (!this.isFirebaseEnabled) return false;

        try {
            const testRef = this.database.ref('connection_test');
            await testRef.set({ timestamp: Date.now() });
            await testRef.remove();
            return true;
        } catch (error) {
            console.error('接続テスト失敗:', error);
            return false;
        }
    }

    // データベース参照取得
    getDatabase() {
        return this.database;
    }

    // Firebase有効状態取得
    isFirebaseEnabled() {
        return this.isFirebaseEnabled;
    }
}
