import React, { useEffect } from 'react';
import type { AppProps } from 'next/app';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    void useAuthStore.getState().initializeAuth();
  }, []);

  return (
    <>
      <Component {...pageProps} />
      <Toaster
        position="top-center"
        toastOptions={{
          className: 'font-quicksand shadow-clay rounded-xl border-0',
        }}
      />
    </>
  );
}
