# Prince's SnackVerse — Setup & Repair Guide (Hindi)

Is ZIP mein corrected source code hai. **Supabase dashboard ki settings aur database migration tumhe apne account mein khud apply karni hogi**; ZIP un accounts mein automatically changes nahi kar sakta.

## 1. GitHub par code replace karna

1. ZIP extract karo.
2. Apne local `Snake-Verse` repository folder ka backup bana lo.
3. Extracted project ke andar ki files/folders ko apne existing `Snake-Verse` repository ke root mein copy karo aur same-name files replace karo.
4. Apne existing local Git repository ka `.git` folder delete mat karna.
5. Purana `package-lock.json` agar pada hai to uski copy backup ke liye rakho, phir project root se purana lockfile hatao. Naya lockfile `npm install` se banega.
6. `.env.local`, `node_modules`, `.next` ya passwords GitHub par upload mat karna.
7. GitHub Desktop mein changed files review karo; repo `princepatel-patelji/Snake-Verse`, branch `main` honi chahiye.
8. Commit aur Push karo.

## 2. Local dependency install aur build

Node.js 22.13+ (recommended: latest Node.js 22 LTS) install hona chahiye. Project root mein terminal kholo:

```bash
npm install
npm run build
```

`npm install` naya `package-lock.json` banayega. Use bhi GitHub par commit/push karna. Is package update ke baad purana Next 14 lockfile jaan-bujhkar include nahi kiya gaya, kyunki woh naye Next 16 dependency versions ke saath stale hota.

## 3. Vercel settings

Vercel → `snake-verse` project → Settings → General:

- Framework Preset: Next.js
- Root Directory: `./`
- Node.js Version: 22.x

Settings → Environment Variables mein ye variables add/edit karo (Production, Preview, Development tino):

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://onwqcyqpmeruzbtfakzy.supabase.co` (sirf tab, agar ye wahi intended Supabase project hai) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Apne Supabase project ki `sb_publishable_...` key |

Code purane `NEXT_PUBLIC_SUPABASE_ANON_KEY` ko fallback ke roop mein bhi support karta hai. Dono key variables rakhna zaroori nahi; publishable variable prefer hota hai.

`SUPABASE_SERVICE_ROLE_KEY`, `sb_secret_...`, SMTP password ya PostgreSQL password ko `NEXT_PUBLIC_` variable mein kabhi mat daalna. Browser mein secret key expose na karo.

Agar Vercel Environment Variables mein `npm_config_cache-dir` ya `NPM_CONFIG_CACHE_DIR` naam ka variable dikhe to remove karo. Yeh npm ka unsupported config warning deta hai; yeh application ka runtime variable nahi hai. Agar aisa variable na ho, is warning ko build failure na samjho.

## 4. Supabase database migration

Pehle Supabase → Table Editor kholo. Confirm karo ki `profiles`, `communities`, `community_members`, `friend_requests`, `friendships`, `game_sessions`, `puzzle_attempts` tables already bani hui hain.

- Agar tables nahi bani aur project fresh/empty hai, SQL Editor se `supabase/migrations/001_initial_schema.sql` ek baar run karo.
- Agar tables already exist karti hain, `001` dobara run MAT karna.
- Uske baad `supabase/migrations/002_auth_profiles_and_rls_repair.sql` ko SQL Editor mein paste karke **ek baar** run karo.

Migration `002` purane users delete nahi karti. Yeh profile trigger, self-only profile RLS, community policy aur secure friend RPCs add/repair karti hai.

## 5. Supabase Auth URL configuration

Supabase Dashboard → Authentication → URL Configuration:

- Site URL: Vercel Project → Settings → Domains mein jo stable Production domain diya hai, wahi use karo (temporary deployment preview link nahi).
- Additional Redirect URLs add karo:
  - `https://*.vercel.app/**`
  - `http://localhost:3000/**`

Agar custom production domain hai, uske liye `https://your-domain/**` entry bhi add karo. Save changes.

## 6. Email limit / SMTP

Supabase ka built-in test email sender production registration ke liye reliable nahi hai aur project-wide email rate limits laga sakta hai. Code email rate-limit error ko explain karta hai, lekin code provider ki sending quota badha nahi sakta.

Production email ke liye apne domain ke saath transactional SMTP provider configure karo:

Supabase → Authentication → Emails / SMTP Settings (dashboard ke current labels ke mutabik) → Custom SMTP enable karo. Verified sender address, SMTP host, port, username aur password provider se lo. SMTP password sirf Supabase dashboard mein enter karo; GitHub, ZIP, browser variables ya chat mein nahi.

## 7. Vercel deploy

1. GitHub push complete hone do.
2. Vercel → Deployments kholo.
3. `main` branch ke newest commit ka deployment kholo.
4. Build `Ready` hona chahiye. `Error` aaye to us deployment ke latest Build Logs ka pehla actual error fix karna hoga.
5. Production domain par registration / email verification / login test karo.

## 8. Optional: purane test accounts aur data wipe

`supabase/RESET_ALL_TEST_ACCOUNTS.sql` **optional aur destructive** hai. Yeh Supabase Auth ke tamam users, profiles, friendships, friend requests, puzzle attempts, sessions aur communities hata deta hai. Isse production users bhi delete ho jayenge.

Agar tum sure ho ki project mein sirf purana test data hai:

1. Supabase Dashboard → Project Settings → Database → Backups se backup/export lo.
2. SQL file kholo aur `TYPE_CONFIRMATION_HERE` ko exactly `DELETE_ALL_SNACKVERSE_TEST_DATA` se replace karo. Ye safety lock hai; bina is explicit edit ke script kuch delete nahi karegi.
3. SQL file ko Supabase SQL Editor mein paste karke review karo.
4. Sirf tab Run karo jab tamam Auth accounts aur unka player data permanently delete karna hai. Isse is Supabase project ke **sabhi** Auth users delete honge, sirf tumhare test users nahi.

**Important:** Auth users delete karne se Supabase ka project-wide email sending quota reset nahi hota. Built-in email sender par limit rahegi; email registration reliably chalane ke liye custom SMTP set up karna hoga. Reset se pehle backup lo.

Yeh reset schema/policies ko delete nahi karta. Isko `001` ya `002` migration ke saath combine mat karna.

## 9. What was and was not verified

Source files ko static syntax inspection ke liye prepare kiya gaya hai. Is environment mein npm registry DNS/network available nahi tha, isliye fresh `npm install`, complete TypeScript check, lint aur production build execute nahi ho saka. Isliye ZIP ko Vercel par deploy karne se pehle local `npm install` aur `npm run build` chalana zaroori hai. Runtime email delivery ko custom SMTP aur Supabase project configuration ke bina certify nahi kiya ja sakta.
