// メインアプリケーションクラス
import { initializeFirebase } from '../config/firebase.js';
import { AudioManager } from './audioManager.js';
import { UserManager } from './userManager.js';
import { UIManager } from './uiManager.js';
import { RealtimeManager } from './realtimeManager.js';

export class VirtualOfficeApp {
    constructor() {
        this.audioManager = new AudioManager();
        this.userManager = new UserManager();
        this.uiManager = new UIManager();
        this.realtimeManager = null;

        this.isInitialized = false;
        this.isFirebaseEnabled = false;
    }

    // アプリケーション初期化
    async initialize() {
        try {
            // Firebase初期化
            const { database, isFirebaseEnabled } = initializeFirebase();
            this.isFirebaseEnabled = isFirebaseEnabled;

            // リアルタイム通信管理初期化
            this.realtimeManager = new RealtimeManager(database, isFirebaseEnabled);

            // UI初期化
            this.uiManager.initializeElements();
            this.setupUICallbacks();
            this.uiManager.setupEventListeners();

            // 保存された名前の復元
            this.uiManager.restoreSavedName();

            // 名前保存の設定
            this.uiManager.elements.nicknameInput.addEventListener('input', () => {
                this.uiManager.saveName();
            });

            // ブラウザ終了時の自動退出設定
            this.setupBeforeUnloadHandler();

            // デモモード表示
            if (!this.isFirebaseEnabled) {
                this.uiManager.showDemoMode();
            }

            this.isInitialized = true;
            console.log('バーチャルオフィスアプリケーション初期化完了');

        } catch (error) {
            console.error('アプリケーション初期化エラー:', error);
        }
    }

    // UIコールバック設定
    setupUICallbacks() {
        // 参加ボタン
        this.uiManager.elements.joinBtn.addEventListener('click', () => this.joinOffice());

        // コントロールボタン
        this.uiManager.elements.statusBtn.addEventListener('click', () => this.toggleStatus());
        this.uiManager.elements.micBtn.addEventListener('click', () => this.toggleMic());
        this.uiManager.elements.volumeBtn.addEventListener('click', () => this.toggleAudioSettings());
        this.uiManager.elements.leaveBtn.addEventListener('click', () => this.leaveOffice());

        // 位置移動
        this.uiManager.onMoveToPosition = (x, y) => this.moveToPosition(x, y);

        // 音声設定
        this.uiManager.onMicSensitivityChange = (sensitivity) => {
            this.audioManager.setMicSensitivity(sensitivity);
        };

        this.uiManager.onMasterVolumeChange = (volume) => {
            this.audioManager.setMasterVolume(volume);
        };

        this.uiManager.onVoiceRangeChange = (distance) => {
            this.audioManager.setVoiceRange(distance);
            this.uiManager.updateVoiceRangeDisplay(this.userManager.getCurrentUser(), distance);
        };

        // 音声レベル変更コールバック
        this.audioManager.onAudioLevelChange = (level, isSpeaking) => {
            this.uiManager.updateAudioLevelDisplay(level);
            this.uiManager.updateSpeakingState(isSpeaking, this.audioManager.isMicOn);

            // 自分の音声レベルをデータベースに送信
            if (this.userManager.getCurrentUser() && this.isFirebaseEnabled) {
                this.realtimeManager.updateAudioLevel(this.userManager.getCurrentUser().id, level, isSpeaking);
            }
        };

        // ユーザー更新コールバック
        this.userManager.onUserUpdate = (users) => {
            this.uiManager.updateUserDisplay(users, this.userManager.getCurrentUser()?.id);
        };

        this.userManager.onUserJoin = (user) => {
            this.uiManager.showNotification(`🎉 ${user.nickname}が参加しました`);
        };

        this.userManager.onUserLeave = (user) => {
            this.uiManager.showNotification(`👋 ${user.nickname}が退出しました`);
        };
    }

    // オフィス参加
    async joinOffice() {
        const nickname = this.uiManager.getNickname();
        if (!nickname || nickname.length > 10) {
            alert('名前は1-10文字で入力してください');
            return;
        }

        this.uiManager.showLoading();

        try {
            // 音声初期化
            const audioSuccess = await this.audioManager.initializeAudio();
            if (!audioSuccess) {
                alert('音声デバイスの初期化に失敗しました。マイクの許可を確認してください。');
                this.uiManager.hideLoading();
                return;
            }

            // ユーザー作成
            const user = this.userManager.createUser(nickname);

            // Firebaseまたはローカルストレージに保存
            if (this.isFirebaseEnabled) {
                await this.realtimeManager.saveUserToFirebase(user);
                this.uiManager.showNotification('🎉 音声通話対応バーチャルオフィスに参加しました！');
            } else {
                this.userManager.addDemoUsers();
                this.uiManager.showNotification('🎯 デモモードで音声通話をテストできます');
            }

            // UI更新
            this.uiManager.showOffice();
            this.uiManager.updateHeaderInfo(user);
            this.uiManager.updateVoiceRangeDisplay(user, this.audioManager.voiceRangeDistance);

            // リアルタイム更新開始
            this.realtimeManager.startRealtimeUpdates(user, this.audioManager, this.userManager);

        } catch (error) {
            console.error('参加エラー:', error);
            alert('オフィスへの参加に失敗しました: ' + error.message);
            this.uiManager.hideLoading();
        }
    }

