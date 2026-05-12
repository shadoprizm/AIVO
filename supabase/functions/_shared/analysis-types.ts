export type Severity = 'high' | 'medium' | 'low';
export type EffortEstimate = 'low' | 'medium' | 'high';
export type ScanAudience = 'anonymous' | 'authenticated';
export type RecommendationSource = 'technical' | 'entity' | 'competitor' | 'content_gap' | 'generative';

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
  source?: RecommendationSource;
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
  category_inference?: CategoryInference;
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

export type QueryIntent = 'brand' | 'category' | 'comparison' | 'intent' | 'feature';
export type CitationFormat = 'quoted' | 'listed' | 'linked' | 'named' | 'absent';

export interface QueryBatteryItem extends AnswerTest {
  intent: QueryIntent;
  citation_format: CitationFormat;
}

export interface GenerativeAudit {
  query_battery: QueryBatteryItem[];
  brand_mention_rate: number;
  competitor_mention_rate: number;
  citation_rate: number;
  notes: string;
}

export interface CategoryInference {
  category: string;
  category_aliases: string[];
  brand: string;
  primary_use_cases: string[];
}

export interface CompetitorCandidate {
  name: string;
  url: string;
  confidence: number;
  source: 'inferred' | 'user';
  reason: string;
}

export interface CompetitorBreakdown {
  name: string;
  url: string;
  entities_owned: string[];
  schema_coverage: string[];
  faq_topics: string[];
  positioning_summary: string;
  citation_format_signals: string[];
  fetch_status: 'ok' | 'failed' | 'skipped';
}

export interface EntityMap {
  claimed: string[];
  perceived: string[];
  gaps: string[];
  competitor_owned: string[];
  salience_score: number;
  notes: string;
}

export type ContentIntent = 'informational' | 'commercial' | 'transactional' | 'comparison';
export type ContentFormat = 'faq' | 'comparison_table' | 'how_to' | 'definition' | 'listicle';

export interface ContentGap {
  question: string;
  intent: ContentIntent;
  has_answer: boolean;
  competitor_has_answer: boolean;
  suggested_format: ContentFormat;
  rationale: string;
}

export type BlueprintPageType = 'vs_competitor' | 'glossary' | 'how_to' | 'faq_expansion' | 'use_case';

export interface BlueprintSection {
  heading: string;
  content_summary: string;
  format: 'definition' | 'comparison_table' | 'faq' | 'how_to' | 'list';
}

export interface BlueprintItem {
  page_type: BlueprintPageType;
  suggested_url: string;
  title: string;
  sections: BlueprintSection[];
  target_entities: string[];
  target_queries: string[];
  schema_template: string;
  closes_gaps: string[];
  expected_citation_uplift: 'low' | 'medium' | 'high';
}

export interface StrategicFindings {
  category_inference?: CategoryInference;
  competitors?: CompetitorCandidate[];
  competitor_teardown?: CompetitorBreakdown[];
  generative_audit?: GenerativeAudit;
  entity_map?: EntityMap;
  content_gaps?: ContentGap[];
  content_blueprint?: BlueprintItem[];
  strategic_readiness_score?: number;
  strategic_readiness_summary?: string;
}
