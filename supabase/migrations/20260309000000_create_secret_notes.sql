-- Secure storage for hidden private notes (one note per user)

create table if not exists secret_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_secret_notes_user_id on secret_notes(user_id);

drop trigger if exists set_secret_notes_updated_at on secret_notes;
create trigger set_secret_notes_updated_at
before update on secret_notes
for each row execute function set_updated_at();

alter table secret_notes enable row level security;

drop policy if exists "secret_notes_select" on secret_notes;
create policy "secret_notes_select" on secret_notes
for select using (auth.uid() = user_id);

drop policy if exists "secret_notes_insert" on secret_notes;
create policy "secret_notes_insert" on secret_notes
for insert with check (auth.uid() = user_id);

drop policy if exists "secret_notes_update" on secret_notes;
create policy "secret_notes_update" on secret_notes
for update using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "secret_notes_delete" on secret_notes;
create policy "secret_notes_delete" on secret_notes
for delete using (auth.uid() = user_id);
