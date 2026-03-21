'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useStore, Room } from '@/store/useStore';
import { getSocket, connectSocket } from '@/lib/socket';
import { avatarTypes, avatarColors } from '@/lib/avatars';
import Avatar from './Avatar';
import ChatBox from './ChatBox';
import VideoCall from './VideoCall';
import Sidebar from './Sidebar';
import MicControls from './MicControls';
import useProximityAudio from '@/hooks/useProximityAudio';
import { User } from '@/store/useStore';

// Map constants
const MAP_WIDTH = 1000;
const MAP_HEIGHT = 600;
const MOVE_SPEED = 3; // pixels per frame for smooth movement

const roomIcons: Record<string, string> = {
  meeting: '💼',
  lounge: '☕',
  focus: '🎧',
  open: '🌐',
};

const statusInfo: Record<string, { label: string; color: string; icon: string }> = {
  online: { label: 'オンライン', color: 'bg-green-500', icon: '🟢' },
  away: { label: '離席中', color: 'bg-yellow-500', icon: '🟡' },
  busy: { label: '取り込み中', color: 'bg-red-500', icon: '🔴' },
  offline: { label: 'オフライン', color: 'bg-gray-400', icon: '⚫' },
};

// Desk positions
const desks = [
  { x: 350, y: 240 }, { x: 450, y: 240 }, { x: 550, y: 240 }, { x: 650, y: 240 },
  { x: 350, y: 340 }, { x: 450, y: 340 }, { x: 550, y: 340 }, { x: 650, y: 340 },
];

// Decorations
const decorations = [
  { x: 270, y: 50, emoji: '🪴' },
  { x: 730, y: 50, emoji: '🌿' },
  { x: 270, y: 550, emoji: '🌱' },
  { x: 730, y: 550, emoji: '🪴' },
  { x: 500, y: 160, emoji: '🖨️' },
  { x: 500, y: 450, emoji: '🚰' },
];

interface OfficeMapProps {
  guestName: string;
}

