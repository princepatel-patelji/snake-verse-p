import React, { useState, useEffect, useMemo } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import ClayButton from '@/components/ClayButton';
import { PUZZLE_BANK } from '@/lib/game-config';
import { useAuthStore } from '@/stores/authStore';
import { supabase, withRequestTimeout } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import type { PuzzleQuestion } from '@/types/database';

const typedDb = supabase as unknown as SupabaseClient;

const C_PROGRAMMING_BANK: PuzzleQuestion[] = [
  // EASY
  {
    id: 'c_easy_1',
    question: 'Who is the creator of the C programming language?',
    options: ['Dennis Ritchie', 'Bjarne Stroustrup', 'James Gosling', 'Guido van Rossum'],
    correct_answer: 'Dennis Ritchie',
    difficulty: 'easy',
    category: 'C Programming',
    xp_reward: 15,
    calorie_reward: 60,
    explanation: 'Dennis Ritchie developed the C language at Bell Labs in 1972.',
  },
  {
    id: 'c_easy_2',
    question: 'Every C program must contain which mandatory function as its entry point?',
    options: ['main()', 'start()', 'init()', 'program()'],
    correct_answer: 'main()',
    difficulty: 'easy',
    category: 'C Programming',
    xp_reward: 15,
    calorie_reward: 60,
    explanation: 'Execution of every standard C program begins at the main() function.',
  },
  {
    id: 'c_easy_3',
    question: 'Which format specifier is used to print an integer (int) value using printf() in C?',
    options: ['%d', '%f', '%c', '%s'],
    correct_answer: '%d',
    difficulty: 'easy',
    category: 'C Programming',
    xp_reward: 15,
    calorie_reward: 60,
    explanation: '%d (or %i) prints a signed decimal integer in C.',
  },
  {
    id: 'c_easy_4',
    question: 'Which symbol is used to terminate a statement in C?',
    options: ['Semicolon (;)', 'Colon (:)', 'Period (.)', 'Comma (,)'],
    correct_answer: 'Semicolon (;)',
    difficulty: 'easy',
    category: 'C Programming',
    xp_reward: 15,
    calorie_reward: 60,
    explanation: 'In C, every individual statement ends with a semicolon (;).',
  },
  {
    id: 'c_easy_5',
    question: 'Which of the following is the smallest individual unit in a C program?',
    options: ['C Token', 'Function', 'Header File', 'Structure'],
    correct_answer: 'C Token',
    difficulty: 'easy',
    category: 'C Programming',
    xp_reward: 15,
    calorie_reward: 60,
    explanation: 'Tokens (keywords, identifiers, constants, strings, operators) are the smallest building blocks in C.',
  },
  {
    id: 'c_easy_6',
    question: 'Which header file is required to use printf() and scanf() functions in C?',
    options: ['<stdio.h>', '<conio.h>', '<stdlib.h>', '<math.h>'],
    correct_answer: '<stdio.h>',
    difficulty: 'easy',
    category: 'C Programming',
    xp_reward: 15,
    calorie_reward: 60,
    explanation: '<stdio.h> stands for Standard Input Output header file.',
  },
  {
    id: 'c_easy_7',
    question: 'Which of the following is a valid single-line comment in C (C99 and later)?',
    options: ['// comment', '## comment', '-- comment', '<!-- comment -->'],
    correct_answer: '// comment',
    difficulty: 'easy',
    category: 'C Programming',
    xp_reward: 15,
    calorie_reward: 60,
    explanation: '// is used for single-line comments, while /* ... */ is used for multi-line comments.',
  },

  // MEDIUM
  {
    id: 'c_med_1',
    question: 'What is the index number of the first element in a C array?',
    options: ['0', '1', '-1', 'Depends on compiler'],
    correct_answer: '0',
    difficulty: 'medium',
    category: 'C Programming',
    xp_reward: 25,
    calorie_reward: 110,
    explanation: 'C uses zero-based indexing, so arr[0] refers to the first element.',
  },
  {
    id: 'c_med_2',
    question: 'Which operator is used to get the memory address of a variable in C?',
    options: ['& (Ampersand)', '* (Asterisk)', '-> (Arrow)', '# (Hash)'],
    correct_answer: '& (Ampersand)',
    difficulty: 'medium',
    category: 'C Programming',
    xp_reward: 25,
    calorie_reward: 110,
    explanation: 'The address-of operator (&) returns the memory address of its operand.',
  },
  {
    id: 'c_med_3',
    question: 'Which loop in C is guaranteed to execute its body at least once even if the condition is false?',
    options: ['do-while loop', 'while loop', 'for loop', 'foreach loop'],
    correct_answer: 'do-while loop',
    difficulty: 'medium',
    category: 'C Programming',
    xp_reward: 25,
    calorie_reward: 110,
    explanation: 'do-while is an exit-controlled loop that checks the condition after executing the loop body.',
  },
  {
    id: 'c_med_4',
    question: 'What is the output of: printf("%d", 5 / 2); in C?',
    options: ['2', '2.5', '3', 'Compiler Error'],
    correct_answer: '2',
    difficulty: 'medium',
    category: 'C Programming',
    xp_reward: 25,
    calorie_reward: 110,
    explanation: 'Integer division in C truncates the fractional part, so 5 / 2 evaluates to 2.',
  },
  {
    id: 'c_med_5',
    question: 'What character automatically marks the end of a string (char array) in C?',
    options: ["'\\0' (Null character)", "'\\n' (Newline)", "'\\t' (Tab)", 'EOF'],
    correct_answer: "'\\0' (Null character)",
    difficulty: 'medium',
    category: 'C Programming',
    xp_reward: 25,
    calorie_reward: 110,
    explanation: "C strings are terminated by the null character '\\0' (ASCII value 0).",
  },
  {
    id: 'c_med_6',
    question: 'Which keyword is used to preserve a local variable value between multiple function calls?',
    options: ['static', 'auto', 'register', 'extern'],
    correct_answer: 'static',
    difficulty: 'medium',
    category: 'C Programming',
    xp_reward: 25,
    calorie_reward: 110,
    explanation: 'A static local variable retains its value in memory across function invocations.',
  },

  // HARD
  {
    id: 'c_hard_1',
    question: 'Which dynamic memory allocation function initializes all allocated bytes to zero?',
    options: ['calloc()', 'malloc()', 'realloc()', 'free()'],
    correct_answer: 'calloc()',
    difficulty: 'hard',
    category: 'C Programming',
    xp_reward: 40,
    calorie_reward: 180,
    explanation: 'calloc() allocates contiguous memory blocks and zero-initializes every byte, unlike malloc().',
  },
  {
    id: 'c_hard_2',
    question: 'What is a pointer that points to a memory location that has already been deallocated (freed)?',
    options: ['Dangling Pointer', 'Void Pointer', 'Null Pointer', 'Wild Pointer'],
    correct_answer: 'Dangling Pointer',
    difficulty: 'hard',
    category: 'C Programming',
    xp_reward: 40,
    calorie_reward: 180,
    explanation: 'When memory is freed using free(ptr) without setting ptr = NULL, ptr becomes a dangling pointer.',
  },
  {
    id: 'c_hard_3',
    question: 'In a C union, how is memory allocated for its members?',
    options: [
      'Equal to the size of its largest member',
      'Sum of sizes of all members',
      'Always 64 bytes',
      'Allocated on the heap automatically',
    ],
    correct_answer: 'Equal to the size of its largest member',
    difficulty: 'hard',
    category: 'C Programming',
    xp_reward: 40,
    calorie_reward: 180,
    explanation: 'All members of a union share the same memory space, sized to hold the largest member.',
  },
  {
    id: 'c_hard_4',
    question: 'What does the operator "->" (arrow operator) do in C?',
    options: [
      'Accesses structure/union members through a pointer',
      'Performs bitwise right shift',
      'Declares a function pointer return type',
      'Dereferences a void array',
    ],
    correct_answer: 'Accesses structure/union members through a pointer',
    difficulty: 'hard',
    category: 'C Programming',
    xp_reward: 40,
    calorie_reward: 180,
    explanation: 'ptr->member is shorthand for (*ptr).member when accessing struct fields via a pointer.',
  },
  {
    id: 'c_hard_5',
    question: 'What is the time complexity of accessing an element in a 1D C array by its index (arr[i])?',
    options: ['O(1)', 'O(n)', 'O(log n)', 'O(n^2)'],
    correct_answer: 'O(1)',
    difficulty: 'hard',
    category: 'C Programming',
    xp_reward: 40,
    calorie_reward: 180,
    explanation: 'C arrays use contiguous memory, so *(arr + i) computes the address in constant O(1) time.',
  },
];

