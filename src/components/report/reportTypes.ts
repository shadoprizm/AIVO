export type ScoreMap = Record<string, unknown>;

export interface ReportSiteSummary {
  name?: string;
  url?: string;
}

export type ReportRecommendationSource = 'technical' | 'entity' | 'competitor' | 'content_gap' | 'generative';

export interface ReportRecommendation {
  title?: string;
  severity?: string;
  evidence?: string;
  why_it_matters?: string;
  exact_fix?: string;
  effort_estimate?: string;
  owner?: string;
  expected_impact?: string;
  source?: ReportRecommendationSource;
}

export interface ReportAnswerTest {
  prompt?: string;
  model?: string;
  brand_mentioned?: boolean;
  competitors_mentioned?: string[];
  cited_urls?: string[];
  sentiment?: string;
  confidence?: number;
  missing_evidence?: string[];
  raw_excerpt?: string;
}

export interface AIFixPromptIssue {
  priority?: number;
  severity?: string;
  title?: string;
  files_or_locations?: string[];
  exact_change?: string;
  verification?: string;
}

export interface AIFixPrompt {
  site_url?: string;
  overall_score?: number;
  scan_date?: string;
  issues?: AIFixPromptIssue[];
  post_fix_action?: string;
}

export interface CustomerSummaryIssue {
  recommendation_index?: number;
  title?: string;
  business_impact?: string;
  what_we_recommend?: string;
}

export interface CustomerSummary {
  headline?: string;
  score_interpretation?: string;
  issues?: CustomerSummaryIssue[];
  closing_call_to_action?: string;
}

export function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export type ReportQueryIntent = 'brand' | 'category' | 'comparison' | 'intent' | 'feature';
export type ReportCitationFormat = 'quoted' | 'listed' | 'linked' | 'named' | 'absent';

export interface ReportQueryBatteryItem extends ReportAnswerTest {
  intent?: ReportQueryIntent;
  citation_format?: ReportCitationFormat;
}

export interface ReportGenerativeAudit {
  query_battery?: ReportQueryBatteryItem[];
  brand_mention_rate?: number;
  competitor_mention_rate?: number;
  citation_rate?: number;
  notes?: string;
}

export interface ReportCategoryInference {
  category?: string;
  category_aliases?: string[];
  brand?: string;
  primary_use_cases?: string[];
}

export interface ReportCompetitorCandidate {
  name?: string;
  url?: string;
  confidence?: number;
  source?: 'inferred' | 'user';
  reason?: string;
}

export interface ReportCompetitorBreakdown {
  name?: string;
  url?: string;
  entities_owned?: string[];
  schema_coverage?: string[];
  faq_topics?: string[];
  positioning_summary?: string;
  citation_format_signals?: string[];
  fetch_status?: 'ok' | 'failed' | 'skipped';
}

export interface ReportEntityMap {
  claimed?: string[];
  perceived?: string[];
  gaps?: string[];
  competitor_owned?: string[];
  salience_score?: number;
  notes?: string;
}

export type ReportContentIntent = 'informational' | 'commercial' | 'transactional' | 'comparison';
export type ReportContentFormat = 'faq' | 'comparison_table' | 'how_to' | 'definition' | 'listicle';

export interface ReportContentGap {
  question?: string;
  intent?: ReportContentIntent;
  has_answer?: boolean;
  competitor_has_answer?: boolean;
  suggested_format?: ReportContentFormat;
  rationale?: string;
}

export type ReportBlueprintPageType = 'vs_competitor' | 'glossary' | 'how_to' | 'faq_expansion' | 'use_case';

export interface ReportBlueprintSection {
  heading?: string;
  content_summary?: string;
  format?: 'definition' | 'comparison_table' | 'faq' | 'how_to' | 'list';
}

export interface ReportBlueprintItem {
  page_type?: ReportBlueprintPageType;
  suggested_url?: string;
  title?: string;
  sections?: ReportBlueprintSection[];
  target_entities?: string[];
  target_queries?: string[];
  schema_template?: string;
  closes_gaps?: string[];
  expected_citation_uplift?: 'low' | 'medium' | 'high';
}
