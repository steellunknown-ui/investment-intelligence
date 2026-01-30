-- Create the 'documents' bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Enable RLS
alter table storage.objects enable row level security;

-- Policy: Allow authenticated users to upload to their own folder
-- Folder structure: {user_id}/{filename}
create policy "Allow User Upload" on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to view their own files
create policy "Allow User Select" on storage.objects
for select
to authenticated
using (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to delete their own files
create policy "Allow User Delete" on storage.objects
for delete
to authenticated
using (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
);
