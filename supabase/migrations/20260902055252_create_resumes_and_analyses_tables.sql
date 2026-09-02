/*
# Create resumes and analyses tables

1. New Tables
- `resumes`: stores uploaded resume files metadata
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to authenticated user, references auth.users)
  - `file_name` (text, not null) - original file name uploaded by user
  - `file_path` (text, not null) - path in Supabase Storage
  - `file_type` (text, not null) - mime type of the file
  - `file_size` (bigint, not null) - file size in bytes
  - `extracted_text` (text) - plain text extracted from the file
  - `created_at` (timestamptz, defaults to now)
- `analyses`: stores AI analysis results for each resume
  - `id` (uuid, primary key)
  - `resume_id` (uuid, not null, references resumes, cascade delete)
  - `user_id` (uuid, not null, defaults to authenticated user, references auth.users)
  - `overall_score` (integer, not null) - overall resume score 0-100
  - `category_scores` (jsonb, not null) - category breakdown scores
  - `summary` (text, not null) - AI-generated summary
  - `suggestions` (jsonb, not null) - array of improvement suggestions
  - `strengths` (jsonb) - array of strengths
  - `created_at` (timestamptz, defaults to now)

2. Security
- Enable RLS on both tables.
- Owner-scoped CRUD: each authenticated user can only access rows they own.
- Both tables have user_id defaulting to auth.uid() so inserts without explicit user_id succeed.

3. Indexes
- Index on resumes.user_id for fast lookups
- Index on analyses.resume_id for fast joins
- Index on analyses.user_id for fast lookups
*/

CREATE TABLE IF NOT EXISTS resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL,
  extracted_text text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_resumes" ON resumes;
CREATE POLICY "select_own_resumes" ON resumes FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_resumes" ON resumes;
CREATE POLICY "insert_own_resumes" ON resumes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_resumes" ON resumes;
CREATE POLICY "update_own_resumes" ON resumes FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_resumes" ON resumes;
CREATE POLICY "delete_own_resumes" ON resumes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);

CREATE TABLE IF NOT EXISTS analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id uuid NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  overall_score integer NOT NULL,
  category_scores jsonb NOT NULL,
  summary text NOT NULL,
  suggestions jsonb NOT NULL,
  strengths jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_analyses" ON analyses;
CREATE POLICY "select_own_analyses" ON analyses FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_analyses" ON analyses;
CREATE POLICY "insert_own_analyses" ON analyses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_analyses" ON analyses;
CREATE POLICY "update_own_analyses" ON analyses FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_analyses" ON analyses;
CREATE POLICY "delete_own_analyses" ON analyses FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_analyses_resume_id ON analyses(resume_id);
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);