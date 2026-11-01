import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import ClayButton from '@/components/ClayButton';
import FoodCard from '@/components/FoodCard';
import { FOOD_CATALOG } from '@/lib/game-config';
import { useAuthStore } from '@/stores/authStore';
import { supabase, withRequestTimeout } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import type { FoodItem } from '@/types/database';

const typedDb = supabase as unknown as SupabaseClient;

const GRID_SIZE = 15;
type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

function getCalorieSpeedProfile(calories: number): {
  label: string;
  badgeColor: string;
  baseSpeedMs: number;
  minSpeedMs: number;
  xpPerBite: number;
  desc: string;
} {
  if (calories <= 100) {
    return {
      label: '🔥 Hard (Fast Snake)',
      badgeColor: 'bg-red-100 text-red-700 border-red-200',
      baseSpeedMs: 120,
      minSpeedMs: 75,
      xpPerBite: 20,
      desc: 'Low calories = Agile & Fast Snake! Double XP (+20 XP per bite)!',
    };
  }
  if (calories <= 210) {
    return {
      label: '⚡ Medium (Balanced Speed)',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      baseSpeedMs: 170,
      minSpeedMs: 105,
      xpPerBite: 15,
      desc: 'Medium calories = Balanced Snake speed (+15 XP per bite).',
    };
  }
  return {
    label: '🐢 Easy (Slow Heavy Snake)',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    baseSpeedMs: 230,
    minSpeedMs: 145,
    xpPerBite: 10,
    desc: 'High calories = Heavy & Slow Snake! Easier to steer (+10 XP per bite).',
  };
}

function formatPlayTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function FoodPage() {
  const { profile, updateProfile } = useAuthStore();
  const [activeMode, setActiveMode] = useState<'catalogue' | 'snake'>('snake');

  // Catalogue & Plate state
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [plate, setPlate] = useState<FoodItem[]>([]);
  const [eatingIndex, setEatingIndex] = useState<number | null>(null);

  const categories = ['All', ...Array.from(new Set(FOOD_CATALOG.map((f) => f.category)))];
  const filtered = FOOD_CATALOG.filter(
    (f) =>
      (filter === 'All' || f.category === filter) &&
      f.name.toLowerCase().includes(search.toLowerCase())
  );

  // Snake Arcade Game State
  const [snakeFood, setSnakeFood] = useState<FoodItem>(() => FOOD_CATALOG[0]);
  const [snake, setSnake] = useState<Point[]>([
    { x: 7, y: 7 },
    { x: 6, y: 7 },
    { x: 5, y: 7 },
  ]);
  const [foodPos, setFoodPos] = useState<Point>({ x: 10, y: 7 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const directionRef = useRef<Direction>('RIGHT');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [itemsEaten, setItemsEaten] = useState(0);
  const [snakeCalories, setSnakeCalories] = useState(0);
  const [snakeXp, setSnakeXp] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [savingSnake, setSavingSnake] = useState(false);
  const [sessionSaved, setSessionSaved] = useState(false);

  const speedProfile = getCalorieSpeedProfile(snakeFood?.calories || 150);

  const getRandomFoodPoint = useCallback((currentSnake: Point[]): Point => {
    while (true) {
      const candidate = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      const onSnake = currentSnake.some(
        (segment) => segment.x === candidate.x && segment.y === candidate.y
      );
      if (!onSnake) return candidate;
    }
  }, []);

  const startSnakeGame = () => {
    const initialSnake = [
      { x: 7, y: 7 },
      { x: 6, y: 7 },
      { x: 5, y: 7 },
    ];
    setSnake(initialSnake);
    setDirection('RIGHT');
    directionRef.current = 'RIGHT';
    setFoodPos(getRandomFoodPoint(initialSnake));
    setItemsEaten(0);
    setSnakeCalories(0);
    setSnakeXp(0);
    setElapsedSeconds(0);
    setIsGameOver(false);
    setSessionSaved(false);
    setIsPlaying(true);
  };

  // Live Playtime Stopwatch
  useEffect(() => {
    if (!isPlaying || isGameOver) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, isGameOver]);

  const changeDirection = useCallback((nextDir: Direction) => {
    const current = directionRef.current;
    if (nextDir === 'UP' && current !== 'DOWN') {
      directionRef.current = 'UP';
      setDirection('UP');
    } else if (nextDir === 'DOWN' && current !== 'UP') {
      directionRef.current = 'DOWN';
      setDirection('DOWN');
    } else if (nextDir === 'LEFT' && current !== 'RIGHT') {
      directionRef.current = 'LEFT';
      setDirection('LEFT');
    } else if (nextDir === 'RIGHT' && current !== 'LEFT') {
      directionRef.current = 'RIGHT';
      setDirection('RIGHT');
    }
  }, []);

  useEffect(() => {
    if (activeMode !== 'snake' || !isPlaying) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'arrowup' || key === 'w') {
        e.preventDefault();
        changeDirection('UP');
      } else if (key === 'arrowdown' || key === 's') {
        e.preventDefault();
        changeDirection('DOWN');
      } else if (key === 'arrowleft' || key === 'a') {
        e.preventDefault();
        changeDirection('LEFT');
      } else if (key === 'arrowright' || key === 'd') {
        e.preventDefault();
        changeDirection('RIGHT');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeMode, isPlaying, changeDirection]);

  // Main Snake Movement Loop with Calorie-Based Speed
  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    const currentSpeedMs = Math.max(
      speedProfile.minSpeedMs,
      speedProfile.baseSpeedMs - itemsEaten * 3
    );

    const timer = setInterval(() => {
      setSnake((prevSnake) => {
        const head = prevSnake[0];
        const dir = directionRef.current;
        const nextHead: Point = {
          x: dir === 'LEFT' ? head.x - 1 : dir === 'RIGHT' ? head.x + 1 : head.x,
          y: dir === 'UP' ? head.y - 1 : dir === 'DOWN' ? head.y + 1 : head.y,
        };

        if (
          nextHead.x < 0 ||
          nextHead.x >= GRID_SIZE ||
          nextHead.y < 0 ||
          nextHead.y >= GRID_SIZE
        ) {
          setIsPlaying(false);
          setIsGameOver(true);
          return prevSnake;
        }

        const hitSelf = prevSnake.some(
          (seg) => seg.x === nextHead.x && seg.y === nextHead.y
        );
        if (hitSelf) {
          setIsPlaying(false);
          setIsGameOver(true);
          return prevSnake;
        }

        const ateFood = nextHead.x === foodPos.x && nextHead.y === foodPos.y;
        if (ateFood) {
          const grownSnake = [nextHead, ...prevSnake];
          setItemsEaten((c) => c + 1);
          setSnakeCalories((cal) => cal + (snakeFood?.calories || 100));
          setSnakeXp((xp) => xp + speedProfile.xpPerBite);
          setFoodPos(getRandomFoodPoint(grownSnake));
          return grownSnake;
        }

        return [nextHead, ...prevSnake.slice(0, -1)];
      });
    }, currentSpeedMs);

    return () => clearInterval(timer);
  }, [isPlaying, isGameOver, itemsEaten, foodPos, snakeFood, speedProfile, getRandomFoodPoint]);

  const saveSnakeSessionToProfile = async () => {
    if (!profile || savingSnake || sessionSaved) return;
    const durationToSave = Math.max(5, elapsedSeconds);
    setSavingSnake(true);
    try {
      const newCals = Math.max(0, (profile.virtual_calories || 0) + snakeCalories);
      await updateProfile({
        virtual_calories: newCals,
        xp: (profile.xp || 0) + snakeXp,
        total_sessions: (profile.total_sessions || 0) + 1,
      });

      // Try inserting with duration_seconds first; fallback if column not added yet
      const payloadWithDuration = {
        user_id: profile.id,
        session_type: 'solo',
        total_calories_added: snakeCalories,
        total_calories_removed: 0,
        puzzles_attempted: 0,
        puzzles_correct: 0,
        xp_earned: snakeXp,
        duration_seconds: durationToSave,
      };

      const { error } = await withRequestTimeout(
        typedDb.from('game_sessions').insert(payloadWithDuration),
        15000,
        'Snake session save timed out'
      );

      if (error) {
        // Fallback without duration_seconds if SQL wasn't run yet
        await withRequestTimeout(
          typedDb.from('game_sessions').insert({
            user_id: profile.id,
            session_type: 'solo',
            total_calories_added: snakeCalories,
            total_calories_removed: 0,
            puzzles_attempted: 0,
            puzzles_correct: 0,
            xp_earned: snakeXp,
          }),
          15000,
          'Snake session save timed out'
        );
      }

      setSessionSaved(true);
      toast.success(
        `Saved! +${snakeCalories} Cal, +${snakeXp} XP & ${formatPlayTime(
          durationToSave
        )} Time Spent recorded! 🐍🎉`
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not save Snake game session.'
      );
    } finally {
      setSavingSnake(false);
    }
  };

  const addToPlate = () => {
    if (selected) {
      setPlate((items) => [...items, selected]);
      toast.success(`${selected.emoji} ${selected.name} added to your plate!`);
      setSelected(null);
    }
  };

  const eatFood = async (food: FoodItem, indexOnPlate: number) => {
    if (!profile || eatingIndex !== null) return;
    setEatingIndex(indexOnPlate);
    try {
      const newCals = Math.max(0, (profile.virtual_calories || 0) + food.calories);
      await updateProfile({
        virtual_calories: newCals,
        xp: (profile.xp || 0) + 5,
        total_sessions: (profile.total_sessions || 0) + 1,
      });

      const { error } = await withRequestTimeout(
        typedDb.from('game_sessions').insert({
          user_id: profile.id,
          session_type: 'solo',
          total_calories_added: food.calories,
          total_calories_removed: 0,
          puzzles_attempted: 0,
          puzzles_correct: 0,
          xp_earned: 5,
          duration_seconds: 15,
        }),
        15000,
        'Snack session save timed out'
      );

      if (error) {
        await withRequestTimeout(
          typedDb.from('game_sessions').insert({
            user_id: profile.id,
            session_type: 'solo',
            total_calories_added: food.calories,
            total_calories_removed: 0,
            puzzles_attempted: 0,
            puzzles_correct: 0,
            xp_earned: 5,
          }),
          15000,
          'Snack session save timed out'
        );
      }

      setPlate((items) => items.filter((_, itemIndex) => itemIndex !== indexOnPlate));
      toast.success(`Yum! Ate ${food.emoji} ${food.name} (+${food.calories} cal, +5 XP)!`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not save this snack session.'
      );
    } finally {
      setEatingIndex(null);
    }
  };

  return (
    <ProtectedRoute>
      <Layout title="Food & Snake Arcade">
        <div className="max-w-6xl mx-auto py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-poppins font-bold text-pv-plum">
                {activeMode === 'snake'
                  ? '🐍 Snake Eat & Grow Arcade'
                  : '🍔 Virtual Food Catalogue'}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Profile Calories:{' '}
                <strong className="text-pv-pink">
                  {profile?.virtual_calories ?? 0} cal
                </strong>{' '}
                • Total XP:{' '}
                <strong className="text-pv-plum">{profile?.xp ?? 0} XP</strong>
              </p>
            </div>

            <div className="flex gap-2 bg-white/70 p-1.5 rounded-2xl border border-purple-100 shadow-sm">
              <button
                type="button"
                onClick={() => setActiveMode('snake')}
                className={`px-4 py-2 rounded-xl font-bold text-sm transition ${
                  activeMode === 'snake'
                    ? 'bg-pv-pink text-white shadow'
                    : 'text-pv-plum hover:bg-purple-50'
                }`}
              >
                🐍 Play Snake Arcade
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  setActiveMode('catalogue');
                }}
                className={`px-4 py-2 rounded-xl font-bold text-sm transition ${
                  activeMode === 'catalogue'
                    ? 'bg-pv-pink text-white shadow'
                    : 'text-pv-plum hover:bg-purple-50'
                }`}
              >
                🍽️ Food Catalogue ({plate.length})
              </button>
            </div>
          </div>

          {activeMode === 'snake' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-5 space-y-5">
                <div className="clay-card p-5">
                  <h2 className="text-lg font-poppins font-bold text-pv-plum mb-1">
                    1. Choose Snack (Sets Snake Speed!)
                  </h2>
                  <p className="text-xs text-gray-500 mb-3">
                    <strong>Low Calories</strong> = Fast &amp; Hard Snake (More XP!) •{' '}
                    <strong>High Calories</strong> = Slow &amp; Easy Snake!
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
                    {FOOD_CATALOG.map((item) => {
                      const isChosen = snakeFood?.id === item.id;
                      const itemSpeed =
                        item.calories <= 100
                          ? '🔥 Fast'
                          : item.calories <= 210
                          ? '⚡ Med'
                          : '🐢 Slow';
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSnakeFood(item)}
                          className={`p-2.5 rounded-2xl border text-left transition flex flex-col items-center text-center ${
                            isChosen
                              ? 'border-pv-pink bg-pv-pink/10 ring-2 ring-pv-pink/30'
                              : 'border-gray-200 bg-white/80 hover:border-pv-pink/50'
                          }`}
                        >
                          <span className="text-2xl">{item.emoji}</span>
                          <span className="text-xs font-bold text-pv-plum mt-1 line-clamp-1">
                            {item.name}
                          </span>
                          <span className="text-[11px] text-pv-pink font-semibold">
                            {item.calories} cal • {itemSpeed}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Speed Difficulty & Live Stats Card */}
                <div className="glass-panel p-5 space-y-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-sm font-bold text-pv-plum">
                      Food: {snakeFood?.emoji} {snakeFood?.name} ({snakeFood?.calories} cal)
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${speedProfile.badgeColor}`}
                    >
                      {speedProfile.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">{speedProfile.desc}</p>

                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2.5 rounded-2xl bg-white/80 border border-purple-100">
                      <p className="text-[10px] uppercase font-bold text-gray-400">Eaten</p>
                      <p className="text-lg font-black text-pv-plum mt-0.5">
                        {itemsEaten} {snakeFood?.emoji}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-white/80 border border-purple-100">
                      <p className="text-[10px] uppercase font-bold text-gray-400">Calories</p>
                      <p className="text-lg font-black text-pv-pink mt-0.5">
                        +{snakeCalories}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-white/80 border border-purple-100">
                      <p className="text-[10px] uppercase font-bold text-gray-400">XP</p>
                      <p className="text-lg font-black text-emerald-600 mt-0.5">
                        +{snakeXp}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-white/80 border border-purple-100">
                      <p className="text-[10px] uppercase font-bold text-gray-400">Time</p>
                      <p className="text-lg font-black text-indigo-600 mt-0.5">
                        ⏱️ {formatPlayTime(elapsedSeconds)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {!isPlaying ? (
                      <ClayButton
                        variant="primary"
                        size="lg"
                        className="w-full"
                        onClick={startSnakeGame}
                      >
                        {isGameOver ? '🔄 Play Snake Again' : '▶️ Start Snake Game'}
                      </ClayButton>
                    ) : (
                      <ClayButton
                        variant="ghost"
                        size="md"
                        className="w-full"
                        onClick={() => {
                          setIsPlaying(false);
                          setIsGameOver(true);
                        }}
                      >
                        ⏹️ Stop &amp; Save Progress
                      </ClayButton>
                    )}

                    {(isGameOver || (!isPlaying && elapsedSeconds > 0)) && !sessionSaved && (
                      <ClayButton
                        variant="secondary"
                        size="lg"
                        className="w-full"
                        onClick={saveSnakeSessionToProfile}
                        disabled={savingSnake}
                      >
                        {savingSnake
                          ? 'Saving to Profile...'
                          : `💾 Save +${snakeCalories} Cal, +${snakeXp} XP & ${formatPlayTime(
                              elapsedSeconds
                            )} Time`}
                      </ClayButton>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Snake Board */}
              <div className="lg:col-span-7 flex flex-col items-center">
                <div className="clay-card p-4 sm:p-6 w-full flex flex-col items-center">
                  <div className="flex items-center justify-between w-full max-w-[420px] mb-3 text-xs font-bold text-pv-plum">
                    <span>🐍 Length: {snake.length}</span>
                    <span>{speedProfile.label}</span>
                    <span>⏱️ {formatPlayTime(elapsedSeconds)}</span>
                  </div>

                  <div
                    className="relative bg-pv-cream/90 border-4 border-pv-plum/20 rounded-2xl shadow-inner overflow-hidden"
                    style={{
                      width: 'min(100%, 405px)',
                      aspectRatio: '1 / 1',
                      display: 'grid',
                      gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                      gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                    }}
                  >
                    {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, idx) => {
                      const x = idx % GRID_SIZE;
                      const y = Math.floor(idx / GRID_SIZE);
                      const isHead = snake[0].x === x && snake[0].y === y;
                      const bodyIndex = snake.findIndex(
                        (seg, sIdx) => sIdx > 0 && seg.x === x && seg.y === y
                      );
                      const isFood = foodPos.x === x && foodPos.y === y;

                      return (
                        <div
                          key={idx}
                          className={`flex items-center justify-center border border-purple-100/40 select-none ${
                            isHead
                              ? 'bg-pv-pink text-white rounded-md shadow-sm font-bold text-xs sm:text-sm z-10'
                              : bodyIndex !== -1
                              ? 'bg-gradient-to-br from-emerald-400 to-teal-500 rounded-sm m-[1px]'
                              : ''
                          }`}
                        >
                          {isHead ? (
                            '👀'
                          ) : isFood ? (
                            <span className="text-base sm:text-lg animate-bounce">
                              {snakeFood?.emoji || '🍎'}
                            </span>
                          ) : null}
                        </div>
                      );
                    })}

                    {!isPlaying && (
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center text-white">
                        {isGameOver ? (
                          <>
                            <div className="text-4xl mb-2">💥🐍</div>
                            <h3 className="text-2xl font-poppins font-bold">Run Complete!</h3>
                            <p className="text-sm mt-1">
                              Ate <strong>{itemsEaten}</strong> {snakeFood?.name}s •{' '}
                              <strong>+{snakeCalories} cal</strong> •{' '}
                              <strong>+{snakeXp} XP</strong> • Time:{' '}
                              <strong>{formatPlayTime(elapsedSeconds)}</strong>
                            </p>
                            <div className="flex flex-wrap gap-3 justify-center mt-4">
                              {!sessionSaved && (
                                <button
                                  type="button"
                                  onClick={saveSnakeSessionToProfile}
                                  disabled={savingSnake}
                                  className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-bold shadow-lg hover:bg-emerald-600"
                                >
                                  {savingSnake
                                    ? 'Saving...'
                                    : '💾 Save Calories, XP & Time'}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={startSnakeGame}
                                className="px-5 py-2.5 rounded-xl bg-pv-pink text-white font-bold shadow-lg hover:opacity-95"
                              >
                                🔄 Play Again
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-5xl mb-2">🐍{snakeFood?.emoji}</div>
                            <h3 className="text-2xl font-poppins font-bold">
                              {snakeFood?.name} ({snakeFood?.calories} cal)
                            </h3>
                            <span className="mt-1 px-3 py-1 rounded-full bg-white/20 text-xs font-bold">
                              Mode: {speedProfile.label}
                            </span>
                            <p className="text-xs sm:text-sm max-w-xs mt-2 text-white/90">
                              {speedProfile.desc}
                            </p>
                            <button
                              type="button"
                              onClick={startSnakeGame}
                              className="mt-4 px-6 py-3 rounded-2xl bg-pv-pink text-white font-bold shadow-lg hover:scale-105 transition"
                            >
                              ▶️ Start Snake Arcade
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Mobile / On-Screen D-Pad Controls */}
                  <div className="mt-5 flex flex-col items-center gap-2">
                    <button
                      type="button"
                      onClick={() => changeDirection('UP')}
                      className="w-14 h-12 rounded-2xl bg-white border border-purple-200 shadow font-bold text-pv-plum active:scale-95"
                    >
                      ⬆️
                    </button>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => changeDirection('LEFT')}
                        className="w-14 h-12 rounded-2xl bg-white border border-purple-200 shadow font-bold text-pv-plum active:scale-95"
                      >
                        ⬅️
                      </button>
                      <button
                        type="button"
                        onClick={() => changeDirection('DOWN')}
                        className="w-14 h-12 rounded-2xl bg-white border border-purple-200 shadow font-bold text-pv-plum active:scale-95"
                      >
                        ⬇️
                      </button>
                      <button
                        type="button"
                        onClick={() => changeDirection('RIGHT')}
                        className="w-14 h-12 rounded-2xl bg-white border border-purple-200 shadow font-bold text-pv-plum active:scale-95"
                      >
                        ➡️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <input
                  type="text"
                  placeholder="Search snacks..."
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pv-pink outline-none"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="flex gap-2 flex-wrap">
                  {categories.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFilter(c)}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        filter === c ? 'bg-pv-pink text-white' : 'bg-white text-gray-600'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {plate.length > 0 && (
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="glass-panel mb-8 border-2 border-pv-pink/30"
                >
                  <h2 className="text-xl font-bold text-pv-plum mb-3">
                    🍽️ Your Plate ({plate.length} items ready to eat)
                  </h2>
                  <div className="flex gap-3 flex-wrap mb-4">
                    {plate.map((f, i) => (
                      <div
                        key={`${f.id}-${i}`}
                        className="bg-pv-cream px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm border border-purple-100"
                      >
                        <span className="text-xl">{f.emoji}</span>
                        <span className="text-sm font-semibold text-pv-plum">
                          {f.name} ({f.calories} cal)
                        </span>
                        <button
                          type="button"
                          disabled={eatingIndex !== null}
                          onClick={() => void eatFood(f, i)}
                          className="px-3 py-1 rounded-lg bg-pv-pink text-white text-xs font-bold shadow hover:opacity-90 disabled:opacity-50"
                        >
                          {eatingIndex === i ? 'Eating...' : 'Eat Now 😋'}
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    Note: Virtual Calories are gameplay points only. They do not represent real
                    nutrition.
                  </p>
                </motion.div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">
                {filtered.map((f) => (
                  <FoodCard key={f.id} food={f} onClick={() => setSelected(f)} />
                ))}
              </div>

              <AnimatePresence>
                {selected && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center p-4"
                    onClick={() => setSelected(null)}
                  >
                    <motion.div
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-glass space-y-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="text-6xl text-center">{selected.emoji}</div>
                      <h2 className="text-2xl font-bold text-pv-plum text-center">
                        {selected.name}
                      </h2>
                      <p className="text-center text-gray-600">
                        {selected.calories} Virtual Calories
                      </p>
                      <div className="flex flex-col gap-2.5">
                        <ClayButton
                          variant="primary"
                          size="md"
                          className="w-full"
                          onClick={() => {
                            setSnakeFood(selected);
                            setSelected(null);
                            setActiveMode('snake');
                          }}
                        >
                          🐍 Feed {selected.name} to Snake
                        </ClayButton>
                        <div className="flex gap-3">
                          <ClayButton
                            variant="ghost"
                            size="md"
                            className="flex-1"
                            onClick={() => setSelected(null)}
                          >
                            Cancel
                          </ClayButton>
                          <ClayButton
                            variant="secondary"
                            size="md"
                            className="flex-1"
                            onClick={addToPlate}
                          >
                            + Add to Plate
                          </ClayButton>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
