-- Prince's SnackVerse: authentication, profile, community and friendship repair.
-- Apply this migration ONCE in Supabase SQL Editor after 001_initial_schema.sql.
-- It preserves existing accounts and player data. It does not reset or delete users.

begin;

-- Ensure the expected tables have RLS enabled (safe on an existing schema).
alter table public.profiles enable row level security;
alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.friend_requests enable row level security;
alter table public.friendships enable row level security;
alter table public.game_sessions enable row level security;
alter table public.puzzle_attempts enable row level security;

-- -----------------------------------------------------------------------------
-- 1. Create a profile automatically at Auth signup.
-- This avoids the signup page trying to insert a profile before email confirmation.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_snackverse_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  base_username text;
  candidate_username text;
  chosen_display_name text;
  suffix text;
begin
  chosen_display_name := left(
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'SnackVerse Player'
    ),
    80
  );

  base_username := lower(regexp_replace(
    coalesce(new.raw_user_meta_data ->> 'username', split_part(coalesce(new.email, ''), '@', 1), 'player'),
    '[^a-zA-Z0-9_]', '', 'g'
  ));
  base_username := left(base_username, 20);
  if length(base_username) < 3 then
    base_username := 'player';
  end if;

  -- Serialize same-base signups so two simultaneous registrations cannot
  -- both pass the lower(username) collision check before either inserts.
  perform pg_advisory_xact_lock(hashtextextended(base_username, 0));

  candidate_username := base_username;
  while exists (
    select 1 from public.profiles p
    where lower(p.username) = lower(candidate_username) and p.id <> new.id
  ) loop
    suffix := substr(md5(random()::text || clock_timestamp()::text || new.id::text), 1, 6);
    candidate_username := left(base_username, 13) || '_' || suffix;
  end loop;

  insert into public.profiles (
    id, display_name, username, phone_number, avatar_url, bio,
    level, xp, virtual_calories, total_sessions, total_puzzles_solved,
    privacy_settings, preferences
  ) values (
    new.id, chosen_display_name, candidate_username, null, null, null,
    1, 0, 0, 0, 0, '{}'::jsonb, '{}'::jsonb
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_snackverse_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created_snackverse on auth.users;
create trigger on_auth_user_created_snackverse
  after insert on auth.users
  for each row execute function public.handle_new_snackverse_user();

-- Keep updated_at current on profile updates.
create or replace function public.set_snackverse_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.set_snackverse_updated_at() from public, anon, authenticated;
drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_snackverse_updated_at();

-- -----------------------------------------------------------------------------
-- 2. Profile access: users may read/insert/update only their own profile.
-- Friend search uses narrow RPCs below; it does not grant broad profile SELECT.
-- -----------------------------------------------------------------------------
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- 3. Communities and memberships. SECURITY DEFINER helper avoids recursive RLS.
-- -----------------------------------------------------------------------------
create or replace function public.is_snackverse_community_member(p_community_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.community_members cm
    where cm.community_id = p_community_id
      and cm.user_id = auth.uid()
      and cm.status = 'active'
  );
$$;

revoke all on function public.is_snackverse_community_member(uuid) from public, anon;
grant execute on function public.is_snackverse_community_member(uuid) to authenticated;

drop policy if exists "Public can view communities" on public.communities;
create policy "Public can view communities"
  on public.communities for select to anon, authenticated
  using (true);

drop policy if exists "Authenticated can create communities" on public.communities;
create policy "Authenticated can create communities"
  on public.communities for insert to authenticated
  with check (auth.uid() = creator_id);

drop policy if exists "Community creator can update community" on public.communities;
create policy "Community creator can update community"
  on public.communities for update to authenticated
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

drop policy if exists "Users view own memberships" on public.community_members;
drop policy if exists "Members view community" on public.community_members;
drop policy if exists "Users view own or same-community memberships" on public.community_members;
drop policy if exists "Users can join communities" on public.community_members;
drop policy if exists "Users can join open communities or add themselves as creator" on public.community_members;
create policy "Users view own or same-community memberships"
  on public.community_members for select to authenticated
  using (auth.uid() = user_id or public.is_snackverse_community_member(community_id));

create policy "Users can join open communities or add themselves as creator"
  on public.community_members for insert to authenticated
  with check (
    auth.uid() = user_id
    and (
      (role = 'member' and exists (
        select 1 from public.communities c
        where c.id = community_id and coalesce(c.requires_approval, false) = false
      ))
      or
      (role = 'creator' and exists (
        select 1 from public.communities c
        where c.id = community_id and c.creator_id = auth.uid()
      ))
    )
  );

-- -----------------------------------------------------------------------------
-- 4. Friend requests and friendship RPCs.
-- -----------------------------------------------------------------------------
drop policy if exists "Users view own requests" on public.friend_requests;
drop policy if exists "Users can send requests" on public.friend_requests;
drop policy if exists "Users view own sent or received requests" on public.friend_requests;
drop policy if exists "Users can send friend requests" on public.friend_requests;
drop policy if exists "Recipients can respond to requests" on public.friend_requests;
create policy "Users view own sent or received requests"
  on public.friend_requests for select to authenticated
  using (auth.uid() = from_id or auth.uid() = to_id);
create policy "Users can send friend requests"
  on public.friend_requests for insert to authenticated
  with check (auth.uid() = from_id and to_id <> auth.uid());

-- No direct INSERT/UPDATE policy is granted on friendships. The authenticated
-- RPC below creates reciprocal rows after verifying a real pending request.
drop policy if exists "Users view own friendships" on public.friendships;
drop policy if exists "Users view their friendships" on public.friendships;
drop policy if exists "Users can create own friendship" on public.friendships;
drop policy if exists "Users can create their own friendship" on public.friendships;
create policy "Users view their friendships"
  on public.friendships for select to authenticated
  using (auth.uid() = user_id or auth.uid() = friend_id);

create or replace function public.is_snackverse_username_available(search_username text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select length(trim(coalesce(search_username, ''))) between 3 and 20
    and not exists (
      select 1 from public.profiles p
      where lower(p.username) = lower(trim(search_username))
        and (auth.uid() is null or p.id <> auth.uid())
    );
$$;
revoke all on function public.is_snackverse_username_available(text) from public;
grant execute on function public.is_snackverse_username_available(text) to anon, authenticated;

create or replace function public.find_profile_by_username(search_username text)
returns table (id uuid, username text, display_name text, avatar_url text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.id, p.username, p.display_name, p.avatar_url
  from public.profiles p
  where auth.uid() is not null
    and lower(p.username) = lower(trim(search_username))
    and p.id <> auth.uid()
  limit 1;
$$;
revoke all on function public.find_profile_by_username(text) from public, anon;
grant execute on function public.find_profile_by_username(text) to authenticated;

create or replace function public.send_snackverse_friend_request(to_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  existing_request public.friend_requests%rowtype;
  new_request_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;
  if to_user_id is null or to_user_id = current_user_id then
    raise exception 'Choose another player to send a friend request';
  end if;
  if not exists (select 1 from public.profiles p where p.id = to_user_id) then
    raise exception 'Player not found';
  end if;
  if exists (
    select 1 from public.friendships f
    where (f.user_id = current_user_id and f.friend_id = to_user_id)
       or (f.user_id = to_user_id and f.friend_id = current_user_id)
  ) then
    raise exception 'You are already friends';
  end if;

  select * into existing_request
  from public.friend_requests fr
  where fr.from_id = current_user_id and fr.to_id = to_user_id
  for update;

  if found then
    if existing_request.status = 'pending' then
      raise exception 'A friend request is already pending';
    end if;
    update public.friend_requests
    set status = 'pending', created_at = now()
    where id = existing_request.id
    returning id into new_request_id;
  else
    insert into public.friend_requests (from_id, to_id, status)
    values (current_user_id, to_user_id, 'pending')
    returning id into new_request_id;
  end if;

  return new_request_id;
end;
$$;
revoke all on function public.send_snackverse_friend_request(uuid) from public, anon;
grant execute on function public.send_snackverse_friend_request(uuid) to authenticated;

create or replace function public.accept_friend_request(request_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  request_row public.friend_requests%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into request_row
  from public.friend_requests fr
  where fr.id = $1
    and fr.to_id = auth.uid()
    and fr.status = 'pending'
  for update;

  if not found then
    raise exception 'Friend request was not found or is no longer pending';
  end if;

  update public.friend_requests
  set status = 'accepted'
  where id = request_row.id;

  insert into public.friendships (user_id, friend_id, status)
  values (request_row.from_id, request_row.to_id, 'accepted'),
         (request_row.to_id, request_row.from_id, 'accepted')
  on conflict (user_id, friend_id) do nothing;

  return true;
end;
$$;
revoke all on function public.accept_friend_request(uuid) from public, anon;
grant execute on function public.accept_friend_request(uuid) to authenticated;

create or replace function public.get_my_friends()
returns table (id uuid, friend_id uuid, username text, display_name text, avatar_url text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select f.id, p.id, p.username, p.display_name, p.avatar_url
  from public.friendships f
  join public.profiles p on p.id = f.friend_id
  where auth.uid() is not null
    and f.user_id = auth.uid()
    and f.status = 'accepted'
  order by p.username;
$$;
revoke all on function public.get_my_friends() from public, anon;
grant execute on function public.get_my_friends() to authenticated;

create or replace function public.get_pending_friend_requests()
returns table (id uuid, from_id uuid, username text, display_name text, avatar_url text, created_at timestamptz)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select fr.id, p.id, p.username, p.display_name, p.avatar_url, fr.created_at
  from public.friend_requests fr
  join public.profiles p on p.id = fr.from_id
  where auth.uid() is not null
    and fr.to_id = auth.uid()
    and fr.status = 'pending'
  order by fr.created_at desc;
$$;
revoke all on function public.get_pending_friend_requests() from public, anon;
grant execute on function public.get_pending_friend_requests() to authenticated;

-- -----------------------------------------------------------------------------
-- 5. Own-row policies for game history and puzzle attempts.
-- -----------------------------------------------------------------------------
drop policy if exists "Users view own sessions" on public.game_sessions;
drop policy if exists "Users can insert sessions" on public.game_sessions;
create policy "Users view own sessions"
  on public.game_sessions for select to authenticated
  using (auth.uid() = user_id);
create policy "Users can insert sessions"
  on public.game_sessions for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users view own attempts" on public.puzzle_attempts;
drop policy if exists "Users can insert attempts" on public.puzzle_attempts;
create policy "Users view own attempts"
  on public.puzzle_attempts for select to authenticated
  using (auth.uid() = user_id);
create policy "Users can insert attempts"
  on public.puzzle_attempts for insert to authenticated
  with check (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 6. Supporting indexes.
-- -----------------------------------------------------------------------------
create index if not exists profiles_username_lower_idx on public.profiles (lower(username));
create index if not exists community_members_user_status_idx on public.community_members (user_id, status);
create index if not exists friend_requests_to_status_idx on public.friend_requests (to_id, status);
create index if not exists friendships_user_status_idx on public.friendships (user_id, status);
create index if not exists game_sessions_user_created_idx on public.game_sessions (user_id, created_at desc);

commit;
