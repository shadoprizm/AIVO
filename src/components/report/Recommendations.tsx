import { useMemo, useState } from 'react';
import { ReportRecommendation } from './reportTypes';

const severityRank: Record<string, number> = { high: 0, medium: 1, low: 2 };
const effortRank: Record<string, number> = { low: 0, medium: 1, high: 2 };

interface RecommendationsProps {
  recommendations: ReportRecommendation[];
}

export default function Recommendations({ recommendations }: RecommendationsProps) {
  const [sortBy, setSortBy] = useState<'severity' | 'effort'>('severity');
  const sorted = useMemo(() => {
    return [...recommendations].sort((first, second) => {
      if (sortBy === 'effort') {
        return effortRank[first.effort_estimate ?? 'medium'] - effortRank[second.effort_estimate ?? 'medium'];
      }
      return severityRank[first.severity ?? 'medium'] - severityRank[second.severity ?? 'medium'];
    });
  }, [recommendations, sortBy]);

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Recommendations</h2>
        <div className="inline-flex rounded-lg border border-gray-200 p-1">
          <button
            type="button"
            onClick={() => setSortBy('severity')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${sortBy === 'severity' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Severity
          </button>
          <button
            type="button"
            onClick={() => setSortBy('effort')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${sortBy === 'effort' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Effort
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {sorted.length === 0 && <p className="text-gray-600">No recommendations were returned for this scan.</p>}
        {sorted.map((recommendation, index) => (
          <article key={`${recommendation.title ?? 'recommendation'}-${index}`} className="rounded-lg border border-gray-200 p-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-gray-900">{recommendation.title ?? 'Recommendation'}</h3>
              {[recommendation.severity, recommendation.effort_estimate, recommendation.owner].filter(Boolean).map((tag) => (
                <span key={tag} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium uppercase text-gray-700">
                  {tag}
                </span>
              ))}
            </div>
            {recommendation.evidence && <p className="text-sm text-gray-700"><strong>Evidence:</strong> {recommendation.evidence}</p>}
            {recommendation.why_it_matters && <p className="mt-2 text-sm text-gray-700"><strong>Why it matters:</strong> {recommendation.why_it_matters}</p>}
            {recommendation.exact_fix && <p className="mt-2 text-sm text-gray-700"><strong>Exact fix:</strong> {recommendation.exact_fix}</p>}
            {recommendation.expected_impact && <p className="mt-2 text-sm text-gray-700"><strong>Expected impact:</strong> {recommendation.expected_impact}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}
