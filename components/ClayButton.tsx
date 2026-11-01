import React from 'react';
import { motion } from 'motion/react';

type MotionButtonProps = Omit<
  React.ComponentProps<typeof motion.button>,
  'children' | 'className' | 'disabled' | 'type' | 'whileTap' | 'whileHover' | 'aria-busy'
>;

export type ClayButtonProps = MotionButtonProps & {
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'glass' | 'ghost' | 'accent' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
};

const variants: Record<NonNullable<ClayButtonProps['variant']>, string> = {
  primary: 'bg-gradient-to-br from-pv-pink to-pv-peach text-white shadow-clay hover:shadow-clay-inset',
  secondary: 'bg-gradient-to-br from-pv-sky to-pv-mint text-white shadow-clay hover:shadow-clay-inset',
  glass: 'border border-glass-border bg-white/40 text-pv-plum shadow-glass backdrop-blur-glass hover:bg-white/60',
  ghost: 'bg-transparent text-pv-plum hover:bg-pv-cream/70',
  accent: 'bg-gradient-to-br from-pv-lavender to-pv-sky text-white shadow-clay hover:shadow-clay-inset',
  danger: 'bg-gradient-to-br from-rose-500 to-red-500 text-white shadow-clay',
  success: 'bg-gradient-to-br from-emerald-400 to-pv-mint text-white shadow-clay',
};

const sizes: Record<NonNullable<ClayButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-base rounded-xl',
  lg: 'px-6 py-3 text-lg rounded-2xl',
  xl: 'px-8 py-4 text-xl rounded-3xl',
};

export const ClayButton: React.FC<ClayButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  type = 'button',
  ...props
}) => {
  const isDisabled = Boolean(loading || disabled);

  return (
    <motion.button
      {...props}
      type={type}
      whileTap={isDisabled ? undefined : { scale: 0.96 }}
      whileHover={isDisabled ? undefined : { scale: 1.02 }}
      className={`relative flex items-center justify-center gap-2 overflow-hidden font-quicksand font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isDisabled}
      aria-busy={loading || undefined}
    >
      {loading ? (
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-label="Loading" />
      ) : (
        <>
          {icon && <span className="flex items-center">{icon}</span>}
          {children}
        </>
      )}
    </motion.button>
  );
};

export default ClayButton;
