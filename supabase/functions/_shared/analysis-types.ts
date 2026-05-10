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

export interface ScanAnalysis {
  scores: TechnicalScores;
  recommendations: Recommendation[];
  summary: string;
  answer_tests?: AnswerTest[];
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
