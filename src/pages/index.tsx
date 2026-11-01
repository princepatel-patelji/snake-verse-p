import React, { useState } from 'react';
import Head from 'next/head';
import Layout from '@/components/Layout';
import ClayButton from '@/components/ClayButton';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import toast from 'react-hot-toast';

// 👉 PRINCE BHAI: Yahan '91' ke aage apna 10-digit WhatsApp number likh dena
const WHATSAPP_NUMBER = '917268842331';

const FULL_GUIDE_STEPS = [
  {
    step: 'Step 1',
    emoji: '📝',
    title: 'Register & Login Account',
    desc: 'Click on "Create Account", fill in your Display Name, Username, Email, and Password. Verify your email link if prompted, then log in to open your Dashboard.',
  },
  {
    step: 'Step 2',
    emoji: '🐍',
    title: 'Feed the Snake (Calorie-Based Speed!)',
    desc: 'Go to the Food page! Low-calorie healthy foods (like Apple 60 cal) make the snake FAST & HARD with bonus XP! High-calorie heavy foods (like Burger 250 cal or Pizza 300 cal) make the snake SLOW & EASY to control! Eat snacks to grow longer and click Save to add Calories, XP & Time Spent to your profile.',
  },
  {
    step: 'Step 3',
    emoji: '💻',
    title: 'C Programming & Random Quizzes',
    desc: 'Go to Puzzle Challenge! Choose "C Programming" or "Random Mix" and select Easy, Medium, or Hard. Questions never repeat during a session! Use 50:50 lifelines and click "Save Progress" anytime to save your XP and Time Spent.',
  },
  {
    step: 'Step 4',
    emoji: '👥',
    title: 'Communities & Friends Live Stats',
    desc: 'Join or create a Community with an Invite Code, and add Friends by username. Click any Friend or Community card to view their Level, XP, Total Time Spent, and recent games!',
  },
];

