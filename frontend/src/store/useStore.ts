import { create } from 'zustand';

export interface User {
  id: string;
  visibilityUserId?: string; // Supabase user ID
  name: string;
  x: number;
  y: number;
  color: string;
  avatarType: string;
  avatarUrl?: string;  // カスタム写真URL
  status: 'online' | 'away' | 'busy' | 'offline';
}

export interface ChatMessage {
  userId: string;
  userName: string;
  message: string;
  timestamp: number;
}

interface StoreState {
  // ユーザー情報
  currentUser: User | null;
  users: Map<string, User>;

  // チャット
  messages: ChatMessage[];

  // アクション
  setCurrentUser: (user: User) => void;
  updateCurrentUser: (updates: Partial<User>) => void;
  setUsers: (users: User[]) => void;
  addUser: (user: User) => void;
  removeUser: (userId: string) => void;
  updateUserPosition: (userId: string, x: number, y: number) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  addMessage: (message: ChatMessage) => void;
}

export const useStore = create<StoreState>((set) => ({
  currentUser: null,
  users: new Map(),
  messages: [],

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

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages.slice(-49), message],
    })),
}));
