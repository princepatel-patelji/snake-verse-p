import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import ClayButton from '@/components/ClayButton';
import { PUZZLE_BANK, GAME_RULES } from '@/lib/game-config';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import type { PuzzleQuestion } from '@/types/database';

export default function PuzzlePage() {
  const { profile, updateProfile } = useAuthStore();
  const [currentQ, setCurrentQ] = useState<PuzzleQuestion | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [xp, setXp] = useState(0);
  const [qIndex, setQIndex] = useState(0);

  const shuffled = [...PUZZLE_BANK].sort(() => Math.random() - 0.5);

  useEffect(() => {
    if (qIndex < shuffled.length) {
      setCurrentQ(shuffled[qIndex]);
      setOptions([...shuffled[qIndex].options].sort(() => Math.random() - 0.5));
      setSelected(null); setShowResult(false);
    }
  }, [qIndex, shuffled]);

  const handleAnswer = async () => {
    if (!selected || !currentQ || showResult) return;
    setShowResult(true);
    const correct = selected === currentQ.correct_answer;
    setIsCorrect(correct);

    if (correct) {
      setScore(s => s + currentQ.calorie_reward);
      setXp(x => x + currentQ.xp_reward);
      toast.success('Correct! Brain power activated! 🧠');
    } else {
      toast.error(`Oops! The answer was: ${currentQ.correct_answer}`);
    }

    if (profile) {
      await supabase.from('puzzle_attempts').insert({
        user_id: profile.id,
        question_id: currentQ.id,
        selected_answer: selected,
        is_correct: correct,
        xp_earned: correct ? currentQ.xp_reward : 0
      });
    }
  };

  const nextQuestion = async () => {
    if (qIndex + 1 >= shuffled.length) {
      // Session complete
      if (profile) {
        const newCals = Math.max(0, (profile.virtual_calories || 0) - score);
        const newXp = (profile.xp || 0) + xp;
        await updateProfile({ 
          virtual_calories: newCals, 
          xp: newXp, 
          total_puzzles_solved: (profile.total_puzzles_solved || 0) + shuffled.length 
        });
        await supabase.from('game_sessions').insert({
          user_id: profile.id, session_type: 'solo', total_calories_added: 0,
          total_calories_removed: score, puzzles_attempted: shuffled.length,
          puzzles_correct: score > 0 ? Math.round(score / 25) : 0, xp_earned: xp
        });
      }
      toast.success(`Session Complete! Earned ${xp} XP & burned ${score} virtual calories! 🎉`);
      setQIndex(0); setScore(0); setXp(0);
    } else {
      setQIndex(q => q + 1);
    }
  };

  return (
    <ProtectedRoute>
      <Layout title="Puzzle Challenge">
        <div className="max-w-2xl mx-auto py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-poppins font-bold text-pv-plum">🧩 Puzzle Challenge</h1>
            <div className="glass-panel px-4 py-2"><span className="text-pv-pink font-bold">XP: +{xp}</span> • <span className="text-pv-mint font-bold">Calories: -{score}</span></div>
          </div>

          <AnimatePresence mode="wait">
            {currentQ ? (
              <motion.div key={currentQ.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="clay-card mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${currentQ.difficulty === 'hard' ? 'bg-red-100 text-red-600' : currentQ.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{currentQ.difficulty}</span>
                  <span className="text-gray-500 text-sm">{currentQ.category}</span>
                </div>
                <h2 className="text-xl font-semibold text-pv-plum mb-5">{currentQ.question}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                  {options.map((opt, i) => (
                    <button key={i} onClick={() => setSelected(opt)} disabled={showResult}
                      className={`p-4 rounded-xl border-2 text-left transition-all font-medium ${
                        selected === opt ? (showResult ? (opt === currentQ.correct_answer ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : 'border-pv-pink bg-pv-pink/10') 
                        : (showResult && opt === currentQ.correct_answer ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-pv-pink/50')
                      }`}>
                      {opt}
                    </button>
                  ))}
                </div>

                {showResult && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-xl mb-5 ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <p className="font-bold mb-1">{isCorrect ? '✅ Correct!' : '❌ Incorrect'}</p>
                    <p className="text-gray-700 text-sm">{currentQ.explanation}</p>
                  </motion.div>
                )}

                <div className="flex justify-between">
                  <ClayButton variant="ghost" onClick={() => { setQIndex(0); setScore(0); setXp(0); }}>Reset</ClayButton>
                  <ClayButton variant="primary" onClick={showResult ? nextQuestion : handleAnswer} disabled={!selected && !showResult}>
                    {showResult ? (qIndex + 1 >= shuffled.length ? 'Finish Session' : 'Next Question') : 'Submit Answer'}
                  </ClayButton>
                </div>
              </motion.div>
            ) : (
              <div className="text-center py-10 text-gray-500">Loading puzzles...</div>
            )}
          </AnimatePresence>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}