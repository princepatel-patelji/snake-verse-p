import React, { useState } from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import ClayButton from '@/components/ClayButton';
import FoodCard from '@/components/FoodCard';
import { FOOD_CATALOG } from '@/lib/game-config';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import type { FoodItem } from '@/types/database';

export default function FoodPage() {
  const { profile, updateProfile } = useAuthStore();
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [plate, setPlate] = useState<FoodItem[]>([]);
  const categories = ['All', ...Array.from(new Set(FOOD_CATALOG.map(f => f.category)))];
  const filtered = FOOD_CATALOG.filter(f => (filter === 'All' || f.category === filter) && f.name.toLowerCase().includes(search.toLowerCase()));

  const addToPlate = () => { if (selected) setPlate([...plate, selected]); };
  
  const eatFood = async (food: FoodItem) => {
    toast.success(`Yum! Ate ${food.name}`);
    setPlate(plate.filter(f => f.id !== food.id));
    if (profile) {
      const newCals = Math.max(0, (profile.virtual_calories || 0) + food.calories);
      await updateProfile({ virtual_calories: newCals });
      await supabase.from('game_sessions').insert({ user_id: profile.id, session_type: 'solo', total_calories_added: food.calories, total_calories_removed: 0, puzzles_attempted: 0, puzzles_correct: 0, xp_earned: 5 });
    }
  };

  return (
    <ProtectedRoute>
      <Layout title="Food Catalogue">
        <div className="max-w-6xl mx-auto py-4">
          <h1 className="text-3xl font-poppins font-bold text-pv-plum mb-6">Virtual Food Catalogue</h1>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <input type="text" placeholder="Search snacks..." className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pv-pink outline-none" value={search} onChange={e => setSearch(e.target.value)} />
            <div className="flex gap-2 flex-wrap">{categories.map(c => <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1 rounded-full text-sm ${filter === c ? 'bg-pv-pink text-white' : 'bg-white text-gray-600'}`}>{c}</button>)}</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">{filtered.map(f => <FoodCard key={f.id} food={f} onClick={() => setSelected(f)} />)}</div>
          
          <AnimatePresence>
            {selected && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-glass" onClick={e => e.stopPropagation()}>
                <div className="text-6xl text-center mb-2">{selected.emoji}</div>
                <h2 className="text-2xl font-bold text-pv-plum text-center">{selected.name}</h2>
                <p className="text-center text-gray-600 mb-4">{selected.calories} Virtual Calories</p>
                <div className="flex gap-3"><ClayButton variant="ghost" size="md" className="flex-1" onClick={() => setSelected(null)}>Cancel</ClayButton><ClayButton variant="secondary" size="md" className="flex-1" onClick={addToPlate}>Add to Plate</ClayButton></div>
              </motion.div>
            </motion.div>}
          </AnimatePresence>

          {plate.length > 0 && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-panel mt-6">
              <h2 className="text-xl font-bold text-pv-plum mb-3">Your Plate</h2>
              <div className="flex gap-3 flex-wrap mb-4">{plate.map((f, i) => <div key={i} className="bg-pv-cream px-3 py-1 rounded-lg flex items-center gap-2"><span>{f.emoji}</span><button onClick={() => eatFood(f)} className="text-pv-pink font-bold hover:underline">Eat</button></div>)}</div>
              <p className="text-xs text-gray-500">Note: Virtual Calories are gameplay points only. They do not represent real nutrition.</p>
            </motion.div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}