import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://onwqcyqpmeruzbtfakzy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ud3FjeXFwbWVydXpidGZha3p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0OTc0OTYsImV4cCI6MjEwODA3MzQ5Nn0.tPbyKv4CuVWbC__9nkb3_BpOcrUf7e0w1rn5EGFGoCw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
