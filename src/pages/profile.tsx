import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { motion } from 'framer-motion';

export default function HistoryPage() {
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => { if (user) loadHistory(); }, [user]);

  const loadHistory = async () => {
    const { data } = await supabase.from('game_sessions').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
    setSessions(data || []);
  };

  const filtered = filter === 'all' ? sessions : sessions.filter(s => s.session_type === filter);

  return (
    <ProtectedRoute>
      <Layout title="Game History">
        <div className="max-w-4xl mx-auto py-6">
          <h1 className="text-3xl font-poppins font-bold text-pv-plum mb-6">📊 Game History</h1>
          <div className="flex gap-2 mb-6">
            {['all', 'solo', 'friend', 'community'].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1 rounded-full text-sm capitalize ${filter === f ? 'bg-pv-pink text-white' : 'bg-white text-gray-600'}`}>{f}</button>
            ))}
          </div>
          <div className="space-y-4">
            {filtered.map(s => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="clay-card">
                <div className="flex justify-between items-start mb-2">
                  <div><span className="px-2 py-0.5 bg-pv-lavender/20 text-pv-lavender rounded-full text-xs font-bold uppercase">{s.session_type}</span>
                  <p className="text-sm text-gray-500 mt-1">{new Date(s.created_at).toLocaleDateString()} • {new Date(s.created_at).toLocaleTimeString()}</p></div>
                  <div className="text-right"><p className="font-bold text-pv-plum">XP: +{s.xp_earned}</p><p className="text-sm text-gray-500">Calories: +{s.total_calories_added} / -{s.total_calories_removed}</p></div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center mt-3 pt-3 border-t border-gray-100">
                  <div><p className="font-semibold">{s.puzzles_attempted}</p><p className="text-xs text-gray-500">Attempted</p></div>
                  <div><p className="font-semibold text-green-600">{s.puzzles_correct}</p><p className="text-xs text-gray-500">Correct</p></div>
                  <div><p className="font-semibold text-pv-pink">{Math.round((s.puzzles_correct / (s.puzzles_attempted || 1)) * 100)}%</p><p className="text-xs text-gray-500">Accuracy</p></div>
                </div>
              </motion.div>
            ))}
            {filtered.length === 0 && <div className="text-center py-10 text-gray-500">No game sessions found for this filter.</div>}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}