import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const rawSupabaseKey = (
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
)?.trim();

export const isSupabaseConfigured = Boolean(
  rawSupabaseUrl &&
    rawSupabaseUrl.startsWith('http') &&
    rawSupabaseKey &&
    rawSupabaseKey.length > 20
);

// Exported for register.tsx & authStore.ts compatibility
export const supabaseConfigured = true;

export const supabaseConfigMessage = isSupabaseConfigured
  ? ''
  : 'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment settings.';

const supabaseUrl =
  rawSupabaseUrl && rawSupabaseUrl.startsWith('http')
    ? rawSupabaseUrl
    : 'https://onwqcyqpmeruzbtfakzy.supabase.co';

const supabaseAnonKey =
  rawSupabaseKey && rawSupabaseKey.length > 20
    ? rawSupabaseKey
    : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ud3FjeXFwbWVydXpidGZha3p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0OTc0OTYsImV4cCI6MjEwODA3MzQ5Nn0.tPbyKv4CuVWbC__9nkb3_BpOcrUf7e0w1rn5EGFGoCw';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'snackverse-auth-token',
  },
});

/**
 * Wraps any Supabase promise or Thenable query with a safety timeout
 * Used across food, puzzle, profile, history, register, and authStore
 */
export async function withRequestTimeout<T>(
  operation: PromiseLike<T> | Promise<T>,
  timeoutMs = 15000,
  timeoutMessage = 'Request timed out. Please check your internet connection and try again.'
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });

  try {
    return await Promise.race([Promise.resolve(operation), timeoutPromise]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

export function formatSupabaseAuthError(
  err: unknown,
  fallbackMessage = 'An unexpected error occurred. Please try again.'
): {
  code: string;
  userMessage: string;
  message: string;
  isEmailVerificationRequired?: boolean;
  isRateLimit?: boolean;
} {
  if (!err || typeof err !== 'object') {
    const msg = typeof err === 'string' && err.trim() ? err : fallbackMessage;
    return {
      code: 'unknown_error',
      userMessage: msg,
      message: msg,
    };
  }

  const errorObj = err as {
    message?: string;
    code?: string;
    status?: number;
  };

  const status = errorObj.status;
  const code = (errorObj.code || '').toLowerCase();
  const message = errorObj.message || '';
  const lowerMsg = message.toLowerCase();

  const buildResult = (
    resCode: string,
    msg: string,
    extra?: { isEmailVerificationRequired?: boolean; isRateLimit?: boolean }
  ) => ({
    code: resCode,
    userMessage: msg,
    message: msg,
    ...extra,
  });

  if (
    code === 'over_email_send_rate_limit' ||
    lowerMsg.includes('email rate limit exceeded') ||
    lowerMsg.includes('for security purposes, you can only request this')
  ) {
    return buildResult(
      'over_email_send_rate_limit',
      'Email limit reached. Please wait a bit before requesting another email.',
      { isRateLimit: true }
    );
  }

  if (
    code === 'user_already_exists' ||
    lowerMsg.includes('user already registered') ||
    lowerMsg.includes('already been registered')
  ) {
    return buildResult(
      'user_already_exists',
      'This email is already registered. Please log in instead.'
    );
  }

  if (
    code === 'email_not_confirmed' ||
    lowerMsg.includes('email not confirmed')
  ) {
    return buildResult(
      'email_not_confirmed',
      'Your email is not verified yet. Please check your inbox and click the confirmation link.',
      { isEmailVerificationRequired: true }
    );
  }

  if (
    code === 'invalid_credentials' ||
    lowerMsg.includes('invalid login credentials')
  ) {
    return buildResult(
      'invalid_credentials',
      'Invalid email or password. Please check your credentials.'
    );
  }

  if (status === 429 || code === 'over_request_rate_limit') {
    return buildResult(
      'over_request_rate_limit',
      'Too many requests. Please wait a minute and try again.',
      { isRateLimit: true }
    );
  }

  if (status === 502 || lowerMsg.includes('502') || lowerMsg.includes('bad gateway')) {
    return buildResult(
      'http_502_bad_gateway',
      'Server gateway error (HTTP 502). Please wait a moment and try again.'
    );
  }

  if (code === '23505' || lowerMsg.includes('duplicate key')) {
    return buildResult(
      'duplicate_key',
      'This record or username already exists.'
    );
  }

  return buildResult(code || 'auth_error', message || fallbackMessage);
}

export function formatSupabaseError(
  err: unknown,
  fallbackMessage?: string
): string {
  return formatSupabaseAuthError(err, fallbackMessage).userMessage;
}
