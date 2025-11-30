'use client';

import { useState } from 'react';
import { useAuth } from './AuthProvider';

type Status = 'online' | 'away' | 'busy' | 'offline';

const statusConfig: Record<Status, { label: string; color: string; icon: string }> = {
  online: { label: 'オンライン', color: 'bg-green-500', icon: '🟢' },
  away: { label: '離席中', color: 'bg-yellow-500', icon: '🟡' },
  busy: { label: '取り込み中', color: 'bg-red-500', icon: '🔴' },
  offline: { label: 'オフライン', color: 'bg-gray-400', icon: '⚫' },
};

export default function StatusSelector() {
  const { profile, updateProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const currentStatus = (profile?.status || 'online') as Status;

  const handleStatusChange = async (status: Status) => {
    await updateProfile({ status });
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow hover:shadow-md transition"
      >
        <span className={`w-3 h-3 rounded-full ${statusConfig[currentStatus].color}`}></span>
        <span className="text-sm font-medium text-gray-700">
          {statusConfig[currentStatus].label}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-20 min-w-[160px]">
            {(Object.keys(statusConfig) as Status[]).map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition ${
                  status === currentStatus ? 'bg-blue-50' : ''
                }`}
              >
                <span className={`w-3 h-3 rounded-full ${statusConfig[status].color}`}></span>
                <span className="text-sm text-gray-700">{statusConfig[status].label}</span>
                {status === currentStatus && (
                  <svg className="w-4 h-4 text-blue-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
