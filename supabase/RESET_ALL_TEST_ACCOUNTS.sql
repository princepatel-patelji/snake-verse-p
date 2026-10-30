-- DANGER: OPTIONAL, DESTRUCTIVE, ONE-TIME RESET.
-- This deletes EVERY Supabase Auth user and all dependent SnackVerse player data.
-- It does NOT delete database tables, policies, functions, or migrations.
-- Back up the project first. Do not run if any account or player record must be kept.
--
-- SAFETY LOCK: change the confirmation string below to exactly:
-- DELETE_ALL_SNACKVERSE_TEST_DATA
-- The script intentionally raises an error until you make that explicit edit.
-- Run ONLY when this Supabase project contains test accounts/data you are willing
-- to permanently delete. This affects every Auth user in this Supabase project.

do $$
declare
  confirmation text := 'TYPE_CONFIRMATION_HERE';
begin
  if confirmation <> 'DELETE_ALL_SNACKVERSE_TEST_DATA' then
    raise exception 'Reset cancelled. Edit the confirmation string only after taking a backup and confirming all users/data may be deleted.';
  end if;

  -- Delete tables that have non-cascading community foreign keys first.
  delete from public.game_sessions;
  delete from public.communities;

  -- profiles and profile-linked player data cascade from auth.users.
  delete from auth.users;
end;
$$;