type SubjectMode = 'c_lang' | 'random';
type DifficultyMode = 'all' | 'easy' | 'medium' | 'hard';

const QUESTION_TIME_LIMIT = 20;

function formatElapsed(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function PuzzlePage() {
  const { profile, updateProfile } = useAuthStore();

  const [subject, setSubject] = useState<SubjectMode>('c_lang');
  const [difficulty, setDifficulty] = useState<DifficultyMode>('all');
  // Incremented ONLY when a full session is saved/reset so questions never repeat mid-session
  const [sessionRound, setSessionRound] = useState(0);

  const [currentQ, setCurrentQ] = useState<PuzzleQuestion | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [hiddenOptions, setHiddenOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const [score, setScore] = useState(0);
  const [xp, setXp] = useState(0);
  const [qIndex, setQIndex] = useState(0);
  const [attemptedCount, setAttemptedCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [savingSession, setSavingSession] = useState(false);
  const [sessionCompleteModal, setSessionCompleteModal] = useState(false);

  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT);
  const [timerPaused, setTimerPaused] = useState(false);
  const [lifeline5050, setLifeline5050] = useState(2);
  const [lifelineFreeze, setLifelineFreeze] = useState(2);
  const [lifelineSkip, setLifelineSkip] = useState(2);

  // Deduplicated & Shuffled Deck — Locked for the current sessionRound so NO question repeats
  const shuffled = useMemo(() => {
    const rawBank =
      subject === 'c_lang' ? C_PROGRAMMING_BANK : [...PUZZLE_BANK, ...C_PROGRAMMING_BANK];

    // Deduplicate by question ID and question text
    const seen = new Set<string>();
    const uniqueBank: PuzzleQuestion[] = [];
    for (const item of rawBank) {
      const key = `${item.id}::${item.question.trim().toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueBank.push(item);
      }
    }

    const filtered =
      difficulty === 'all'
        ? uniqueBank
        : uniqueBank.filter((q) => q.difficulty === difficulty);

    const pool = filtered.length > 0 ? filtered : uniqueBank;
    // Fisher-Yates shuffle
    const copy = [...pool];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, difficulty, sessionRound]);

  // Total session playtime counter
  useEffect(() => {
    if (sessionCompleteModal || timerPaused) return;
    const interval = setInterval(() => {
      setSessionSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionCompleteModal, timerPaused]);

  const startFreshSession = () => {
    setSessionCompleteModal(false);
    setQIndex(0);
    setScore(0);
    setXp(0);
    setAttemptedCount(0);
    setCorrectCount(0);
    setStreak(0);
    setSessionSeconds(0);
    setLifeline5050(2);
    setLifelineFreeze(2);
    setLifelineSkip(2);
    setSessionRound((r) => r + 1);
  };

  useEffect(() => {
    if (qIndex < shuffled.length) {
      const nextQ = shuffled[qIndex];
      setCurrentQ(nextQ);
      setOptions([...nextQ.options].sort(() => Math.random() - 0.5));
      setHiddenOptions([]);
      setSelected(null);
      setShowResult(false);
      setIsCorrect(false);
      setTimeLeft(QUESTION_TIME_LIMIT);
      setTimerPaused(false);
    }
  }, [qIndex, shuffled]);

  useEffect(() => {
    if (!currentQ || showResult || timerPaused || sessionCompleteModal) return;
    if (timeLeft <= 0) {
      setShowResult(true);
      setIsCorrect(false);
      setStreak(0);
      setAttemptedCount((c) => c + 1);
      toast.error(`⏰ Time's up! Correct answer: ${currentQ.correct_answer}`);
      return;
    }
    const t = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, currentQ, showResult, timerPaused, sessionCompleteModal]);

  const use5050Lifeline = () => {
    if (!currentQ || showResult || lifeline5050 <= 0 || hiddenOptions.length > 0) return;
    const wrongOpts = options.filter((o) => o !== currentQ.correct_answer);
    setHiddenOptions(wrongOpts.slice(0, 2));
    setLifeline5050((c) => c - 1);
    toast.success('💡 50:50 Lifeline used!');
  };

  const useFreezeLifeline = () => {
    if (showResult || lifelineFreeze <= 0) return;
    setTimeLeft((t) => t + 15);
    setLifelineFreeze((c) => c - 1);
    toast.success('❄️ +15 Seconds added!');
  };

  const useSkipLifeline = () => {
    if (showResult || lifelineSkip <= 0) return;
    setLifelineSkip((c) => c - 1);
    if (qIndex + 1 < shuffled.length) {
      setQIndex((q) => q + 1);
      toast.success('⏭️ Skipped to next unique question!');
    } else {
      setSessionCompleteModal(true);
    }
  };

  const handleAnswer = async () => {
    if (!selected || !currentQ || showResult) return;
    setShowResult(true);
    setAttemptedCount((c) => c + 1);
    const correct = selected === currentQ.correct_answer;
    setIsCorrect(correct);

    if (correct) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      const speedBonus = timeLeft >= 12 ? 5 : 0;
      const streakBonus = nextStreak >= 3 ? 10 : nextStreak === 2 ? 5 : 0;
      const totalQuestionXp = currentQ.xp_reward + speedBonus + streakBonus;

      setScore((s) => s + currentQ.calorie_reward);
      setXp((x) => x + totalQuestionXp);
      setCorrectCount((count) => count + 1);

      toast.success(
        `✅ Correct! +${totalQuestionXp} XP ${
          nextStreak >= 2 ? `(🔥 ${nextStreak}x Streak!)` : ''
        }`
      );
    } else {
      setStreak(0);
      toast.error(`Oops! The answer was: ${currentQ.correct_answer}`);
    }

    if (profile) {
      try {
        await withRequestTimeout(
          typedDb.from('puzzle_attempts').insert({
            user_id: profile.id,
            question_id: currentQ.id,
            selected_answer: selected,
            is_correct: correct,
            xp_earned: correct ? currentQ.xp_reward : 0,
          }),
          15000,
          'Puzzle attempt save timed out'
        );
      } catch {
        // Ignore if custom C ID is not in static table
      }
    }
  };

  const saveAndFinishSession = async () => {
    if (savingSession) return;
    setSavingSession(true);
    const durationToSave = Math.max(5, sessionSeconds);

    try {
      if (profile && (attemptedCount > 0 || xp > 0)) {
        const newCals = Math.max(0, (profile.virtual_calories || 0) - score);
        const newXp = (profile.xp || 0) + xp;
        await updateProfile({
          virtual_calories: newCals,
          xp: newXp,
          total_puzzles_solved: (profile.total_puzzles_solved || 0) + correctCount,
          total_sessions: (profile.total_sessions || 0) + 1,
        });

        const payloadWithDuration = {
          user_id: profile.id,
          session_type: 'solo',
          total_calories_added: 0,
          total_calories_removed: score,
          puzzles_attempted: Math.max(1, attemptedCount),
          puzzles_correct: correctCount,
          xp_earned: xp,
          duration_seconds: durationToSave,
        };

        const { error } = await withRequestTimeout(
          typedDb.from('game_sessions').insert(payloadWithDuration),
          15000,
          'Puzzle session save timed out'
        );

        if (error) {
          await withRequestTimeout(
            typedDb.from('game_sessions').insert({
              user_id: profile.id,
              session_type: 'solo',
              total_calories_added: 0,
              total_calories_removed: score,
              puzzles_attempted: Math.max(1, attemptedCount),
              puzzles_correct: correctCount,
              xp_earned: xp,
            }),
            15000,
            'Puzzle session save timed out'
          );
        }
      }

      toast.success(
        `🎉 Saved! +${xp} XP, -${score} Cal & ${formatElapsed(
          durationToSave
        )} Time Spent recorded!`
      );
      setSessionCompleteModal(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save session.');
    } finally {
      setSavingSession(false);
    }
  };

  const nextQuestion = async () => {
    if (qIndex + 1 >= shuffled.length) {
      await saveAndFinishSession();
    } else {
      setQIndex((q) => q + 1);
    }
  };

  return (
    <ProtectedRoute>
      <Layout title="Puzzle Challenge">
        <div className="max-w-3xl mx-auto py-4 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-poppins font-bold text-pv-plum">
                🧩 Puzzle &amp; Coding Arena
              </h1>
              <p className="text-xs sm:text-sm text-gray-600">
                No repeated questions in a session • Save anytime to record XP &amp; Time Spent!
              </p>
            </div>
            <div className="glass-panel px-4 py-2.5 flex flex-wrap items-center gap-3 text-xs sm:text-sm">
              <span className="text-pv-pink font-bold">⭐ +{xp} XP</span>
              <span>•</span>
              <span className="text-emerald-600 font-bold">🔥 -{score} cal</span>
              <span>•</span>
              <span className="text-indigo-600 font-bold">
                ⏱️ {formatElapsed(sessionSeconds)}
              </span>
            </div>
          </div>

          {/* Subject & Difficulty Selector */}
          <div className="clay-card p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase text-gray-400 mb-1.5">
                  1. Choose Subject
                </p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setSubject('c_lang');
                      startFreshSession();
                    }}
                    className={`px-4 py-2 rounded-xl font-bold text-sm transition flex items-center gap-2 ${
                      subject === 'c_lang'
                        ? 'bg-pv-pink text-white shadow'
                        : 'bg-white text-pv-plum border border-purple-100 hover:bg-purple-50'
                    }`}
                  >
                    <span>💻</span>
                    <span>C Programming</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSubject('random');
                      startFreshSession();
                    }}
                    className={`px-4 py-2 rounded-xl font-bold text-sm transition flex items-center gap-2 ${
                      subject === 'random'
                        ? 'bg-pv-pink text-white shadow'
                        : 'bg-white text-pv-plum border border-purple-100 hover:bg-purple-50'
                    }`}
                  >
                    <span>🎲</span>
                    <span>Random Mix</span>
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-gray-400 mb-1.5">
                  2. Choose Difficulty
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {(
                    [
                      { id: 'all', label: 'All' },
                      { id: 'easy', label: '🟢 Easy' },
                      { id: 'medium', label: '🟡 Medium' },
                      { id: 'hard', label: '🔴 Hard' },
                    ] as { id: DifficultyMode; label: string }[]
                  ).map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        setDifficulty(d.id);
                        startFreshSession();
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                        difficulty === d.id
                          ? 'bg-pv-plum text-white shadow-sm'
                          : 'bg-white text-gray-600 border border-gray-200 hover:border-pv-plum'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-purple-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={use5050Lifeline}
                  disabled={showResult || lifeline5050 <= 0 || hiddenOptions.length > 0}
                  className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 disabled:opacity-40 text-amber-900 font-bold text-xs"
                >
                  💡 50:50 ({lifeline5050})
                </button>
                <button
                  type="button"
                  onClick={useFreezeLifeline}
                  disabled={showResult || lifelineFreeze <= 0}
                  className="px-3 py-1.5 rounded-xl bg-sky-100 hover:bg-sky-200 disabled:opacity-40 text-sky-900 font-bold text-xs"
                >
                  ❄️ +15s ({lifelineFreeze})
                </button>
                <button
                  type="button"
                  onClick={useSkipLifeline}
                  disabled={showResult || lifelineSkip <= 0}
                  className="px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 disabled:opacity-40 text-purple-900 font-bold text-xs"
                >
                  ⏭️ Skip ({lifelineSkip})
                </button>
              </div>

              {attemptedCount > 0 && !sessionCompleteModal && (
                <button
                  type="button"
                  onClick={() => void saveAndFinishSession()}
                  disabled={savingSession}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow"
                >
                  {savingSession ? 'Saving...' : '💾 Save Progress & Finish Now'}
                </button>
              )}
            </div>
          </div>

          {sessionCompleteModal ? (
            <div className="clay-card p-8 text-center space-y-5 border-2 border-emerald-400">
              <div className="text-5xl">🏆🎉</div>
              <h2 className="text-3xl font-poppins font-bold text-pv-plum">
                Session Saved Successfully!
              </h2>
              <p className="text-sm text-gray-600">
                All your stats, XP, burned calories, and time spent have been synced to your
                profile. Ready for a fresh round of questions?
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-2xl bg-purple-50">
                  <p className="text-xs text-gray-500">Solved</p>
                  <p className="text-xl font-black text-pv-plum">
                    {correctCount} / {attemptedCount}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50">
                  <p className="text-xs text-gray-500">XP Earned</p>
                  <p className="text-xl font-black text-pv-pink">+{xp} XP</p>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50">
                  <p className="text-xs text-gray-500">Calories Burned</p>
                  <p className="text-xl font-black text-emerald-600">-{score} cal</p>
                </div>
                <div className="p-3 rounded-2xl bg-indigo-50">
                  <p className="text-xs text-gray-500">Time Spent</p>
                  <p className="text-xl font-black text-indigo-600">
                    ⏱️ {formatElapsed(sessionSeconds)}
                  </p>
                </div>
              </div>
              <ClayButton
                variant="primary"
                size="lg"
                onClick={startFreshSession}
                className="w-full sm:w-auto"
              >
                🔄 Start New Session (Reshuffle Questions)
              </ClayButton>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {currentQ ? (
                <motion.div
                  key={`${currentQ.id}-${qIndex}-${sessionRound}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="clay-card mb-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                          currentQ.difficulty === 'hard'
                            ? 'bg-red-100 text-red-600'
                            : currentQ.difficulty === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {currentQ.difficulty}
                      </span>
                      <span className="text-pv-plum font-semibold text-sm">
                        {currentQ.category}
                      </span>
                      <span className="text-xs font-bold text-pv-pink">
                        (Unique Q {qIndex + 1} of {shuffled.length})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setTimerPaused((p) => !p)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold"
                      >
                        {timerPaused ? '▶️ Resume' : '⏸️ Pause'}
                      </button>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                          timeLeft <= 5
                            ? 'bg-red-100 text-red-600 animate-pulse'
                            : 'bg-purple-100 text-pv-plum'
                        }`}
                      >
                        ⏱️ {timeLeft}s
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-5">
                    <div
                      className={`h-full transition-all duration-500 ${
                        timeLeft <= 5
                          ? 'bg-red-500'
                          : 'bg-gradient-to-r from-pv-pink to-pv-lavender'
                      }`}
                      style={{
                        width: `${Math.min(100, (timeLeft / QUESTION_TIME_LIMIT) * 100)}%`,
                      }}
                    />
                  </div>

                  <h2 className="text-xl font-semibold text-pv-plum mb-5 leading-snug">
                    {currentQ.question}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                    {options.map((opt, i) => {
                      if (hiddenOptions.includes(opt)) {
                        return (
                          <div
                            key={i}
                            className="p-4 rounded-xl border-2 border-dashed border-gray-200 text-gray-300 text-sm flex items-center justify-center select-none"
                          >
                            50:50 Removed
                          </div>
                        );
                      }

                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelected(opt)}
                          disabled={showResult}
                          className={`p-4 rounded-xl border-2 text-left transition-all font-medium ${
                            selected === opt
                              ? showResult
                                ? opt === currentQ.correct_answer
                                  ? 'border-green-500 bg-green-50 text-green-900'
                                  : 'border-red-500 bg-red-50 text-red-900'
                                : 'border-pv-pink bg-pv-pink/10 text-pv-plum'
                              : showResult && opt === currentQ.correct_answer
                              ? 'border-green-500 bg-green-50 text-green-900'
                              : 'border-gray-200 hover:border-pv-pink/50'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {showResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-xl mb-5 ${
                        isCorrect
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-red-50 border border-red-200'
                      }`}
                    >
                      <p className="font-bold mb-1">
                        {isCorrect ? '✅ Correct!' : '❌ Incorrect'}
                      </p>
                      <p className="text-gray-700 text-sm">{currentQ.explanation}</p>
                    </motion.div>
                  )}

                  <div className="flex justify-between items-center">
                    <ClayButton variant="ghost" onClick={startFreshSession}>
                      🔄 New Session
                    </ClayButton>
                    <ClayButton
                      variant="primary"
                      onClick={showResult ? nextQuestion : handleAnswer}
                      disabled={!selected && !showResult || savingSession}
                    >
                      {showResult
                        ? qIndex + 1 >= shuffled.length
                          ? '🏆 Save & Finish Session'
                          : 'Next Unique Question →'
                        : 'Submit Answer'}
                    </ClayButton>
                  </div>
                </motion.div>
              ) : (
                <div className="text-center py-10 text-gray-500">Loading puzzles...</div>
              )}
            </AnimatePresence>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
