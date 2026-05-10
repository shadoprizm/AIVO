export interface Site {
  id: string;
  user_id: string | null;
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

export interface CategoryFeedback {
  score_reason: string;
  improvement_path: string;
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
  category_feedback: Record<keyof CategoryScores, CategoryFeedback>;
  recommendations: Recommendation[];
  notes?: string[];
  warnings?: string[];
  faq_findings?: {
    url: string;
    content_length: number;
    has_faq_schema: boolean;
    has_question_schema: boolean;
    question_like_blocks: number;
    adequacy: 'strong' | 'weak' | 'missing';
    summary: string;
  }[];
  analyzed_at: string;
  analysis_version: string;
}

export type ScanVisibility = 'private' | 'unlisted' | 'public';
export type ScanSource = 'dashboard' | 'public';
export type JsonObject = Record<string, unknown>;

export interface Scan {
  id: string;
  site_id: string;
  user_id: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  overall_score: number | null;
  analysis_json: AnalysisJson | null;
  public_token: string | null;
  visibility: ScanVisibility | null;
  request_ip_hash: string | null;
  user_agent_hash: string | null;
  request_domain: string | null;
  source: ScanSource | string | null;
  v2_score: JsonObject | null;
  v2_evidence: JsonObject | null;
  created_at: string;
  completed_at: string | null;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  content_format?: string;
  author_name: string;
  author_email?: string;
  cover_image_url?: string;
  image_source?: string;
  image_author?: string;
  image_author_url?: string;
  tags: string[];
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  meta_description?: string;
  reading_time_minutes: number;
}
