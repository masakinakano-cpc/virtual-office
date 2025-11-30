'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useStore } from '@/store/useStore';
import { getSocket, connectSocket } from '@/lib/socket';
import { useAuth } from './AuthProvider';
import Avatar from './Avatar';
import ChatBox from './ChatBox';
import StatusSelector from './StatusSelector';
import AvatarCustomizer, { avatarTypes } from './AvatarCustomizer';
import VideoCall from './VideoCall';
import { User } from '@/store/useStore';

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

const roomIcons: Record<string, string> = {
  meeting: '💼',
  lounge: '☕',
  focus: '🎧',
  open: '🌐',
};

// 装飾オブジェクト
const decorations = [
  // 観葉植物
  { type: 'plant', x: 220, y: 50, emoji: '🪴' },
  { type: 'plant', x: 770, y: 50, emoji: '🌿' },
  { type: 'plant', x: 220, y: 520, emoji: '🌱' },
  { type: 'plant', x: 770, y: 520, emoji: '🪴' },
  // コーヒーマシン
  { type: 'coffee', x: 920, y: 380, emoji: '☕' },
  // 本棚
  { type: 'bookshelf', x: 20, y: 300, emoji: '📚' },
  // ウォーターサーバー
  { type: 'water', x: 960, y: 300, emoji: '🚰' },
];

