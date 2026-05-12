-- v2 strategic report layer
--
-- No structural changes: v2_score and v2_evidence are JSONB and absorb new fields without migration.
-- This file documents the new shape so future readers know what to expect inside v2_evidence.
--
-- v2_evidence now contains (in addition to the existing fields):
--   category_inference          : { category, category_aliases[], brand, primary_use_cases[] }
--   competitors                 : Array<{ name, url, confidence, source, reason }>
--   competitor_teardown         : Array<{ name, url, entities_owned[], schema_coverage[],
--                                          faq_topics[], positioning_summary, citation_format_signals[],
--                                          fetch_status }>
--   query_battery               : Array<QueryBatteryItem> (expanded answer simulations with intent + citation_format)
--   answer_tests                : Mirrors query_battery for backwards compatibility with v1 consumers.
--   generative_audit            : { query_battery, brand_mention_rate, competitor_mention_rate,
--                                    citation_rate, notes }
--   entity_map                  : { claimed[], perceived[], gaps[], competitor_owned[],
--                                    salience_score, notes }
--   content_gaps                : Array<{ question, intent, has_answer, competitor_has_answer,
--                                          suggested_format, rationale }>
--   content_blueprint           : Array<{ page_type, suggested_url, title, sections[],
--                                          target_entities[], target_queries[], schema_template,
--                                          closes_gaps[], expected_citation_uplift }>
--   strategic_readiness_score   : number 0-100
--   strategic_readiness_summary : string (one short paragraph)
--   module_timings_ms           : { [module_name]: number } -- per-module wall time for cost/perf tracking
--
-- v2_evidence.recommendations entries now carry an optional `source` field:
--   'technical' | 'entity' | 'competitor' | 'content_gap' | 'generative'
-- Pre-existing recommendations without a source default to undefined and render under "technical" in the UI.
--
-- v2_score.competitive_presence is now derived from generative_audit (brand_mention_rate + citation_rate)
-- when the strategic pass completes. Pre-existing rows scanned before this migration keep the LLM-guessed value.

COMMENT ON COLUMN public.scans.v2_evidence IS
  'JSONB report evidence. v2 strategic layer adds: category_inference, competitors, competitor_teardown, query_battery, generative_audit, entity_map, content_gaps, content_blueprint, strategic_readiness_score, strategic_readiness_summary, module_timings_ms. See migration 20260512000000_v2_report_strategic_layer.sql for the full shape.';

COMMENT ON COLUMN public.scans.v2_score IS
  'JSONB sub-scores (crawl_access, entity_clarity, answer_readiness, citation_likelihood, trust_evidence, competitive_presence, overall). competitive_presence is derived from generative_audit when the v2 strategic pass completes.';
