import React from 'react';
import type { AppProps } from 'next/app';
import { Toaster } from 'react-hot-toast';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const AnyComponent = Component as any;
  const AnyToaster = Toaster as any;

  return (
    <>
      <Component {...(pageProps as any)} />
      <AnyToaster
        position="top-center"
        toastOptions={{ className: 'font-quicksand shadow-clay rounded-xl border-0' }}
      />
    </>
  );
}
