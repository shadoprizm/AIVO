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

export function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
