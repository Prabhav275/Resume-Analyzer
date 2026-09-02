import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface AnalysisResult {
  overallScore: number;
  categoryScores: {
    label: string;
    score: number;
    description: string;
  }[];
  summary: string;
  suggestions: {
    category: string;
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    example?: string;
  }[];
  strengths: string[];
}

function extractTextFromPdf(bytes: Uint8Array): string {
  let text = '';
  try {
    const decoder = new TextDecoder('latin1');
    const raw = decoder.decode(bytes);
    const matches = raw.matchAll(/BT([\s\S]*?)ET/g);
    for (const match of matches) {
      const block = match[1];
      const textMatches = block.matchAll(/\(([^)]*)\)\s*Tj/g);
      for (const tm of textMatches) {
        text += tm[1] + ' ';
      }
      const arrayMatches = block.matchAll(/\[([^\]]*)\]\s*TJ/g);
      for (const am of arrayMatches) {
        const parts = am[1].matchAll(/\(([^)]*)\)/g);
        for (const p of parts) {
          text += p[1] + ' ';
        }
      }
    }
  } catch {
    text = '';
  }
  if (!text.trim()) {
    try {
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const raw = decoder.decode(bytes);
      const textMatches = raw.matchAll(/\(([^)]{2,})\)/g);
      for (const tm of textMatches) {
        const candidate = tm[1];
        if (candidate.length > 1 && /[a-zA-Z]/.test(candidate)) {
          text += candidate + ' ';
        }
      }
    } catch {
      // give up
    }
  }
  return text.replace(/\s+/g, ' ').trim();
}

function extractTextFromDoc(bytes: Uint8Array): string {
  try {
    const decoder = new TextDecoder('latin1');
    const raw = decoder.decode(bytes);
    const textMatches = raw.matchAll(/[\r\n]?([^\r\n\x00-\x08\x0B\x0C\x0E-\x1F]{4,})[\r\n]?/g);
    let text = '';
    for (const tm of textMatches) {
      const candidate = tm[1].trim();
      if (candidate.length > 2 && /[a-zA-Z]/.test(candidate)) {
        text += candidate + ' ';
      }
    }
    return text.replace(/\s+/g, ' ').trim();
  } catch {
    return '';
  }
}

function extractTextFromDocx(bytes: Uint8Array): string {
  try {
    const decoder = new TextDecoder('utf-8');
    const raw = decoder.decode(bytes);
    const textMatches = raw.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g);
    let text = '';
    for (const tm of textMatches) {
      text += tm[1] + ' ';
    }
    const paragraphMatches = raw.matchAll(/<w:p[\s>]/g);
    const paragraphCount = paragraphMatches.length;
    if (paragraphCount > 0 && text) {
      const decoder2 = new TextDecoder('utf-8');
      const raw2 = decoder2.decode(bytes);
      let modified = raw2.replace(/<\/w:p>/g, '\n');
      const paraMatches = modified.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g);
      let text2 = '';
      let lastFull = '';
      for (const pm of paraMatches) {
        text2 += pm[1];
      }
      const lines = text2.split('\n').filter((l) => l.trim());
      return lines.join(' ').replace(/\s+/g, ' ').trim() || text.replace(/\s+/g, ' ').trim();
    }
    return text.replace(/\s+/g, ' ').trim();
  } catch {
    return '';
  }
}

function extractText(fileType: string, bytes: Uint8Array): string {
  if (fileType === 'application/pdf') {
    return extractTextFromPdf(bytes);
  }
  if (fileType === 'application/msword') {
    return extractTextFromDoc(bytes);
  }
  if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return extractTextFromDocx(bytes);
  }
  return '';
}

