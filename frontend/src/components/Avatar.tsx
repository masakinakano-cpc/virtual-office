'use client';

import { useRef, useEffect } from 'react';
import { User } from '@/store/useStore';
import { avatarTypes } from '@/lib/avatars';

interface AvatarProps {
  user: User;
  isCurrentUser?: boolean;
  isSpeaking?: boolean;
  lightweightMode?: boolean;
}

const statusColors: Record<string, string> = {
  online: '#22c55e',
  away: '#eab308',
  busy: '#ef4444',
  offline: '#9ca3af',
};

const statusBgColors: Record<string, string> = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
  offline: 'bg-gray-400',
};

export default function Avatar({ user, isCurrentUser = false, isSpeaking = false, lightweightMode = false }: AvatarProps) {
  const avatarEmoji = avatarTypes[user.avatarType as keyof typeof avatarTypes]?.emoji || '🐱';
  const status = user.status || 'online';
  const hasCustomPhoto = user.avatarType === 'custom' && user.avatarUrl;
  const containerRef = useRef<HTMLDivElement>(null);

  // Smooth position interpolation via CSS transform
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.left = `${user.x}px`;
      containerRef.current.style.top = `${user.y}px`;
    }
  }, [user.x, user.y]);

  return (
    <div
      ref={containerRef}
      className="absolute flex flex-col items-center"
      style={{
        left: user.x,
        top: user.y,
        transform: 'translate(-50%, -50%)',
        zIndex: isCurrentUser ? 100 : 10,
        transition: lightweightMode ? 'none' : 'left 0.15s ease-out, top 0.15s ease-out',
        willChange: 'left, top',
      }}
    >
      {/* Speaking indicator ring */}
      {isSpeaking && !lightweightMode && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ top: '-4px', left: '-4px', right: '-4px' }}
        >
          <div
            className="w-[52px] h-[52px] rounded-full animate-pulse"
            style={{
              border: '3px solid #22c55e',
              boxShadow: '0 0 12px rgba(34, 197, 94, 0.5)',
            }}
          />
        </div>
      )}

      {/* Avatar body */}
      <div className="relative group">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-lg overflow-hidden ${
            isCurrentUser ? 'ring-3 ring-white/80' : ''
          }`}
          style={{
            backgroundColor: user.color,
            transition: 'transform 0.15s ease',
            boxShadow: isSpeaking
              ? `0 0 0 3px ${statusColors.online}, 0 4px 12px rgba(0,0,0,0.15)`
              : '0 4px 12px rgba(0,0,0,0.15)',
          }}
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

        {/* Status indicator */}
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${statusBgColors[status]}`}
        />
      </div>

      {/* Name label */}
      <div
        className={`mt-1 px-2 py-0.5 rounded-full text-[11px] font-medium shadow-sm whitespace-nowrap max-w-[80px] truncate ${
          isCurrentUser
            ? 'bg-indigo-600 text-white'
            : 'bg-white/90 text-gray-700 border border-gray-200/50'
        }`}
      >
        {user.name}
      </div>
    </div>
  );
}