    // 位置移動
    moveToPosition(x, y) {
        const currentUser = this.userManager.getCurrentUser();
        if (!currentUser) return;

        this.userManager.updateUserPosition(currentUser.id, x, y);

        // 自分のアバター更新
        const myAvatar = this.uiManager.elements.officeFloor.querySelector(`[data-user-id="${currentUser.id}"]`);
        if (myAvatar) {
            myAvatar.style.left = x + 'px';
            myAvatar.style.top = y + 'px';
        }

        // 音声範囲表示更新
        this.uiManager.updateVoiceRangeDisplay(currentUser, this.audioManager.voiceRangeDistance);

        // 空間音声更新
        this.audioManager.updateAllAudioVolumes(this.userManager.getAllUsers(), currentUser);

        // データベース更新
        if (this.isFirebaseEnabled) {
            this.realtimeManager.updateUserPosition(currentUser.id, x, y);
        }
    }

    // ステータス切り替え
    toggleStatus() {
        const newStatus = this.userManager.toggleStatus();
        this.uiManager.updateStatus(newStatus);

        const currentUser = this.userManager.getCurrentUser();
        if (currentUser && this.isFirebaseEnabled) {
            this.realtimeManager.updateUserStatus(currentUser.id, newStatus, currentUser.micOn);
        }
    }

    // マイク切り替え
    toggleMic() {
        const isMicOn = this.audioManager.toggleMic();
        this.uiManager.updateMicState(isMicOn);

        const currentUser = this.userManager.getCurrentUser();
        if (currentUser) {
            this.userManager.updateUserStatus(currentUser.id, currentUser.status, isMicOn);

            if (this.isFirebaseEnabled) {
                this.realtimeManager.updateUserStatus(currentUser.id, currentUser.status, isMicOn);
            }
        }

        const action = isMicOn ? 'ON' : 'OFF';
        this.uiManager.showNotification(`🎤 マイクを${action}にしました`);
    }

    // 音声設定切り替え
    toggleAudioSettings() {
        this.uiManager.toggleAudioSettings();
    }

    // オフィス退出
    async leaveOffice() {
        if (confirm('オフィスから退出しますか？')) {
            const currentUser = this.userManager.getCurrentUser();

            // 音声デバイスのクリーンアップ
            this.audioManager.cleanup();

            // リアルタイム更新停止
            this.realtimeManager.stopRealtimeUpdates();

            // Firebaseからユーザー削除
            if (this.isFirebaseEnabled && currentUser) {
                await this.realtimeManager.removeUserFromFirebase(currentUser.id);
            }

            // 状態クリーンアップ
            this.userManager.cleanup();

            // UI更新
            this.uiManager.hideOffice();
            this.uiManager.showEntry();

            this.uiManager.showNotification('👋 オフィスから退出しました');
        }
    }

    // ブラウザ終了時の自動退出設定
    setupBeforeUnloadHandler() {
        // beforeunloadイベント（ページを離れる時）- 同期的に処理
        window.addEventListener('beforeunload', (event) => {
            if (this.userManager.getCurrentUser()) {
                console.log('ブラウザ終了を検出: 同期的な退出処理を実行');
                this.syncForceLeaveOffice();
            }
        });

        // pagehideイベント（ページが非表示になる時）
        window.addEventListener('pagehide', async (event) => {
            if (this.userManager.getCurrentUser()) {
                console.log('ページ非表示を検出: 自動退出処理を実行');
                await this.forceLeaveOffice();
            }
        });

        // visibilitychangeイベント（タブの切り替え時）
        document.addEventListener('visibilitychange', async () => {
            if (document.visibilityState === 'hidden' && this.userManager.getCurrentUser()) {
                console.log('タブ非表示を検出: 自動退出処理を実行');
                await this.forceLeaveOffice();
            }
        });

        // unloadイベント（ページアンロード時）
        window.addEventListener('unload', async (event) => {
            if (this.userManager.getCurrentUser()) {
                console.log('ページアンロードを検出: 自動退出処理を実行');
                await this.forceLeaveOffice();
            }
        });
    }

    // 同期的な強制退出処理（beforeunload用）
    syncForceLeaveOffice() {
        try {
            const currentUser = this.userManager.getCurrentUser();
            if (!currentUser) return;

            console.log('同期的な自動退出処理を開始:', currentUser.nickname);

            // 音声デバイスのクリーンアップ
            this.audioManager.cleanup();

            // リアルタイム更新停止
            this.realtimeManager.stopRealtimeUpdates();

            // Firebaseからユーザー削除（同期的に）
            if (this.isFirebaseEnabled) {
                // 同期的な削除のため、XMLHttpRequestを使用
                const xhr = new XMLHttpRequest();
                xhr.open('DELETE', `https://virtual-office-team-default-rtdb.asia-southeast1.firebasedatabase.app/users/${currentUser.id}.json`, false);
                xhr.send();
                console.log('Firebaseからユーザーを同期的に削除しました:', currentUser.id);
            }

            // 状態クリーンアップ
            this.userManager.cleanup();

            console.log('同期的な自動退出処理が完了しました');

        } catch (error) {
            console.error('同期的な自動退出処理エラー:', error);
        }
    }

    // 強制退出処理（確認なし）
    async forceLeaveOffice() {
        try {
            const currentUser = this.userManager.getCurrentUser();
            if (!currentUser) return;

            console.log('自動退出処理を開始:', currentUser.nickname);

            // 音声デバイスのクリーンアップ
            this.audioManager.cleanup();

            // リアルタイム更新停止
            this.realtimeManager.stopRealtimeUpdates();

            // Firebaseからユーザー削除
            if (this.isFirebaseEnabled) {
                await this.realtimeManager.removeUserFromFirebase(currentUser.id);
                console.log('Firebaseからユーザーを削除しました:', currentUser.id);
            }

            // 状態クリーンアップ
            this.userManager.cleanup();

            console.log('自動退出処理が完了しました');

        } catch (error) {
            console.error('自動退出処理エラー:', error);
        }
    }

    // アプリケーション開始
    static async start() {
        const app = new VirtualOfficeApp();
        await app.initialize();
        return app;
    }
}