async function callAI(resumeText: string): Promise<AnalysisResult> {
  const apiKey = Deno.env.get('OPENCODE_API_KEY');
  if (!apiKey) {
    throw new Error('OPENCODE_API_KEY secret is not configured. Please add it in Supabase Edge Functions > Secrets.');
  }

  const systemPrompt = `You are an expert resume reviewer and career coach. Analyze the resume text provided and return a JSON object with this exact structure:
{
  "overallScore": number (0-100),
  "categoryScores": [
    { "label": string, "score": number (0-100), "description": string }
  ] (categories: Formatting & Design, Impact & Achievements, Keywords & ATS Optimization, Skills & Qualifications, Experience & Relevance),
  "summary": string (2-3 sentence overview of the resume quality),
  "suggestions": [
    { "category": string, "priority": "high"|"medium"|"low", "title": string, "description": string, "example": string (optional) }
  ] (at least 5 specific, actionable suggestions),
  "strengths": string[] (3-5 things the resume does well)
}

Score fairly but critically. Most resumes should score between 40-80. Only give 90+ to exceptional resumes. Provide specific, actionable feedback with examples where possible. You MUST return only valid JSON, no markdown fences, no explanation text.`;

  const models = [
    'nemotron-3-ultra-free',
    'deepseek-v4-flash-free',
    'mimo-v2.5-free',
    'laguna-s-2.1-free',
    'nemotron-3.5-lightning-free',
    'hy3-free',
    'big-pickle',
  ];

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Analyze this resume:\n\n${resumeText}` },
  ];

  let lastError = '';

  for (const model of models) {
    const response = await fetch('https://opencode.ai/zen/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, temperature: 0.7 }),
    });

    if (!response.ok) {
      lastError = `OpenCode API error (${response.status}) for model ${model}: ${await response.text()}`;
      continue;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      lastError = `No content returned from OpenCode API for model ${model}`;
      continue;
    }

    try {
      const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const parsed = JSON.parse(cleaned) as AnalysisResult;

      if (typeof parsed.overallScore !== 'number' || !Array.isArray(parsed.categoryScores) || !Array.isArray(parsed.suggestions)) {
        lastError = `Invalid analysis format from model ${model}`;
        continue;
      }

      return parsed;
    } catch {
      lastError = `Failed to parse JSON from model ${model}`;
      continue;
    }
  }

  throw new Error(lastError || 'All OpenCode Zen models failed. Please try again later.');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { resumeId } = await req.json();

    if (!resumeId) {
      return new Response(JSON.stringify({ error: 'resumeId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: userData } = await supabase.auth.getUser(token);
      if (!userData.user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: resume, error: resumeError } = await supabase
        .from('resumes')
        .select('*')
        .eq('id', resumeId)
        .eq('user_id', userData.user.id)
        .maybeSingle();

      if (resumeError || !resume) {
        return new Response(JSON.stringify({ error: 'Resume not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: fileData, error: downloadError } = await supabase
        .storage
        .from('resume-files')
        .download(resume.file_path);

      if (downloadError || !fileData) {
        return new Response(JSON.stringify({ error: 'Failed to download resume file' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const fileBytes = new Uint8Array(await fileData.arrayBuffer());
      const extractedText = extractText(resume.file_type, fileBytes);

      if (!extractedText || extractedText.trim().length < 20) {
        return new Response(JSON.stringify({ error: 'Could not extract enough text from this file. Please try a text-based PDF or a standard Word document.' }), {
          status: 422,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await supabase
        .from('resumes')
        .update({ extracted_text: extractedText })
        .eq('id', resume.id);

      const analysisResult = await callAI(extractedText);

      const { data: analysisRecord, error: insertError } = await supabase
        .from('analyses')
        .insert({
          resume_id: resume.id,
          user_id: userData.user.id,
          overall_score: analysisResult.overallScore,
          category_scores: analysisResult.categoryScores,
          summary: analysisResult.summary,
          suggestions: analysisResult.suggestions,
          strengths: analysisResult.strengths,
        })
        .select()
        .maybeSingle();

      if (insertError || !analysisRecord) {
        throw new Error('Failed to save analysis: ' + (insertError?.message ?? 'unknown'));
      }

      return new Response(JSON.stringify(analysisRecord), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'No authorization header' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
