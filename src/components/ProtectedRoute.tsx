import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/stores/authStore';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const initialized = useAuthStore((state) => state.initialized);

  useEffect(() => {
    if (initialized && !loading && !user && router.isReady) {
      void router.replace('/auth/login');
    }
  }, [initialized, loading, user, router]);

  if (!initialized || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-live="polite">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-pv-pink border-t-transparent" />
        <span className="sr-only">Checking your session…</span>
      </div>
    );
  }

  if (!user) {
    return <div className="py-12 text-center text-pv-plum">Redirecting to sign in…</div>;
  }

  return <>{children}</>;
}