export default function OfficeMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showAvatarCustomizer, setShowAvatarCustomizer] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showVideoCall, setShowVideoCall] = useState(false);

  const { user, profile, signOut, updateProfile } = useAuth();
  const {
    currentUser,
    users,
    setCurrentUser,
    updateCurrentUser,
    setUsers,
    addUser,
    removeUser,
    updateUserPosition,
    updateUser,
    addMessage,
  } = useStore();

  // Socket.io接続とイベント設定
  useEffect(() => {
    if (!user) return;

    const socket = connectSocket();

    socket.on('user-joined', (u) => {
      setCurrentUser(u);
    });

    socket.on('users-list', (usersList) => {
      setUsers(usersList);
    });

    socket.on('rooms-list', (roomsList) => {
      setRooms(roomsList);
    });

    socket.on('user-connected', (u) => {
      addUser(u);
    });

    socket.on('user-disconnected', (userId) => {
      removeUser(userId);
    });

    socket.on('user-moved', ({ id, x, y }) => {
      updateUserPosition(id, x, y);
    });

    socket.on('user-updated', ({ id, ...updates }) => {
      updateUser(id, updates);
    });

    socket.on('chat-message', (message) => {
      addMessage(message);
    });

    // プロフィール情報で参加（プロフィールがない場合はデフォルト値を使用）
    socket.emit('join', {
      name: profile?.display_name || user.email?.split('@')[0] || 'User',
      visibilityUserId: profile?.id || user.id,
      avatarType: profile?.avatar_type || 'cat',
      avatarUrl: profile?.avatar_url || '',
      color: profile?.avatar_color || '#4ECDC4',
      status: profile?.status || 'online',
    });

    return () => {
      socket.off('user-joined');
      socket.off('users-list');
      socket.off('rooms-list');
      socket.off('user-connected');
      socket.off('user-disconnected');
      socket.off('user-moved');
      socket.off('user-updated');
      socket.off('chat-message');
    };
  }, [user, profile, setCurrentUser, setUsers, addUser, removeUser, updateUserPosition, updateUser, addMessage]);

  // プロフィール変更時にサーバーに通知
  useEffect(() => {
    if (!profile || !currentUser) return;

    const socket = getSocket();
    if (socket.connected) {
      socket.emit('update-user', {
        avatarType: profile.avatar_type,
        avatarUrl: profile.avatar_url || '',
        color: profile.avatar_color,
        status: profile.status,
      });

      // ローカル状態も更新
      updateCurrentUser({
        avatarType: profile.avatar_type,
        avatarUrl: profile.avatar_url || '',
        color: profile.avatar_color,
        status: profile.status as 'online' | 'away' | 'busy' | 'offline',
      });
    }
  }, [profile?.avatar_type, profile?.avatar_url, profile?.avatar_color, profile?.status]);

  // クリックで移動
  const handleMapClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!currentUser || !mapRef.current) return;

      const rect = mapRef.current.getBoundingClientRect();
      const x = Math.max(30, Math.min(970, e.clientX - rect.left));
      const y = Math.max(30, Math.min(570, e.clientY - rect.top));

      // ローカルで即時更新
      updateCurrentUser({ x, y });

      // サーバーに送信
      const socket = getSocket();
      socket.emit('move', { x, y });
    },
    [currentUser, updateCurrentUser]
  );

  // キーボードで移動
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentUser) return;
      // 入力フォーカス中は無視
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      const speed = 20;
      let newX = currentUser.x;
      let newY = currentUser.y;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          newY = Math.max(30, currentUser.y - speed);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          newY = Math.min(570, currentUser.y + speed);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          newX = Math.max(30, currentUser.x - speed);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          newX = Math.min(970, currentUser.x + speed);
          break;
        default:
          return;
      }

      updateCurrentUser({ x: newX, y: newY });

      const socket = getSocket();
      socket.emit('move', { x: newX, y: newY });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentUser, updateCurrentUser]);

  // 他のユーザー（自分以外）
  const otherUsers = Array.from(users.values()).filter(
    (u) => u.id !== currentUser?.id
  );

  // ヘッダーのアバター表示
  const getHeaderAvatar = () => {
    if (profile?.avatar_type === 'custom' && profile?.avatar_url) {
      return (
        <img
          src={profile.avatar_url}
          alt="avatar"
          className="w-full h-full object-cover"
        />
      );
    }
    return avatarTypes[currentUser?.avatarType as keyof typeof avatarTypes]?.emoji || '🐱';
  };

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 overflow-hidden">
      {/* 背景装飾 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* ヘッダー */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-lg shadow-sm z-20 flex items-center justify-between px-6 border-b border-white/20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-xl">🏢</span>
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Virtual Office</h1>
              <p className="text-xs text-gray-500">みんなで一緒に働こう</p>
            </div>
          </div>
          <div className="ml-4">
            <StatusSelector />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* アバターカスタマイズボタン */}
          <button
            onClick={() => setShowAvatarCustomizer(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl hover:from-violet-600 hover:to-fuchsia-600 transition-all shadow-md hover:shadow-lg text-sm font-medium"
          >
            <span>✨</span>
            アバター変更
          </button>

          {/* ユーザー情報 */}
          <div className="flex items-center gap-3 bg-white/50 rounded-xl px-3 py-2">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-xl overflow-hidden shadow-md"
              style={{ backgroundColor: profile?.avatar_color || '#4ECDC4' }}
            >
              {getHeaderAvatar()}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">{profile?.display_name}</p>
              <p className="text-xs text-gray-500">{profile?.email}</p>
            </div>
          </div>

          <button
            onClick={signOut}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-white/50 rounded-xl transition text-sm font-medium"
          >
            ログアウト
          </button>
        </div>
      </div>

      {/* オフィスマップ */}
      <div className="pt-20 pb-4 px-4 h-full flex items-center justify-center">
        <div
          ref={mapRef}
          onClick={handleMapClick}
          className="relative w-[1000px] h-[600px] bg-white/70 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden cursor-pointer border border-white/50"
        >
          {/* フロアパターン */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                radial-gradient(circle at 25px 25px, rgba(99, 102, 241, 0.03) 2px, transparent 2px),
                linear-gradient(rgba(99, 102, 241, 0.02) 1px, transparent 1px),
                linear-gradient(90deg, rgba(99, 102, 241, 0.02) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px, 25px 25px, 25px 25px',
            }}
          ></div>

          {/* 中央のワークエリア */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            {/* ワークエリアの床 */}
            <div className="absolute -inset-16 bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl opacity-50"></div>

            {/* デスク配置 */}
            <div className="relative grid grid-cols-4 gap-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="relative group">
                  {/* デスク */}
                  <div className="w-24 h-16 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200/50 shadow-md flex items-center justify-center relative overflow-hidden">
                    {/* デスクの木目風パターン */}
                    <div className="absolute inset-0 opacity-20" style={{
                      backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(180, 140, 100, 0.1) 10px, rgba(180, 140, 100, 0.1) 11px)'
                    }}></div>
                    {/* モニター */}
                    <div className="w-8 h-6 bg-gradient-to-b from-gray-700 to-gray-800 rounded-sm shadow-inner flex items-center justify-center">
                      <div className="w-6 h-4 bg-gradient-to-br from-blue-400 to-blue-500 rounded-sm"></div>
                    </div>
                  </div>
                  {/* 椅子 */}
                  <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gradient-to-b from-gray-600 to-gray-700 rounded-full shadow-md border-2 border-gray-500"></div>
                  {/* デスク番号 */}
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-white rounded-full shadow text-xs flex items-center justify-center text-gray-500 font-medium">
                    {i + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ルーム */}
          {rooms.map((room) => (
            <div
              key={room.id}
              className="absolute rounded-2xl border-2 flex flex-col items-center justify-center transition-all hover:shadow-xl hover:scale-[1.02] group"
              style={{
                left: room.x,
                top: room.y,
                width: room.width,
                height: room.height,
                backgroundColor: room.color,
                borderColor: 'rgba(255,255,255,0.8)',
              }}
            >
              {/* ルーム内装飾 */}
              <div className="absolute inset-2 rounded-xl border border-white/30"></div>

              <div className="relative z-10 text-center">
                <span className="text-3xl mb-2 block group-hover:scale-110 transition-transform">{roomIcons[room.type]}</span>
                <span className="text-sm font-semibold text-gray-700">{room.name}</span>
                <div className="mt-1 text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  クリックして入室
                </div>
              </div>

              {/* ルームのソファや家具（ラウンジのみ） */}
              {room.type === 'lounge' && (
                <>
                  <div className="absolute bottom-3 left-3 w-12 h-6 bg-rose-300 rounded-lg shadow-inner"></div>
                  <div className="absolute bottom-3 right-3 w-12 h-6 bg-rose-300 rounded-lg shadow-inner"></div>
                </>
              )}
            </div>
          ))}

          {/* 装飾オブジェクト */}
          {decorations.map((deco, i) => (
            <div
              key={i}
              className="absolute text-2xl transition-transform hover:scale-125"
              style={{ left: deco.x, top: deco.y }}
              title={deco.type}
            >
              {deco.emoji}
            </div>
          ))}

          {/* 他のユーザー */}
          {otherUsers.map((user) => (
            <div
              key={user.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedUser(user);
              }}
            >
              <Avatar user={user} />
            </div>
          ))}

          {/* 自分のアバター */}
          {currentUser && <Avatar user={currentUser} isCurrentUser />}
        </div>
      </div>

      {/* チャットボックス */}
      <ChatBox />

      {/* 操作説明 */}
      <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg px-5 py-4 border border-white/50">
        <h3 className="font-bold text-sm text-gray-800 mb-3 flex items-center gap-2">
          <span className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-xs">?</span>
          操作方法
        </h3>
        <ul className="text-xs text-gray-600 space-y-2">
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center">🖱️</span>
            クリックで移動
          </li>
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center text-[10px]">⌨️</span>
            WASD / 矢印キーで移動
          </li>
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center">💬</span>
            近くのユーザーとチャット
          </li>
        </ul>
      </div>

      {/* オンラインユーザー数 */}
      <div className="absolute top-20 left-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg px-4 py-3 mt-2 border border-white/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75"></div>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{users.size}人</p>
            <p className="text-xs text-gray-500">オンライン</p>
          </div>
        </div>
      </div>

      {/* アバターカスタマイザー */}
      <AvatarCustomizer
        isOpen={showAvatarCustomizer}
        onClose={() => setShowAvatarCustomizer(false)}
      />

      {/* ユーザー選択メニュー */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-40">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full mx-4 shadow-2xl border border-white/50">
            <div className="flex items-center gap-4 mb-6">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl overflow-hidden shadow-lg"
                style={{ backgroundColor: selectedUser.color }}
              >
                {selectedUser.avatarType === 'custom' && selectedUser.avatarUrl ? (
                  <img src={selectedUser.avatarUrl} alt={selectedUser.name} className="w-full h-full object-cover" />
                ) : (
                  avatarTypes[selectedUser.avatarType as keyof typeof avatarTypes]?.emoji || '🐱'
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">{selectedUser.name}</h3>
                <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    selectedUser.status === 'online' ? 'bg-green-500' :
                    selectedUser.status === 'away' ? 'bg-yellow-500' :
                    selectedUser.status === 'busy' ? 'bg-red-500' : 'bg-gray-400'
                  }`}></span>
                  {selectedUser.status === 'online' ? 'オンライン' :
                   selectedUser.status === 'away' ? '離席中' :
                   selectedUser.status === 'busy' ? '取り込み中' : 'オフライン'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowVideoCall(true);
                }}
                className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <span>📹</span>
                ビデオ通話を開始
              </button>
              <button
                onClick={() => setSelectedUser(null)}
                className="w-full py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ビデオ通話 */}
      {showVideoCall && (
        <VideoCall
          targetUser={selectedUser}
          onClose={() => {
            setShowVideoCall(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}
