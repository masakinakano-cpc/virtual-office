const WebSocket = require('ws');
const http = require('http');
const url = require('url');

// HTTPサーバーの作成
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// ルーム管理
const rooms = new Map();

// ユーザー管理
const users = new Map();

// ルーム情報の構造
class Room {
    constructor(id) {
        this.id = id;
        this.users = new Map();
        this.createdAt = new Date();
    }

    addUser(userId, ws, nickname) {
        const user = {
            id: userId,
            nickname: nickname,
            ws: ws,
            joinedAt: new Date(),
            position: { x: 0, y: 0 },
            isVideoEnabled: true,
            isAudioEnabled: true
        };

        this.users.set(userId, user);
        users.set(userId, { ...user, roomId: this.id });

        // 他のユーザーに新しいユーザーの参加を通知
        this.broadcast({
            type: 'user-joined',
            userId: userId,
            nickname: nickname,
            position: user.position
        }, userId);

        // 新しいユーザーに既存のユーザー一覧を送信
        const existingUsers = Array.from(this.users.values())
            .filter(u => u.id !== userId)
            .map(u => ({
                id: u.id,
                nickname: u.nickname,
                position: u.position,
                isVideoEnabled: u.isVideoEnabled,
                isAudioEnabled: u.isAudioEnabled
            }));

        ws.send(JSON.stringify({
            type: 'room-users',
            users: existingUsers
        }));

        console.log(`User ${userId} (${nickname}) joined room ${this.id}`);
    }

    removeUser(userId) {
        const user = this.users.get(userId);
        if (user) {
            this.users.delete(userId);
            users.delete(userId);

            // 他のユーザーにユーザーの退出を通知
            this.broadcast({
                type: 'user-left',
                userId: userId
            }, userId);

            console.log(`User ${userId} left room ${this.id}`);
        }
    }

    updateUserPosition(userId, position) {
        const user = this.users.get(userId);
        if (user) {
            user.position = position;

            // 他のユーザーに位置更新を通知
            this.broadcast({
                type: 'user-position-update',
                userId: userId,
                position: position
            }, userId);
        }
    }

    updateUserMedia(userId, mediaState) {
        const user = this.users.get(userId);
        if (user) {
            user.isVideoEnabled = mediaState.isVideoEnabled;
            user.isAudioEnabled = mediaState.isAudioEnabled;

            // 他のユーザーにメディア状態更新を通知
            this.broadcast({
                type: 'user-media-update',
                userId: userId,
                mediaState: mediaState
            }, userId);
        }
    }

    broadcast(message, excludeUserId = null) {
        this.users.forEach((user, userId) => {
            if (userId !== excludeUserId && user.ws.readyState === WebSocket.OPEN) {
                user.ws.send(JSON.stringify(message));
            }
        });
    }

    forwardMessage(fromUserId, toUserId, message) {
        const targetUser = this.users.get(toUserId);
        if (targetUser && targetUser.ws.readyState === WebSocket.OPEN) {
            targetUser.ws.send(JSON.stringify({
                type: 'webrtc-signal',
                fromUserId: fromUserId,
                message: message
            }));
        }
    }

    isEmpty() {
        return this.users.size === 0;
    }
}

// WebSocket接続の処理
wss.on('connection', (ws, req) => {
    const query = url.parse(req.url, true).query;
    const roomId = query.roomId;
    const userId = query.userId;
    const nickname = query.nickname || `User${Math.floor(Math.random() * 1000)}`;

    if (!roomId || !userId) {
        ws.close(1008, 'Missing roomId or userId');
        return;
    }

    // ルームの取得または作成
    let room = rooms.get(roomId);
    if (!room) {
        room = new Room(roomId);
        rooms.set(roomId, room);
        console.log(`Room ${roomId} created`);
    }

    // ユーザーをルームに追加
    room.addUser(userId, ws, nickname);

    // メッセージの処理
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);

            switch (message.type) {
                case 'webrtc-signal':
                    // WebRTCシグナリングメッセージの転送
                    room.forwardMessage(userId, message.targetUserId, message.signal);
                    break;

                case 'position-update':
                    // ユーザー位置の更新
                    room.updateUserPosition(userId, message.position);
                    break;

                case 'media-update':
                    // メディア状態の更新
                    room.updateUserMedia(userId, message.mediaState);
                    break;

                case 'chat-message':
                    // チャットメッセージのブロードキャスト
                    room.broadcast({
                        type: 'chat-message',
                        userId: userId,
                        nickname: room.users.get(userId)?.nickname || 'Unknown',
                        message: message.message,
                        timestamp: new Date().toISOString()
                    }, userId);
                    break;

                case 'ping':
                    // ハートビート応答
                    ws.send(JSON.stringify({ type: 'pong' }));
                    break;

                default:
                    console.log(`Unknown message type: ${message.type}`);
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    // 接続終了の処理
    ws.on('close', () => {
        if (room) {
            room.removeUser(userId);

            // ルームが空になったら削除
            if (room.isEmpty()) {
                rooms.delete(roomId);
                console.log(`Room ${roomId} deleted`);
            }
        }
    });

    // エラーの処理
    ws.on('error', (error) => {
        console.error(`WebSocket error for user ${userId}:`, error);
    });

    // 接続成功の通知
    ws.send(JSON.stringify({
        type: 'connection-success',
        userId: userId,
        roomId: roomId
    }));
});

// ハートビート機能
setInterval(() => {
    wss.clients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.ping();
        }
    });
}, 30000);

// サーバー統計の定期出力
setInterval(() => {
    console.log(`Active rooms: ${rooms.size}, Connected users: ${users.size}`);
}, 60000);

// サーバーの起動
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Signaling server running on port ${PORT}`);
});

// 優雅な終了処理
process.on('SIGINT', () => {
    console.log('Shutting down signaling server...');
    wss.close(() => {
        server.close(() => {
            process.exit(0);
        });
    });
});
