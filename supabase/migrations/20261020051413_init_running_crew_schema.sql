-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  role text not null default 'member' check (role in ('admin', 'member')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  pace text default '5:30/km',
  bio text,
  crew_title text default 'Crew Member',
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2. Posts Table
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  category text not null default 'lounge' check (category in ('regular', 'flash', 'review', 'lounge')),
  title text not null,
  content text not null,
  location text,
  run_date timestamptz,
  distance_km numeric(5,2),
  target_pace text,
  elevation_gain int,
  image_url text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 3. RSVPs (Running Attendance) Table
create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  pace_group text default 'Group B (5:00~5:30)',
  status text not null default 'attending' check (status in ('attending', 'waiting', 'cancelled')),
  created_at timestamptz default timezone('utc'::text, now()) not null,
  unique (post_id, user_id)
);

-- 4. Comments Table
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.rsvps enable row level security;
alter table public.comments enable row level security;

-- Helper functions for security checks
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

create or replace function public.is_approved()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'approved'
  );
end;
$$ language plpgsql security definer;

-- Trigger: Automatically create or update profile on user signup (e.g. Google OAuth)
create or replace function public.handle_new_user()
returns trigger as $$
declare
  user_count int;
  initial_role text := 'member';
  initial_status text := 'pending';
begin
  -- Check if this is the very first user in profiles
  select count(*) into user_count from public.profiles;
  if user_count = 0 then
    -- The first user automatically becomes approved admin
    initial_role := 'admin';
    initial_status := 'approved';
  end if;

  insert into public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    role,
    status
  ) values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''),
    initial_role,
    initial_status
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
    updated_at = now();

  return new;
end;
$$ language plpgsql security definer;

-- Drop existing trigger if any and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Policies: PROFILES
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update their own non-sensitive profile info"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id and (
      -- Regular user cannot change their own role or status
      (role = (select role from public.profiles where id = auth.uid()) and
       status = (select status from public.profiles where id = auth.uid()))
      or public.is_admin()
    )
  );

create policy "Admins can update any profile"
  on public.profiles for update
  using (public.is_admin());

-- Policies: POSTS
create policy "Posts are viewable by everyone"
  on public.posts for select
  using (true);

create policy "Approved members can create posts"
  on public.posts for insert
  with check (
    auth.uid() = author_id and
    (public.is_approved() or public.is_admin())
  );

create policy "Author or Admin can update posts"
  on public.posts for update
  using (auth.uid() = author_id or public.is_admin());

create policy "Author or Admin can delete posts"
  on public.posts for delete
  using (auth.uid() = author_id or public.is_admin());

-- Policies: RSVPS
create policy "RSVPs are viewable by everyone"
  on public.rsvps for select
  using (true);

create policy "Approved members can join runs"
  on public.rsvps for insert
  with check (
    auth.uid() = user_id and
    (public.is_approved() or public.is_admin())
  );

create policy "Users can cancel their RSVP or Admins can manage"
  on public.rsvps for delete
  using (auth.uid() = user_id or public.is_admin());

-- Policies: COMMENTS
create policy "Comments are viewable by everyone"
  on public.comments for select
  using (true);

create policy "Approved members can write comments"
  on public.comments for insert
  with check (
    auth.uid() = author_id and
    (public.is_approved() or public.is_admin())
  );

create policy "Author or Admin can delete comments"
  on public.comments for delete
  using (auth.uid() = author_id or public.is_admin());

-- Realtime publication for live updates
alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.rsvps;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.profiles;
