import { useMemo, useState } from 'react';
import { ReportRecommendation, ReportRecommendationSource } from './reportTypes';

const severityRank: Record<string, number> = { high: 0, medium: 1, low: 2 };
const effortRank: Record<string, number> = { low: 0, medium: 1, high: 2 };

type SourceFilter = 'all' | ReportRecommendationSource;

const SOURCE_LABEL: Record<ReportRecommendationSource, string> = {
  technical: 'Technical',
  entity: 'Entity',
  competitor: 'Competitor',
  content_gap: 'Content gap',
  generative: 'Generative',
};

const SOURCE_CLASS: Record<ReportRecommendationSource, string> = {
  technical: 'bg-gray-100 text-gray-700',
  entity: 'bg-amber-100 text-amber-800',
  competitor: 'bg-red-100 text-red-800',
  content_gap: 'bg-sky-100 text-sky-800',
  generative: 'bg-purple-100 text-purple-800',
};

interface RecommendationsProps {
  recommendations: ReportRecommendation[];
}

function recommendationSource(rec: ReportRecommendation): ReportRecommendationSource {
  return rec.source ?? 'technical';
}

export default function Recommendations({ recommendations }: RecommendationsProps) {
  const [sortBy, setSortBy] = useState<'severity' | 'effort'>('severity');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');

  const sourceCounts = useMemo(() => {
    const counts: Record<ReportRecommendationSource, number> = {
      technical: 0, entity: 0, competitor: 0, content_gap: 0, generative: 0,
    };
    for (const rec of recommendations) counts[recommendationSource(rec)] += 1;
    return counts;
  }, [recommendations]);

  const visible = useMemo(() => {
    const filtered = sourceFilter === 'all'
      ? recommendations
      : recommendations.filter((rec) => recommendationSource(rec) === sourceFilter);
    return [...filtered].sort((first, second) => {
      if (sortBy === 'effort') {
        return effortRank[first.effort_estimate ?? 'medium'] - effortRank[second.effort_estimate ?? 'medium'];
      }
      return severityRank[first.severity ?? 'medium'] - severityRank[second.severity ?? 'medium'];
    });
  }, [recommendations, sortBy, sourceFilter]);

  const availableSources = (Object.keys(sourceCounts) as ReportRecommendationSource[])
    .filter((source) => sourceCounts[source] > 0);

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

      {availableSources.length > 1 && (
        <div className="mb-5 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setSourceFilter('all')}
            className={`rounded-full px-3 py-1 text-xs font-medium ${sourceFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            All ({recommendations.length})
          </button>
          {availableSources.map((source) => (
            <button
              key={source}
              type="button"
              onClick={() => setSourceFilter(source)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${sourceFilter === source ? 'bg-blue-600 text-white' : `${SOURCE_CLASS[source]} hover:opacity-80`}`}
            >
              {SOURCE_LABEL[source]} ({sourceCounts[source]})
            </button>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {visible.length === 0 && <p className="text-gray-600">No recommendations match the current filter.</p>}
        {visible.map((recommendation, index) => {
          const source = recommendationSource(recommendation);
          return (
            <article key={`${recommendation.title ?? 'recommendation'}-${index}`} className="rounded-lg border border-gray-200 p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-gray-900">{recommendation.title ?? 'Recommendation'}</h3>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SOURCE_CLASS[source]}`}>
                  {SOURCE_LABEL[source]}
                </span>
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
          );
        })}
      </div>
    </section>
  );
}
