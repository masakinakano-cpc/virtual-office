'use client';

import { useState, useMemo } from 'react';
import { User, Room } from '@/store/useStore';
import { avatarTypes } from '@/lib/avatars';

interface SidebarProps {
  users: Map<string, User>;
  currentUser: User | null;
  rooms: Room[];
  speakingUsers: Set<string>;
  isOpen: boolean;
  onToggle: () => void;
  onUserClick: (user: User) => void;
}

const Sidebar = ({
  users,
  currentUser,
  rooms,
  speakingUsers,
  isOpen,
  onToggle,
  onUserClick,
}: SidebarProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    const userArray = Array.from(users.values());
    if (!searchQuery.trim()) return userArray;

    const query = searchQuery.toLowerCase();
    return userArray.filter(user =>
      user.name.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  // Group users by room or open area
  const groupedUsers = useMemo(() => {
    const roomGroups: Record<string, User[]> = {};
    const openAreaUsers: User[] = [];

    filteredUsers.forEach(user => {
      if (user.currentRoom) {
        if (!roomGroups[user.currentRoom]) {
          roomGroups[user.currentRoom] = [];
        }
        roomGroups[user.currentRoom].push(user);
      } else {
        openAreaUsers.push(user);
      }
    });

    return { roomGroups, openAreaUsers };
  }, [filteredUsers]);

  // Count online users
  const onlineCount = useMemo(() => {
    return Array.from(users.values()).filter(
      user => user.status === 'online'
    ).length;
  }, [users]);

  // Get status color
  const getStatusColor = (status: User['status']) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'busy':
        return 'bg-red-500';
      case 'offline':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  // Get room icon
  const getRoomIcon = (roomType: Room['type']) => {
    switch (roomType) {
      case 'meeting':
        return '💼';
      case 'lounge':
        return '☕';
      case 'focus':
        return '🎧';
      case 'open':
        return '🌐';
      default:
        return '🌐';
    }
  };

  // Get room name
  const getRoomName = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    return room ? room.name : roomId;
  };

  // Get room type
  const getRoomType = (roomId: string): Room['type'] => {
    const room = rooms.find(r => r.id === roomId);
    return room?.type || 'open';
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 h-full w-80 bg-white/80 backdrop-blur-lg shadow-2xl z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200/50">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-800">メンバー</h2>
            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
              {onlineCount}
            </span>
          </div>
          <button
            onClick={onToggle}
            className="p-2 hover:bg-gray-200/50 rounded-lg transition-colors"
            aria-label="サイドバーを閉じる"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Search/Filter Input */}
        <div className="p-4 border-b border-gray-200/50">
          <div className="relative">
            <input
              type="text"
              placeholder="メンバーを検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 bg-white/50 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Users in Rooms */}
          {Object.entries(groupedUsers.roomGroups).map(([roomId, roomUsers]) => (
            <div key={roomId} className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <span>{getRoomIcon(getRoomType(roomId))}</span>
                <span>{getRoomName(roomId)}</span>
                <span className="text-xs text-gray-400">({roomUsers.length})</span>
              </div>
              <div className="space-y-1">
                {roomUsers.map(user => (
                  <UserRow
                    key={user.id}
                    user={user}
                    isSpeaking={speakingUsers.has(user.id)}
                    isCurrentUser={currentUser?.id === user.id}
                    getStatusColor={getStatusColor}
                    onClick={() => onUserClick(user)}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Users in Open Area */}
          {groupedUsers.openAreaUsers.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <span>🌐</span>
                <span>オープンエリア</span>
                <span className="text-xs text-gray-400">
                  ({groupedUsers.openAreaUsers.length})
                </span>
              </div>
              <div className="space-y-1">
                {groupedUsers.openAreaUsers.map(user => (
                  <UserRow
                    key={user.id}
                    user={user}
                    isSpeaking={speakingUsers.has(user.id)}
                    isCurrentUser={currentUser?.id === user.id}
                    getStatusColor={getStatusColor}
                    onClick={() => onUserClick(user)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <p>メンバーが見つかりません</p>
            </div>
          )}
        </div>
      </div>

      {/* Toggle Button (when closed) */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed right-4 top-4 z-40 p-3 bg-white/80 backdrop-blur-lg hover:bg-white/90 rounded-full shadow-lg transition-all"
          aria-label="サイドバーを開く"
        >
          <svg
            className="w-6 h-6 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      )}
    </>
  );
};

// User Row Component
interface UserRowProps {
  user: User;
  isSpeaking: boolean;
  isCurrentUser: boolean;
  getStatusColor: (status: User['status']) => string;
  onClick: () => void;
}

const UserRow = ({
  user,
  isSpeaking,
  isCurrentUser,
  getStatusColor,
  onClick,
}: UserRowProps) => {
  const avatarEmoji = avatarTypes[user.avatarType]?.emoji || '👤';

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all hover:bg-white/50 ${
        isCurrentUser ? 'bg-blue-50/50' : ''
      }`}
    >
      {/* Avatar with speaking indicator */}
      <div className="relative">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all ${
            isSpeaking
              ? 'ring-4 ring-green-400 ring-offset-2 animate-pulse'
              : 'ring-2 ring-gray-200'
          }`}
          style={{ backgroundColor: user.color }}
        >
          {avatarEmoji}
        </div>
        {/* Status dot */}
        <div
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(
            user.status
          )}`}
        />
      </div>

      {/* User info */}
      <div className="flex-1 text-left min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-800 truncate">
            {user.name}
            {isCurrentUser && (
              <span className="ml-1 text-xs text-gray-500">(あなた)</span>
            )}
          </p>
        </div>
        {user.currentRoom && (
          <p className="text-xs text-gray-500 truncate">{user.currentRoom}</p>
        )}
      </div>

      {/* Speaking indicator icon */}
      {isSpeaking && (
        <div className="flex-shrink-0">
          <svg
            className="w-4 h-4 text-green-500 animate-pulse"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </button>
  );
};

export default Sidebar;
