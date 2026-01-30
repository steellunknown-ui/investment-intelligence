-- Create the 'avatars' bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
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

-- Policy: Allow public read access to avatars (since bucket is public)
create policy "Allow Public Avatar Read" on storage.objects
for select
to public
using (bucket_id = 'avatars');