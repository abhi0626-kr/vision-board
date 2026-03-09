-- Private storage buckets for Secret Notes media uploads

insert into storage.buckets (id, name, public)
values ('secret-note-images', 'secret-note-images', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('secret-note-videos', 'secret-note-videos', false)
on conflict (id) do nothing;

drop policy if exists "secret_note_media_select" on storage.objects;
create policy "secret_note_media_select" on storage.objects
for select to authenticated
using (
  bucket_id in ('secret-note-images', 'secret-note-videos')
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "secret_note_media_insert" on storage.objects;
create policy "secret_note_media_insert" on storage.objects
for insert to authenticated
with check (
  bucket_id in ('secret-note-images', 'secret-note-videos')
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "secret_note_media_update" on storage.objects;
create policy "secret_note_media_update" on storage.objects
for update to authenticated
using (
  bucket_id in ('secret-note-images', 'secret-note-videos')
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id in ('secret-note-images', 'secret-note-videos')
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "secret_note_media_delete" on storage.objects;
create policy "secret_note_media_delete" on storage.objects
for delete to authenticated
using (
  bucket_id in ('secret-note-images', 'secret-note-videos')
  and (storage.foldername(name))[1] = auth.uid()::text
);
