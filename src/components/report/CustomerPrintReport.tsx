import { SITE } from '../../config/site';
import {
  CustomerSummary,
  CustomerSummaryIssue,
  ReportBlueprintItem,
  ReportCompetitorBreakdown,
  ReportContentGap,
  ReportEntityMap,
  ReportGenerativeAudit,
  ReportRecommendation,
} from './reportTypes';

interface CustomerPrintReportProps {
  siteName: string;
  siteUrl?: string;
  scanDate?: string;
  overallScore: number;
  customerSummary?: CustomerSummary;
  recommendations: ReportRecommendation[];
  strategicReadinessScore?: number | null;
  strategicReadinessSummary?: string;
  generativeAudit?: ReportGenerativeAudit | null;
  entityMap?: ReportEntityMap | null;
  contentGaps?: ReportContentGap[];
  contentBlueprint?: ReportBlueprintItem[];
  competitorTeardown?: ReportCompetitorBreakdown[];
  mode?: 'print' | 'pdf';
}

const severityRank: Record<string, number> = { high: 0, medium: 1, low: 2 };

function formatDate(value?: string): string {
  if (!value) return new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function scoreBand(score: number): { label: string; className: string } {
  if (score >= 80) return { label: 'Strong', className: 'text-emerald-700' };
  if (score >= 60) return { label: 'Good', className: 'text-blue-700' };
  if (score >= 40) return { label: 'Needs work', className: 'text-amber-700' };
  return { label: 'At risk', className: 'text-red-700' };
}

function fallbackInterpretation(score: number): string {
  if (score >= 80) {
    return `A score of ${score} means AI assistants can confidently find, read, and quote your site when answering customer questions.`;
  }
  if (score >= 60) {
    return `A score of ${score} means AI assistants find your site but may skip past it for some customer questions where competitors are clearer.`;
  }
  if (score >= 40) {
    return `A score of ${score} means AI assistants struggle to read or quote your site, costing you customer visibility in AI-driven searches.`;
  }
  return `A score of ${score} means AI assistants largely overlook your site, and your customers are seeing competitor answers instead.`;
}

function sortedRecommendations(recommendations: ReportRecommendation[]): ReportRecommendation[] {
  return [...recommendations].sort((first, second) => {
    return severityRank[first.severity ?? 'medium'] - severityRank[second.severity ?? 'medium'];
  });
}

export default function CustomerPrintReport({
  siteName,
  siteUrl,
  scanDate,
  overallScore,
  customerSummary,
  recommendations,
  strategicReadinessScore,
  strategicReadinessSummary,
  generativeAudit,
  entityMap,
  contentGaps,
  contentBlueprint,
  competitorTeardown,
  mode = 'print',
}: CustomerPrintReportProps) {
  const band = scoreBand(overallScore);
  const headline = customerSummary?.headline
    ?? `Your AI visibility score is ${overallScore} out of 100 — ${band.label.toLowerCase()}.`;
  const interpretation = customerSummary?.score_interpretation ?? fallbackInterpretation(overallScore);
  const cta = customerSummary?.closing_call_to_action
    ?? 'We can implement these fixes for you — typical turnaround is one to two weeks.';

  const orderedRecommendations = sortedRecommendations(recommendations);

  const customerIssuesByIndex = new Map<number, CustomerSummaryIssue>();
  customerSummary?.issues?.forEach((issue) => {
    if (typeof issue?.recommendation_index === 'number') {
      customerIssuesByIndex.set(issue.recommendation_index, issue);
    }
  });

  const brandMentionPct = typeof generativeAudit?.brand_mention_rate === 'number'
    ? Math.round(generativeAudit.brand_mention_rate * 100)
    : null;
  const citationPct = typeof generativeAudit?.citation_rate === 'number'
    ? Math.round(generativeAudit.citation_rate * 100)
    : null;
  const competitorMentionPct = typeof generativeAudit?.competitor_mention_rate === 'number'
    ? Math.round(generativeAudit.competitor_mention_rate * 100)
    : null;
  const unansweredGaps = (contentGaps ?? []).filter((g) => g.has_answer === false);
  const competitorAnsweredGaps = unansweredGaps.filter((g) => g.competitor_has_answer === true);
  const highUpliftBlueprint = (contentBlueprint ?? []).filter((b) => b.expected_citation_uplift === 'high');
  const rootClassName = mode === 'pdf'
    ? 'customer-print-report'
    : 'customer-print-report hidden print:block';

  return (
    <div className={rootClassName}>
      <header className="customer-print-cover">
        <div className="customer-print-brand">{SITE.name}</div>
        <h1 className="customer-print-title">AI Visibility Report</h1>
        <div className="customer-print-meta">
          <div><strong>Prepared for:</strong> {siteName}</div>
          {siteUrl && <div><strong>Website:</strong> {siteUrl}</div>}
          <div><strong>Report date:</strong> {formatDate(scanDate)}</div>
        </div>
        <div className="customer-print-score-block">
          <div className={`customer-print-score ${band.className}`}>{overallScore}</div>
          <div className="customer-print-score-out-of">out of 100</div>
          <div className={`customer-print-score-band ${band.className}`}>{band.label}</div>
        </div>
        <p className="customer-print-headline">{headline}</p>
        <p className="customer-print-interpretation">{interpretation}</p>
      </header>

      {(typeof strategicReadinessScore === 'number' || strategicReadinessSummary) && (
        <section className="customer-print-section">
          <h2 className="customer-print-section-title">Strategic readiness</h2>
          {typeof strategicReadinessScore === 'number' && (
            <p className="customer-print-headline">
              Strategic readiness score: <strong>{strategicReadinessScore} / 100</strong>
            </p>
          )}
          {strategicReadinessSummary && <p>{strategicReadinessSummary}</p>}
        </section>
      )}

      {(brandMentionPct !== null || citationPct !== null) && (
        <section className="customer-print-section">
          <h2 className="customer-print-section-title">How AI assistants see you</h2>
          <ul className="customer-print-issues">
            {brandMentionPct !== null && (
              <li className="customer-print-issue">
                <p>
                  Your brand appeared in <strong>{brandMentionPct}%</strong> of the simulated AI questions we ran.
                  {brandMentionPct < 30 && ' That means most people asking AI about your space never hear about you.'}
                </p>
              </li>
            )}
            {citationPct !== null && (
              <li className="customer-print-issue">
                <p>
                  Your site was quoted or linked in <strong>{citationPct}%</strong> of those responses.
                  {citationPct < 20 && ' Being mentioned by name is good — being cited as the source is what drives traffic.'}
                </p>
              </li>
            )}
            {competitorMentionPct !== null && (
              <li className="customer-print-issue">
                <p>
                  Competitors appeared in <strong>{competitorMentionPct}%</strong> of the same questions. They're the default answer.
                </p>
              </li>
            )}
          </ul>
        </section>
      )}

      {entityMap && ((entityMap.gaps?.length ?? 0) > 0 || (entityMap.competitor_owned?.length ?? 0) > 0) && (
        <section className="customer-print-section">
          <h2 className="customer-print-section-title">What you stand for in AI minds</h2>
          {(entityMap.gaps?.length ?? 0) > 0 && (
            <p>
              Your site claims these topics, but AI engines don't yet link them to you: <strong>{entityMap.gaps!.slice(0, 5).join(', ')}</strong>.
              Reinforcing them gives you a chance to be the answer when people ask.
            </p>
          )}
          {(entityMap.competitor_owned?.length ?? 0) > 0 && (
            <p>
              Competitors clearly own these topics that you don't claim: <strong>{entityMap.competitor_owned!.slice(0, 5).join(', ')}</strong>.
              Establishing your position on these makes you eligible as an alternative answer.
            </p>
          )}
        </section>
      )}

      {competitorAnsweredGaps.length > 0 && (
        <section className="customer-print-section">
          <h2 className="customer-print-section-title">Questions your competitors answer that you don't</h2>
          <ol className="customer-print-issues">
            {competitorAnsweredGaps.slice(0, 8).map((gap, i) => (
              <li key={`gap-${i}`} className="customer-print-issue">
                <p><strong>"{gap.question}"</strong></p>
                {gap.rationale && <p>{gap.rationale}</p>}
              </li>
            ))}
          </ol>
        </section>
      )}

      {highUpliftBlueprint.length > 0 && (
        <section className="customer-print-section">
          <h2 className="customer-print-section-title">Highest-impact pages to build first</h2>
          <ol className="customer-print-issues">
            {highUpliftBlueprint.slice(0, 6).map((item, i) => (
              <li key={`bp-${i}`} className="customer-print-issue">
                <p><strong>{item.title}</strong> {item.suggested_url && <span>({item.suggested_url})</span>}</p>
                {(item.target_queries?.length ?? 0) > 0 && (
                  <p>Targets questions like: {item.target_queries!.slice(0, 3).map((q) => `"${q}"`).join(', ')}.</p>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      {(competitorTeardown ?? []).length > 0 && (
        <section className="customer-print-section">
          <h2 className="customer-print-section-title">Who you're up against</h2>
          <ol className="customer-print-issues">
            {competitorTeardown!.slice(0, 5).map((c, i) => (
              <li key={`comp-${i}`} className="customer-print-issue">
                <p>
                  <strong>{c.name ?? 'Competitor'}</strong>
                  {c.url && <span> — {new URL(c.url).hostname.replace(/^www\./, '')}</span>}
                </p>
                {c.positioning_summary && <p>{c.positioning_summary}</p>}
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="customer-print-section">
        <h2 className="customer-print-section-title">What we found</h2>
        {orderedRecommendations.length === 0 && (
          <p className="customer-print-empty">No critical issues were identified in this scan.</p>
        )}
        <ol className="customer-print-issues">
          {orderedRecommendations.map((recommendation, index) => {
            const originalIndex = recommendations.indexOf(recommendation);
            const plain = customerIssuesByIndex.get(originalIndex);
            const title = plain?.title ?? recommendation.title ?? `Recommendation ${index + 1}`;
            const impact = plain?.business_impact ?? recommendation.why_it_matters ?? '';
            const recommendation_text = plain?.what_we_recommend ?? recommendation.exact_fix ?? '';
            const severity = recommendation.severity ?? 'medium';
            return (
              <li key={originalIndex} className={`customer-print-issue customer-print-issue-${severity}`}>
                <div className="customer-print-issue-header">
                  <span className="customer-print-issue-number">{index + 1}</span>
                  <h3 className="customer-print-issue-title">{title}</h3>
                  <span className={`customer-print-severity customer-print-severity-${severity}`}>
                    {severity}
                  </span>
                </div>
                {impact && (
                  <div className="customer-print-issue-block">
                    <div className="customer-print-issue-label">Why it matters for your business</div>
                    <p>{impact}</p>
                  </div>
                )}
                {recommendation_text && (
                  <div className="customer-print-issue-block">
                    <div className="customer-print-issue-label">What we recommend</div>
                    <p>{recommendation_text}</p>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      <section className="customer-print-cta">
        <h2 className="customer-print-section-title">Next steps</h2>
        <p>{cta}</p>
        <p className="customer-print-cta-contact">
          Reply to the email this report was sent with, or visit {SITE.url.replace(/^https?:\/\//, '')} to get started.
        </p>
      </section>

      <footer className="customer-print-footer">
        Report generated by {SITE.name} · {formatDate(scanDate)}
      </footer>
    </div>
  );
}
