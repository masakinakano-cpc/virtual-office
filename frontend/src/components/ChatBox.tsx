'use client';

import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { getSocket } from '@/lib/socket';

export default function ChatBox() {
  const [input, setInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messages = useStore((state) => state.messages);
  const currentUser = useStore((state) => state.currentUser);
  const currentRoom = useStore((state) => state.currentRoom);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);

  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setUnreadCount(0);
    } else if (messages.length > prevMessageCountRef.current) {
      setUnreadCount((c) => c + (messages.length - prevMessageCountRef.current));
    }
    prevMessageCountRef.current = messages.length;
  }, [messages, isMinimized]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const socket = getSocket();
    socket.emit('chat-message', input);
    setInput('');
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className={`absolute bottom-16 left-4 z-30 transition-all ${
        isMinimized ? 'w-48' : 'w-80'
      }`}
    >
      {/* Header */}
      <button
        onClick={() => setIsMinimized(!isMinimized)}
        className="w-full flex items-center justify-between bg-slate-800 text-white px-4 py-2 rounded-t-xl hover:bg-slate-700 transition"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            💬 {currentRoom ? 'ルームチャット' : 'Near Chat'}
          </span>
          {unreadCount > 0 && isMinimized && (
            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        <span className="text-xs">{isMinimized ? '▲' : '▼'}</span>
      </button>

      {!isMinimized && (
        <>
          {/* Scope indicator */}
          <div className="bg-slate-100 px-3 py-1.5 text-[10px] text-slate-500 border-x border-slate-200">
            {currentRoom ? '🏠 同じ部屋のメンバーに送信' : '📡 200px以内のユーザーに送信'}
          </div>

          {/* Messages */}
          <div className="h-44 overflow-y-auto p-3 space-y-1.5 bg-white border-x border-slate-200">
            {messages.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-6">
                メッセージはまだありません
              </p>
            ) : (
              messages.map((msg, index) => {
                if (msg.type === 'system' || msg.userId === 'system') {
                  return (
                    <div key={`${msg.timestamp}-${index}`} className="text-center">
                      <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                        {msg.message}
                      </span>
                    </div>
                  );
                }

                const isMe = msg.userId === currentUser?.id;
                return (
                  <div
                    key={`${msg.timestamp}-${index}`}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-1.5 ${
                        isMe
                          ? 'bg-indigo-500 text-white'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {!isMe && (
                        <p className="text-[10px] font-semibold text-indigo-500 mb-0.5">
                          {msg.userName}
                        </p>
                      )}
                      <p className="text-sm break-words leading-snug">{msg.message}</p>
                    </div>
                    <span className="text-[9px] text-slate-400 mt-0.5 px-1">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="bg-white border border-slate-200 rounded-b-xl p-2">
            <div className="flex gap-1.5">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="メッセージを入力..."
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-500 text-white text-sm font-medium rounded-lg hover:bg-indigo-600 transition"
              >
                送信
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
