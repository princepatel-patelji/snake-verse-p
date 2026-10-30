import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { motion } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function Layout({ children, title }: LayoutProps) {
  const { profile, signOut } = useAuthStore();

  return (
    <>
      <Head>
        <title>{title} | Prince's SnackVerse</title>
        <meta name="description" content="Eat. Play. Puzzle. Repeat!" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-50 backdrop-blur-md bg-white/30 border-b border-glass-border">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="text-2xl font-poppins font-bold text-pv-plum flex items-center gap-2">
              <span>🍔</span> SnackVerse
            </Link>
            <nav className="flex items-center gap-4">
              {profile ? (
                <>
                  <Link href="/dashboard" className="text-pv-plum hover:text-pv-pink transition">Dashboard</Link>
                  <button onClick={signOut} className="text-sm text-red-500 hover:underline">Logout</button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="text-pv-plum hover:text-pv-pink">Login</Link>
                  <Link href="/auth/register" className="bg-pv-pink text-white px-4 py-1.5 rounded-full shadow-clay hover:shadow-clay-inset transition">Register</Link>
                </>
              )}
            </nav>
          </div>
        </header>
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            {children}
          </motion.div>
        </main>
        <footer className="text-center py-6 text-sm text-pv-plum/60 border-t border-glass-border">
          Created by Prince • Eat. Play. Puzzle. Repeat!
        </footer>
      </div>
    </>
  );
}