import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/stores/authStore';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

// 👉 PRINCE BHAI: Yahan '91' ke baad apna 10-digit WhatsApp number daal dena!
const WHATSAPP_NUMBER = '917268842331';

const GUIDE_STEPS = [
  {
    step: 'Step 1',
    emoji: '📝',
    title: 'Create Account & Verify Email',
    desc: 'Click on "Register", enter your Display Name, unique Username, Email, and Password. If email confirmation is active, open your email inbox and click the confirmation link.',
  },
  {
    step: 'Step 2',
    emoji: '🔐',
    title: 'Login & Open Dashboard',
    desc: 'Go to the Login page, enter your verified Email and Password, and you will land on your personal SnackVerse Dashboard showing your Level, XP, and Virtual Calories.',
  },
  {
    step: 'Step 3',
    emoji: '🐍',
    title: 'Play Snake Arcade & Eat Virtual Food',
    desc: 'Open the Food section! You can either add snacks to your Plate & click "Eat", OR switch to "Snake Eat & Grow Arcade", pick your favorite food (Apple, Burger, Pizza, Gulab Jamun), move the snake to eat & grow, and save your earned Calories + XP!',
  },
  {
    step: 'Step 4',
    emoji: '🧩',
    title: 'Solve C Programming & Random Puzzles',
    desc: 'Open Puzzle Challenge! Choose your subject ("C Programming" or "Random Mix") and difficulty ("Easy", "Medium", or "Hard"). Use 50:50 lifelines, build Combo Streaks, burn virtual calories, and level up fast!',
  },
  {
    step: 'Step 5',
    emoji: '👥',
    title: 'Join Communities & Track Friends',
    desc: 'Create your own Community or join using an Invite Code, and add Friends by username. Click on any Community or Friend card to inspect their Level, XP, Time Spent, and Game History!',
  },
];

