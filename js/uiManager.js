// UI管理クラス
export class UIManager {
    constructor() {
        this.elements = {};
        this.currentZoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.isDragging = false;
        this.lastX = 0;
        this.lastY = 0;
        this.onMoveToPosition = null;
        this.onZoomChange = null;
    }

    // DOM要素の初期化
    initializeElements() {
        this.elements = {
            entryScreen: document.getElementById('entryScreen'),
            officeContainer: document.getElementById('officeContainer'),
            loadingScreen: document.getElementById('loadingScreen'),
            nicknameInput: document.getElementById('nicknameInput'),
            charCount: document.getElementById('charCount'),
            joinBtn: document.getElementById('joinBtn'),
            userAvatarHeader: document.getElementById('userAvatarHeader'),
            userNameHeader: document.getElementById('userNameHeader'),
            statusBtn: document.getElementById('statusBtn'),
            micBtn: document.getElementById('micBtn'),
            volumeBtn: document.getElementById('volumeBtn'),
            leaveBtn: document.getElementById('leaveBtn'),
            officeSpace: document.getElementById('officeSpace'),
            officeFloor: document.getElementById('officeFloor'),
            participantCount: document.getElementById('participantCount'),
            participantsList: document.getElementById('participantsList'),
            zoomInBtn: document.getElementById('zoomInBtn'),
            zoomOutBtn: document.getElementById('zoomOutBtn'),
            resetViewBtn: document.getElementById('resetViewBtn'),
            micIndicator: document.getElementById('micIndicator'),
            audioLevelFill: document.getElementById('audioLevelFill'),
            audioSettings: document.getElementById('audioSettings'),
            micSensitivity: document.getElementById('micSensitivity'),
            masterVolume: document.getElementById('masterVolume'),
            voiceRange: document.getElementById('voiceRange'),
            voiceRangeSlider: document.getElementById('voiceRange'),
            audioElements: document.getElementById('audioElements')
        };
    }

