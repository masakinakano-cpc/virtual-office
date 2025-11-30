'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const OfficeMap = dynamic(() => import('@/components/OfficeMap'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Virtual Office を読み込み中...</p>
      </div>
    </div>
  ),
});

function GuestLoginPage({ onJoin }: { onJoin: (name: string) => void }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('名前を入力してください');
      return;
    }
    if (name.trim().length < 2) {
      setError('名前は2文字以上で入力してください');
      return;
    }
    onJoin(name.trim());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* ロゴ */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-3xl">🏢</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Virtual Office</h1>
          <p className="text-gray-500 text-sm mt-1">
            名前を入力してオフィスに参加
          </p>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              表示名
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="田中太郎"
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition"
          >
            オフィスに入る
          </button>
        </form>

        {/* 説明 */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>💡 他のユーザーに近づくと会話できます</p>
          <p className="mt-1">📞 クリックでビデオ通話が可能</p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [guestName, setGuestName] = useState<string | null>(null);

  if (!guestName) {
    return <GuestLoginPage onJoin={setGuestName} />;
  }

  return <OfficeMap guestName={guestName} />;
}