export default function Layout({ children, title }: LayoutProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const signOut = useAuthStore((state) => state.signOut);

  const [helpOpen, setHelpOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'guide' | 'whatsapp'>('guide');
  const [senderName, setSenderName] = useState('');
  const [issueType, setIssueType] = useState('Login / Registration Issue');
  const [issueDetails, setIssueDetails] = useState('');

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('You have been signed out.');
      await router.replace('/auth/login');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not sign out. Please try again.'
      );
    }
  };

  const handleSendWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName =
      senderName.trim() || profile?.display_name || user?.email || 'SnackVerse Player';
    const cleanDetails = issueDetails.trim();

    if (!cleanDetails) {
      toast.error('Please write your problem or question first.');
      return;
    }

    const message = [
      `🍔 *Prince's SnackVerse - Help Request*`,
      `👤 *Name:* ${cleanName}`,
      `📌 *Topic:* ${issueType}`,
      `🌐 *Page:* ${typeof window !== 'undefined' ? window.location.pathname : '/'}`,
      `💬 *Problem:* ${cleanDetails}`,
    ].join('\n');

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    toast.success('Opening WhatsApp chat with Prince...');
  };

  return (
    <>
      <Head>
        <title>{title} | Prince&apos;s SnackVerse</title>
        <meta name="description" content="Eat. Play. Puzzle. Repeat!" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 border-b border-glass-border bg-white/40 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-poppins font-bold text-pv-plum md:text-2xl"
            >
              <span>🍔</span> SnackVerse
            </Link>
            <nav className="flex items-center gap-2.5 text-sm md:gap-4 flex-wrap justify-end">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('guide');
                  setHelpOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-full bg-amber-100 hover:bg-amber-200 text-pv-plum font-bold px-3.5 py-1.5 shadow-sm transition"
              >
                <span>❓</span>
                <span>Help &amp; Guide</span>
              </button>

              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="text-pv-plum font-medium transition hover:text-pv-pink"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/food"
                    className="hidden sm:inline text-pv-plum font-medium transition hover:text-pv-pink"
                  >
                    🐍 Food &amp; Snake
                  </Link>
                  <Link
                    href="/puzzle"
                    className="hidden sm:inline text-pv-plum font-medium transition hover:text-pv-pink"
                  >
                    🧩 Puzzles
                  </Link>
                  <Link
                    href="/profile"
                    className="hidden text-pv-plum font-semibold transition hover:text-pv-pink md:inline"
                  >
                    {profile?.display_name || 'Profile'}
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="text-red-500 font-semibold hover:underline"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="text-pv-plum font-semibold hover:text-pv-pink"
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/register"
                    className="rounded-full bg-pv-pink px-4 py-1.5 text-white font-semibold shadow-clay transition hover:shadow-clay-inset"
                  >
                    Register
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        </main>

        {/* Floating Quick Help & WhatsApp Trigger (Visible on Login, Home, and all pages) */}
        <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('whatsapp');
              setHelpOpen(true);
            }}
            className="flex items-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-2.5 shadow-lg transition transform hover:scale-105 text-xs sm:text-sm"
            title="Need Help? Contact Prince on WhatsApp or Read Guide"
          >
            <span>💬</span>
            <span>Need Help?</span>
          </button>
        </div>

        {/* Help & A-to-Z Guide Modal */}
        <AnimatePresence>
          {helpOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
              onClick={() => setHelpOpen(false)}
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
                      Prince&apos;s SnackVerse Support Center
                    </span>
                    <h2 className="text-2xl font-poppins font-bold text-pv-plum mt-0.5">
                      📘 A-to-Z Game Guide &amp; WhatsApp Help
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHelpOpen(false)}
                    className="rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 py-1.5 text-sm"
                  >
                    ✕ Close
                  </button>
                </div>

                {/* Modal Tabs */}
                <div className="flex gap-2 mb-6 bg-gray-100 p-1.5 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setActiveTab('guide')}
                    className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm transition ${
                      activeTab === 'guide'
                        ? 'bg-white text-pv-plum shadow-sm'
                        : 'text-gray-600 hover:text-pv-plum'
                    }`}
                  >
                    📖 A-to-Z How to Play Guide
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('whatsapp')}
                    className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm transition ${
                      activeTab === 'whatsapp'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'text-gray-600 hover:text-emerald-700'
                    }`}
                  >
                    💬 WhatsApp Direct Support
                  </button>
                </div>

                {activeTab === 'guide' ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      New to <strong>Prince&apos;s SnackVerse</strong>? Follow these 5 simple steps
                      from creating your account to mastering Snake Arcade &amp; C Programming
                      Puzzles:
                    </p>
                    <div className="space-y-3">
                      {GUIDE_STEPS.map((g, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-pv-cream/50 border border-purple-100 flex items-start gap-3.5"
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
                    </div>

                    <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100">
                      <span className="text-xs text-gray-500">
                        Still facing any problem with login or gameplay?
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('whatsapp')}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow transition"
                      >
                        💬 Contact Prince on WhatsApp →
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSendWhatsApp} className="space-y-4">
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm">
                      <strong>Direct WhatsApp Support:</strong> Fill in your problem below and click
                      &quot;Send on WhatsApp&quot;. Your message will go directly to Prince with your
                      issue details!
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                        Your Name or Username
                      </label>
                      <input
                        type="text"
                        placeholder={
                          profile?.display_name || 'Enter your name (e.g. Rahul / @rahul)'
                        }
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-400 outline-none text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                        What issue are you facing?
                      </label>
                      <select
                        value={issueType}
                        onChange={(e) => setIssueType(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-400 outline-none text-sm bg-white"
                      >
                        <option value="Login / Registration Issue">
                          🔐 Login / Registration Issue
                        </option>
                        <option value="Email Verification Problem">
                          📧 Email Verification Problem
                        </option>
                        <option value="Snake Game / Food Catalogue Issue">
                          🐍 Snake Game / Food Catalogue Issue
                        </option>
                        <option value="Puzzle / C Programming Quiz Issue">
                          🧩 Puzzle / C Programming Quiz Issue
                        </option>
                        <option value="Friends / Community Issue">
                          👥 Friends / Community Issue
                        </option>
                        <option value="Suggestion / Feedback">💡 Suggestion / Feedback</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                        Describe your problem in detail
                      </label>
                      <textarea
                        rows={4}
                        required
                        placeholder="Write what happened or what error message you saw..."
                        value={issueDetails}
                        onChange={(e) => setIssueDetails(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-400 outline-none text-sm"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab('guide')}
                        className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm"
                      >
                        ← Back to Guide
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-3 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg transition flex items-center justify-center gap-2"
                      >
                        <span>💬</span>
                        <span>Send Problem on WhatsApp</span>
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="border-t border-glass-border py-6 text-center text-sm text-pv-plum/60">
          Created by Prince • Eat. Play. Puzzle. Repeat! •{' '}
          <button
            type="button"
            onClick={() => {
              setActiveTab('guide');
              setHelpOpen(true);
            }}
            className="text-pv-pink font-semibold hover:underline"
          >
            Need Help? Open A-to-Z Guide
          </button>
        </footer>
      </div>
    </>
  );
}
