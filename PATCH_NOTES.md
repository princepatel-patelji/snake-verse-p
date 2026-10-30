# Prince's SnackVerse – Repair Notes

This package is a repair of the supplied existing Next.js Pages Router project. It is not a redesign or a replacement application.

## Main changes

- Repaired Supabase client configuration and added support for the current Publishable key environment variable, with legacy anon-key fallback.
- Added bounded request timeouts and readable authentication/network/rate-limit error messages.
- Reworked authentication initialization, session restoration, and profile loading to avoid an endless protected-route spinner.
- Improved registration, email-confirmation callback, login, and password-reset flows.
- Added `Database` TypeScript definitions to match the existing PostgreSQL schema.
- Added a follow-up SQL migration for automatic profile creation, ownership-based RLS, community access policies, and friendship RPCs.
- Updated framework/dependency configuration, removed build-error suppression, and added typecheck/lint scripts.
- Updated service-worker caching so authentication/API responses are not cached.
- Replaced the empty favicon with a valid icon.
- Added an optional guarded reset script for projects where every Auth account and associated player record is disposable test data.

## Important limitations

- The ZIP does not modify GitHub, Vercel, or Supabase accounts. The owner must upload the code and apply the database migration/configuration.
- The optional reset SQL deletes every Auth user and dependent player data in the selected Supabase project. Back up first and run only after explicit review.
- Deleting Auth users does not reset Supabase's project-wide email sending quota. Use custom SMTP for production email.
- Fresh `npm install`, full typecheck, lint, and production build could not be completed in this environment because npm registry DNS/network requests timed out. Static TypeScript/TSX parsing, JSON parsing, JavaScript syntax checks, and import-path checks completed without syntax errors. Run the local build before pushing/deploying.
