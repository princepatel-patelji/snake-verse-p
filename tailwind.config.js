/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'pv-lavender': '#B388FF',
        'pv-pink': '#FF8A80',
        'pv-mint': '#80DFB0',
        'pv-peach': '#FFB74D',
        'pv-cream': '#FFF8E1',
        'pv-sky': '#80D8FF',
        'pv-butter': '#FFF176',
        'pv-plum': '#4A148C',
        'glass-white': 'rgba(255, 255, 255, 0.25)',
        'glass-border': 'rgba(255, 255, 255, 0.18)',
      },
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
        'quicksand': ['Quicksand', 'sans-serif'],
      },
      boxShadow: {
        clay: '8px 8px 16px #a3b1c6, -8px -8px 16px #ffffff',
        'clay-inset': 'inset 4px 4px 8px #a3b1c6, inset -4px -4px 8px #ffffff',
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.25)',
      },
      backdropBlur: {
        glass: '12px',
      },
    },
  },
  plugins: [],
};