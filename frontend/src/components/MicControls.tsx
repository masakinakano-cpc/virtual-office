'use client';

import { useEffect, useState } from 'react';

interface MicControlsProps {
  isMuted: boolean;
  isAudioActive: boolean;
  audioLevel: number;
  connectedPeers: number;
  onToggleMute: () => void;
  onStartAudio: () => void;
}

const MicControls = ({
  isMuted,
  isAudioActive,
  audioLevel,
  connectedPeers,
  onToggleMute,
  onStartAudio,
}: MicControlsProps) => {
  const [showPushToTalkHint, setShowPushToTalkHint] = useState(true);

  // Hide push-to-talk hint after 5 seconds
  useEffect(() => {
    if (!isMuted) {
      setShowPushToTalkHint(false);
    } else {
      const timer = setTimeout(() => {
        setShowPushToTalkHint(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isMuted]);

  // Get status text
  const getStatusText = () => {
    if (!isAudioActive) {
      return '接続中...';
    }
    return isMuted ? 'ミュート中' : 'マイクON';
  };

  // Get audio level bar width
  const getAudioLevelWidth = () => {
    if (isMuted || !isAudioActive) return 0;
    return Math.min(audioLevel * 100, 100);
  };

  // Get audio level color gradient
  const getAudioLevelColor = () => {
    const level = audioLevel;
    if (level < 0.3) {
      return 'bg-gradient-to-r from-green-400 to-green-500';
    } else if (level < 0.7) {
      return 'bg-gradient-to-r from-green-400 via-yellow-400 to-yellow-500';
    } else {
      return 'bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500';
    }
  };

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
      {/* Main Controls Container */}
      <div className="flex flex-col items-center gap-3">
        {/* Push-to-Talk Hint */}
        {isMuted && showPushToTalkHint && (
          <div className="px-3 py-1.5 bg-gray-800/80 backdrop-blur-md text-white text-xs rounded-full animate-fade-in">
            Space キーで話す
          </div>
        )}

        {/* Controls Bar */}
        <div className="flex items-center gap-4 px-6 py-4 bg-white/80 backdrop-blur-lg rounded-full shadow-2xl">
          {/* Mic Button */}
          <button
            onClick={isAudioActive ? onToggleMute : onStartAudio}
            className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 ${
              isMuted
                ? 'bg-red-500 hover:bg-red-600'
                : isAudioActive
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-gray-400 hover:bg-gray-500'
            } ${
              !isMuted && isAudioActive && audioLevel > 0.1
                ? 'animate-pulse-subtle'
                : ''
            }`}
            aria-label={isMuted ? 'マイクをオン' : 'マイクをミュート'}
          >
            {isMuted ? (
              // Muted Icon
              <svg
                className="w-6 h-6 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              // Active Mic Icon
              <svg
                className="w-6 h-6 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                  clipRule="evenodd"
                />
              </svg>
            )}

            {/* Speaking Ring Animation */}
            {!isMuted && isAudioActive && audioLevel > 0.1 && (
              <div className="absolute inset-0 rounded-full border-4 border-white animate-ping opacity-75" />
            )}
          </button>

          {/* Audio Level & Status Container */}
          <div className="flex flex-col gap-2 min-w-[200px]">
            {/* Status Text */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {getStatusText()}
              </span>
              {isAudioActive && connectedPeers > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                  <span>{connectedPeers}</span>
                </div>
              )}
            </div>

            {/* Audio Level Bar */}
            <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-100 ${getAudioLevelColor()}`}
                style={{ width: `${getAudioLevelWidth()}%` }}
              >
                <div className="absolute inset-0 bg-white/30 animate-shimmer" />
              </div>
            </div>
          </div>

          {/* Connection Status Indicator */}
          <div
            className={`w-3 h-3 rounded-full transition-colors ${
              isAudioActive
                ? 'bg-green-500 animate-pulse-slow'
                : 'bg-gray-400 animate-pulse'
            }`}
            title={isAudioActive ? '接続済み' : '接続中...'}
          />
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse-subtle {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(34, 197, 94, 0);
          }
        }

        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-pulse-subtle {
          animation: pulse-subtle 2s infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default MicControls;
