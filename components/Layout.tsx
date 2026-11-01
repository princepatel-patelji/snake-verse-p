import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/stores/authStore';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function Layout({ children, title }: LayoutProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const signOut = useAuthStore((state) => state.signOut);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('You have been signed out.');
      await router.replace('/auth/login');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not sign out. Please try again.');
    }
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
        <header className="sticky top-0 z-50 border-b border-glass-border bg-white/30 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 text-xl font-poppins font-bold text-pv-plum md:text-2xl">
              <span>🍔</span> SnackVerse
            </Link>
            <nav className="flex items-center gap-3 text-sm md:gap-4">
              {user ? (
                <>
                  <Link href="/dashboard" className="text-pv-plum transition hover:text-pv-pink">Dashboard</Link>
                  <Link href="/profile" className="hidden text-pv-plum transition hover:text-pv-pink sm:inline">{profile?.display_name || 'Profile'}</Link>
                  <button type="button" onClick={handleSignOut} className="text-red-500 hover:underline">Logout</button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="text-pv-plum hover:text-pv-pink">Login</Link>
                  <Link href="/auth/register" className="rounded-full bg-pv-pink px-4 py-1.5 text-white shadow-clay transition hover:shadow-clay-inset">Register</Link>
                </>
              )}
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            {children}
          </motion.div>
        </main>
        <footer className="border-t border-glass-border py-6 text-center text-sm text-pv-plum/60">
          Created by Prince • Eat. Play. Puzzle. Repeat!
        </footer>
      </div>
    </>
  );
}
