# Prince's SnackVerse

**Eat. Play. Puzzle. Repeat!**

Existing Next.js Pages Router application with a Claymorphism interface, Supabase authentication and PostgreSQL-backed player data.

## Quick start (Windows / macOS / Linux)

1. Install Node.js 22 LTS.
2. Copy `.env.example` to `.env.local` and enter your own Supabase project URL and publishable key.
3. From the project root, run:

   ```bash
   npm install
   npm run dev
   ```

4. Open `http://localhost:3000`.

Before deployment, run `npm run build`. The `npm install` command creates the fresh `package-lock.json`; commit that file with the source.

## Required environment variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (preferred)

The legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` is also accepted for compatibility. Never place a Supabase secret/service-role key, database password or SMTP password in a `NEXT_PUBLIC_` variable or commit it to Git.

## Supabase database

Review `SETUP_HINDI.md` before running migrations. Apply `001_initial_schema.sql` only to a genuinely empty project. Apply `002_auth_profiles_and_rls_repair.sql` after checking the existing schema. Do not rerun the initial migration blindly.

The optional `supabase/RESET_ALL_TEST_ACCOUNTS.sql` deletes all Auth users and dependent player data after its explicit confirmation string is changed. Back up first; this cannot be undone.

## Deployment

This project uses the Next.js Pages Router and is intended for Vercel. Set Node.js 22, configure the Supabase environment variables in Vercel, apply the Supabase migrations, and configure a custom SMTP sender for reliable production email delivery. See `SETUP_HINDI.md` for the exact steps.
