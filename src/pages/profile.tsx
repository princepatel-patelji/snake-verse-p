import React, { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import ClayButton from '@/components/ClayButton';
import { useAuthStore } from '@/stores/authStore';
import { formatSupabaseAuthError, supabase, withRequestTimeout } from '@/lib/supabase';
import toast from 'react-hot-toast';

const typedDb = supabase as unknown as SupabaseClient;

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const [form, setForm] = useState({ display_name: '', username: '', bio: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm({ display_name: profile.display_name || '', username: profile.username || '', bio: profile.bio || '' });
  }, [profile]);

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    const displayName = form.display_name.trim();
    const username = form.username.trim().toLowerCase();
    if (displayName.length < 2) return toast.error('Display name must contain at least 2 characters.');
    if (!/^[a-z0-9_]{3,20}$/.test(username)) return toast.error('Username must be 3–20 letters, numbers or underscores.');

    setSaving(true);
    try {
      const { data: usernameAvailable, error: usernameError } = await withRequestTimeout(
        typedDb.rpc('is_snackverse_username_available', { search_username: username }),
        12000,
        'Username check timed out',
      );
      if (usernameError) throw usernameError;
      if (!usernameAvailable) throw new Error('That username is already being used by another player.');

      await updateProfile({ display_name: displayName, username, bio: form.bio.trim() || null });
      toast.success('Profile updated successfully.');
    } catch (error) {
      toast.error(formatSupabaseAuthError(error).userMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <Layout title="My Profile">
        <div className="glass-panel mx-auto mt-6 max-w-2xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-pv-pink to-pv-lavender text-4xl shadow-clay">👤</div>
            <h1 className="text-2xl font-poppins font-bold text-pv-plum">My Player Profile</h1>
            <p className="text-sm text-pv-plum/65">{user?.email}</p>
          </div>
          <form onSubmit={saveProfile} className="space-y-4">
            <label className="block text-sm font-semibold text-pv-plum">Display name
              <input value={form.display_name} onChange={(event) => setForm({ ...form, display_name: event.target.value })} required minLength={2} className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-pv-pink" />
            </label>
            <label className="block text-sm font-semibold text-pv-plum">Username
              <input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value.toLowerCase() })} required minLength={3} maxLength={20} pattern="[a-zA-Z0-9_]{3,20}" className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-pv-pink" />
            </label>
            <label className="block text-sm font-semibold text-pv-plum">Bio
              <textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} rows={3} maxLength={240} className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-pv-pink" />
            </label>
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-white/50 p-4 text-center">
              <div><p className="text-xs text-pv-plum/65">Level</p><p className="text-xl font-bold text-pv-plum">{profile?.level ?? 1}</p></div>
              <div><p className="text-xs text-pv-plum/65">XP</p><p className="text-xl font-bold text-pv-plum">{profile?.xp ?? 0}</p></div>
            </div>
            <ClayButton type="submit" size="lg" loading={saving} disabled={saving} className="w-full">Save Profile</ClayButton>
          </form>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
