import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { supabase, withRequestTimeout } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { motion } from 'motion/react';
import type { GameSession } from '@/types/database';
import toast from 'react-hot-toast';

export default function HistoryPage() {
  const user = useAuthStore((state) => state.user);
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    if (!user) {
      setSessions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await withRequestTimeout(
        supabase.from('game_sessions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        15000,
        'Game history request timed out',
      );
      if (error) throw error;
      setSessions((data || []) as GameSession[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load game history.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { void loadHistory(); }, [loadHistory]);

  const filtered = useMemo(
    () => filter === 'all' ? sessions : sessions.filter((session) => session.session_type === filter),
    [filter, sessions],
  );

  return (
    <ProtectedRoute>
      <Layout title="Game History">
        <div className="max-w-4xl mx-auto py-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h1 className="text-3xl font-poppins font-bold text-pv-plum">📊 Game History</h1>
            <button type="button" onClick={() => void loadHistory()} disabled={loading} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-pv-plum shadow-clay disabled:opacity-50">Refresh</button>
          </div>
          <div className="flex gap-2 mb-6 flex-wrap">
            {['all', 'solo', 'friend', 'community'].map((item) => (
              <button type="button" key={item} onClick={() => setFilter(item)} className={`px-4 py-1 rounded-full text-sm capitalize ${filter === item ? 'bg-pv-pink text-white' : 'bg-white text-gray-600'}`}>{item}</button>
            ))}
          </div>
          {loading ? (
            <div className="py-10 text-center text-gray-500" role="status">Loading history…</div>
          ) : (
            <div className="space-y-4">
              {filtered.map((session) => {
                const attempted = session.puzzles_attempted || 0;
                const accuracy = attempted > 0 ? Math.round(((session.puzzles_correct || 0) / attempted) * 100) : 0;
                return (
                  <motion.div key={session.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="clay-card">
                    <div className="flex justify-between items-start mb-2 gap-3">
                      <div>
                        <span className="px-2 py-0.5 bg-pv-lavender/20 text-pv-lavender rounded-full text-xs font-bold uppercase">{session.session_type || 'solo'}</span>
                        <p className="text-sm text-gray-500 mt-1">{session.created_at ? new Date(session.created_at).toLocaleString() : 'Date unavailable'}</p>
                      </div>
                      <div className="text-right"><p className="font-bold text-pv-plum">XP: +{session.xp_earned || 0}</p><p className="text-sm text-gray-500">Calories: +{session.total_calories_added || 0} / -{session.total_calories_removed || 0}</p></div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center mt-3 pt-3 border-t border-gray-100">
                      <div><p className="font-semibold">{attempted}</p><p className="text-xs text-gray-500">Attempted</p></div>
                      <div><p className="font-semibold text-green-600">{session.puzzles_correct || 0}</p><p className="text-xs text-gray-500">Correct</p></div>
                      <div><p className="font-semibold text-pv-pink">{accuracy}%</p><p className="text-xs text-gray-500">Accuracy</p></div>
                    </div>
                  </motion.div>
                );
              })}
              {filtered.length === 0 && <div className="text-center py-10 text-gray-500">No game sessions found for this filter.</div>}
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
