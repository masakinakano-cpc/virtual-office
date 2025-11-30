'use client';

import { useState, useRef, useEffect } from 'react';
import { useStore, ChatMessage } from '@/store/useStore';
import { getSocket } from '@/lib/socket';

export default function ChatBox() {
  const [input, setInput] = useState('');
  const messages = useStore((state) => state.messages);
  const currentUser = useStore((state) => state.currentUser);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    <div className="absolute bottom-4 left-4 w-80 bg-white bg-opacity-95 rounded-lg shadow-xl overflow-hidden">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2">
        <h3 className="font-semibold text-sm">Near Chat</h3>
        <p className="text-xs text-blue-100">150px以内のユーザーと会話</p>
      </div>

      {/* メッセージ一覧 */}
      <div className="h-48 overflow-y-auto p-3 space-y-2 bg-gray-50">
        {messages.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">
            近くのユーザーとチャットできます
          </p>
        ) : (
          messages.map((msg, index) => (
            <div
              key={`${msg.timestamp}-${index}`}
              className={`flex flex-col ${
                msg.userId === currentUser?.id ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-1.5 ${
                  msg.userId === currentUser?.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200'
                }`}
              >
                {msg.userId !== currentUser?.id && (
                  <p className="text-xs font-medium text-blue-600 mb-0.5">
                    {msg.userName}
                  </p>
                )}
                <p className="text-sm break-words">{msg.message}</p>
              </div>
              <span className="text-[10px] text-gray-400 mt-0.5 px-1">
                {formatTime(msg.timestamp)}
              </span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 入力欄 */}
      <form onSubmit={sendMessage} className="p-2 bg-white border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="メッセージを入力..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            送信
          </button>
        </div>
      </form>
    </div>
  );
}
