'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, UserProfile } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // ダミープロフィールを作成するヘルパー
  const createDummyProfile = (userId: string, email?: string): UserProfile => ({
    id: userId,
    email: email || 'user@example.com',
    display_name: email?.split('@')[0] || 'User',
    avatar_type: 'cat',
    avatar_color: getRandomColor(),
    status: 'online',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  // プロフィールを取得（タイムアウト付き）
  const fetchProfile = async (userId: string, email?: string): Promise<UserProfile> => {
    // 5秒でタイムアウト
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), 5000);
    });

    const fetchPromise = (async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);

          // プロフィールがなければ作成を試みる
          if (error.code === 'PGRST116') {
            const newProfile = createDummyProfile(userId, email);

            const { error: insertError } = await supabase
              .from('profiles')
              .insert(newProfile);

            if (!insertError) {
              return newProfile;
            }
          }
          return null;
        }
        return data as UserProfile;
      } catch (err) {
        console.error('fetchProfile exception:', err);
        return null;
      }
    })();

    const result = await Promise.race([fetchPromise, timeoutPromise]);

    // 結果がなければダミープロフィールを返す
    if (!result) {
      console.log('Using dummy profile (timeout or error)');
      return createDummyProfile(userId, email);
    }

    return result;
  };

  useEffect(() => {
    let isMounted = true;

    // 現在のセッションを取得
    const initAuth = async () => {
      console.log('initAuth started');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('Session result:', { session: !!session, error });

        if (error) {
          console.error('Error getting session:', error);
        }

        if (isMounted) {
          setUser(session?.user ?? null);
          if (session?.user) {
            console.log('Fetching profile for user:', session.user.id);
            // fetchProfileは必ずUserProfileを返す（タイムアウトでもダミーを返す）
            const p = await fetchProfile(session.user.id, session.user.email);
            console.log('Profile result:', p);
            if (isMounted) {
              setProfile(p);
            }
          }
        }
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        // 必ずloadingをfalseにする
        if (isMounted) {
          console.log('Setting loading to false');
          setLoading(false);
        }
      }
    };

    initAuth();

    // 認証状態の変化を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (isMounted) {
          setUser(session?.user ?? null);
          if (session?.user) {
            const p = await fetchProfile(session.user.id, session.user.email);
            setProfile(p);
          } else {
            setProfile(null);
          }
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) return { error: error as Error };

    // トリガーがプロフィールを自動作成するので少し待つ
    if (data.user) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      // display_nameを更新
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          avatar_color: getRandomColor(),
        })
        .eq('id', data.user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
      }
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating profile:', error);
      return;
    }

    // ローカル状態を更新
    setProfile((prev) => (prev ? { ...prev, ...updates } : null));
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signIn, signUp, signOut, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

function getRandomColor(): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
