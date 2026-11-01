import React from 'react';
import Head from 'next/head';
import Layout from '@/components/Layout';
import ClayButton from '@/components/ClayButton';
import { motion } from 'motion/react';
import Link from 'next/link';

export default function Home() {
  return (
    <Layout title="Home">
      <Head>
        <title>Prince&apos;s SnackVerse - Eat. Play. Puzzle. Repeat!</title>
      </Head>
      <div className="min-h-[75vh] flex flex-col items-center justify-center text-center py-10">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-amber-100 text-pv-plum font-bold text-xs sm:text-sm mb-4 shadow-sm">
            🐍 Real Snake Arcade • 💻 C Programming Quiz • 👥 Social Clubs
          </span>
          <h1 className="text-5xl md:text-7xl font-poppins font-bold text-transparent bg-clip-text bg-gradient-to-r from-pv-pink to-pv-lavender">
            Prince&apos;s SnackVerse
          </h1>
          <p className="text-xl md:text-2xl font-quicksand text-pv-plum mt-3 font-medium">
            Eat. Play. Puzzle. Repeat!
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link href="/auth/register">
            <ClayButton variant="primary" size="xl" icon={<span>🚀</span>}>
              Create Account
            </ClayButton>
          </Link>
          <Link href="/auth/login">
            <ClayButton variant="glass" size="xl" icon={<span>🎮</span>}>
              Start Playing (Login)
            </ClayButton>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 w-full max-w-4xl"
        >
          {[
            {
              e: '🐍',
              t: 'Snake Arcade & Food',
              d: 'Pick your favorite snack (Apple, Burger, Pizza), feed the moving snake to grow longer, and gain Virtual Calories!',
            },
            {
              e: '💻',
              t: 'C & Random Puzzles',
              d: 'Choose C Programming (Easy, Medium, Hard) or Random Mix with 50:50 lifelines, timers, and combo streaks!',
            },
            {
              e: '👥',
              t: 'Social Gaming & Help',
              d: 'Join communities, inspect friend levels & time spent, and get instant A-to-Z guide or WhatsApp help anytime.',
            },
          ].map((c, i) => (
            <div key={i} className="glass-panel text-center p-6">
              <div className="text-4xl mb-2">{c.e}</div>
              <h3 className="font-poppins font-semibold text-pv-plum text-lg">{c.t}</h3>
              <p className="text-gray-600 text-sm mt-1">{c.d}</p>
            </div>
          ))}
        </motion.div>

        {/* Quick A-to-Z Onboarding Strip on the Very First Page */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 w-full max-w-4xl glass-panel p-6 text-left"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <h2 className="text-lg font-poppins font-bold text-pv-plum">
              📘 Quick Start Guide (How to Play)
            </h2>
            <span className="text-xs text-gray-500">
              Click &quot;❓ Help &amp; Guide&quot; in the top bar anytime for WhatsApp support!
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white/70 border border-purple-100">
              <p className="font-bold text-pv-pink">1. Register &amp; Login</p>
              <p className="text-gray-600 mt-1">
                Create your account, verify your email if prompted, and log in.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/70 border border-purple-100">
              <p className="font-bold text-pv-pink">2. Feed the Snake</p>
              <p className="text-gray-600 mt-1">
                Choose a food item, steer the snake to eat it, grow longer &amp; earn calories.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/70 border border-purple-100">
              <p className="font-bold text-pv-pink">3. C &amp; Trivia Quizzes</p>
              <p className="text-gray-600 mt-1">
                Pick C Language or Random mode, choose Easy/Medium/Hard &amp; win XP.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/70 border border-purple-100">
              <p className="font-bold text-pv-pink">4. Compete with Friends</p>
              <p className="text-gray-600 mt-1">
                Join clubs with invite codes and check friends&apos; level &amp; time spent.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
