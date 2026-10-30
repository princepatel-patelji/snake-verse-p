import React from 'react';
import Head from 'next/head';
import Layout from '@/components/Layout';
import ClayButton from '@/components/ClayButton';
import { motion } from 'motion/react';
import Link from 'next/link';

export default function Home() {
  return (
    <Layout title="Home">
      <Head><title>Prince's SnackVerse - Eat. Play. Puzzle. Repeat!</title></Head>
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center py-10">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6 }} className="mb-6">
          <h1 className="text-5xl md:text-7xl font-poppins font-bold text-transparent bg-clip-text bg-gradient-to-r from-pv-pink to-pv-lavender">Prince's SnackVerse</h1>
          <p className="text-xl md:text-2xl font-quicksand text-pv-plum mt-3 font-medium">Eat. Play. Puzzle. Repeat!</p>
        </motion.div>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex flex-col sm:flex-row gap-5">
          <Link href="/auth/register"><ClayButton variant="primary" size="xl" icon={<span>🚀</span>}>Create Account</ClayButton></Link>
          <Link href="/auth/login"><ClayButton variant="glass" size="xl" icon={<span>🎮</span>}>Start Playing</ClayButton></Link>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 w-full max-w-4xl">
          {[{e:'🍔', t:'Virtual Food', d:'Choose from a delicious catalogue.'},{e:'🧩', t:'Fun Puzzles', d:'Solve quizzes to earn rewards.'},{e:'👥', t:'Social Gaming', d:'Challenge friends & join clubs.'}].map((c,i)=>(
            <div key={i} className="glass-panel text-center">{<div className="text-4xl mb-2">{c.e}</div>}<h3 className="font-poppins font-semibold text-pv-plum">{c.t}</h3><p className="text-gray-600 text-sm">{c.d}</p></div>
          ))}
        </motion.div>
      </div>
    </Layout>
  );
}