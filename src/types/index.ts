export interface Resume {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  extracted_text: string | null;
  created_at: string;
}

export interface CategoryScore {
  label: string;
  score: number;
  description: string;
}

export interface Suggestion {
  category: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  example?: string;
}

export interface Analysis {
  id: string;
  resume_id: string;
  user_id: string;
  overall_score: number;
  category_scores: CategoryScore[];
  summary: string;
  suggestions: Suggestion[];
  strengths: string[] | null;
  created_at: string;
}

export interface AnalysisResult {
  overallScore: number;
  categoryScores: CategoryScore[];
  summary: string;
  suggestions: Suggestion[];
  strengths: string[];
}
