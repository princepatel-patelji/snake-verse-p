import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/stores/authStore';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading, initialized } = useAuthStore();

  useEffect(() => {
    if (initialized && !user) {
      router.replace('/auth/login');
    }
  }, [user, loading, initialized, router]);

  if (!initialized || (loading && !user)) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-10 h-10 border-4 border-pv-pink border-t-transparent rounded-full animate-spin" /></div>;
  }
  return initialized && user ? <>{children}</> : null;
}