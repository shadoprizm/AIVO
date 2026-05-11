export type Severity = 'high' | 'medium' | 'low';
export type EffortEstimate = 'low' | 'medium' | 'high';
export type ScanAudience = 'anonymous' | 'authenticated';

export interface FetchedResource {
  url: string;
  status: number;
  bytes: number;
  contentType: string;
  body: string;
}

export interface FailedResource {
  url: string;
  error: string;
}

export interface SystemFile {
  type: 'robots' | 'sitemap' | 'llms';
  url: string;
  status: number;
  content: string;
}

export interface CrawlEvidence {
  discovered_pages: string[];
  fetched_pages: { url: string; bytes: number; status: number }[];
  failed_pages: FailedResource[];
  system_files: SystemFile[];
  crawl_warnings: string[];
}

export interface DiscoveredSite {
  input_url: string;
  normalized_url: string;
  domain: string;
  homepage: FetchedResource | null;
  pages: FetchedResource[];
  system_files: SystemFile[];
  sitemap_urls: string[];
  detected_pages: {
    about: string[];
    contact: string[];
    trust: string[];
    faq: string[];
    product_or_service: string[];
  };
  evidence: CrawlEvidence;
}

export interface TechnicalFinding {
  key: string;
  label: string;
  passed: boolean;
  severity: Severity;
  evidence: string;
}

export interface TechnicalScores {
  crawl_access: number;
  entity_clarity: number;
  answer_readiness: number;
  citation_likelihood: number;
  trust_evidence: number;
  competitive_presence: number;
  overall: number;
}

export interface AIVOScoreV2 {
  crawl_access: number;        // 25% - deterministic crawl and robots/sitemap access.
  entity_clarity: number;      // 20% - LLM analysis blended with schema/entity signals.
  answer_readiness: number;    // 20% - LLM analysis of answerable structure.
  citation_likelihood: number; // 15% - LLM analysis blended with answer simulations.
  trust_evidence: number;      // 15% - deterministic trust, contact, and evidence signals.
  competitive_presence: number;// 5% - answer simulation comparison signal.
  overall: number;             // Weighted blend of the category scores above.
}

export interface Recommendation {
  title: string;
  severity: Severity;
  evidence: string;
  why_it_matters: string;
  exact_fix: string;
  effort_estimate: EffortEstimate;
  owner: 'developer' | 'content' | 'marketing' | 'owner';
  expected_impact: string;
}

export interface TechnicalCheckResult {
  scores: TechnicalScores;
  findings: TechnicalFinding[];
  recommendations: Recommendation[];
  evidence: {
    robots: {
      present: boolean;
      allowed_bots: string[];
      blocked_bots: string[];
    };
    llms: {
      present: boolean;
      summary: string;
    };
    sitemap: {
      present: boolean;
      valid_xml: boolean;
      url_count: number;
    };
    html: {
      title: string | null;
      meta_description: string | null;
      canonical: string | null;
      schema_types: string[];
      has_open_graph: boolean;
      has_twitter_metadata: boolean;
      h1_count: number;
      heading_order_valid: boolean;
      has_faq_schema: boolean;
      csr_shell_risk: boolean;
    };
  };
}

export interface ScanInput {
  site: DiscoveredSite;
  technical: TechnicalCheckResult;
}

export interface AIFixPromptIssue {
  priority: number;
  severity: Severity;
  title: string;
  files_or_locations: string[];
  exact_change: string;
  verification: string;
}

export interface AIFixPrompt {
  site_url: string;
  overall_score: number;
  scan_date: string;
  issues: AIFixPromptIssue[];
  post_fix_action: string;
}

export interface CustomerSummaryIssue {
  recommendation_index: number;
  title: string;
  business_impact: string;
  what_we_recommend: string;
}

export interface CustomerSummary {
  headline: string;
  score_interpretation: string;
  issues: CustomerSummaryIssue[];
  closing_call_to_action: string;
}

export interface ScanAnalysis {
  scores: TechnicalScores;
  recommendations: Recommendation[];
  summary: string;
  answer_tests?: AnswerTest[];
  ai_fix_prompt_markdown?: string;
  ai_fix_prompt_structured?: AIFixPrompt;
  customer_summary?: CustomerSummary;
}

export interface AnswerTest {
  prompt: string;
  model: string;
  brand_mentioned: boolean;
  competitors_mentioned: string[];
  cited_urls: string[];
  sentiment: 'positive' | 'neutral' | 'negative' | 'unknown';
  confidence: number;
  missing_evidence: string[];
  raw_excerpt: string;
}
