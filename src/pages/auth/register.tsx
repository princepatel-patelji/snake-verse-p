import React, { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import ClayButton from '@/components/ClayButton';
import {
  formatSupabaseAuthError,
  supabase,
  supabaseConfigured,
  supabaseConfigMessage,
  withRequestTimeout,
} from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

// The current shared Supabase schema omits RPC definitions; keep this page's
// queries compatible until the generated database schema is added.
const typedDb = supabase as unknown as SupabaseClient;

export default function Register() {
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  const setLoadingState = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(() => setResendCooldown((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    if (!supabaseConfigured) return toast.error(supabaseConfigMessage);

    const displayName = form.name.trim();
    const username = form.username.trim().toLowerCase();
    const email = form.email.trim().toLowerCase();

    if (displayName.length < 2) return toast.error('Display name must contain at least 2 characters.');
    if (!/^[a-z0-9_]{3,20}$/.test(username)) return toast.error('Username must be 3–20 characters (letters, numbers and underscores only).');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error('Enter a valid email address.');
    if (form.password.length < 8) return toast.error('Use a password with at least 8 characters.');

    setLoading(true);
    setLoadingState(true);
    try {
      const { data: isAvailable, error: usernameError } = await withRequestTimeout(
        typedDb.rpc('is_snackverse_username_available', { search_username: username }),
        12000,
        'Username check timed out',
      );
      if (usernameError) throw usernameError;
      if (!isAvailable) throw new Error('This username is already taken. Choose another username.');

      const { data, error } = await withRequestTimeout(
        supabase.auth.signUp({
          email,
          password: form.password,
          options: {
            data: { display_name: displayName, username },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        }),
        20000,
        'Registration request timed out',
      );
      if (error) throw error;
      if (!data.user) throw new Error('Supabase did not return a user. Please try again later.');

      // Supabase intentionally returns an empty identities array for some already-
      // registered addresses to reduce account enumeration.
      if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        throw new Error('An account may already exist for this email. Try signing in or use Forgot password.');
      }

      if (data.session) {
        setUser(data.user);
        await fetchProfile(data.user);
        toast.success('Your account has been created.');
        await router.replace('/dashboard');
      } else {
        setAwaitingVerification(true);
        setResendCooldown(60);
        toast.success('Check your inbox to verify your email before signing in.');
      }
    } catch (error) {
      const formatted = formatSupabaseAuthError(error);
      toast.error(formatted.userMessage);
      if (formatted.isRateLimit) setResendCooldown(60);
    } finally {
      setLoading(false);
      setLoadingState(false);
    }
  };

  const resendVerification = async () => {
    if (loading || resendCooldown > 0 || !form.email.trim()) return;
    if (!supabaseConfigured) return toast.error(supabaseConfigMessage);

    setLoading(true);
    try {
      const { error } = await withRequestTimeout(
        supabase.auth.resend({
          type: 'signup',
          email: form.email.trim().toLowerCase(),
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        }),
        20000,
        'Verification email request timed out',
      );
      if (error) throw error;
      setResendCooldown(60);
      toast.success('Verification email request submitted. Check your inbox and spam folder.');
    } catch (error) {
      const formatted = formatSupabaseAuthError(error);
      toast.error(formatted.userMessage);
      if (formatted.isRateLimit) setResendCooldown(60);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Register">
      <div className="glass-panel mx-auto mt-10 max-w-md">
        <h1 className="mb-2 text-center text-2xl font-poppins font-bold text-pv-plum">Join SnackVerse</h1>
        <p className="mb-6 text-center text-sm text-pv-plum/70">Create your account and start playing.</p>

        {awaitingVerification ? (
          <div className="space-y-4 text-center" role="status" aria-live="polite">
            <div className="text-5xl">📩</div>
            <h2 className="text-xl font-bold text-pv-plum">Verify your email</h2>
            <p className="text-sm text-pv-plum/80">
              A verification request was submitted for <strong>{form.email}</strong>. Open the email and click its confirmation link before signing in.
            </p>
            <ClayButton type="button" variant="secondary" size="lg" className="w-full" loading={loading} disabled={loading || resendCooldown > 0} onClick={resendVerification}>
              {resendCooldown > 0 ? `Resend available in ${resendCooldown}s` : 'Resend verification email'}
            </ClayButton>
            <button type="button" className="text-sm font-semibold text-pv-plum underline" onClick={() => setAwaitingVerification(false)}>
              Back to registration
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm font-semibold text-pv-plum">
              Display name
              <input type="text" autoComplete="name" placeholder="Your name" className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-pv-pink" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required minLength={2} />
            </label>
            <label className="block text-sm font-semibold text-pv-plum">
              Username
              <input type="text" autoComplete="username" placeholder="your_username" className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-pv-pink" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })} required minLength={3} maxLength={20} pattern="[a-zA-Z0-9_]{3,20}" />
            </label>
            <label className="block text-sm font-semibold text-pv-plum">
              Email
              <input type="email" autoComplete="email" placeholder="you@example.com" className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-pv-pink" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
            </label>
            <label className="block text-sm font-semibold text-pv-plum">
              Password
              <input type="password" autoComplete="new-password" placeholder="At least 8 characters" className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-pv-pink" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required minLength={8} />
            </label>
            <ClayButton type="submit" variant="primary" size="lg" loading={loading} className="w-full">
              Create Account
            </ClayButton>
          </form>
        )}

        <p className="mt-5 text-center text-sm text-pv-plum/80">
          Already registered? <Link href="/auth/login" className="font-bold text-pv-plum underline">Sign in</Link>
        </p>
      </div>
    </Layout>
  );
}
