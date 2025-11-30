'use client';

import { User } from '@/store/useStore';
import { avatarTypes } from './AvatarCustomizer';

interface AvatarProps {
  user: User;
  isCurrentUser?: boolean;
}

const statusColors: Record<string, string> = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
  offline: 'bg-gray-400',
};

export default function Avatar({ user, isCurrentUser = false }: AvatarProps) {
  const avatarEmoji = avatarTypes[user.avatarType as keyof typeof avatarTypes]?.emoji || '🐱';
  const status = user.status || 'online';
  const hasCustomPhoto = user.avatarType === 'custom' && user.avatarUrl;

  return (
    <div
      className="absolute flex flex-col items-center transition-all duration-150 ease-out"
      style={{
        left: user.x,
        top: user.y,
        transform: 'translate(-50%, -50%)',
        zIndex: isCurrentUser ? 100 : 10,
      }}
    >
      {/* アバター本体 */}
      <div className="relative group">
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg transition-transform hover:scale-110 overflow-hidden ${
            isCurrentUser ? 'ring-4 ring-white ring-opacity-70' : ''
          }`}
          style={{ backgroundColor: user.color }}
        >
          {hasCustomPhoto ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          ) : (
            avatarEmoji
          )}
        </div>

        {/* ステータスインジケーター */}
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white ${statusColors[status]}`}
        ></div>

        {/* ホバー時のオーラエフェクト */}
        <div
          className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-30 transition-opacity"
          style={{
            background: `radial-gradient(circle, ${user.color} 0%, transparent 70%)`,
            transform: 'scale(1.5)',
          }}
        ></div>
      </div>

      {/* 名前 */}
      <div
        className={`mt-1.5 px-2.5 py-1 rounded-full text-xs font-medium shadow-md ${
          isCurrentUser
            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
            : 'bg-white text-gray-700 border border-gray-200'
        }`}
      >
        {user.name}
        {isCurrentUser && ' (You)'}
      </div>
    </div>
  );
}
