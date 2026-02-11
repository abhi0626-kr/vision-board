-- User profiles table for storing personal information

-- Create profiles table
create table if not exists user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users (id) on delete cascade,
  name text,
  bio text,
  location text,
  occupation text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create trigger for updated_at
create trigger set_user_profiles_updated_at
before update on user_profiles
for each row execute function set_updated_at();

-- Enable Row Level Security
alter table user_profiles enable row level security;

-- Policies: Users can only read and write their own profile
create policy "user_profiles_select" on user_profiles
for select using (auth.uid() = user_id);

create policy "user_profiles_insert" on user_profiles
for insert with check (auth.uid() = user_id);

create policy "user_profiles_update" on user_profiles
for update using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "user_profiles_delete" on user_profiles
for delete using (auth.uid() = user_id);

-- Create index on user_id for faster lookups
create index if not exists idx_user_profiles_user_id on user_profiles(user_id);

-- Function to automatically create a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (user_id, name)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
