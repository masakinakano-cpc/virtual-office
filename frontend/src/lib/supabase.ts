import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserProfile = {
  id: string;
  email: string;
  display_name: string;
  avatar_type: string;
  avatar_color: string;
  avatar_url?: string;  // カスタム写真URL
  status: 'online' | 'away' | 'busy' | 'offline';
  created_at: string;
  updated_at: string;
};
