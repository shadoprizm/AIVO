import { useMemo, useState } from 'react';
import { CheckCircle2, MinusCircle, XCircle } from 'lucide-react';
import { ReportContentFormat, ReportContentGap, ReportContentIntent } from './reportTypes';

interface ContentGapsProps {
  gaps: ReportContentGap[];
}

type FilterMode = 'all' | 'unanswered' | 'competitor_owned';

const INTENT_LABEL: Record<ReportContentIntent, string> = {
  informational: 'Informational',
  commercial: 'Commercial',
  transactional: 'Transactional',
  comparison: 'Comparison',
};

const FORMAT_LABEL: Record<ReportContentFormat, string> = {
  faq: 'FAQ',
  comparison_table: 'Comparison table',
  how_to: 'How-to',
  definition: 'Definition',
  listicle: 'List',
};

function intentClass(intent?: ReportContentIntent): string {
  switch (intent) {
    case 'commercial': return 'bg-purple-100 text-purple-800';
    case 'transactional': return 'bg-emerald-100 text-emerald-800';
    case 'comparison': return 'bg-indigo-100 text-indigo-800';
    default: return 'bg-sky-100 text-sky-800';
  }
}

function AnswerBadge({ has, label }: { has: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-600">
      {has
        ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
        : <XCircle className="h-3.5 w-3.5 text-gray-400" />}
      {label}
    </span>
  );
}

export default function ContentGaps({ gaps }: ContentGapsProps) {
  const [filter, setFilter] = useState<FilterMode>('unanswered');

  const filtered = useMemo(() => {
    if (filter === 'unanswered') return gaps.filter((g) => g.has_answer === false);
    if (filter === 'competitor_owned') return gaps.filter((g) => g.has_answer === false && g.competitor_has_answer === true);
    return gaps;
  }, [gaps, filter]);

  if (!gaps.length) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-xl font-semibold text-gray-900">Content Gaps</h2>
        <p className="text-gray-600">No content gap analysis was available for this scan.</p>
      </section>
    );
  }

  const totalCount = gaps.length;
  const unansweredCount = gaps.filter((g) => g.has_answer === false).length;
  const competitorOwnedCount = gaps.filter((g) => g.has_answer === false && g.competitor_has_answer === true).length;

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Content Gaps</h2>
          <p className="mt-1 text-sm text-gray-600">
            Canonical questions in this space and whether the target site or competitors answer them.
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-gray-200 p-1 text-sm">
          <button
            type="button"
            onClick={() => setFilter('unanswered')}
            className={`rounded-md px-3 py-1.5 font-medium ${filter === 'unanswered' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Unanswered ({unansweredCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('competitor_owned')}
            className={`rounded-md px-3 py-1.5 font-medium ${filter === 'competitor_owned' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Competitor owns ({competitorOwnedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`rounded-md px-3 py-1.5 font-medium ${filter === 'all' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            All ({totalCount})
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-sm text-gray-600">No gaps match the current filter.</p>
        )}
        {filtered.map((gap, index) => (
          <article key={`${gap.question ?? 'gap'}-${index}`} className="rounded-lg border border-gray-200 p-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {gap.intent && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${intentClass(gap.intent)}`}>
                  {INTENT_LABEL[gap.intent] ?? gap.intent}
                </span>
              )}
              {gap.suggested_format && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                  {FORMAT_LABEL[gap.suggested_format] ?? gap.suggested_format}
                </span>
              )}
            </div>
            <h3 className="text-sm font-medium text-gray-900">{gap.question}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <AnswerBadge has={Boolean(gap.has_answer)} label="Target answers" />
              <AnswerBadge has={Boolean(gap.competitor_has_answer)} label="Competitor answers" />
              {gap.has_answer === false && gap.competitor_has_answer === false && (
                <span className="inline-flex items-center gap-1 text-xs text-amber-700">
                  <MinusCircle className="h-3.5 w-3.5" />
                  Uncontested
                </span>
              )}
            </div>
            {gap.rationale && <p className="mt-2 text-sm text-gray-600">{gap.rationale}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}
