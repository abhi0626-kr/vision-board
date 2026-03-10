-- Syncable reflection fields from the main board page

create table if not exists user_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  long_notes text not null default '',
  strengths text not null default '',
  weaknesses text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_reflections_user_id on user_reflections(user_id);

drop trigger if exists set_user_reflections_updated_at on user_reflections;
create trigger set_user_reflections_updated_at
before update on user_reflections
for each row execute function set_updated_at();

alter table user_reflections enable row level security;

drop policy if exists "user_reflections_select" on user_reflections;
create policy "user_reflections_select" on user_reflections
for select using (auth.uid() = user_id);

drop policy if exists "user_reflections_insert" on user_reflections;
create policy "user_reflections_insert" on user_reflections
for insert with check (auth.uid() = user_id);

drop policy if exists "user_reflections_update" on user_reflections;
create policy "user_reflections_update" on user_reflections
for update using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "user_reflections_delete" on user_reflections;
create policy "user_reflections_delete" on user_reflections
for delete using (auth.uid() = user_id);
