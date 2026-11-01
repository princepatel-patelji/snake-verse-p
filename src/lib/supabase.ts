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

export function formatSupabaseAuthError(err: unknown): {
  code: string;
  userMessage: string;
  isEmailVerificationRequired?: boolean;
  isRateLimit?: boolean;
} {
  if (!err || typeof err !== 'object') {
    return {
      code: 'unknown_error',
      userMessage: 'An unexpected error occurred. Please try again.',
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

  if (
    code === 'over_email_send_rate_limit' ||
    lowerMsg.includes('email rate limit exceeded') ||
    lowerMsg.includes('for security purposes, you can only request this')
  ) {
    return {
      code: 'over_email_send_rate_limit',
      isRateLimit: true,
      userMessage:
        'Email limit reached. Please wait a bit before requesting another email.',
    };
  }

  if (
    code === 'user_already_exists' ||
    lowerMsg.includes('user already registered') ||
    lowerMsg.includes('already been registered')
  ) {
    return {
      code: 'user_already_exists',
      userMessage: 'This email is already registered. Please log in instead.',
    };
  }

  if (
    code === 'email_not_confirmed' ||
    lowerMsg.includes('email not confirmed')
  ) {
    return {
      code: 'email_not_confirmed',
      isEmailVerificationRequired: true,
      userMessage:
        'Your email is not verified yet. Please check your inbox and click the confirmation link.',
    };
  }

  if (
    code === 'invalid_credentials' ||
    lowerMsg.includes('invalid login credentials')
  ) {
    return {
      code: 'invalid_credentials',
      userMessage: 'Invalid email or password. Please check your credentials.',
    };
  }

  if (status === 429 || code === 'over_request_rate_limit') {
    return {
      code: 'over_request_rate_limit',
      isRateLimit: true,
      userMessage: 'Too many requests. Please wait a minute and try again.',
    };
  }

  if (status === 502 || lowerMsg.includes('502') || lowerMsg.includes('bad gateway')) {
    return {
      code: 'http_502_bad_gateway',
      userMessage:
        'Server gateway error (HTTP 502). Please wait a moment and try again.',
    };
  }

  if (code === '23505' || lowerMsg.includes('duplicate key')) {
    return {
      code: 'duplicate_key',
      userMessage: 'This record or username already exists.',
    };
  }

  return {
    code: code || 'auth_error',
    userMessage: message || 'Operation failed. Please try again.',
  };
}

export function formatSupabaseError(err: unknown): string {
  return formatSupabaseAuthError(err).userMessage;
}
