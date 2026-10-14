import { ScoreMap, asNumber } from './reportTypes';

const READINESS_LABELS = [
  ['content_clarity', 'Content Clarity'], ['semantic_structure', 'Page Structure'],
  ['schema_metadata', 'Metadata and Structured Data'], ['qa_readiness', 'Customer Answers'],
  ['authority_trust', 'Evidence of Expertise'], ['technical_accessibility', 'Content Accessibility'],
];

const SCORE_LABELS = [
  ['crawl_access', 'Crawl Access'],
  ['entity_clarity', 'Entity Clarity'],
  ['answer_readiness', 'Answer Readiness'],
  ['citation_likelihood', 'Citation Likelihood'],
  ['trust_evidence', 'Trust Evidence'],
  ['competitive_presence', 'Competitive Presence'],
];

interface ScoreSummaryProps {
  score: ScoreMap;
}

export default function ScoreSummary({ score }: ScoreSummaryProps) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-xl font-semibold text-gray-900">Sub-scores</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {('content_clarity' in score ? READINESS_LABELS : SCORE_LABELS).map(([key, label]) => {
          const value = asNumber(score[key]);
          return (
            <div key={key}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">{label}</span>
                <span className="font-semibold text-gray-900">{value === null ? 'Not assessed' : value}</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100">
                <div className="h-2 rounded-full bg-blue-600" style={{ width: `${Math.min(value ?? 0, 100)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