    // イベントリスナーの設定
    setupEventListeners() {
        // ニックネーム入力
        this.elements.nicknameInput.addEventListener('input', () => this.updateCharCount());
        this.elements.nicknameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !this.elements.joinBtn.disabled) {
                this.onJoinOffice?.();
            }
        });

        // オフィス内移動
        this.elements.officeFloor.addEventListener('click', (e) => this.handleMoveToPosition(e));

        // ズーム・パンコントロール
        this.elements.zoomInBtn.addEventListener('click', () => this.zoomOffice(1.2));
        this.elements.zoomOutBtn.addEventListener('click', () => this.zoomOffice(0.8));
        this.elements.resetViewBtn.addEventListener('click', () => this.resetView());

        // マウスホイールでズーム
        this.elements.officeSpace.addEventListener('wheel', (e) => this.handleWheel(e));

        // ドラッグでパン
        this.setupDragAndDrop();

        // 音声設定
        this.elements.micSensitivity.addEventListener('input', (e) => {
            this.onMicSensitivityChange?.(e.target.value / 100);
        });
        
        this.elements.masterVolume.addEventListener('input', (e) => {
            this.onMasterVolumeChange?.(e.target.value / 100);
        });
        
        this.elements.voiceRangeSlider.addEventListener('input', (e) => {
            this.onVoiceRangeChange?.(parseInt(e.target.value));
        });
    }

    // ドラッグ&ドロップ設定
    setupDragAndDrop() {
        this.elements.officeSpace.addEventListener('mousedown', (e) => {
            if (e.target === this.elements.officeSpace || e.target === this.elements.officeFloor) {
                this.isDragging = true;
                this.lastX = e.clientX;
                this.lastY = e.clientY;
                this.elements.officeSpace.style.cursor = 'grabbing';
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const deltaX = e.clientX - this.lastX;
                const deltaY = e.clientY - this.lastY;
                this.panX += deltaX;
                this.panY += deltaY;
                this.updateTransform();
                this.lastX = e.clientX;
                this.lastY = e.clientY;
            }
        });

        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.elements.officeSpace.style.cursor = 'move';
            }
        });
    }

    // 文字数カウント更新
    updateCharCount() {
        const length = this.elements.nicknameInput.value.length;
        this.elements.charCount.textContent = length;
        this.elements.joinBtn.disabled = length === 0 || length > 10;
    }

    // 位置移動処理
    handleMoveToPosition(event) {
        if (!this.onMoveToPosition) return;

        const rect = this.elements.officeFloor.getBoundingClientRect();
        const x = (event.clientX - rect.left) / this.currentZoom - 25;
        const y = (event.clientY - rect.top) / this.currentZoom - 25;

        // 境界チェック
        const maxX = this.elements.officeFloor.clientWidth - 50;
        const maxY = this.elements.officeFloor.clientHeight - 50;
        const finalX = Math.max(0, Math.min(x, maxX));
        const finalY = Math.max(0, Math.min(y, maxY));

        this.onMoveToPosition(finalX, finalY);
    }

    // ズーム機能
    zoomOffice(factor) {
        this.currentZoom = Math.max(0.5, Math.min(2, this.currentZoom * factor));
        this.updateTransform();
        this.onZoomChange?.(this.currentZoom);
    }

    // ビューリセット
    resetView() {
        this.currentZoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.updateTransform();
        this.onZoomChange?.(this.currentZoom);
    }

    // 変形更新
    updateTransform() {
        this.elements.officeFloor.style.transform = 
            `translate(calc(-50% + ${this.panX}px), calc(-50% + ${this.panY}px)) scale(${this.currentZoom})`;
    }

    // ホイール処理
    handleWheel(event) {
        event.preventDefault();
        const delta = event.deltaY > 0 ? 0.9 : 1.1;
        this.zoomOffice(delta);
    }

    // 音声範囲表示更新
    updateVoiceRangeDisplay(currentUser, voiceRangeDistance) {
        if (!currentUser) return;
        
        const range = this.elements.voiceRange;
        const diameter = voiceRangeDistance * 2;
        
        range.style.width = diameter + 'px';
        range.style.height = diameter + 'px';
        range.style.left = (currentUser.x - voiceRangeDistance + 25) + 'px';
        range.style.top = (currentUser.y - voiceRangeDistance + 25) + 'px';
    }

    // 音声レベル表示更新
    updateAudioLevelDisplay(level) {
        this.elements.audioLevelFill.style.width = level + '%';
    }

    // 話し中状態更新
    updateSpeakingState(isSpeaking, isMicOn) {
        this.elements.micIndicator.classList.toggle('speaking', isSpeaking && isMicOn);
        this.elements.micBtn.classList.toggle('speaking', isSpeaking && isMicOn);
    }

    // マイク状態更新
    updateMicState(isMicOn) {
        this.elements.micBtn.textContent = isMicOn ? '🎤 マイクON' : '🔇 マイクOFF';
        this.elements.micBtn.classList.toggle('muted', !isMicOn);
        this.elements.micIndicator.classList.toggle('muted', !isMicOn);
    }

    // ステータス更新
    updateStatus(status) {
        const statusEmojis = {
            available: '🟢 在席',
            away: '🟡 離席',
            meeting: '🔴 ミーティング中',
            focus: '🟣 集中中'
        };

        const statusClasses = {
            available: '',
            away: 'away',
            meeting: 'meeting',
            focus: 'focus'
        };

        this.elements.statusBtn.textContent = statusEmojis[status];
        this.elements.statusBtn.className = `control-btn status-btn ${statusClasses[status]}`;
    }

    // ユーザーアバター作成
    createUserAvatar(user, currentUserId) {
        const avatar = document.createElement('div');
        avatar.className = 'user-avatar';
        if (user.id === currentUserId) {
            avatar.classList.add('joining');
        }
        avatar.style.left = user.x + 'px';
        avatar.style.top = user.y + 'px';
        avatar.setAttribute('data-user-id', user.id);

        const circle = document.createElement('div');
        circle.className = 'avatar-circle';
        if (user.id === currentUserId) {
            circle.classList.add('my-avatar');
        }
        if (user.isSpeaking && user.micOn) {
            circle.classList.add('speaking');
        }
        circle.style.background = user.color;
        circle.textContent = user.nickname.charAt(0).toUpperCase();

        const statusIndicator = document.createElement('div');
        statusIndicator.className = `status-indicator status-${user.status}`;

        const micIndicator = document.createElement('div');
        micIndicator.className = 'avatar-mic-indicator';
        if (!user.micOn) {
            micIndicator.classList.add('muted');
        }
        if (user.isSpeaking && user.micOn) {
            micIndicator.classList.add('speaking');
        }

        const name = document.createElement('div');
        name.className = 'avatar-name';
        name.textContent = user.nickname;

        circle.appendChild(statusIndicator);
        circle.appendChild(micIndicator);
        avatar.appendChild(circle);
        avatar.appendChild(name);

        return avatar;
    }

    // ユーザー表示更新
    updateUserDisplay(users, currentUserId) {
        // 既存のアバターを削除
        const existingAvatars = this.elements.officeFloor.querySelectorAll('.user-avatar');
        existingAvatars.forEach(avatar => avatar.remove());

        // ユーザーアバター作成
        Object.values(users).forEach(user => {
            const avatar = this.createUserAvatar(user, currentUserId);
            this.elements.officeFloor.appendChild(avatar);
        });

        // 参加者リスト更新
        this.updateParticipantsList(users);
    }

    // 参加者リスト更新
    updateParticipantsList(users) {
        const userCount = Object.keys(users).length;
        this.elements.participantCount.textContent = userCount;

        this.elements.participantsList.innerHTML = '';
        Object.values(users).forEach(user => {
            const item = document.createElement('div');
            item.className = 'participant-item';

            const avatar = document.createElement('div');
            avatar.className = 'participant-avatar';
            avatar.style.background = user.color;
            avatar.textContent = user.nickname.charAt(0).toUpperCase();

            const statusIndicator = document.createElement('div');
            statusIndicator.className = `status-indicator status-${user.status}`;
            avatar.appendChild(statusIndicator);

            const micIndicator = document.createElement('div');
            micIndicator.className = 'avatar-mic-indicator';
            if (!user.micOn) {
                micIndicator.classList.add('muted');
            }
            if (user.isSpeaking && user.micOn) {
                micIndicator.classList.add('speaking');
            }
            avatar.appendChild(micIndicator);

            const info = document.createElement('div');
            info.className = 'participant-info';

            const name = document.createElement('p');
            name.className = 'participant-name';
            name.textContent = user.nickname;

            const status = document.createElement('p');
            status.className = 'participant-status';
            status.textContent = this.getStatusText(user.status);

            const volumeBar = document.createElement('div');
            volumeBar.className = 'participant-volume';
            const volumeFill = document.createElement('div');
            volumeFill.className = 'participant-volume-fill';
            volumeFill.style.width = (user.audioLevel || 0) + '%';
            volumeBar.appendChild(volumeFill);

            info.appendChild(name);
            info.appendChild(status);
            info.appendChild(volumeBar);

            item.appendChild(avatar);
            item.appendChild(info);
            this.elements.participantsList.appendChild(item);
        });
    }

    // ステータステキスト取得
    getStatusText(status) {
        const statusMap = {
            available: '在席',
            away: '離席',
            meeting: 'ミーティング中',
            focus: '集中中'
        };
        return statusMap[status] || '在席';
    }

    // 音声設定パネル切り替え
    toggleAudioSettings() {
        this.elements.audioSettings.classList.toggle('show');
    }

    // 通知表示
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // ローディング表示
    showLoading() {
        this.elements.loadingScreen.style.display = 'flex';
    }

    hideLoading() {
        this.elements.loadingScreen.style.display = 'none';
    }

    // 画面表示制御
    showEntry() {
        this.elements.entryScreen.classList.remove('hidden');
    }

    showOffice() {
        this.hideLoading();
        this.elements.entryScreen.classList.add('hidden');
        this.elements.officeContainer.style.display = 'block';
        this.elements.voiceRange.classList.add('active');
    }

    hideOffice() {
        this.elements.officeContainer.style.display = 'none';
        this.elements.audioSettings.classList.remove('show');
    }

    // ヘッダー情報設定
    updateHeaderInfo(user) {
        this.elements.userAvatarHeader.textContent = user.nickname.charAt(0).toUpperCase();
        this.elements.userAvatarHeader.style.background = user.color;
        this.elements.userNameHeader.textContent = user.nickname;
    }

    // 保存された名前の復元
    restoreSavedName() {
        const savedName = localStorage.getItem('virtualOfficeNickname');
        if (savedName) {
            this.elements.nicknameInput.value = savedName;
            this.updateCharCount();
        }
    }

    // 名前の保存
    saveName() {
        localStorage.setItem('virtualOfficeNickname', this.elements.nicknameInput.value);
    }

    // デモモード表示
    showDemoMode() {
        setTimeout(() => {
            const demoNotice = document.createElement('div');
            demoNotice.style.cssText = `
                position: fixed; top: 20px; left: 20px;
                background: #f59e0b; color: white;
                padding: 8px 12px; border-radius: 6px;
                font-size: 12px; z-index: 1001;
            `;
            demoNotice.textContent = '🎯 デモモード（音声はシミュレーション）';
            document.body.appendChild(demoNotice);
        }, 1000);
    }

    // 入力値取得
    getNickname() {
        return this.elements.nicknameInput.value.trim();
    }

    // 入力値設定
    setNickname(nickname) {
        this.elements.nicknameInput.value = nickname;
        this.updateCharCount();
    }
} 