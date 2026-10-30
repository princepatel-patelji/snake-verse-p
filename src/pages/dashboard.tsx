import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import ClayButton from '@/components/ClayButton';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuthStore } from '@/stores/authStore';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Dashboard() {
  const { profile } = useAuthStore();
  const router = useRouter();

  return (
    <ProtectedRoute>
      <Layout title="Dashboard">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto py-4">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pv-pink to-pv-lavender flex items-center justify-center text-3xl shadow-clay">{profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full rounded-full object-cover" /> : '🎮'}</div>
            <div><h1 className="text-3xl font-poppins font-bold text-pv-plum">Hi, {profile?.display_name}!</h1><p className="text-gray-600">Level {profile?.level} • {profile?.xp} XP • {profile?.virtual_calories} Virtual Calories</p></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[{l:'Sessions', v:profile?.total_sessions},{l:'Puzzles', v:profile?.total_puzzles_solved},{l:'XP', v:profile?.xp},{l:'Calories', v:profile?.virtual_calories}].map((s,i)=>(
              <div key={i} className="clay-card"><div className="text-2xl font-bold text-pv-plum">{s.v || 0}</div><div className="text-sm text-gray-500">{s.l}</div></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <Link href="/food"><ClayButton variant="primary" size="lg" className="w-full h-20 text-lg" icon={<span>🍔</span>}>Choose Food</ClayButton></Link>
            <Link href="/puzzle"><ClayButton variant="secondary" size="lg" className="w-full h-20 text-lg" icon={<span>🧩</span>}>Solve Puzzles</ClayButton></Link>
            <Link href="/community"><ClayButton variant="glass" size="lg" className="w-full h-20 text-lg" icon={<span>🏛️</span>}>Communities</ClayButton></Link>
          </div>
          <div className="glass-panel">
            <h2 className="text-xl font-poppins font-bold text-pv-plum mb-4">Quick Links</h2>
            <div className="flex flex-wrap gap-3">
              <Link href="/friends" className="text-pv-plum hover:underline">Friends</Link>
              <Link href="/history" className="text-pv-plum hover:underline">History</Link>
              <Link href="/profile" className="text-pv-plum hover:underline">Profile</Link>
            </div>
          </div>
        </motion.div>
      </Layout>
    </ProtectedRoute>
  );
}