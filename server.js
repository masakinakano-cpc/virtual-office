import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { parse } from 'url';

const server = createServer();
const wss = new WebSocketServer({ server });

// ルーム管理
const rooms = new Map();

// ユーザー管理
const users = new Map();

// WebSocket接続処理
wss.on('connection', (ws, request) => {
    const url = parse(request.url, true);
    const { roomId, userId, nickname } = url.query;

    if (!roomId || !userId || !nickname) {
        ws.close(1008, 'Missing required parameters');
        return;
    }

    console.log(`ユーザー ${nickname} (${userId}) がルーム ${roomId} に接続しました`);

    // ユーザー情報を保存
    const user = {
        id: userId,
        nickname: nickname,
        roomId: roomId,
        ws: ws,
        position: { x: 200, y: 200 },
        isVideoEnabled: false,
        isAudioEnabled: true
    };

    users.set(userId, user);

    // ルームにユーザーを追加
    if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
    }
    rooms.get(roomId).add(userId);

    // 接続成功メッセージ
    ws.send(JSON.stringify({
        type: 'connection-success',
        userId: userId,
        roomId: roomId
    }));

    // 既存のユーザー一覧を送信
    const roomUsers = Array.from(rooms.get(roomId))
        .map(id => users.get(id))
        .filter(u => u && u.id !== userId)
        .map(u => ({
            id: u.id,
            nickname: u.nickname,
            position: u.position,
            isVideoEnabled: u.isVideoEnabled,
            isAudioEnabled: u.isAudioEnabled
        }));

    ws.send(JSON.stringify({
        type: 'room-users',
        users: roomUsers
    }));

    // 他のユーザーに新規参加を通知
    broadcastToRoom(roomId, {
        type: 'user-joined',
        userId: userId,
        nickname: nickname,
        position: user.position
    }, userId);

    // メッセージ処理
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());
            handleMessage(userId, message);
        } catch (error) {
            console.error('メッセージ解析エラー:', error);
        }
    });

    // 切断処理
    ws.on('close', () => {
        console.log(`ユーザー ${nickname} (${userId}) が切断しました`);

        // ユーザーをルームから削除
        if (rooms.has(roomId)) {
            rooms.get(roomId).delete(userId);
            if (rooms.get(roomId).size === 0) {
                rooms.delete(roomId);
            }
        }

        // ユーザー情報を削除
        users.delete(userId);

        // 他のユーザーに退出を通知
        broadcastToRoom(roomId, {
            type: 'user-left',
            userId: userId
        });
    });

    // エラー処理
    ws.on('error', (error) => {
        console.error(`WebSocketエラー (${userId}):`, error);
    });
});