export default function Home() {
  const [guideOpen, setGuideOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'guide' | 'whatsapp'>('guide');
  const [userName, setUserName] = useState('');
  const [issueCategory, setIssueCategory] = useState('Login / Registration Help');
  const [issueText, setIssueText] = useState('');

  const handleWhatsAppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueText.trim()) {
      toast.error('Please describe your problem first.');
      return;
    }
    const text = [
      `🍔 *Prince's SnackVerse - Support Request*`,
      `👤 *Name:* ${userName.trim() || 'Player'}`,
      `📌 *Issue:* ${issueCategory}`,
      `💬 *Details:* ${issueText.trim()}`,
    ].join('\n');

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener,noreferrer'
    );
    toast.success('Opening WhatsApp chat...');
  };

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
            🐍 Calorie-Speed Snake Arcade • 💻 C Programming Quiz • 👥 Live Time Tracking
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
          className="flex flex-col sm:flex-row flex-wrap justify-center gap-4"
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
          <ClayButton
            variant="secondary"
            size="xl"
            icon={<span>❓</span>}
            onClick={() => {
              setModalTab('guide');
              setGuideOpen(true);
            }}
          >
            Help &amp; A-to-Z Guide
          </ClayButton>
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
              d: 'Low-calorie snacks make the snake fast & hard; heavy snacks make it slow! Eat, grow & gain calories.',
            },
            {
              e: '💻',
              t: 'C & Random Puzzles',
              d: 'Choose C Programming (Easy, Medium, Hard) or Random Mix with zero repeated questions & lifelines!',
            },
            {
              e: '👥',
              t: 'Social Gaming & Help',
              d: 'Join communities, check friends’ level & exact time spent, and contact Prince on WhatsApp anytime.',
            },
          ].map((c, i) => (
            <div key={i} className="glass-panel text-center p-6">
              <div className="text-4xl mb-2">{c.e}</div>
              <h3 className="font-poppins font-semibold text-pv-plum text-lg">{c.t}</h3>
              <p className="text-gray-600 text-sm mt-1">{c.d}</p>
            </div>
          ))}
        </motion.div>

        {/* Interactive Clickable Quick Start Guide */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 w-full max-w-4xl glass-panel p-6 text-left border-2 border-pv-pink/20"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-poppins font-bold text-pv-plum">
                📘 Quick Start Guide (How to Play)
              </h2>
              <p className="text-xs text-gray-500">
                Click any step below to open the full A-to-Z Guide or message Prince on WhatsApp!
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setModalTab('guide');
                  setGuideOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-pv-pink text-white font-bold text-xs shadow hover:opacity-90 transition"
              >
                📖 Open A-to-Z Guide
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalTab('whatsapp');
                  setGuideOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 text-white font-bold text-xs shadow hover:bg-emerald-600 transition"
              >
                💬 WhatsApp Help
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            {[
              {
                title: '1. Register & Login',
                text: 'Create your account, verify your email if prompted, and log in.',
              },
              {
                title: '2. Feed the Snake',
                text: 'Low-cal food = Fast Snake! High-cal food = Slow Snake! Eat & grow.',
              },
              {
                title: '3. C & Trivia Quizzes',
                text: 'Pick C Language or Random mode, choose Easy/Medium/Hard & win XP.',
              },
              {
                title: '4. Compete with Friends',
                text: 'Join clubs with invite codes and check friends’ level & time spent.',
              },
            ].map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setModalTab('guide');
                  setGuideOpen(true);
                }}
                className="p-3.5 rounded-xl bg-white/80 hover:bg-white border border-purple-100 hover:border-pv-pink text-left transition transform hover:-translate-y-0.5 shadow-sm cursor-pointer"
              >
                <p className="font-bold text-pv-pink flex items-center justify-between">
                  <span>{item.title}</span>
                  <span>→</span>
                </p>
                <p className="text-gray-600 mt-1">{item.text}</p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Full A-to-Z Guide & WhatsApp Modal */}
        <AnimatePresence>
          {guideOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-left"
              onClick={() => setGuideOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.92, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.92, y: 20 }}
                className="bg-white rounded-3xl max-w-2xl w-full max-h-[88vh] overflow-y-auto p-6 md:p-8 shadow-2xl border-2 border-pv-pink/30"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4 mb-5">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-pv-pink">
                      Prince&apos;s SnackVerse Help Center
                    </span>
                    <h2 className="text-2xl font-poppins font-bold text-pv-plum mt-0.5">
                      📘 Complete A-to-Z Guide &amp; WhatsApp Support
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGuideOpen(false)}
                    className="rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 py-1.5 text-sm"
                  >
                    ✕ Close
                  </button>
                </div>

                <div className="flex gap-2 mb-6 bg-gray-100 p-1.5 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setModalTab('guide')}
                    className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm transition ${
                      modalTab === 'guide'
                        ? 'bg-white text-pv-plum shadow-sm'
                        : 'text-gray-600 hover:text-pv-plum'
                    }`}
                  >
                    📖 Step-by-Step Guide
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalTab('whatsapp')}
                    className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm transition ${
                      modalTab === 'whatsapp'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'text-gray-600 hover:text-emerald-700'
                    }`}
                  >
                    💬 Contact on WhatsApp
                  </button>
                </div>

                {modalTab === 'guide' ? (
                  <div className="space-y-4">
                    {FULL_GUIDE_STEPS.map((g, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-2xl bg-pv-cream/60 border border-purple-100 flex items-start gap-3.5"
                      >
                        <div className="text-3xl shrink-0 bg-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm">
                          {g.emoji}
                        </div>
                        <div>
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-pv-pink">
                            {g.step}
                          </span>
                          <h3 className="text-base font-bold text-pv-plum">{g.title}</h3>
                          <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
                            {g.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div className="pt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setModalTab('whatsapp')}
                        className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow"
                      >
                        💬 Have an Issue? Message Prince on WhatsApp →
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleWhatsAppSubmit} className="space-y-4">
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm">
                      Write your issue below and click <strong>Send on WhatsApp</strong> to chat
                      directly with Prince!
                    </div>
                    <input
                      type="text"
                      placeholder="Your Name or Username"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none text-sm"
                    />
                    <select
                      value={issueCategory}
                      onChange={(e) => setIssueCategory(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none text-sm bg-white"
                    >
                      <option value="Login / Registration Help">🔐 Login / Registration Help</option>
                      <option value="Snake Game / Food Issue">🐍 Snake Game / Food Issue</option>
                      <option value="Puzzle / C Quiz Issue">🧩 Puzzle / C Quiz Issue</option>
                      <option value="Friends / Community Issue">👥 Friends / Community Issue</option>
                    </select>
                    <textarea
                      rows={4}
                      required
                      placeholder="Describe what problem you are facing..."
                      value={issueText}
                      onChange={(e) => setIssueText(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none text-sm"
                    />
                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg"
                    >
                      💬 Send Problem on WhatsApp
                    </button>
                  </form>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
