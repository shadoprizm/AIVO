export interface Site {
  id: string;
  user_id: string;
  name: string;
  url: string;
  created_at: string;
  last_scanned_at: string | null;
}

export interface CategoryScores {
  content_clarity: number;
  semantic_structure: number;
  schema_metadata: number;
  qa_readiness: number;
  authority_trust: number;
  technical_accessibility: number;
}

export interface Recommendation {
  id: string;
  category: keyof CategoryScores;
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  suggested_fix: string;
  implementation_effort: 'low' | 'medium' | 'high';
}

export interface AnalysisJson {
  overall_score: number;
  category_scores: CategoryScores;
  recommendations: Recommendation[];
  notes?: string[];
  warnings?: string[];
  analyzed_at: string;
  analysis_version: string;
}

export interface Scan {
  id: string;
  site_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  overall_score: number | null;
  analysis_json: AnalysisJson | null;
  created_at: string;
  completed_at: string | null;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author_name: string;
  author_email?: string;
  cover_image_url?: string;
  tags: string[];
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  meta_description?: string;
  reading_time_minutes: number;
}
