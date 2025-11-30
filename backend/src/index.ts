import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
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

// ユーザー情報の型定義
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
}

interface JoinData {
  name: string;
  visibilityUserId?: string;
  avatarType?: string;
  avatarUrl?: string;
  color?: string;
  status?: 'online' | 'away' | 'busy' | 'offline';
}

// 接続中のユーザーを管理
const users = new Map<string, User>();

// ルーム情報
interface Room {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  type: 'meeting' | 'lounge' | 'focus' | 'open';
}

const defaultRooms: Room[] = [
  { id: 'meeting-a', name: 'ミーティング A', x: 30, y: 30, width: 180, height: 130, color: '#FEF3C7', type: 'meeting' },
  { id: 'meeting-b', name: 'ミーティング B', x: 790, y: 30, width: 180, height: 130, color: '#DCFCE7', type: 'meeting' },
  { id: 'lounge', name: 'カフェラウンジ', x: 790, y: 440, width: 180, height: 130, color: '#FEE2E2', type: 'lounge' },
  { id: 'focus', name: 'フォーカスゾーン', x: 30, y: 440, width: 180, height: 130, color: '#E0E7FF', type: 'focus' },
];

// ランダムな色を生成
const getRandomColor = (): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// ランダムなアバタータイプを生成
const getRandomAvatarType = (): string => {
  const types = ['cat', 'dog', 'bear', 'rabbit', 'panda', 'fox', 'penguin', 'owl'];
  return types[Math.floor(Math.random() * types.length)];
};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // ユーザーが参加
  socket.on('join', (data: JoinData | string) => {
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
    };

    users.set(socket.id, user);

    // 自分の情報を送信
    socket.emit('user-joined', user);

    // 既存のユーザー一覧を送信
    socket.emit('users-list', Array.from(users.values()));

    // ルーム情報を送信
    socket.emit('rooms-list', defaultRooms);

    // 他のユーザーに新規参加を通知
    socket.broadcast.emit('user-connected', user);

    console.log(`${user.name} joined the office (${user.avatarType})`);
  });

  // ユーザーの移動
  socket.on('move', (position: { x: number; y: number }) => {
    const user = users.get(socket.id);
    if (user) {
      user.x = position.x;
      user.y = position.y;
      users.set(socket.id, user);

      // 他のユーザーに位置を通知
      socket.broadcast.emit('user-moved', {
        id: socket.id,
        x: position.x,
        y: position.y,
      });
    }
  });

  // ユーザー情報の更新（アバター、ステータスなど）
  socket.on('update-user', (updates: Partial<User>) => {
    const user = users.get(socket.id);
    if (user) {
      const updatedUser = { ...user, ...updates };
      users.set(socket.id, updatedUser);

      // 他のユーザーに更新を通知
      socket.broadcast.emit('user-updated', {
        id: socket.id,
        ...updates,
      });
    }
  });

  // チャットメッセージ
  socket.on('chat-message', (message: string) => {
    const user = users.get(socket.id);
    if (user) {
      // 送信者の近くにいるユーザーを取得（距離150px以内）
      const nearbyUsers = Array.from(users.values()).filter((u) => {
        if (u.id === socket.id) return false;
        const distance = Math.sqrt(
          Math.pow(u.x - user.x, 2) + Math.pow(u.y - user.y, 2)
        );
        return distance <= 150;
      });

      const chatData = {
        userId: socket.id,
        userName: user.name,
        message,
        timestamp: Date.now(),
      };

      // 自分に送信
      socket.emit('chat-message', chatData);

      // 近くのユーザーにのみ送信
      nearbyUsers.forEach((nearbyUser) => {
        io.to(nearbyUser.id).emit('chat-message', chatData);
      });
    }
  });

  // ビデオ通話シグナリング
  socket.on('call-user', (data: { to: string; signal: unknown }) => {
    const user = users.get(socket.id);
    if (user) {
      io.to(data.to).emit('incoming-call', {
        from: socket.id,
        signal: data.signal,
        callerName: user.name,
      });
    }
  });

  socket.on('answer-call', (data: { to: string; signal: unknown }) => {
    io.to(data.to).emit('call-accepted', {
      from: socket.id,
      signal: data.signal,
    });
  });

  socket.on('end-call', (data: { to: string }) => {
    io.to(data.to).emit('call-ended', { from: socket.id });
  });

  // 切断処理
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      console.log(`${user.name} left the office`);
    }
    users.delete(socket.id);
    io.emit('user-disconnected', socket.id);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🏢 Virtual Office server running on port ${PORT}`);
});
