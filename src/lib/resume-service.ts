import { supabase } from '@/lib/supabase';

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Please upload a PDF, DOC, or DOCX file.';
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'File size must be under 10 MB.';
  }
  return null;
}

export async function uploadResume(
  file: File,
  userId: string
): Promise<{ id: string; error: string | null }> {
  const fileExt = file.name.split('.').pop() || 'pdf';
  const fileName = `${userId}/${crypto.randomUUID()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('resume-files')
    .upload(fileName, file, { contentType: file.type });

  if (uploadError) {
    return { id: '', error: uploadError.message };
  }

  const { data, error: insertError } = await supabase
    .from('resumes')
    .insert({
      file_name: file.name,
      file_path: fileName,
      file_type: file.type,
      file_size: file.size,
    })
    .select('id')
    .maybeSingle();

  if (insertError || !data) {
    return { id: '', error: insertError?.message ?? 'Failed to save resume record.' };
  }

  return { id: data.id, error: null };
}

export async function analyzeResume(resumeId: string): Promise<{ data: unknown; error: string | null }> {
  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-resume`;

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  if (!token) {
    return { data: null, error: 'You must be signed in to analyze a resume.' };
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ resumeId }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    return { data: null, error: errBody.error || `Analysis failed (${response.status})` };
  }

  const result = await response.json();
  if (!result || typeof result.overall_score !== 'number') {
    return { data: null, error: 'Received an invalid analysis response.' };
  }

  return { data: result, error: null };
}
