'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Peer from 'simple-peer';
import { getSocket } from '@/lib/socket';
import { useStore, User } from '@/store/useStore';

interface VideoCallProps {
  targetUser: User | null;
  onClose: () => void;
}

export default function VideoCall({ targetUser, onClose }: VideoCallProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'receiving' | 'connected'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{ from: string; signal: unknown; callerName: string } | null>(null);

  const myVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<Peer.Instance | null>(null);
  const currentUser = useStore((state) => state.currentUser);

  // メディアストリームを取得
  const getMediaStream = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(mediaStream);
      if (myVideoRef.current) {
        myVideoRef.current.srcObject = mediaStream;
      }
      return mediaStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      // カメラがない場合は音声のみ
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true,
        });
        setStream(audioStream);
        return audioStream;
      } catch (audioError) {
        console.error('Error accessing audio:', audioError);
        return null;
      }
    }
  }, []);

  // 画面共有を開始
  const startScreenShare = useCallback(async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: true,
      });

      setScreenStream(displayStream);
      setIsScreenSharing(true);

      // 画面共有が終了したときの処理
      displayStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

      // Peerに画面共有ストリームを追加
      if (peerRef.current && stream) {
        const videoTrack = displayStream.getVideoTracks()[0];
        const sender = peerRef.current._pc?.getSenders().find(
          (s: RTCRtpSender) => s.track?.kind === 'video'
        );
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      }

      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = displayStream;
      }
    } catch (error) {
      console.error('Error starting screen share:', error);
    }
  }, [stream]);

  // 画面共有を停止
  const stopScreenShare = useCallback(() => {
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
      setScreenStream(null);
    }
    setIsScreenSharing(false);

    // 元のカメラ映像に戻す
    if (peerRef.current && stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const sender = peerRef.current._pc?.getSenders().find(
          (s: RTCRtpSender) => s.track?.kind === 'video'
        );
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      }
    }
  }, [screenStream, stream]);

  // 画面共有切り替え
  const toggleScreenShare = () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  };

  // 通話を開始
  const startCall = useCallback(async () => {
    if (!targetUser) return;

    const mediaStream = await getMediaStream();
    if (!mediaStream) return;

    setCallStatus('calling');

    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: mediaStream,
    });

    peer.on('signal', (signal) => {
      const socket = getSocket();
      socket.emit('call-user', {
        to: targetUser.id,
        signal,
      });
    });

    peer.on('stream', (remoteMediaStream) => {
      setRemoteStream(remoteMediaStream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteMediaStream;
      }
      setCallStatus('connected');
    });

    peer.on('close', () => {
      handleEndCall();
    });

    peer.on('error', (err) => {
      console.error('Peer error:', err);
      handleEndCall();
    });

    peerRef.current = peer;
  }, [targetUser, getMediaStream]);

  // 通話に応答
  const answerCall = useCallback(async () => {
    if (!incomingCall) return;

    const mediaStream = await getMediaStream();
    if (!mediaStream) return;

    setCallStatus('connected');

    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: mediaStream,
    });

    peer.on('signal', (signal) => {
      const socket = getSocket();
      socket.emit('answer-call', {
        to: incomingCall.from,
        signal,
      });
    });

    peer.on('stream', (remoteMediaStream) => {
      setRemoteStream(remoteMediaStream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteMediaStream;
      }
    });

    peer.on('close', () => {
      handleEndCall();
    });

    peer.on('error', (err) => {
      console.error('Peer error:', err);
      handleEndCall();
    });

    peer.signal(incomingCall.signal as Peer.SignalData);
    peerRef.current = peer;
    setIncomingCall(null);
  }, [incomingCall, getMediaStream]);

  // 通話を終了
  const handleEndCall = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
    }
    if (peerRef.current) {
      peerRef.current.destroy();
    }

    const socket = getSocket();
    if (targetUser) {
      socket.emit('end-call', { to: targetUser.id });
    }
    if (incomingCall) {
      socket.emit('end-call', { to: incomingCall.from });
    }

    setStream(null);
    setScreenStream(null);
    setRemoteStream(null);
    setCallStatus('idle');
    setIncomingCall(null);
    setIsScreenSharing(false);
    peerRef.current = null;
    onClose();
  }, [stream, screenStream, targetUser, incomingCall, onClose]);

  // Socketイベントを監視
  useEffect(() => {
    const socket = getSocket();

    socket.on('incoming-call', (data) => {
      setIncomingCall(data);
      setCallStatus('receiving');
    });

    socket.on('call-accepted', (data) => {
      if (peerRef.current) {
        peerRef.current.signal(data.signal);
      }
    });

    socket.on('call-ended', () => {
      handleEndCall();
    });

    return () => {
      socket.off('incoming-call');
      socket.off('call-accepted');
      socket.off('call-ended');
    };
  }, [handleEndCall]);

  // ミュート切り替え
  const toggleMute = () => {
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  // ビデオ切り替え
  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach((track) => {
        track.enabled = isVideoOff;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  // 通話拒否
  const rejectCall = () => {
    if (incomingCall) {
      const socket = getSocket();
      socket.emit('end-call', { to: incomingCall.from });
    }
    setIncomingCall(null);
    setCallStatus('idle');
    onClose();
  };

  // 着信表示
  if (callStatus === 'receiving' && incomingCall) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-4xl">📞</span>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">着信中</h2>
          <p className="text-gray-600 mb-6">{incomingCall.callerName} からの通話</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={rejectCall}
              className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition"
            >
              <span className="text-2xl">✕</span>
            </button>
            <button
              onClick={answerCall}
              className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white hover:bg-green-600 transition animate-bounce"
            >
              <span className="text-2xl">📞</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 通話画面
  if (!targetUser && callStatus === 'idle') return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col z-50">
      {/* ヘッダー */}
      <div className="p-4 flex justify-between items-center">
        <div className="text-white">
          <h2 className="font-semibold">{targetUser?.name || 'ビデオ通話'}</h2>
          <p className="text-sm text-gray-400">
            {callStatus === 'calling' && '発信中...'}
            {callStatus === 'connected' && (isScreenSharing ? '画面共有中' : '通話中')}
          </p>
        </div>
        {isScreenSharing && (
          <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            画面共有中
          </div>
        )}
      </div>

      {/* ビデオエリア */}
      <div className="flex-1 flex items-center justify-center gap-4 p-4">
        {/* リモートビデオ / 画面共有 */}
        <div className="relative w-full max-w-4xl aspect-video bg-gray-800 rounded-2xl overflow-hidden">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-5xl">👤</span>
                </div>
                <p className="text-gray-400">
                  {callStatus === 'calling' ? '接続中...' : 'カメラオフ'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 自分のビデオ（小さく表示） */}
        <div className="absolute bottom-24 right-8 w-48 aspect-video bg-gray-800 rounded-lg overflow-hidden shadow-lg border-2 border-gray-700">
          {isScreenSharing && screenStream ? (
            <video
              ref={screenVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : stream && !isVideoOff ? (
            <video
              ref={myVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-400 text-sm">カメラオフ</span>
            </div>
          )}
          {isScreenSharing && (
            <div className="absolute bottom-1 left-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded">
              画面共有中
            </div>
          )}
        </div>
      </div>

      {/* コントロールバー */}
      <div className="p-6 flex justify-center gap-4">
        {callStatus === 'idle' && targetUser && (
          <button
            onClick={startCall}
            className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white hover:bg-green-600 transition shadow-lg"
          >
            <span className="text-2xl">📞</span>
          </button>
        )}

        {(callStatus === 'calling' || callStatus === 'connected') && (
          <>
            <button
              onClick={toggleMute}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition shadow-lg ${
                isMuted ? 'bg-red-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
              title={isMuted ? 'ミュート解除' : 'ミュート'}
            >
              <span className="text-xl">{isMuted ? '🔇' : '🎤'}</span>
            </button>

            <button
              onClick={toggleVideo}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition shadow-lg ${
                isVideoOff ? 'bg-red-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
              title={isVideoOff ? 'カメラオン' : 'カメラオフ'}
            >
              <span className="text-xl">{isVideoOff ? '📷' : '🎥'}</span>
            </button>

            <button
              onClick={toggleScreenShare}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition shadow-lg ${
                isScreenSharing ? 'bg-blue-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
              title={isScreenSharing ? '画面共有を停止' : '画面共有'}
            >
              <span className="text-xl">🖥️</span>
            </button>

            <button
              onClick={handleEndCall}
              className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition shadow-lg"
              title="通話終了"
            >
              <span className="text-2xl">✕</span>
            </button>
          </>
        )}

        {callStatus === 'idle' && (
          <button
            onClick={onClose}
            className="w-14 h-14 bg-gray-700 rounded-full flex items-center justify-center text-white hover:bg-gray-600 transition shadow-lg"
          >
            <span className="text-xl">✕</span>
          </button>
        )}
      </div>

      {/* 操作説明 */}
      <div className="absolute bottom-4 left-4 text-gray-500 text-xs">
        <p>🖥️ 画面共有ボタンで画面を共有できます</p>
      </div>
    </div>
  );
}
