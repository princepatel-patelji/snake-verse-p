import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const rawEnvUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const envUrl = rawEnvUrl?.replace(/\/+$/, '');
const envKey = (
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)?.trim();

export const supabaseConfigured = Boolean(
  envUrl && /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(envUrl) && envKey,
);

export const supabaseConfigMessage =
  'SnackVerse is not connected to Supabase. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in Vercel Environment Variables, then create a new deployment.';

// Build-time placeholders are never used for a real request because the UI checks
// supabaseConfigured before calling Auth or database methods.
const supabaseUrl = supabaseConfigured ? envUrl! : 'https://example.supabase.co';
const supabaseKey = supabaseConfigured ? envKey! : 'build-only-missing-key';

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storageKey: 'snackverse-auth-token-v2',
  },
});

/** Bound UI waits so an upstream request cannot leave a button or route spinning forever. */
export async function withRequestTimeout<T>(
  request: PromiseLike<T>,
  timeoutMs = 15000,
  label = 'Request timed out',
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(request),
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(label)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export interface FormattedAuthError {
  code: string;
  userMessage: string;
  isEmailVerificationRequired?: boolean;
  isRateLimit?: boolean;
}

export function formatSupabaseAuthError(err: unknown): FormattedAuthError {
  if (!err || typeof err !== 'object') {
    return { code: 'unknown_error', userMessage: 'Something went wrong. Please try again.' };
  }

  const errorObj = err as { message?: string; code?: string; status?: number; name?: string };
  const status = errorObj.status;
  const code = (errorObj.code || '').toLowerCase();
  const message = errorObj.message || '';
  const lowerMessage = message.toLowerCase();

  // Diagnostic logging intentionally excludes passwords, tokens and API keys.
  console.warn('[SnackVerse auth error]', {
    status: status ?? null,
    code: code || 'not_provided',
    name: errorObj.name || 'Error',
  });

  if (
    code === 'over_email_send_rate_limit' ||
    lowerMessage.includes('email rate limit exceeded') ||
    lowerMessage.includes('for security purposes, you can only request this')
  ) {
    return {
      code: 'over_email_send_rate_limit',
      isRateLimit: true,
      userMessage: 'Supabase email limit reached. Do not keep resending. Wait for the limit to reset or configure a verified custom SMTP provider in Supabase Auth settings.',
    };
  }

  if (code === 'email_address_not_authorized' || lowerMessage.includes('not authorized')) {
    return {
      code: 'email_address_not_authorized',
      userMessage: 'Supabase default email service cannot send to this address. Configure a verified custom SMTP sender in Supabase.',
    };
  }

  if (code === 'user_already_exists' || lowerMessage.includes('user already registered')) {
    return {
      code: 'user_already_exists',
      userMessage: 'An account may already exist for this email. Try signing in or use Forgot password.',
    };
  }

  if (code === 'email_not_confirmed' || lowerMessage.includes('email not confirmed')) {
    return {
      code: 'email_not_confirmed',
      isEmailVerificationRequired: true,
      userMessage: 'Verify your email using the confirmation link, then sign in.',
    };
  }

  if (code === 'invalid_credentials' || lowerMessage.includes('invalid login credentials')) {
    return { code: 'invalid_credentials', userMessage: 'Email or password is incorrect.' };
  }

  if (status === 429 || code === 'over_request_rate_limit') {
    return {
      code: 'over_request_rate_limit',
      isRateLimit: true,
      userMessage: 'Too many attempts. Wait before trying again; repeated requests can extend the limit.',
    };
  }

  if (status === 502 || lowerMessage.includes('bad gateway')) {
    return {
      code: 'http_502_bad_gateway',
      userMessage: 'The authentication service returned HTTP 502. This is an upstream/server problem, not an incorrect password. Check Supabase Auth logs and Vercel runtime logs.',
    };
  }

  if (lowerMessage.includes('timed out') || lowerMessage.includes('timeout')) {
    return { code: 'request_timeout', userMessage: 'The request took too long. Check Supabase project status and try once again later.' };
  }

  if (typeof status === 'number' && status >= 500) {
    return { code: `http_${status}`, userMessage: `Authentication service error (HTTP ${status}). Please try again later and check Supabase Auth logs.` };
  }

  if (
    lowerMessage.includes('failed to fetch') ||
    lowerMessage.includes('networkerror') ||
    lowerMessage.includes('load failed')
  ) {
    return {
      code: 'network_error',
      userMessage: 'Cannot reach Supabase. Check the Supabase project URL, project status, browser Network tab and internet connection.',
    };
  }
  export const formatSupabaseError = formatSupabaseAuthError;

  return { code: code || 'auth_error', userMessage: message || 'Authentication failed. Please try again.' };
}
