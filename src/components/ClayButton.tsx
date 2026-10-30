import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'glass' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
}

export default function ClayButton({ variant = 'primary', size = 'md', loading, icon, children, className = '', ...props }: ButtonProps) {
  const base = "relative font-quicksand font-semibold transition-all duration-200 flex items-center justify-center gap-2 overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-gradient-to-br from-pv-pink to-pv-peach text-white shadow-clay hover:shadow-clay-inset active:scale-95",
    secondary: "bg-gradient-to-br from-pv-sky to-pv-mint text-white shadow-clay hover:shadow-clay-inset active:scale-95",
    glass: "bg-glass-white backdrop-blur-glass border border-glass-border text-pv-plum shadow-glass hover:bg-white/40 active:scale-95",
    ghost: "bg-transparent text-pv-plum hover:bg-pv-cream/50 active:scale-95",
  };
  const sizes = { sm: "px-3 py-1.5 text-sm rounded-lg", md: "px-4 py-2 text-base rounded-xl", lg: "px-6 py-3 text-lg rounded-2xl", xl: "px-8 py-4 text-xl rounded-3xl" };

  return (
    <motion.button whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.02 }} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <> {icon && <span className="flex items-center">{icon}</span>} {children} </>}
    </motion.button>
  );
}