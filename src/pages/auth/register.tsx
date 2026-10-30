import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import ClayButton from '@/components/ClayButton';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

export default function Register() {
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
const setUser = useAuthStore((s: any) => s.setUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email: form.email, password: form.password, options: { data: { display_name: form.name, username: form.username } } });
      if (error) throw error;
      if (data.user) {
        await supabase.from('profiles').insert({ id: data.user.id, display_name: form.name, username: form.username, phone_number: null, avatar_url: null, bio: null, level: 1, xp: 0, virtual_calories: 0, total_sessions: 0, total_puzzles_solved: 0, privacy_settings: {}, preferences: {} });
        setUser(data.user);
        toast.success('Account created! Please check your email to verify.');
        router.push('/dashboard');
      }
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  return (
    <Layout title="Register">
      <div className="max-w-md mx-auto glass-panel mt-10">
        <h1 className="text-2xl font-poppins font-bold text-pv-plum mb-6 text-center">Join SnackVerse</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Display Name" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pv-pink outline-none" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required />
          <input type="text" placeholder="Username" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pv-pink outline-none" value={form.username} onChange={e=>setForm({...form, username:e.target.value})} required pattern="[a-zA-Z0-9_]{3,20}" />
          <input type="email" placeholder="Email" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pv-pink outline-none" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required />
          <input type="password" placeholder="Password" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pv-pink outline-none" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} required minLength={6} />
          <ClayButton type="submit" variant="primary" size="lg" loading={loading} className="w-full">Create Account</ClayButton>
        </form>
      </div>
    </Layout>
  );
}