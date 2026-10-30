import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types/database';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
  setUser: (u: User | null) => void;
  setProfile: (p: Profile | null) => void;
  setLoading: (l: boolean) => void;
  initializeAuth: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: string | null }>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: false,
  initialized: false,
  setUser: (u) => set({ user: u }),
  setProfile: (p) => set({ profile: p }),
  setLoading: (l) => set({ loading: l }),
  initializeAuth: async () => {
    if (useAuthStore.getState().initialized) return;
    set({ loading: true, initialized: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        set({ user: session.user, profile: profile || null });
      }
      supabase.auth.onAuthStateChange(async (_, session) => {
        if (session?.user) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
          set({ user: session.user, profile: profile || null });
        } else {
          set({ user: null, profile: null });
        }
      });
    } catch (e) {
      console.error('Auth init failed:', e);
    } finally {
      set({ loading: false });
    }
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },
  updateProfile: async (updates) => {
    const { user } = useAuthStore.getState();
    if (!user) return { error: 'Not authenticated' };
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', user.id).select().single();
    if (!error && data) set({ profile: data });
    return { error: error?.message || null };
  },
}));
