-- profiles table for linking extra user data to auth.users
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamptz,
  username text unique,
  full_name text,
  avatar_url text,
  website text
);

-- enable RLS
alter table public.profiles enable row level security;

-- public select policy so list of profiles is readable (optional)
create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

-- allow users to insert their own profile
create policy "Users can insert their own profile." on public.profiles
  for insert with check ((select auth.uid()) = id);

-- allow users to update their own profile
create policy "Users can update own profile." on public.profiles
  for update using ((select auth.uid()) = id);

-- create trigger function to auto-create profile on sign up
create or replace function public.handle_new_user() returns trigger
  language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, avatar_url, updated_at)
    values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', now())
    on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
