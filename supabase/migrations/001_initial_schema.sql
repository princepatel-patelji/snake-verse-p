-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null,
  username text unique not null,
  phone_number text,
  avatar_url text,
  bio text,
  level int default 1,
  xp int default 0,
  virtual_calories int default 0,
  total_sessions int default 0,
  total_puzzles_solved int default 0,
  privacy_settings jsonb default '{}',
  preferences jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Communities
create table communities (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  icon_url text,
  creator_id uuid references profiles(id),
  invite_code text unique not null,
  requires_approval boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Community Members
create table community_members (
  id uuid default uuid_generate_v4() primary key,
  community_id uuid references communities(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text check (role in ('creator', 'admin', 'member')) default 'member',
  status text check (status in ('active', 'pending')) default 'pending',
  joined_at timestamptz default now(),
  unique(community_id, user_id)
);

-- Friend Requests
create table friend_requests (
  id uuid default uuid_generate_v4() primary key,
  from_id uuid references profiles(id) on delete cascade,
  to_id uuid references profiles(id) on delete cascade,
  status text check (status in ('pending', 'accepted', 'rejected')) default 'pending',
  created_at timestamptz default now(),
  unique(from_id, to_id)
);

-- Friendships
create table friendships (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade,
  friend_id uuid references profiles(id) on delete cascade,
  status text check (status in ('accepted', 'blocked')) default 'accepted',
  created_at timestamptz default now(),
  unique(user_id, friend_id)
);

-- Game Sessions
create table game_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade,
  session_type text check (session_type in ('solo', 'friend', 'community')) default 'solo',
  community_id uuid references communities(id),
  room_id text,
  total_calories_added int default 0,
  total_calories_removed int default 0,
  puzzles_attempted int default 0,
  puzzles_correct int default 0,
  xp_earned int default 0,
  duration int,
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- Puzzle Attempts
create table puzzle_attempts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade,
  question_id text not null,
  selected_answer text,
  is_correct boolean default false,
  xp_earned int default 0,
  time_taken int,
  created_at timestamptz default now()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
alter table profiles enable row level security;
alter table communities enable row level security;
alter table community_members enable row level security;
alter table friend_requests enable row level security;
alter table friendships enable row level security;
alter table game_sessions enable row level security;
alter table puzzle_attempts enable row level security;

-- Profiles: Users can read/update own profile
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Communities: Public read, authenticated insert
create policy "Public can view communities" on communities for select using (true);
create policy "Authenticated can create communities" on communities for insert with check (auth.role() = 'authenticated');

-- Community Members: View own, admins/creators view all in their community
create policy "Users view own memberships" on community_members for select using (auth.uid() = user_id);
create policy "Members view community" on community_members for select using (community_id in (select community_id from community_members where user_id = auth.uid()));

-- Friend Requests: View own sent/received
create policy "Users view own requests" on friend_requests for select using (auth.uid() = from_id or auth.uid() = to_id);
create policy "Users can send requests" on friend_requests for insert with check (auth.uid() = from_id);

-- Friendships: View own
create policy "Users view own friendships" on friendships for select using (auth.uid() = user_id or auth.uid() = friend_id);

-- Game Sessions: Own only
create policy "Users view own sessions" on game_sessions for select using (auth.uid() = user_id);
create policy "Users can insert sessions" on game_sessions for insert with check (auth.uid() = user_id);

-- Puzzle Attempts: Own only
create policy "Users view own attempts" on puzzle_attempts for select using (auth.uid() = user_id);
create policy "Users can insert attempts" on puzzle_attempts for insert with check (auth.uid() = user_id);