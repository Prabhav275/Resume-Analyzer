/*
# Create resume-files storage bucket

1. Storage
- Create a private storage bucket named "resume-files" for storing uploaded resume documents.
- Set a 10MB file size limit.
- Allow only PDF, DOC, and DOCX file types.

2. Security
- Storage policies: only authenticated users can upload, read, and delete their own files.
- Files are stored under paths prefixed with the user's ID for isolation.
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resume-files',
  'resume-files',
  false,
  10485760,
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload own resume files" ON storage.objects;
CREATE POLICY "Users can upload own resume files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'resume-files' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can read own resume files" ON storage.objects;
CREATE POLICY "Users can read own resume files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'resume-files' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete own resume files" ON storage.objects;
CREATE POLICY "Users can delete own resume files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'resume-files' AND (storage.foldername(name))[1] = auth.uid()::text);