export type ScoreMap = Record<string, unknown>;

export interface ReportSiteSummary {
  name?: string;
  url?: string;
}

export interface ReportRecommendation {
  title?: string;
  severity?: string;
  evidence?: string;
  why_it_matters?: string;
  exact_fix?: string;
  effort_estimate?: string;
  owner?: string;
  expected_impact?: string;
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