// メッセージ処理関数
function handleMessage(userId, message) {
    const user = users.get(userId);
    if (!user) return;

    const roomId = user.roomId;

    switch (message.type) {
        case 'position-update':
            user.position = message.position;
            broadcastToRoom(roomId, {
                type: 'user-position-update',
                userId: userId,
                position: message.position
            }, userId);
            break;

        case 'media-update':
            user.isVideoEnabled = message.mediaState.isVideoEnabled;
            user.isAudioEnabled = message.mediaState.isAudioEnabled;
            broadcastToRoom(roomId, {
                type: 'user-media-update',
                userId: userId,
                mediaState: message.mediaState
            }, userId);
            break;

        case 'webrtc-signal':
            // WebRTCシグナリングメッセージを対象ユーザーに転送
            const targetUser = users.get(message.targetUserId);
            if (targetUser && targetUser.ws.readyState === targetUser.ws.OPEN) {
                targetUser.ws.send(JSON.stringify({
                    type: 'webrtc-signal',
                    fromUserId: userId,
                    message: message.signal
                }));
            }
            break;

        case 'chat-message':
            console.log(`チャットメッセージ受信: ${user.nickname}: ${message.message}`);
            // ルーム内の他のユーザーにメッセージを転送
            const roomConnections = Array.from(rooms.values())
                .filter(conn => conn.id !== userId)
                .map(conn => {
                    if (conn.ws.readyState === conn.ws.OPEN) {
                        conn.ws.send(JSON.stringify({
                            type: 'chat-message',
                            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            userId: userId,
                            nickname: user.nickname,
                            message: message.message,
                            timestamp: Date.now(),
                            color: user.color || '#6366f1'
                        }));
                    }
                });
            break;

        case 'ping':
            user.ws.send(JSON.stringify({ type: 'pong' }));
            break;

        // WebRTCシグナリング用のメッセージタイプを追加
        case 'offer':
        case 'answer':
        case 'ice-candidate':
            console.log(`WebRTCシグナル転送: ${message.type} from ${userId} to ${message.targetUserId || 'all'}`);

            if (message.targetUserId) {
                // 特定のユーザーへの転送
                const targetUser = users.get(message.targetUserId);
                if (targetUser && targetUser.ws.readyState === targetUser.ws.OPEN) {
                    targetUser.ws.send(JSON.stringify({
                        type: 'webrtc-signal',
                        fromUserId: userId,
                        signalType: message.type,
                        signal: message
                    }));
                }
            } else {
                // 全員に転送
                broadcastToRoom(roomId, {
                    type: 'webrtc-signal',
                    fromUserId: userId,
                    signalType: message.type,
                    signal: message
                }, userId);
            }
            break;

        case 'video-toggle':
            console.log(`ビデオトグル: ${user.nickname} (${userId})`);
            user.isVideoEnabled = !user.isVideoEnabled;

            // 他のユーザーにビデオ状態の変更を通知
            broadcastToRoom(roomId, {
                type: 'user-video-toggle',
                userId: userId,
                isVideoEnabled: user.isVideoEnabled
            }, userId);

            // 送信者に確認を返す
            user.ws.send(JSON.stringify({
                type: 'video-toggle-confirm',
                isVideoEnabled: user.isVideoEnabled
            }));
            break;

        case 'audio-toggle':
            console.log(`オーディオトグル: ${user.nickname} (${userId})`);
            user.isAudioEnabled = !user.isAudioEnabled;

            // 他のユーザーにオーディオ状態の変更を通知
            broadcastToRoom(roomId, {
                type: 'user-audio-toggle',
                userId: userId,
                isAudioEnabled: user.isAudioEnabled
            }, userId);

            // 送信者に確認を返す
            user.ws.send(JSON.stringify({
                type: 'audio-toggle-confirm',
                isAudioEnabled: user.isAudioEnabled
            }));
            break;

        case 'whiteboard-draw':
            console.log(`ホワイトボード描画: ${user.nickname}`);
            broadcastToRoom(roomId, {
                type: 'whiteboard-draw',
                fromUserId: userId,
                drawData: message.drawData
            }, userId);
            break;

        case 'whiteboard-clear':
            console.log(`ホワイトボードクリア: ${user.nickname}`);
            broadcastToRoom(roomId, {
                type: 'whiteboard-clear',
                fromUserId: userId
            }, userId);
            break;

        default:
            console.log(`未知のメッセージタイプ: ${message.type} from user: ${userId}`);
    }
}

// ルーム内のユーザーにブロードキャスト
function broadcastToRoom(roomId, message, excludeUserId = null) {
    if (!rooms.has(roomId)) return;

    const userIds = Array.from(rooms.get(roomId));
    userIds.forEach(userId => {
        if (userId === excludeUserId) return;

        const user = users.get(userId);
        if (user && user.ws.readyState === user.ws.OPEN) {
            user.ws.send(JSON.stringify(message));
        }
    });
}

// ハートビート機能
setInterval(() => {
    wss.clients.forEach((ws) => {
        if (ws.readyState === ws.OPEN) {
            ws.ping();
        }
    });
}, 30000);

// サーバー起動
const PORT = process.env.PORT || 8080;

// ポート競合エラーハンドリング
const startServer = (port) => {
    server.listen(port, () => {
        console.log(`WebSocketサーバーがポート ${port} で起動しました`);
        console.log(`接続URL: ws://localhost:${port}`);
    }).on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            console.log(`ポート ${port} は使用中です。次のポートを試します...`);
            startServer(port + 1);
        } else {
            console.error('サーバー起動エラー:', error);
            process.exit(1);
        }
    });
};

// グレースフルシャットダウン
process.on('SIGTERM', () => {
    console.log('サーバーをシャットダウンしています...');
    wss.clients.forEach((ws) => {
        ws.close();
    });
    server.close(() => {
        console.log('サーバーが正常にシャットダウンされました');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('サーバーをシャットダウンしています...');
    wss.clients.forEach((ws) => {
        ws.close();
    });
    server.close(() => {
        console.log('サーバーが正常にシャットダウンされました');
        process.exit(0);
    });
});

startServer(PORT);
