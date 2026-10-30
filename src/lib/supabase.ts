import { createClient } from '@supabase/supabase-js';

// Browser me Vercel Proxy use karega (taaki kisi user ko network/DNS error na aaye)
// Aur server build ke waqt direct URL use karega
const supabaseUrl =
  typeof window !== 'undefined'
    ? `${window.location.origin}/supabase-proxy`
    : 'https://onwqcyqpmeruzbtfakzy.supabase.co';

const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ud3FjeXFwbWVydXpidGZha3p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0OTc0OTYsImV4cCI6MjEwODA3MzQ5Nn0.tPbyKv4CuVWbC__9nkb3_BpOcrUf7e0w1rn5EGFGoCw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