export default function OfficeMap({ guestName }: OfficeMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const animFrameRef = useRef<number>(0);
  const lastMoveEmitRef = useRef<number>(0);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showAvatarCustomizer, setShowAvatarCustomizer] = useState(false);
  const [mapScale, setMapScale] = useState(1);

  // Avatar config
  const [myAvatar, setMyAvatar] = useState(() => {
    const avatars = Object.keys(avatarTypes);
    return avatars[Math.floor(Math.random() * avatars.length)];
  });
  const [myColor, setMyColor] = useState(() => {
    return avatarColors[Math.floor(Math.random() * avatarColors.length)].color;
  });
  const [myStatus, setMyStatus] = useState<'online' | 'away' | 'busy' | 'offline'>('online');

  const {
    currentUser,
    users,
    rooms,
    currentRoom,
    audio,
    sidebarOpen,
    lightweightMode,
    setCurrentUser,
    updateCurrentUser,
    setUsers,
    addUser,
    removeUser,
    updateUserPosition,
    updateUser,
    setRooms,
    setCurrentRoom,
    updateRoom,
    addMessage,
    addSystemMessage,
    setMuted,
    setUserSpeaking,
    toggleSidebar,
    setLightweightMode,
  } = useStore();

  // Proximity audio
  const socket = getSocket();
  const {
    startAudio,
    stopAudio,
    isAudioActive,
    connectedPeers,
    localStream,
  } = useProximityAudio({
    socket,
    currentUser,
    users,
    isMuted: audio.isMuted,
    onSpeakingChange: (userId: string, speaking: boolean) => {
      setUserSpeaking(userId, speaking);
    },
    onAudioLevelChange: (level: number) => {
      useStore.getState().setAudioLevel(level);
    },
  });

  // Responsive map scaling
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth - (sidebarOpen ? 280 : 0) - 32;
        const containerHeight = containerRef.current.clientHeight - 80 - 32;
        const scaleX = containerWidth / MAP_WIDTH;
        const scaleY = containerHeight / MAP_HEIGHT;
        setMapScale(Math.min(scaleX, scaleY, 1.2));
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [sidebarOpen]);

  // Socket connection and event setup
  useEffect(() => {
    const sock = connectSocket();

    sock.on('user-joined', (u: User) => {
      setCurrentUser(u);
    });

    sock.on('users-list', (usersList: User[]) => {
      setUsers(usersList);
    });

    sock.on('rooms-list', (roomsList: Room[]) => {
      setRooms(roomsList);
    });

    sock.on('user-connected', (u: User) => {
      addUser(u);
      addSystemMessage(`${u.name} が参加しました`);
    });

    sock.on('user-disconnected', (userId: string) => {
      const dcUser = useStore.getState().users.get(userId);
      if (dcUser) addSystemMessage(`${dcUser.name} が退出しました`);
      removeUser(userId);
    });

    sock.on('user-moved', ({ id, x, y }: { id: string; x: number; y: number }) => {
      updateUserPosition(id, x, y);
    });

    sock.on('user-updated', ({ id, ...updates }: { id: string } & Partial<User>) => {
      updateUser(id, updates);
    });

    sock.on('chat-message', (message: { userId: string; userName: string; message: string; timestamp: number; type?: string }) => {
      addMessage({
        ...message,
        type: (message.type as 'proximity' | 'room' | 'dm' | 'system') || 'proximity',
      });
    });

    sock.on('room-entered', ({ userId, roomId }: { userId: string; roomId: string }) => {
      const enteredUser = useStore.getState().users.get(userId);
      const enteredRoom = useStore.getState().rooms.find(r => r.id === roomId);
      updateUser(userId, { currentRoom: roomId });
      if (userId === sock.id) {
        setCurrentRoom(roomId);
        if (enteredRoom) addSystemMessage(`${enteredRoom.name} に入室しました`);
      } else if (enteredUser && enteredRoom) {
        addSystemMessage(`${enteredUser.name} が ${enteredRoom.name} に入りました`);
      }
    });

    sock.on('room-left', ({ userId, roomId }: { userId: string; roomId: string }) => {
      const leftRoom = useStore.getState().rooms.find(r => r.id === roomId);
      updateUser(userId, { currentRoom: null });
      if (userId === sock.id) {
        setCurrentRoom(null);
        if (leftRoom) addSystemMessage(`${leftRoom.name} から退室しました`);
      }
    });

    sock.on('room-updated', ({ roomId, occupants, locked, lockedBy }: { roomId: string; occupants: string[]; locked: boolean; lockedBy?: string }) => {
      updateRoom(roomId, { occupants, locked, lockedBy });
    });

    sock.on('user-speaking', ({ userId, speaking }: { userId: string; speaking: boolean }) => {
      setUserSpeaking(userId, speaking);
    });

    // Join as guest
    sock.emit('join', {
      name: guestName,
      visibilityUserId: `guest-${Date.now()}`,
      avatarType: myAvatar,
      avatarUrl: '',
      color: myColor,
      status: 'online',
    });

    return () => {
      sock.off('user-joined');
      sock.off('users-list');
      sock.off('rooms-list');
      sock.off('user-connected');
      sock.off('user-disconnected');
      sock.off('user-moved');
      sock.off('user-updated');
      sock.off('chat-message');
      sock.off('room-entered');
      sock.off('room-left');
      sock.off('room-updated');
      sock.off('user-speaking');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guestName]);

  // Smooth keyboard movement with animation loop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        e.preventDefault();
        keysRef.current.add(key);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    const moveLoop = () => {
      const state = useStore.getState();
      const user = state.currentUser;
      if (!user) {
        animFrameRef.current = requestAnimationFrame(moveLoop);
        return;
      }

      const keys = keysRef.current;
      if (keys.size === 0) {
        animFrameRef.current = requestAnimationFrame(moveLoop);
        return;
      }

      let dx = 0;
      let dy = 0;

      if (keys.has('w') || keys.has('arrowup')) dy -= MOVE_SPEED;
      if (keys.has('s') || keys.has('arrowdown')) dy += MOVE_SPEED;
      if (keys.has('a') || keys.has('arrowleft')) dx -= MOVE_SPEED;
      if (keys.has('d') || keys.has('arrowright')) dx += MOVE_SPEED;

      // Normalize diagonal movement
      if (dx !== 0 && dy !== 0) {
        const factor = 1 / Math.sqrt(2);
        dx *= factor;
        dy *= factor;
      }

      const newX = Math.max(20, Math.min(MAP_WIDTH - 20, user.x + dx));
      const newY = Math.max(20, Math.min(MAP_HEIGHT - 20, user.y + dy));

      if (newX !== user.x || newY !== user.y) {
        state.updateCurrentUser({ x: newX, y: newY });

        // Throttle socket emissions to ~20/sec
        const now = Date.now();
        if (now - lastMoveEmitRef.current >= 50) {
          lastMoveEmitRef.current = now;
          const sock = getSocket();
          sock.emit('move', { x: Math.round(newX), y: Math.round(newY) });
        }
      }

      animFrameRef.current = requestAnimationFrame(moveLoop);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    animFrameRef.current = requestAnimationFrame(moveLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Click to move (smooth)
  const handleMapClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!currentUser || !mapRef.current) return;
      const rect = mapRef.current.getBoundingClientRect();
      const x = Math.max(20, Math.min(MAP_WIDTH - 20, (e.clientX - rect.left) / mapScale));
      const y = Math.max(20, Math.min(MAP_HEIGHT - 20, (e.clientY - rect.top) / mapScale));

      updateCurrentUser({ x, y });
      const sock = getSocket();
      sock.emit('move', { x: Math.round(x), y: Math.round(y) });
    },
    [currentUser, updateCurrentUser, mapScale]
  );

  // Avatar update
  const updateAvatarConfig = (newAvatar: string, newColor: string) => {
    setMyAvatar(newAvatar);
    setMyColor(newColor);
    const sock = getSocket();
    sock.emit('update-user', { avatarType: newAvatar, color: newColor });
    updateCurrentUser({ avatarType: newAvatar, color: newColor });
  };

  // Status change
  const handleStatusChange = (status: 'online' | 'away' | 'busy' | 'offline') => {
    setMyStatus(status);
    const sock = getSocket();
    sock.emit('update-user', { status });
    updateCurrentUser({ status });
  };

  // Mic toggle
  const handleToggleMute = useCallback(() => {
    const newMuted = !audio.isMuted;
    setMuted(newMuted);
    if (localStream) {
      localStream.getAudioTracks().forEach((track: MediaStreamTrack) => {
        track.enabled = !newMuted;
      });
    }
  }, [audio.isMuted, setMuted, localStream]);

  // Handle start audio
  const handleStartAudio = useCallback(async () => {
    await startAudio();
    setMuted(false);
  }, [startAudio, setMuted]);

  const handleLeave = () => {
    stopAudio();
    window.location.reload();
  };

  const otherUsers = Array.from(users.values()).filter(
    (u) => u.id !== currentUser?.id
  );

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
  };

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-slate-50 overflow-hidden flex">
      {/* Main area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-14 bg-white/90 backdrop-blur-md shadow-sm z-20 flex items-center justify-between px-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow">
              <span className="text-base">🏢</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-800">Virtual Office</h1>
              <p className="text-[10px] text-slate-400">{users.size}人 オンライン</p>
            </div>

            {/* Status selector */}
            <select
              value={myStatus}
              onChange={(e) => handleStatusChange(e.target.value as typeof myStatus)}
              className="ml-2 text-xs bg-white border border-slate-200 rounded-lg pl-6 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer text-slate-600"
            >
              {Object.entries(statusInfo).map(([key, { label, icon }]) => (
                <option key={key} value={key}>{icon} {label}</option>
              ))}
            </select>

            {/* Room indicator */}
            {currentRoom && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-700">
                <span>{roomIcons[rooms.find(r => r.id === currentRoom)?.type || 'open']}</span>
                {rooms.find(r => r.id === currentRoom)?.name}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Lightweight mode toggle */}
            <button
              onClick={() => setLightweightMode(!lightweightMode)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition ${
                lightweightMode
                  ? 'bg-amber-50 border-amber-300 text-amber-700'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
              title="軽量モード"
            >
              ⚡ {lightweightMode ? '軽量' : '通常'}
            </button>

            {/* Avatar change */}
            <button
              onClick={() => setShowAvatarCustomizer(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition text-xs font-medium"
            >
              ✨ アバター
            </button>

            {/* User info */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-sm"
                style={{ backgroundColor: myColor }}
              >
                {avatarTypes[myAvatar]?.emoji || '🐱'}
              </div>
              <span className="text-xs font-medium text-slate-700">{guestName}</span>
            </div>

            {/* Sidebar toggle */}
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition text-slate-500"
              title="メンバーリスト"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </button>

            <button
              onClick={handleLeave}
              className="px-3 py-1.5 text-xs text-slate-500 hover:text-white hover:bg-red-500 rounded-lg transition border border-slate-200 hover:border-red-500"
            >
              退出
            </button>
          </div>
        </header>

        {/* Map area */}
        <div className="flex-1 flex items-center justify-center p-4 relative">
          <div
            ref={mapRef}
            onClick={handleMapClick}
            className="relative bg-white rounded-2xl shadow-xl overflow-hidden cursor-crosshair border border-slate-200"
            style={{
              width: MAP_WIDTH,
              height: MAP_HEIGHT,
              transform: `scale(${mapScale})`,
              transformOrigin: 'center center',
            }}
          >
            {/* Floor grid */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)
                `,
                backgroundSize: '25px 25px',
              }}
            />

            {/* Rooms */}
            {rooms.map((room) => {
              const isUserInThisRoom = currentRoom === room.id;
              const occupantCount = room.occupants.length;
              return (
                <div
                  key={room.id}
                  className={`absolute rounded-xl border-2 transition-all ${
                    isUserInThisRoom ? 'border-indigo-400 shadow-lg shadow-indigo-100' : 'border-slate-200'
                  } ${room.locked ? 'opacity-90' : ''}`}
                  style={{
                    left: room.x,
                    top: room.y,
                    width: room.width,
                    height: room.height,
                    backgroundColor: room.color,
                  }}
                >
                  {/* Room interior */}
                  <div className="absolute inset-2 rounded-lg border border-white/40" />

                  {/* Room label */}
                  <div className="absolute top-2 left-3 flex items-center gap-1.5">
                    <span className="text-lg">{roomIcons[room.type]}</span>
                    <span className="text-xs font-semibold text-slate-700">{room.name}</span>
                    {room.locked && <span className="text-xs">🔒</span>}
                  </div>

                  {/* Occupant count */}
                  {occupantCount > 0 && (
                    <div className="absolute bottom-2 right-3 flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded-full">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      <span className="text-[10px] text-slate-600 font-medium">{occupantCount}人</span>
                    </div>
                  )}

                  {/* Lounge decoration */}
                  {room.type === 'lounge' && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
                      <div className="w-10 h-5 bg-rose-300/60 rounded-lg" />
                      <div className="w-10 h-5 bg-rose-300/60 rounded-lg" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Desks */}
            {desks.map((desk, i) => (
              <div key={`desk-${i}`} className="absolute" style={{ left: desk.x - 40, top: desk.y - 25 }}>
                <div className="w-20 h-14 bg-amber-50 rounded-lg border border-amber-200/60 shadow-sm flex items-center justify-center">
                  <div className="w-7 h-5 bg-slate-700 rounded-sm">
                    <div className="w-5 h-3 bg-blue-400 rounded-sm m-0.5" />
                  </div>
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-7 h-7 bg-slate-500 rounded-full border border-slate-400 shadow-sm" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full shadow text-[8px] flex items-center justify-center text-slate-400 font-medium">
                  {i + 1}
                </div>
              </div>
            ))}

            {/* Decorations */}
            {decorations.map((deco, i) => (
              <div
                key={`deco-${i}`}
                className="absolute text-xl pointer-events-none"
                style={{ left: deco.x, top: deco.y }}
              >
                {deco.emoji}
              </div>
            ))}

            {/* Other users */}
            {otherUsers.map((user) => (
              <div
                key={user.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedUser(user);
                }}
              >
                <Avatar
                  user={user}
                  isSpeaking={audio.speakingUsers.has(user.id)}
                  lightweightMode={lightweightMode}
                />
              </div>
            ))}

            {/* Current user avatar */}
            {currentUser && (
              <Avatar
                user={currentUser}
                isCurrentUser
                isSpeaking={audio.isSpeaking}
                lightweightMode={lightweightMode}
              />
            )}

            {/* Proximity range indicator (subtle circle around current user) */}
            {currentUser && !lightweightMode && (
              <div
                className="absolute rounded-full border border-dashed border-slate-200 pointer-events-none"
                style={{
                  left: currentUser.x - 150,
                  top: currentUser.y - 150,
                  width: 300,
                  height: 300,
                  transition: 'left 0.15s ease-out, top 0.15s ease-out',
                  opacity: 0.4,
                }}
              />
            )}
          </div>

          {/* Controls hint */}
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl shadow-md px-4 py-3 border border-slate-200">
            <ul className="text-[11px] text-slate-500 space-y-1">
              <li>🖱️ クリックで移動</li>
              <li>⌨️ WASD / 矢印キー</li>
              <li>💬 近接チャット (200px)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <Sidebar
        users={users}
        currentUser={currentUser}
        rooms={rooms}
        speakingUsers={audio.speakingUsers}
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        onUserClick={handleUserClick}
      />

      {/* Chat */}
      <ChatBox />

      {/* Mic Controls */}
      <MicControls
        isMuted={audio.isMuted}
        isAudioActive={isAudioActive}
        audioLevel={audio.audioLevel}
        connectedPeers={connectedPeers.size}
        onToggleMute={handleToggleMute}
        onStartAudio={handleStartAudio}
      />

      {/* Avatar Customizer Modal */}
      {showAvatarCustomizer && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white px-6 py-4">
              <h2 className="text-lg font-bold">アバターをカスタマイズ</h2>
            </div>

            <div className="p-6">
              {/* Preview */}
              <div className="flex justify-center mb-6">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-lg ring-4 ring-white"
                  style={{ backgroundColor: myColor }}
                >
                  {avatarTypes[myAvatar]?.emoji || '🐱'}
                </div>
              </div>

              {/* Character selection */}
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-slate-600 mb-2">キャラクター</h3>
                <div className="grid grid-cols-6 gap-1.5">
                  {Object.entries(avatarTypes).map(([key, { emoji, name }]) => (
                    <button
                      key={key}
                      onClick={() => setMyAvatar(key)}
                      className={`flex flex-col items-center p-1.5 rounded-lg transition ${
                        myAvatar === key ? 'bg-violet-100 ring-2 ring-violet-500' : 'hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xl">{emoji}</span>
                      <span className="text-[9px] text-slate-500">{name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color selection */}
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-slate-600 mb-2">カラー</h3>
                <div className="flex gap-2 flex-wrap">
                  {avatarColors.map(({ id, color }) => (
                    <button
                      key={id}
                      onClick={() => setMyColor(color)}
                      className={`w-8 h-8 rounded-full transition ${
                        myColor === color ? 'ring-2 ring-violet-500 ring-offset-2 scale-110' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 flex gap-2">
              <button
                onClick={() => setShowAvatarCustomizer(false)}
                className="flex-1 py-2.5 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-100 transition text-sm"
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  updateAvatarConfig(myAvatar, myColor);
                  setShowAvatarCustomizer(false);
                }}
                className="flex-1 py-2.5 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition text-sm font-medium"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User selection menu */}
      {selectedUser && !showVideoCall && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-40">
          <div className="bg-white rounded-2xl p-5 max-w-xs w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow"
                style={{ backgroundColor: selectedUser.color }}
              >
                {avatarTypes[selectedUser.avatarType as keyof typeof avatarTypes]?.emoji || '🐱'}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">{selectedUser.name}</h3>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${statusInfo[selectedUser.status || 'online'].color}`} />
                  {statusInfo[selectedUser.status || 'online'].label}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setShowVideoCall(true)}
                className="w-full py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition flex items-center justify-center gap-2"
              >
                📹 ビデオ通話
              </button>
              <button
                onClick={() => setSelectedUser(null)}
                className="w-full py-2 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video call */}
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
