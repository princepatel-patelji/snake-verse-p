import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import ClayButton from '@/components/ClayButton';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setUser = useAuthStore(s => s.setUser);
  const setProfile = useAuthStore(s => s.setProfile);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
      if (error) throw error;
      if (data.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
        setUser(data.user); setProfile(profile);
        toast.success('Welcome back!'); router.push('/dashboard');
      }
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  return (
    <Layout title="Login">
      <div className="max-w-md mx-auto glass-panel mt-10">
        <h1 className="text-2xl font-poppins font-bold text-pv-plum mb-6 text-center">Welcome Back</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="Email" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pv-pink outline-none" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required />
          <input type="password" placeholder="Password" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pv-pink outline-none" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} required />
          <ClayButton type="submit" variant="primary" size="lg" loading={loading} className="w-full">Sign In</ClayButton>
        </form>
      </div>
    </Layout>
  );
}