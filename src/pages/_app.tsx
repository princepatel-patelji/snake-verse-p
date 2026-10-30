import React, { useEffect } from 'react';
import type { AppProps } from 'next/app';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => initializeAuth(), [initializeAuth]);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('[SnackVerse PWA] Service worker registration failed:', error instanceof Error ? error.message : 'Unknown error');
    });
  }, []);

  return (
    <>
      <Component {...pageProps} />
      <Toaster
        position="top-center"
        toastOptions={{ className: 'font-quicksand shadow-clay rounded-xl border-0' }}
      />
    </>
  );
}
