import { create } from 'zustand';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';
import { supabase, supabaseConfigured, withRequestTimeout } from '@/lib/supabase';
import type { Profile, ProfileUpdate } from '@/types/database';

// Use the local unparameterized client for table queries because the shared
// Database generic currently lacks these table definitions.
const typedDb = supabase as unknown as SupabaseClient;

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
  profileError: string | null;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  fetchProfile: (user: User) => Promise<Profile | null>;
  updateProfile: (updates: ProfileUpdate) => Promise<Profile>;
  initializeAuth: () => () => void;
  signOut: () => Promise<void>;
}

type AuthSubscription = { unsubscribe: () => void };
let activeAuthSubscription: AuthSubscription | null = null;
let initializationPromise: Promise<void> | null = null;
let authEventVersion = 0;

function makeFallbackProfile(user: User): Profile {
  const metadata = user.user_metadata || {};
  const emailPrefix = (user.email || 'player').split('@')[0];
  const usernameBase = String(metadata.username || emailPrefix)
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .replace(/^_+|_+$/g, '')
    .slice(0, 12);
  // A user-specific suffix prevents old accounts with the same email prefix
  // from colliding when repairing a missing profile.
  const username = `${usernameBase.length >= 3 ? usernameBase : 'player'}_${user.id.slice(0, 6)}`;

  return {
    id: user.id,
    username,
    display_name: String(metadata.display_name || metadata.full_name || emailPrefix || 'SnackVerse Player'),
    phone_number: null,
    avatar_url: null,
    bio: null,
    level: 1,
    xp: 0,
    virtual_calories: 0,
    total_sessions: 0,
    total_puzzles_solved: 0,
    privacy_settings: {},
    preferences: {},
    created_at: null,
    updated_at: null,
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,
  profileError: null,

  setUser: (user) => set((state) => ({
    user,
    profile: user?.id === state.user?.id ? state.profile : null,
    profileError: null,
  })),

  setProfile: (profile) => set({ profile, profileError: null }),
  setLoading: (loading) => set({ loading }),

  fetchProfile: async (user) => {
    if (!supabaseConfigured) {
      set({ profile: null, profileError: 'Supabase environment variables are missing.' });
      return null;
    }

    try {
      const { data: existingProfile, error: selectError } = await withRequestTimeout(
        typedDb.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        15000,
        'Profile request timed out',
      );
      if (selectError) throw selectError;

      if (existingProfile) {
        const profile = existingProfile as Profile;
        if (get().user?.id === user.id) set({ profile, profileError: null });
        return profile;
      }

      // Migration 002 creates profiles at signup. This upsert repairs older accounts
      // that were created before the trigger was installed; RLS restricts it to self.
      const fallback = makeFallbackProfile(user);
      const { data: createdProfile, error: upsertError } = await withRequestTimeout(
        typedDb.from('profiles').upsert({
          id: fallback.id,
          username: fallback.username,
          display_name: fallback.display_name,
          phone_number: fallback.phone_number,
          avatar_url: fallback.avatar_url,
          bio: fallback.bio,
          level: fallback.level,
          xp: fallback.xp,
          virtual_calories: fallback.virtual_calories,
          total_sessions: fallback.total_sessions,
          total_puzzles_solved: fallback.total_puzzles_solved,
          privacy_settings: fallback.privacy_settings,
          preferences: fallback.preferences,
        }, { onConflict: 'id' }).select('*').single(),
        15000,
        'Profile creation timed out',
      );
      if (upsertError) throw upsertError;

      const profile = createdProfile as Profile;
      if (get().user?.id === user.id) set({ profile, profileError: null });
      return profile;
    } catch (error) {
      console.warn('[SnackVerse profile load]', error instanceof Error ? error.message : 'Unknown profile error');
      if (get().user?.id === user.id) {
        set({
          profile: null,
          profileError: 'Your account is signed in, but its profile could not be loaded. Confirm that Supabase migration 002 has been applied.',
        });
      }
      return null;
    }
  },

  updateProfile: async (updates) => {
    const user = get().user;
    if (!user) throw new Error('Please sign in before updating your profile.');
    if (!supabaseConfigured) throw new Error('Supabase is not configured.');

    const { data, error } = await withRequestTimeout(
      typedDb.from('profiles').update(updates).eq('id', user.id).select('*').single(),
      15000,
      'Profile update timed out',
    );
    if (error) throw error;
    const profile = data as Profile;
    set({ profile, profileError: null });
    return profile;
  },

  initializeAuth: () => {
    if (typeof window === 'undefined') return () => undefined;

    if (!supabaseConfigured) {
      set({ user: null, profile: null, loading: false, initialized: true, profileError: 'Supabase is not configured.' });
      return () => undefined;
    }

    if (!activeAuthSubscription) {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        authEventVersion += 1;
        const nextUser = session?.user ?? null;

        if (event === 'SIGNED_OUT' || !nextUser) {
          set({ user: null, profile: null, loading: false, initialized: true, profileError: null });
          return;
        }

        set((state) => ({
          user: nextUser,
          profile: nextUser.id === state.user?.id ? state.profile : null,
          loading: false,
          initialized: true,
          profileError: null,
        }));

        // Never await Supabase queries inside onAuthStateChange; that can deadlock
        // the Supabase auth lock. Schedule profile loading after the callback returns.
        window.setTimeout(() => {
          if (get().user?.id === nextUser.id) void get().fetchProfile(nextUser);
        }, 0);
      });
      activeAuthSubscription = data.subscription;
    }

    if (!initializationPromise) {
      const startingEventVersion = authEventVersion;
      set({ loading: true });
      initializationPromise = (async () => {
        try {
          const { data, error } = await withRequestTimeout(
            supabase.auth.getSession(),
            12000,
            'Session restore timed out',
          );
          if (error) throw error;

          // An auth event that occurred while getSession was pending is newer.
          if (authEventVersion === startingEventVersion) {
            const currentUser = data.session?.user ?? null;
            set({ user: currentUser, profile: null, profileError: null });
            if (currentUser) await get().fetchProfile(currentUser);
          }
        } catch (error) {
          console.warn('[SnackVerse session restore]', error instanceof Error ? error.message : 'Unknown session error');
          if (authEventVersion === startingEventVersion && !get().user) {
            set({ user: null, profile: null, profileError: 'Your session could not be restored. Please sign in again.' });
          }
        } finally {
          set({ loading: false, initialized: true });
          initializationPromise = null;
        }
      })();
    }

    // Keep the single app-wide listener alive for the lifetime of the app.
    // This avoids React Strict Mode setup/cleanup cycles removing the only listener.
    return () => undefined;
  },

  signOut: async () => {
    if (!supabaseConfigured) {
      set({ user: null, profile: null, loading: false, initialized: true, profileError: null });
      return;
    }

    set({ loading: true });
    try {
      const { error } = await withRequestTimeout(supabase.auth.signOut(), 12000, 'Sign out timed out');
      if (error) throw error;
      set({ user: null, profile: null, loading: false, initialized: true, profileError: null });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
}));
