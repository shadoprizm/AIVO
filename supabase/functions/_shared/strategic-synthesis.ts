import {
  BlueprintItem,
  CompetitorBreakdown,
  ContentGap,
  EntityMap,
  GenerativeAudit,
  Recommendation,
  StrategicFindings,
  TechnicalScores,
} from './analysis-types.ts';

export function weightedOverallScore(scores: TechnicalScores): number {
  return Math.max(0, Math.min(100, Math.round(
    scores.crawl_access * 0.25 +
    scores.entity_clarity * 0.20 +
    scores.answer_readiness * 0.20 +
    scores.citation_likelihood * 0.15 +
    scores.trust_evidence * 0.15 +
    scores.competitive_presence * 0.05
  )));
}

export function computeStrategicReadinessScore(findings: StrategicFindings): number {
  const generative = findings.generative_audit;
  const entityMap = findings.entity_map;
  const gaps = findings.content_gaps ?? [];

  let weightedSum = 0;
  let appliedWeight = 0;

  if (generative && generative.query_battery.length > 0) {
    const visibility = (generative.brand_mention_rate * 0.6 + generative.citation_rate * 0.4) * 100;
    weightedSum += visibility * 0.4;
    appliedWeight += 0.4;
  }

  if (entityMap) {
    weightedSum += entityMap.salience_score * 0.3;
    appliedWeight += 0.3;
  }

  if (gaps.length > 0) {
    const answered = gaps.filter((g) => g.has_answer).length;
    const coverage = (answered / gaps.length) * 100;
    weightedSum += coverage * 0.3;
    appliedWeight += 0.3;
  }

  if (appliedWeight === 0) return 0;
  return Math.max(0, Math.min(100, Math.round(weightedSum / appliedWeight)));
}

export function summarizeStrategicReadiness(findings: StrategicFindings): string {
  const score = findings.strategic_readiness_score ?? 0;
  if (score >= 80) {
    return 'Strong strategic readiness. The brand is well-perceived in AI answers and content covers the key questions.';
  }
  if (score >= 60) {
    return 'Decent strategic readiness with notable gaps. Specific entities or queries lack coverage relative to competitors.';
  }
  if (score >= 40) {
    return 'Mixed strategic readiness. The brand is partially visible in AI answers but significant content and entity gaps remain.';
  }
  if (score >= 20) {
    return 'Weak strategic readiness. The brand rarely surfaces in AI answers and competitors own the question space.';
  }
  return 'Critical strategic readiness gap. AI engines do not associate the brand with its category, and competitors dominate.';
}

export function deriveCompetitivePresenceScore(generative: GenerativeAudit | undefined): number | null {
  if (!generative || generative.query_battery.length === 0) return null;
  const composite = (generative.brand_mention_rate * 0.6 + generative.citation_rate * 0.4) * 100;
  return Math.max(0, Math.min(100, Math.round(composite)));
}

export function synthesizeStrategicRecommendations(
  entityMap: EntityMap | null | undefined,
  contentGaps: ContentGap[],
  blueprint: BlueprintItem[],
  competitorTeardown: CompetitorBreakdown[],
  generative: GenerativeAudit | undefined,
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  if (generative && generative.query_battery.length > 0 && generative.brand_mention_rate < 0.3) {
    recommendations.push({
      title: 'Improve brand recognition in AI answers',
      severity: 'high',
      evidence: `Brand was mentioned in only ${Math.round(generative.brand_mention_rate * 100)}% of ${generative.query_battery.length} simulated queries.`,
      why_it_matters: 'When AI engines do not associate the brand with its category, users asking category-level questions never see it.',
      exact_fix: 'Publish or amplify three pieces: a clear "what we do" page with Organization schema, a definitive answer to the top category query, and a comparison page against the leading competitor. Cross-link with descriptive anchor text.',
      effort_estimate: 'medium',
      owner: 'content',
      expected_impact: 'Increases brand mention frequency in generative responses for category queries.',
      source: 'generative',
    });
  }

  if (entityMap && entityMap.gaps.length > 0) {
    const topGaps = entityMap.gaps.slice(0, 3).join(', ');
    recommendations.push({
      title: 'Reinforce the entities AI engines should associate with your brand',
      severity: 'medium',
      evidence: `${entityMap.gaps.length} entities the site claims (${topGaps}) did not surface in simulated AI answers.`,
      why_it_matters: 'Entities that are claimed but not perceived signal weak salience — AI engines do not yet link them to the brand.',
      exact_fix: 'For each missing entity, add a dedicated section or definition on the homepage or a glossary page using DefinedTerm schema, and link inbound from related content.',
      effort_estimate: 'medium',
      owner: 'content',
      expected_impact: 'Lifts entity salience score and increases the chance of citation for these concepts.',
      source: 'entity',
    });
  }

  if (entityMap && entityMap.competitor_owned.length > 0) {
    const topOwned = entityMap.competitor_owned.slice(0, 3).join(', ');
    recommendations.push({
      title: 'Contest concepts your competitors own in AI knowledge graphs',
      severity: 'medium',
      evidence: `Competitors clearly own entities (${topOwned}) that the target does not claim.`,
      why_it_matters: 'When users ask AI about these concepts, only competitors surface. Establishing these as part of your own positioning makes you eligible too.',
      exact_fix: 'Publish a long-form authoritative page for each contested entity, supported by FAQ schema and citations. Reference the entity in the homepage and llms.txt.',
      effort_estimate: 'medium',
      owner: 'content',
      expected_impact: 'Establishes the target as an alternative answer to entity queries currently dominated by competitors.',
      source: 'competitor',
    });
  }

  const unanswered = contentGaps.filter((g) => !g.has_answer);
  const competitorAnswered = unanswered.filter((g) => g.competitor_has_answer);
  if (competitorAnswered.length > 0) {
    const sample = competitorAnswered.slice(0, 3).map((g) => `"${g.question}"`).join(', ');
    recommendations.push({
      title: 'Close the highest-leverage content gaps',
      severity: 'high',
      evidence: `${competitorAnswered.length} canonical questions in your space are answered by competitors but not by your site (e.g. ${sample}).`,
      why_it_matters: 'Generative engines route these queries to whoever answers them clearly. Without content here, the site is invisible for these intents.',
      exact_fix: 'Publish or extend a page for each gap using the suggested format (FAQ, comparison table, how-to). Add the relevant schema type. Cross-link from existing content.',
      effort_estimate: 'medium',
      owner: 'content',
      expected_impact: 'Captures generative answers for queries currently going to competitors.',
      source: 'content_gap',
    });
  }

  const highUplift = blueprint.filter((b) => b.expected_citation_uplift === 'high');
  if (highUplift.length > 0) {
    const sample = highUplift.slice(0, 3).map((b) => b.title).join('; ');
    recommendations.push({
      title: 'Ship the high-uplift pages in your content blueprint',
      severity: 'medium',
      evidence: `${highUplift.length} blueprint pages were flagged as high citation uplift (e.g. ${sample}).`,
      why_it_matters: 'These pages are structured for AI extraction and target queries with no current owner. They are the fastest path to generative visibility.',
      exact_fix: 'Build each high-uplift blueprint item in the suggested format with the specified schema_template. Prioritize vs_competitor and glossary pages first.',
      effort_estimate: 'medium',
      owner: 'content',
      expected_impact: 'Generates new citation surfaces optimized for AI extraction.',
      source: 'content_gap',
    });
  }

  return recommendations;
}
