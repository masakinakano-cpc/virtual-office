'use client';

import dynamic from 'next/dynamic';
import { AuthProvider, useAuth } from '@/components/AuthProvider';
import LoginPage from '@/components/LoginPage';

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

function AppContent() {
  const { user, profile, loading } = useAuth();

  // デバッグ用
  console.log('AppContent state:', { user: !!user, profile: !!profile, loading });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
        <div className="text-center">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-4xl">🏢</span>
          </div>
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <OfficeMap />;
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
