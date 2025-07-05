// ユーザー管理クラス
export class UserManager {
    constructor() {
        this.currentUser = null;
        this.users = {};
        this.currentStatus = 'available';
        this.onUserUpdate = null;
        this.onUserJoin = null;
        this.onUserLeave = null;
    }

    // ユーザーID生成
    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // ランダムカラー生成
    getRandomColor() {
        const colors = [
            'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            'linear-gradient(135deg, #10b981, #059669)',
            'linear-gradient(135deg, #f59e0b, #d97706)',
            'linear-gradient(135deg, #ef4444, #dc2626)',
            'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            'linear-gradient(135deg, #06b6d4, #0891b2)'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // ユーザー作成
    createUser(nickname, x, y) {
        const userId = this.generateUserId();
        const user = {
            id: userId,
            nickname: nickname,
            x: x || 500 + Math.random() * 200,
            y: y || 300 + Math.random() * 200,
            status: 'available',
            micOn: true,
            color: this.getRandomColor(),
            joinedAt: Date.now(),
            audioLevel: 0,
            isSpeaking: false
        };

        this.currentUser = user;
        this.users[userId] = user;

        return user;
    }

    // デモユーザー追加
    addDemoUsers() {
        const demoUsers = [
            { nickname: 'AI Assistant', status: 'available', x: 300, y: 200 },
            { nickname: 'Team Lead', status: 'meeting', x: 800, y: 350 },
            { nickname: 'Designer', status: 'focus', x: 600, y: 500 }
        ];

        demoUsers.forEach((demo, index) => {
            const demoId = 'demo_' + index;
            this.users[demoId] = {
                id: demoId,
                nickname: demo.nickname,
                x: demo.x,
                y: demo.y,
                status: demo.status,
                micOn: Math.random() > 0.3,
                color: this.getRandomColor(),
                joinedAt: Date.now() - Math.random() * 60000,
                audioLevel: Math.random() * 50,
                isSpeaking: Math.random() > 0.7
            };
        });
    }

    // ユーザー位置更新
    updateUserPosition(userId, x, y) {
        if (this.users[userId]) {
            this.users[userId].x = x;
            this.users[userId].y = y;
            
            if (userId === this.currentUser?.id) {
                this.currentUser.x = x;
                this.currentUser.y = y;
            }
        }
    }

    // ユーザーステータス更新
    updateUserStatus(userId, status, micOn) {
        if (this.users[userId]) {
            this.users[userId].status = status;
            this.users[userId].micOn = micOn;
            
            if (userId === this.currentUser?.id) {
                this.currentUser.status = status;
                this.currentUser.micOn = micOn;
                this.currentStatus = status;
            }
        }
    }

    // ユーザー音声レベル更新
    updateUserAudioLevel(userId, audioLevel, isSpeaking) {
        if (this.users[userId]) {
            this.users[userId].audioLevel = audioLevel;
            this.users[userId].isSpeaking = isSpeaking;
        }
    }

    // ユーザー追加
    addUser(user) {
        this.users[user.id] = user;
        if (this.onUserJoin) {
            this.onUserJoin(user);
        }
    }

    // ユーザー削除
    removeUser(userId) {
        const user = this.users[userId];
        if (user) {
            delete this.users[userId];
            if (this.onUserLeave) {
                this.onUserLeave(user);
            }
        }
    }

    // 全ユーザー更新
    updateAllUsers(newUsers) {
        const previousUsers = { ...this.users };
        
        // 新規ユーザーの検出
        Object.keys(newUsers).forEach(userId => {
            if (!previousUsers[userId] && userId !== this.currentUser?.id) {
                if (this.onUserJoin) {
                    this.onUserJoin(newUsers[userId]);
                }
            }
        });
        
        // 退出ユーザーの検出
        Object.keys(previousUsers).forEach(userId => {
            if (!newUsers[userId] && userId !== this.currentUser?.id) {
                if (this.onUserLeave) {
                    this.onUserLeave(previousUsers[userId]);
                }
            }
        });
        
        this.users = newUsers;
        
        if (this.onUserUpdate) {
            this.onUserUpdate(this.users);
        }
    }

    // ステータス切り替え
    toggleStatus() {
        const statuses = ['available', 'away', 'meeting', 'focus'];
        const currentIndex = statuses.indexOf(this.currentStatus);
        const nextIndex = (currentIndex + 1) % statuses.length;
        this.currentStatus = statuses[nextIndex];

        if (this.currentUser) {
            this.currentUser.status = this.currentStatus;
            this.updateUserStatus(this.currentUser.id, this.currentStatus, this.currentUser.micOn);
        }

        return this.currentStatus;
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

    // ステータスエモジ取得
    getStatusEmoji(status) {
        const emojiMap = {
            available: '🟢 在席',
            away: '🟡 離席',
            meeting: '🔴 ミーティング中',
            focus: '🟣 集中中'
        };
        return emojiMap[status] || '🟢 在席';
    }

    // ステータスクラス取得
    getStatusClass(status) {
        const classMap = {
            available: '',
            away: 'away',
            meeting: 'meeting',
            focus: 'focus'
        };
        return classMap[status] || '';
    }

    // ユーザー取得
    getUser(userId) {
        return this.users[userId];
    }

    // 全ユーザー取得
    getAllUsers() {
        return this.users;
    }

    // 現在のユーザー取得
    getCurrentUser() {
        return this.currentUser;
    }

    // ユーザー数取得
    getUserCount() {
        return Object.keys(this.users).length;
    }

    // ユーザー存在確認
    userExists(userId) {
        return userId in this.users;
    }

    // クリーンアップ
    cleanup() {
        this.currentUser = null;
        this.users = {};
        this.currentStatus = 'available';
    }
} 