import { useEffect, useRef, useCallback, useState } from 'react';
import { Socket } from 'socket.io-client';

interface UseProximityAudioOptions {
  socket: Socket;
  currentUser: { id: string; x: number; y: number; currentRoom?: string | null } | null;
  users: Map<string, { id: string; x: number; y: number; currentRoom?: string | null }>;
  isMuted: boolean;
  onSpeakingChange?: (userId: string, speaking: boolean) => void;
  onAudioLevelChange?: (level: number) => void;
}

interface UseProximityAudioReturn {
  startAudio: () => Promise<void>;
  stopAudio: () => void;
  isAudioActive: boolean;
  connectedPeers: Set<string>;
  localStream: MediaStream | null;
}

interface AudioPeersUpdate {
  connect: string[];
  disconnect: string[];
}

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];
const SPEAKING_THRESHOLD = 0.01;
const AUDIO_CHECK_INTERVAL = 100;
const MAX_DISTANCE = 300;
const MIN_DISTANCE = 50;

export default function useProximityAudio({
  socket,
  currentUser,
  users,
  isMuted,
  onSpeakingChange,
  onAudioLevelChange,
}: UseProximityAudioOptions): UseProximityAudioReturn {
  // State
  const [isAudioActive, setIsAudioActive] = useState(false);
  const [connectedPeers, setConnectedPeers] = useState<Set<string>>(new Set());

  // Refs for mutable state that shouldn't trigger re-renders
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const gainNodesRef = useRef<Map<string, GainNode>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const speakingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const spatializationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpeakingStateRef = useRef<boolean>(false);

  /**
   * Calculate distance between two users
   */
  const calculateDistance = useCallback(
    (userId: string): number => {
      if (!currentUser) return Infinity;
      const otherUser = users.get(userId);
      if (!otherUser) return Infinity;

      const dx = currentUser.x - otherUser.x;
      const dy = currentUser.y - otherUser.y;
      return Math.sqrt(dx * dx + dy * dy);
    },
    [currentUser, users]
  );

  /**
   * Calculate gain based on distance and room status
   */
  const calculateGain = useCallback(
    (userId: string): number => {
      if (!currentUser) return 0;
      const otherUser = users.get(userId);
      if (!otherUser) return 0;

      // If users are in the same room, full volume (no distance attenuation)
      if (
        currentUser.currentRoom &&
        otherUser.currentRoom &&
        currentUser.currentRoom === otherUser.currentRoom
      ) {
        return 1.0;
      }

      const distance = calculateDistance(userId);

      // Distance-based volume curve
      if (distance <= MIN_DISTANCE) {
        return 1.0; // Full volume within 50px
      } else if (distance >= MAX_DISTANCE) {
        return 0.0; // Silent beyond 300px
      } else {
        // Linear fade from 1.0 to 0.0 between 50px and 300px
        return 1.0 - (distance - MIN_DISTANCE) / (MAX_DISTANCE - MIN_DISTANCE);
      }
    },
    [currentUser, users, calculateDistance]
  );

  /**
   * Update gain for all connected peers
   */
  const updateSpatialAudio = useCallback(() => {
    gainNodesRef.current.forEach((gainNode, userId) => {
      const newGain = calculateGain(userId);
      // Smooth transition using setTargetAtTime
      gainNode.gain.setTargetAtTime(newGain, audioContextRef.current?.currentTime ?? 0, 0.1);
    });
  }, [calculateGain]);

  /**
   * Detect speaking from local stream
   */
  const checkSpeaking = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average amplitude
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    const normalizedLevel = average / 255;

    // Emit audio level
    if (onAudioLevelChange) {
      onAudioLevelChange(normalizedLevel);
    }

    // Check if speaking
    const isSpeaking = normalizedLevel > SPEAKING_THRESHOLD;

    // Only emit when state changes (debouncing)
    if (isSpeaking !== lastSpeakingStateRef.current) {
      lastSpeakingStateRef.current = isSpeaking;
      socket.emit('user-speaking', { speaking: isSpeaking });
      if (onSpeakingChange && currentUser) {
        onSpeakingChange(currentUser.id, isSpeaking);
      }
    }
  }, [socket, currentUser, onSpeakingChange, onAudioLevelChange]);

  /**
   * Create a peer connection
   */
  const createPeerConnection = useCallback(
    (userId: string): RTCPeerConnection => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      // Add local stream tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('audio-ice-candidate', {
            to: userId,
            candidate: event.candidate,
          });
        }
      };

      // Handle remote stream
      pc.ontrack = (event) => {
        const remoteStream = event.streams[0];
        remoteStreamsRef.current.set(userId, remoteStream);

        // Set up Web Audio API for spatialization
        if (audioContextRef.current) {
          const source = audioContextRef.current.createMediaStreamSource(remoteStream);
          const gainNode = audioContextRef.current.createGain();
          gainNodesRef.current.set(userId, gainNode);

          source.connect(gainNode);
          gainNode.connect(audioContextRef.current.destination);

          // Set initial gain
          const initialGain = calculateGain(userId);
          gainNode.gain.setValueAtTime(initialGain, audioContextRef.current.currentTime);
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          cleanupPeerConnection(userId);
        }
      };

      return pc;
    },
    [socket, calculateGain]
  );

  /**
   * Clean up a peer connection
   */
  const cleanupPeerConnection = useCallback((userId: string) => {
    // Close peer connection
    const pc = peerConnectionsRef.current.get(userId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(userId);
    }

    // Clean up audio nodes
    const gainNode = gainNodesRef.current.get(userId);
    if (gainNode) {
      gainNode.disconnect();
      gainNodesRef.current.delete(userId);
    }

    // Clean up remote stream
    const stream = remoteStreamsRef.current.get(userId);
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      remoteStreamsRef.current.delete(userId);
    }

    // Update connected peers state
    setConnectedPeers((prev) => {
      const newSet = new Set(prev);
      newSet.delete(userId);
      return newSet;
    });
  }, []);

  /**
   * Handle audio-peers-update event
   */
  const handleAudioPeersUpdate = useCallback(
    async ({ connect, disconnect }: AudioPeersUpdate) => {
      if (!currentUser) return;

      // Disconnect peers
      for (const userId of disconnect) {
        cleanupPeerConnection(userId);
      }

      // Connect new peers
      for (const userId of connect) {
        if (peerConnectionsRef.current.has(userId)) continue;

        const pc = createPeerConnection(userId);
        peerConnectionsRef.current.set(userId, pc);

        // Determine who initiates the offer (lexicographically smaller ID)
        const shouldOffer = currentUser.id < userId;

        if (shouldOffer) {
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('audio-offer', { to: userId, offer });
          } catch (error) {
            console.error(`Failed to create offer for ${userId}:`, error);
            cleanupPeerConnection(userId);
          }
        }

        // Update connected peers state
        setConnectedPeers((prev) => new Set(prev).add(userId));
      }
    },
    [currentUser, socket, createPeerConnection, cleanupPeerConnection]
  );

  /**
   * Handle audio-offer event
   */
  const handleAudioOffer = useCallback(
    async ({ from, offer }: { from: string; offer: RTCSessionDescriptionInit }) => {
      let pc = peerConnectionsRef.current.get(from);

      if (!pc) {
        pc = createPeerConnection(from);
        peerConnectionsRef.current.set(from, pc);
        setConnectedPeers((prev) => new Set(prev).add(from));
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('audio-answer', { to: from, answer });
      } catch (error) {
        console.error(`Failed to handle offer from ${from}:`, error);
        cleanupPeerConnection(from);
      }
    },
    [socket, createPeerConnection, cleanupPeerConnection]
  );

  /**
   * Handle audio-answer event
   */
  const handleAudioAnswer = useCallback(
    async ({ from, answer }: { from: string; answer: RTCSessionDescriptionInit }) => {
      const pc = peerConnectionsRef.current.get(from);
      if (!pc) return;

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (error) {
        console.error(`Failed to handle answer from ${from}:`, error);
        cleanupPeerConnection(from);
      }
    },
    [cleanupPeerConnection]
  );

  /**
   * Handle audio-ice-candidate event
   */
  const handleIceCandidate = useCallback(
    async ({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
      const pc = peerConnectionsRef.current.get(from);
      if (!pc) return;

      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error(`Failed to add ICE candidate from ${from}:`, error);
      }
    },
    []
  );

  /**
   * Handle user-speaking event from server
   */
  const handleUserSpeaking = useCallback(
    ({ userId, speaking }: { userId: string; speaking: boolean }) => {
      if (onSpeakingChange) {
        onSpeakingChange(userId, speaking);
      }
    },
    [onSpeakingChange]
  );

  /**
   * Start audio (request microphone access and set up audio context)
   */
  const startAudio = useCallback(async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      // Create audio context
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      // Set up analyser for speaking detection
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      // Set initial mute state
      stream.getAudioTracks()[0].enabled = !isMuted;

      // Start speaking detection
      speakingIntervalRef.current = setInterval(checkSpeaking, AUDIO_CHECK_INTERVAL);

      // Start spatial audio updates
      spatializationIntervalRef.current = setInterval(updateSpatialAudio, AUDIO_CHECK_INTERVAL);

      setIsAudioActive(true);
    } catch (error) {
      console.error('Failed to start audio:', error);
      throw error;
    }
  }, [isMuted, checkSpeaking, updateSpatialAudio]);

  /**
   * Stop audio (stop all tracks and close connections)
   */
  const stopAudio = useCallback(() => {
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    // Stop intervals
    if (speakingIntervalRef.current) {
      clearInterval(speakingIntervalRef.current);
      speakingIntervalRef.current = null;
    }

    if (spatializationIntervalRef.current) {
      clearInterval(spatializationIntervalRef.current);
      spatializationIntervalRef.current = null;
    }

    // Close all peer connections
    peerConnectionsRef.current.forEach((_, userId) => {
      cleanupPeerConnection(userId);
    });
    peerConnectionsRef.current.clear();

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setIsAudioActive(false);
    setConnectedPeers(new Set());
  }, [cleanupPeerConnection]);

  /**
   * Handle mute state changes
   */
  useEffect(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMuted;
      }
    }
  }, [isMuted]);

  /**
   * Update spatial audio when user positions change
   */
  useEffect(() => {
    if (isAudioActive) {
      updateSpatialAudio();
    }
  }, [currentUser, users, isAudioActive, updateSpatialAudio]);

  /**
   * Set up socket event listeners
   */
  useEffect(() => {
    socket.on('audio-peers-update', handleAudioPeersUpdate);
    socket.on('audio-offer', handleAudioOffer);
    socket.on('audio-answer', handleAudioAnswer);
    socket.on('audio-ice-candidate', handleIceCandidate);
    socket.on('user-speaking', handleUserSpeaking);

    return () => {
      socket.off('audio-peers-update', handleAudioPeersUpdate);
      socket.off('audio-offer', handleAudioOffer);
      socket.off('audio-answer', handleAudioAnswer);
      socket.off('audio-ice-candidate', handleIceCandidate);
      socket.off('user-speaking', handleUserSpeaking);
    };
  }, [
    socket,
    handleAudioPeersUpdate,
    handleAudioOffer,
    handleAudioAnswer,
    handleIceCandidate,
    handleUserSpeaking,
  ]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  return {
    startAudio,
    stopAudio,
    isAudioActive,
    connectedPeers,
    localStream: localStreamRef.current,
  };
}
