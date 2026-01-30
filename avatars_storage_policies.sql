-- Create the 'avatars' bucket if it doesn't exist (private bucket)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false)
on conflict (id) do nothing;

-- Enable RLS on storage.objects if not already enabled
alter table storage.objects enable row level security;

-- Policy: Allow authenticated users to upload to their own folder
-- Folder structure: {user_id}/avatar.{ext}
create policy "Allow User Avatar Upload" on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to view their own avatars
create policy "Allow User Avatar Select" on storage.objects
for select
to authenticated
using (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to delete their own avatars
create policy "Allow User Avatar Delete" on storage.objects
for delete
to authenticated
using (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to update their own avatars
create policy "Allow User Avatar Update" on storage.objects
for update
to authenticated
using (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
);