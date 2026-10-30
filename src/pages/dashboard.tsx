import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Apple, Brain, Users, Trophy, History, UserRound, Sparkles, Building2 } from 'lucide-react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuthStore } from '@/stores/authStore';

const destinations = [
  { href: '/food', title: 'Food Catalogue', description: 'Pick snacks and build your virtual plate.', icon: Apple, badge: '🍔' },
  { href: '/puzzle', title: 'Puzzle Challenge', description: 'Solve questions and earn XP.', icon: Brain, badge: '🧩' },
  { href: '/friends', title: 'Friends', description: 'Find players and accept friend requests.', icon: Users, badge: '👥' },
  { href: '/community', title: 'Communities', description: 'Create a group or join with an invite code.', icon: Building2, badge: '🏰' },
  { href: '/history', title: 'Game History', description: 'Review your previous sessions.', icon: History, badge: '📊' },
  { href: '/profile', title: 'My Profile', description: 'Update your player details.', icon: UserRound, badge: '✨' },
];

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const profileError = useAuthStore((state) => state.profileError);
  const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Player';

  return (
    <ProtectedRoute>
      <Layout title="Dashboard">
        <div className="mx-auto max-w-6xl py-4">
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-panel mb-7 overflow-hidden">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-pv-plum/65"><Sparkles size={16} /> Your SnackVerse space</p>
                <h1 className="text-3xl font-poppins font-bold text-pv-plum md:text-4xl">Welcome, {displayName}!</h1>
                <p className="mt-2 text-pv-plum/75">Eat. Play. Puzzle. Repeat!</p>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/50 px-6 py-4 text-center shadow-clay">
                <div className="text-3xl">🏆</div>
                <p className="text-sm font-semibold text-pv-plum/70">Player level</p>
                <p className="text-3xl font-bold text-pv-plum">{profile?.level ?? 1}</p>
              </div>
            </div>
            {profileError && (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/90 p-3 text-sm text-amber-900">
                Your account is signed in, but profile data is not fully synced yet. Apply the SnackVerse database migration in Supabase, then refresh this page.
              </div>
            )}
          </motion.section>

          <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="clay-card text-center"><div className="mb-1 text-2xl">⭐</div><p className="text-sm text-pv-plum/65">Experience points</p><p className="text-2xl font-bold text-pv-plum">{profile?.xp ?? 0}</p></div>
            <div className="clay-card text-center"><div className="mb-1 text-2xl">🍱</div><p className="text-sm text-pv-plum/65">Virtual calories</p><p className="text-2xl font-bold text-pv-plum">{profile?.virtual_calories ?? 0}</p></div>
            <div className="clay-card text-center"><div className="mb-1 text-2xl">🎮</div><p className="text-sm text-pv-plum/65">Game sessions</p><p className="text-2xl font-bold text-pv-plum">{profile?.total_sessions ?? 0}</p></div>
          </section>

          <section>
            <div className="mb-4 flex items-end justify-between gap-3">
              <div><h2 className="text-2xl font-poppins font-bold text-pv-plum">Explore SnackVerse</h2><p className="text-sm text-pv-plum/65">Choose what you would like to do next.</p></div>
              <Trophy className="text-pv-peach" size={28} />
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {destinations.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div key={item.href} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} whileHover={{ y: -3 }}>
                    <Link href={item.href} className="clay-card block h-full transition-shadow hover:shadow-glass">
                      <div className="mb-3 flex items-center justify-between"><span className="text-3xl">{item.badge}</span><Icon size={22} className="text-pv-plum/55" /></div>
                      <h3 className="text-lg font-bold text-pv-plum">{item.title}</h3>
                      <p className="mt-1 text-sm text-gray-600">{item.description}</p>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </section>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
