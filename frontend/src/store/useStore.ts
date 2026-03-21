import { create } from 'zustand';

export interface User {
  id: string;
  visibilityUserId?: string;
  name: string;
  x: number;
  y: number;
  color: string;
  avatarType: string;
  avatarUrl?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  currentRoom?: string | null;
  isSpeaking?: boolean;
}

export interface ChatMessage {
  userId: string;
  userName: string;
  message: string;
  timestamp: number;
  type?: 'proximity' | 'room' | 'dm' | 'system';
}

export interface Room {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  type: 'meeting' | 'lounge' | 'focus' | 'open';
  occupants: string[];
  locked: boolean;
  lockedBy?: string;
}

interface AudioState {
  isMuted: boolean;
  isSpeaking: boolean;
  audioLevel: number;
  connectedPeers: Set<string>;
  speakingUsers: Set<string>;
}

interface StoreState {
  // User state
  currentUser: User | null;
  users: Map<string, User>;

  // Room state
  rooms: Room[];
  currentRoom: string | null;

  // Chat state
  messages: ChatMessage[];

  // Audio state
  audio: AudioState;

  // UI state
  sidebarOpen: boolean;
  lightweightMode: boolean;

  // User actions
  setCurrentUser: (user: User) => void;
  updateCurrentUser: (updates: Partial<User>) => void;
  setUsers: (users: User[]) => void;
  addUser: (user: User) => void;
  removeUser: (userId: string) => void;
  updateUserPosition: (userId: string, x: number, y: number) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;

  // Room actions
  setRooms: (rooms: Room[]) => void;
  updateRoom: (roomId: string, updates: Partial<Room>) => void;
  setCurrentRoom: (roomId: string | null) => void;
  setRoomOccupants: (roomId: string, occupants: string[]) => void;

  // Chat actions
  addMessage: (message: ChatMessage) => void;
  addSystemMessage: (text: string) => void;

  // Audio actions
  setMuted: (muted: boolean) => void;
  setSpeaking: (speaking: boolean) => void;
  setAudioLevel: (level: number) => void;
  addAudioPeer: (peerId: string) => void;
  removeAudioPeer: (peerId: string) => void;
  setUserSpeaking: (userId: string, speaking: boolean) => void;

  // UI actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setLightweightMode: (enabled: boolean) => void;
}

export const useStore = create<StoreState>((set) => ({
  currentUser: null,
  users: new Map(),
  rooms: [],
  currentRoom: null,
  messages: [],
  audio: {
    isMuted: true, // Default to muted (privacy-first)
    isSpeaking: false,
    audioLevel: 0,
    connectedPeers: new Set(),
    speakingUsers: new Set(),
  },
  sidebarOpen: true,
  lightweightMode: false,

  // User actions
  setCurrentUser: (user) => set({ currentUser: user }),

  updateCurrentUser: (updates) =>
    set((state) => ({
      currentUser: state.currentUser
        ? { ...state.currentUser, ...updates }
        : null,
    })),

  setUsers: (users) =>
    set({
      users: new Map(users.map((u) => [u.id, u])),
    }),

  addUser: (user) =>
    set((state) => {
      const newUsers = new Map(state.users);
      newUsers.set(user.id, user);
      return { users: newUsers };
    }),

  removeUser: (userId) =>
    set((state) => {
      const newUsers = new Map(state.users);
      newUsers.delete(userId);
      return { users: newUsers };
    }),

  updateUserPosition: (userId, x, y) =>
    set((state) => {
      const newUsers = new Map(state.users);
      const user = newUsers.get(userId);
      if (user) {
        newUsers.set(userId, { ...user, x, y });
      }
      return { users: newUsers };
    }),

  updateUser: (userId, updates) =>
    set((state) => {
      const newUsers = new Map(state.users);
      const user = newUsers.get(userId);
      if (user) {
        newUsers.set(userId, { ...user, ...updates });
      }
      return { users: newUsers };
    }),

  // Room actions
  setRooms: (rooms) => set({ rooms }),

  updateRoom: (roomId, updates) =>
    set((state) => ({
      rooms: state.rooms.map((r) =>
        r.id === roomId ? { ...r, ...updates } : r
      ),
    })),

  setCurrentRoom: (roomId) => set({ currentRoom: roomId }),

  setRoomOccupants: (roomId, occupants) =>
    set((state) => ({
      rooms: state.rooms.map((r) =>
        r.id === roomId ? { ...r, occupants } : r
      ),
    })),

  // Chat actions
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages.slice(-99), message],
    })),

  addSystemMessage: (text) =>
    set((state) => ({
      messages: [
        ...state.messages.slice(-99),
        {
          userId: 'system',
          userName: 'System',
          message: text,
          timestamp: Date.now(),
          type: 'system' as const,
        },
      ],
    })),

  // Audio actions
  setMuted: (muted) =>
    set((state) => ({
      audio: { ...state.audio, isMuted: muted },
    })),

  setSpeaking: (speaking) =>
    set((state) => ({
      audio: { ...state.audio, isSpeaking: speaking },
    })),

  setAudioLevel: (level) =>
    set((state) => ({
      audio: { ...state.audio, audioLevel: level },
    })),

  addAudioPeer: (peerId) =>
    set((state) => {
      const newPeers = new Set(state.audio.connectedPeers);
      newPeers.add(peerId);
      return { audio: { ...state.audio, connectedPeers: newPeers } };
    }),

  removeAudioPeer: (peerId) =>
    set((state) => {
      const newPeers = new Set(state.audio.connectedPeers);
      newPeers.delete(peerId);
      return { audio: { ...state.audio, connectedPeers: newPeers } };
    }),

  setUserSpeaking: (userId, speaking) =>
    set((state) => {
      const newSpeaking = new Set(state.audio.speakingUsers);
      if (speaking) {
        newSpeaking.add(userId);
      } else {
        newSpeaking.delete(userId);
      }
      return { audio: { ...state.audio, speakingUsers: newSpeaking } };
    }),

  // UI actions
  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  setLightweightMode: (enabled) => set({ lightweightMode: enabled }),
}));
