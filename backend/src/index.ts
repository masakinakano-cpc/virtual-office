import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';

const app = express();
const server = createServer(app);

const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';

const io = new Server(server, {
  cors: {
    origin: corsOrigin.split(','),
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// ====================
// 型定義
// ====================

/** ユーザー情報 */
interface User {
  id: string;
  visibilityUserId?: string;
  name: string;
  x: number;
  y: number;
  color: string;
  avatarType: string;
  avatarUrl?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  currentRoom: string | null; // 現在所属しているルームID
  isMuted: boolean; // ミュート状態
}

/** ルーム情報 */
interface Room {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  type: 'meeting' | 'lounge' | 'focus' | 'open';
  occupants: string[]; // 現在の滞在ユーザーID一覧
  locked: boolean; // ロック状態（ミーティングルームのみ）
  lockedBy?: string; // ロックしたユーザーID
}

/** 参加時データ */
interface JoinData {
  name: string;
  visibilityUserId?: string;
  avatarType?: string;
  avatarUrl?: string;
  color?: string;
  status?: 'online' | 'away' | 'busy' | 'offline';
}

// ====================
// データストア
// ====================

/** 接続中のユーザー */
const users = new Map<string, User>();

/** ルーム定義 */
const rooms = new Map<string, Room>();

/** デフォルトルーム定義 */
const defaultRooms: Omit<Room, 'occupants' | 'locked'>[] = [
  {
    id: 'meeting-a',
    name: 'ミーティング A',
    x: 30,
    y: 30,
    width: 220,
    height: 160,
    color: '#FEF3C7',
    type: 'meeting',
  },
  {
    id: 'meeting-b',
    name: 'ミーティング B',
    x: 750,
    y: 30,
    width: 220,
    height: 160,
    color: '#DCFCE7',
    type: 'meeting',
  },
  {
    id: 'lounge',
    name: 'カフェラウンジ',
    x: 750,
    y: 440,
    width: 220,
    height: 160,
    color: '#FEE2E2',
    type: 'lounge',
  },
  {
    id: 'focus',
    name: 'フォーカスゾーン',
    x: 30,
    y: 440,
    width: 220,
    height: 160,
    color: '#E0E7FF',
    type: 'focus',
  },
];

/** 各ユーザーの現在のオーディオ接続相手 (throttle用) */
const userAudioPeers = new Map<string, Set<string>>();

/** 位置更新のスロットリング管理 */
const positionUpdateTimestamps = new Map<string, number>();
const POSITION_UPDATE_INTERVAL = 50; // 20回/秒 = 50ms

/** オーディオピア再計算のスロットリング管理 */
const audioPeerUpdateTimestamps = new Map<string, number>();
const AUDIO_PEER_UPDATE_INTERVAL = 100; // 10回/秒 = 100ms

// ====================
// 初期化
// ====================

/** ルームを初期化 */
function initializeRooms(): void {
  defaultRooms.forEach((room) => {
    rooms.set(room.id, {
      ...room,
      occupants: [],
      locked: false,
    });
  });
  console.log(`📦 Initialized ${rooms.size} rooms`);
}

// ====================
// ユーティリティ関数
// ====================

/** ランダムな色を生成 */
function getRandomColor(): string {
  const colors = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FFEAA7',
    '#DDA0DD',
    '#98D8C8',
    '#F7DC6F',
    '#BB8FCE',
    '#85C1E9',
    '#F8B500',
    '#00CED1',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/** ランダムなアバタータイプを生成 */
function getRandomAvatarType(): string {
  const types = ['cat', 'dog', 'bear', 'rabbit', 'panda', 'fox', 'penguin', 'owl'];
  return types[Math.floor(Math.random() * types.length)];
}

/** ユーザーがルーム内にいるか判定 */
function isUserInRoom(user: User, room: Room): boolean {
  return (
    user.x >= room.x &&
    user.x <= room.x + room.width &&
    user.y >= room.y &&
    user.y <= room.y + room.height
  );
}

/** ユーザーの現在位置から所属ルームを検出 */
function detectUserRoom(user: User): string | null {
  for (const room of rooms.values()) {
    if (isUserInRoom(user, room)) {
      return room.id;
    }
  }
  return null;
}

/** 2ユーザー間の距離を計算 */
function calculateDistance(user1: User, user2: User): number {
  return Math.sqrt(Math.pow(user2.x - user1.x, 2) + Math.pow(user2.y - user1.y, 2));
}

/** オーディオ接続すべきユーザーを計算 */
function calculateAudioPeers(userId: string): string[] {
  const user = users.get(userId);
  if (!user) return [];

  const peers: string[] = [];

  for (const [otherId, otherUser] of users.entries()) {
    if (otherId === userId) continue;

    // 両方がルーム内 → 同じルームなら接続
    if (user.currentRoom && otherUser.currentRoom) {
      if (user.currentRoom === otherUser.currentRoom) {
        peers.push(otherId);
      }
      continue;
    }

    // どちらか一方がルーム内 → 接続しない（ルームプライバシー）
    if (user.currentRoom || otherUser.currentRoom) {
      continue;
    }

    // 両方がルーム外 → 距離300px以内なら接続
    const distance = calculateDistance(user, otherUser);
    if (distance < 300) {
      peers.push(otherId);
    }
  }

  return peers;
}

/** ルーム入退室を処理 */
function handleRoomTransition(
  socket: Socket,
  user: User,
  oldRoomId: string | null,
  newRoomId: string | null
): void {
  // ルームから退出
  if (oldRoomId && oldRoomId !== newRoomId) {
    const oldRoom = rooms.get(oldRoomId);
    if (oldRoom) {
      oldRoom.occupants = oldRoom.occupants.filter((id) => id !== user.id);
      rooms.set(oldRoomId, oldRoom);

      // ルーム退出イベント
      io.emit('room-left', { userId: user.id, roomId: oldRoomId });

      // ルーム情報更新を全体にブロードキャスト
      io.emit('room-updated', {
        roomId: oldRoomId,
        occupants: oldRoom.occupants,
        locked: oldRoom.locked,
        lockedBy: oldRoom.lockedBy,
      });

      console.log(`📤 ${user.name} left room: ${oldRoom.name}`);
    }
  }

  // ルームに入室
  if (newRoomId && newRoomId !== oldRoomId) {
    const newRoom = rooms.get(newRoomId);
    if (newRoom) {
      // ロックされているミーティングルームには入れない
      if (newRoom.locked && newRoom.type === 'meeting') {
        console.log(`🔒 ${user.name} tried to enter locked room: ${newRoom.name}`);
        return;
      }

      newRoom.occupants.push(user.id);
      rooms.set(newRoomId, newRoom);

      // ルーム入室イベント
      io.emit('room-entered', { userId: user.id, roomId: newRoomId });

      // ルーム情報更新を全体にブロードキャスト
      io.emit('room-updated', {
        roomId: newRoomId,
        occupants: newRoom.occupants,
        locked: newRoom.locked,
        lockedBy: newRoom.lockedBy,
      });

      console.log(`📥 ${user.name} entered room: ${newRoom.name}`);
    }
  }
}

/** オーディオピアの変更を通知 */
function notifyAudioPeersUpdate(userId: string, newPeers: string[]): void {
  const oldPeers = userAudioPeers.get(userId) || new Set<string>();
  const newPeersSet = new Set(newPeers);

  // 接続を追加すべきピア
  const toConnect = newPeers.filter((id) => !oldPeers.has(id));

  // 切断すべきピア
  const toDisconnect = Array.from(oldPeers).filter((id) => !newPeersSet.has(id));

  if (toConnect.length > 0 || toDisconnect.length > 0) {
    io.to(userId).emit('audio-peers-update', {
      connect: toConnect,
      disconnect: toDisconnect,
    });

    // 更新
    userAudioPeers.set(userId, newPeersSet);
  }
}

/** チャットメッセージの配信範囲を取得 */
function getChatRecipients(sender: User): string[] {
  const recipients: string[] = [];

  // 送信者がルーム内 → ルーム全体に配信
  if (sender.currentRoom) {
    const room = rooms.get(sender.currentRoom);
    if (room) {
      return room.occupants.filter((id) => id !== sender.id);
    }
  }

  // 送信者がルーム外 → 距離200px以内のユーザーに配信
  for (const [userId, user] of users.entries()) {
    if (userId === sender.id) continue;
    if (user.currentRoom) continue; // 相手がルーム内なら届かない

    const distance = calculateDistance(sender, user);
    if (distance <= 200) {
      recipients.push(userId);
    }
  }

  return recipients;
}

// ====================
// Socket.IO イベントハンドラ
// ====================

io.on('connection', (socket: Socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  // -------------------
  // 参加イベント
  // -------------------
  socket.on('join', (data: JoinData | string) => {
    try {
      // 後方互換性: 文字列の場合は名前として扱う
      const joinData: JoinData = typeof data === 'string' ? { name: data } : data;

      const user: User = {
        id: socket.id,
        visibilityUserId: joinData.visibilityUserId,
        name: joinData.name || `Guest_${socket.id.slice(0, 4)}`,
        x: 400 + Math.random() * 200,
        y: 300 + Math.random() * 200,
        color: joinData.color || getRandomColor(),
        avatarType: joinData.avatarType || getRandomAvatarType(),
        avatarUrl: joinData.avatarUrl || '',
        status: joinData.status || 'online',
        currentRoom: null,
        isMuted: false,
      };

      users.set(socket.id, user);
      userAudioPeers.set(socket.id, new Set());

      // 自分の情報を送信
      socket.emit('user-joined', user);

      // 既存のユーザー一覧を送信
      socket.emit('users-list', Array.from(users.values()));

      // ルーム情報を送信
      socket.emit('rooms-list', Array.from(rooms.values()));

      // 他のユーザーに新規参加を通知
      socket.broadcast.emit('user-connected', user);

      console.log(`👤 ${user.name} joined the office (${user.avatarType})`);
    } catch (error) {
      console.error('❌ Error in join event:', error);
    }
  });

  // -------------------
  // 移動イベント
  // -------------------
  socket.on('move', (position: { x: number; y: number }) => {
    try {
      const user = users.get(socket.id);
      if (!user) return;

      // スロットリング: 50ms以内の連続更新を無視
      const now = Date.now();
      const lastUpdate = positionUpdateTimestamps.get(socket.id) || 0;
      if (now - lastUpdate < POSITION_UPDATE_INTERVAL) {
        return;
      }
      positionUpdateTimestamps.set(socket.id, now);

      const oldRoomId = user.currentRoom;

      // 位置を更新
      user.x = position.x;
      user.y = position.y;

      // 新しいルームを検出
      const newRoomId = detectUserRoom(user);
      user.currentRoom = newRoomId;
      users.set(socket.id, user);

      // ルーム遷移を処理
      if (oldRoomId !== newRoomId) {
        handleRoomTransition(socket, user, oldRoomId, newRoomId);
      }

      // 位置更新を全ユーザーにブロードキャスト
      socket.broadcast.emit('user-moved', {
        id: socket.id,
        x: position.x,
        y: position.y,
      });

      // オーディオピアを再計算（スロットリング付き）
      const lastAudioUpdate = audioPeerUpdateTimestamps.get(socket.id) || 0;
      if (now - lastAudioUpdate >= AUDIO_PEER_UPDATE_INTERVAL) {
        audioPeerUpdateTimestamps.set(socket.id, now);

        const newAudioPeers = calculateAudioPeers(socket.id);
        notifyAudioPeersUpdate(socket.id, newAudioPeers);

        // 相手側の接続も再計算（自分が相手のピアに追加/削除される可能性）
        newAudioPeers.forEach((peerId) => {
          const peerNewPeers = calculateAudioPeers(peerId);
          notifyAudioPeersUpdate(peerId, peerNewPeers);
        });
      }
    } catch (error) {
      console.error('❌ Error in move event:', error);
    }
  });

  // -------------------
  // ユーザー情報更新
  // -------------------
  socket.on('update-user', (updates: Partial<User>) => {
    try {
      const user = users.get(socket.id);
      if (!user) return;

      const updatedUser = { ...user, ...updates };
      users.set(socket.id, updatedUser);

      // 他のユーザーに更新を通知
      socket.broadcast.emit('user-updated', {
        id: socket.id,
        ...updates,
      });
    } catch (error) {
      console.error('❌ Error in update-user event:', error);
    }
  });

  // -------------------
  // チャットメッセージ
  // -------------------
  socket.on('chat-message', (message: string) => {
    try {
      const user = users.get(socket.id);
      if (!user) return;

      const recipients = getChatRecipients(user);

      const chatData = {
        userId: socket.id,
        userName: user.name,
        message,
        timestamp: Date.now(),
        type: user.currentRoom ? 'room' : 'proximity',
      };

      // 自分に送信
      socket.emit('chat-message', chatData);

      // 対象ユーザーに送信
      recipients.forEach((recipientId) => {
        io.to(recipientId).emit('chat-message', chatData);
      });

      console.log(`💬 ${user.name}: ${message} (recipients: ${recipients.length})`);
    } catch (error) {
      console.error('❌ Error in chat-message event:', error);
    }
  });

  // -------------------
  // ルームのロック/アンロック
  // -------------------
  socket.on('lock-room', (data: { roomId: string }) => {
    try {
      const user = users.get(socket.id);
      const room = rooms.get(data.roomId);

      if (!user || !room) return;

      // ミーティングルームのみロック可能
      if (room.type !== 'meeting') {
        console.log(`⚠️ ${user.name} tried to lock non-meeting room: ${room.name}`);
        return;
      }

      // ルーム内のユーザーのみロック可能
      if (!room.occupants.includes(socket.id)) {
        console.log(`⚠️ ${user.name} tried to lock room from outside: ${room.name}`);
        return;
      }

      room.locked = true;
      room.lockedBy = socket.id;
      rooms.set(data.roomId, room);

      // ルーム情報更新を全体にブロードキャスト
      io.emit('room-updated', {
        roomId: data.roomId,
        occupants: room.occupants,
        locked: room.locked,
        lockedBy: room.lockedBy,
      });

      console.log(`🔒 ${user.name} locked room: ${room.name}`);
    } catch (error) {
      console.error('❌ Error in lock-room event:', error);
    }
  });

  socket.on('unlock-room', (data: { roomId: string }) => {
    try {
      const user = users.get(socket.id);
      const room = rooms.get(data.roomId);

      if (!user || !room) return;

      // ロックしたユーザーのみアンロック可能
      if (room.lockedBy !== socket.id) {
        console.log(`⚠️ ${user.name} tried to unlock room locked by others: ${room.name}`);
        return;
      }

      room.locked = false;
      room.lockedBy = undefined;
      rooms.set(data.roomId, room);

      // ルーム情報更新を全体にブロードキャスト
      io.emit('room-updated', {
        roomId: data.roomId,
        occupants: room.occupants,
        locked: room.locked,
      });

      console.log(`🔓 ${user.name} unlocked room: ${room.name}`);
    } catch (error) {
      console.error('❌ Error in unlock-room event:', error);
    }
  });

  // -------------------
  // WebRTC Audio シグナリング
  // -------------------
  socket.on('audio-offer', (data: { to: string; sdp: unknown }) => {
    try {
      io.to(data.to).emit('audio-offer', {
        from: socket.id,
        sdp: data.sdp,
      });
    } catch (error) {
      console.error('❌ Error in audio-offer event:', error);
    }
  });

  socket.on('audio-answer', (data: { to: string; sdp: unknown }) => {
    try {
      io.to(data.to).emit('audio-answer', {
        from: socket.id,
        sdp: data.sdp,
      });
    } catch (error) {
      console.error('❌ Error in audio-answer event:', error);
    }
  });

  socket.on('audio-ice-candidate', (data: { to: string; candidate: unknown }) => {
    try {
      io.to(data.to).emit('audio-ice-candidate', {
        from: socket.id,
        candidate: data.candidate,
      });
    } catch (error) {
      console.error('❌ Error in audio-ice-candidate event:', error);
    }
  });

  // -------------------
  // スピーキング状態の通知
  // -------------------
  socket.on('user-speaking', (data: { speaking: boolean }) => {
    try {
      const user = users.get(socket.id);
      if (!user) return;

      // オーディオ接続中のピアに通知
      const peers = userAudioPeers.get(socket.id) || new Set();
      peers.forEach((peerId) => {
        io.to(peerId).emit('user-speaking', {
          userId: socket.id,
          speaking: data.speaking,
        });
      });
    } catch (error) {
      console.error('❌ Error in user-speaking event:', error);
    }
  });

  // -------------------
  // 1:1 ビデオ通話シグナリング（既存機能）
  // -------------------
  socket.on('call-user', (data: { to: string; signal: unknown }) => {
    try {
      const user = users.get(socket.id);
      if (!user) return;

      io.to(data.to).emit('incoming-call', {
        from: socket.id,
        signal: data.signal,
        callerName: user.name,
      });
    } catch (error) {
      console.error('❌ Error in call-user event:', error);
    }
  });

  socket.on('answer-call', (data: { to: string; signal: unknown }) => {
    try {
      io.to(data.to).emit('call-accepted', {
        from: socket.id,
        signal: data.signal,
      });
    } catch (error) {
      console.error('❌ Error in answer-call event:', error);
    }
  });

  socket.on('end-call', (data: { to: string }) => {
    try {
      io.to(data.to).emit('call-ended', { from: socket.id });
    } catch (error) {
      console.error('❌ Error in end-call event:', error);
    }
  });

  // -------------------
  // 切断処理
  // -------------------
  socket.on('disconnect', () => {
    try {
      const user = users.get(socket.id);
      if (user) {
        console.log(`👋 ${user.name} left the office`);

        // ルームから削除
        if (user.currentRoom) {
          handleRoomTransition(socket, user, user.currentRoom, null);
        }

        // オーディオピアをクリーンアップ
        const peers = userAudioPeers.get(socket.id) || new Set();
        peers.forEach((peerId) => {
          const peerNewPeers = calculateAudioPeers(peerId);
          notifyAudioPeersUpdate(peerId, peerNewPeers);
        });

        userAudioPeers.delete(socket.id);
        positionUpdateTimestamps.delete(socket.id);
        audioPeerUpdateTimestamps.delete(socket.id);
      }

      users.delete(socket.id);
      io.emit('user-disconnected', socket.id);
    } catch (error) {
      console.error('❌ Error in disconnect event:', error);
    }
  });
});

// ====================
// サーバー起動
// ====================

const PORT = process.env.PORT || 3001;

initializeRooms();

server.listen(PORT, () => {
  console.log(`🏢 Virtual Office server running on port ${PORT}`);
  console.log(`📡 CORS enabled for: ${corsOrigin}`);
  console.log(`🎯 Features: Room System, Proximity Audio, Chat, Video Calls`);
});
