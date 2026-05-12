import { useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronRight, XCircle } from 'lucide-react';
import {
  ReportCitationFormat,
  ReportGenerativeAudit,
  ReportQueryBatteryItem,
  ReportQueryIntent,
} from './reportTypes';

interface GenerativeAuditProps {
  audit: ReportGenerativeAudit | null;
  battery: ReportQueryBatteryItem[];
}

const INTENT_LABEL: Record<ReportQueryIntent, string> = {
  brand: 'Brand',
  category: 'Category',
  comparison: 'Comparison',
  intent: 'Use case',
  feature: 'Feature',
};

const CITATION_LABEL: Record<ReportCitationFormat, string> = {
  quoted: 'Quoted',
  listed: 'Listed',
  linked: 'Linked',
  named: 'Named only',
  absent: 'Not present',
};

const CITATION_CLASS: Record<ReportCitationFormat, string> = {
  quoted: 'bg-emerald-100 text-emerald-800',
  linked: 'bg-emerald-100 text-emerald-800',
  listed: 'bg-blue-100 text-blue-800',
  named: 'bg-amber-100 text-amber-800',
  absent: 'bg-gray-100 text-gray-700',
};

function pct(value: number | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return `${Math.round(value * 100)}%`;
}

function intentClass(intent?: ReportQueryIntent): string {
  switch (intent) {
    case 'comparison':
      return 'bg-purple-100 text-purple-800';
    case 'category':
      return 'bg-indigo-100 text-indigo-800';
    case 'intent':
      return 'bg-sky-100 text-sky-800';
    case 'feature':
      return 'bg-teal-100 text-teal-800';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export default function GenerativeAudit({ audit, battery }: GenerativeAuditProps) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  if (!battery.length) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-xl font-semibold text-gray-900">Generative Result Audit</h2>
        <p className="text-gray-600">
          Generative audit was not available for this scan. Re-run the scan once AI analysis is restored.
        </p>
      </section>
    );
  }

  const toggle = (index: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-gray-900">Generative Result Audit</h2>
        <p className="text-sm text-gray-600">
          Each prompt was simulated against AIVO's analysis model. This measures how a knowledgeable AI assistant
          would respond — not a live ChatGPT/Claude/Gemini query.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="text-xs uppercase text-gray-500">Brand mention rate</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{pct(audit?.brand_mention_rate)}</div>
          <div className="mt-1 text-xs text-gray-500">% of queries where the brand surfaced</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="text-xs uppercase text-gray-500">Citation rate</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{pct(audit?.citation_rate)}</div>
          <div className="mt-1 text-xs text-gray-500">% of queries where the brand was quoted or linked</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="text-xs uppercase text-gray-500">Competitor mention rate</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{pct(audit?.competitor_mention_rate)}</div>
          <div className="mt-1 text-xs text-gray-500">% of queries where a competitor surfaced</div>
        </div>
      </div>

      {audit?.notes && (
        <p className="mb-5 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">{audit.notes}</p>
      )}

      <div className="space-y-3">
        {battery.map((item, index) => {
          const isOpen = expanded.has(index);
          const citation: ReportCitationFormat = item.citation_format ?? 'absent';
          return (
            <article key={`${item.prompt ?? 'query'}-${index}`} className="rounded-lg border border-gray-200">
              <button
                type="button"
                onClick={() => toggle(index)}
                className="flex w-full items-start justify-between gap-4 px-4 py-3 text-left hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {item.intent && (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${intentClass(item.intent)}`}>
                        {INTENT_LABEL[item.intent] ?? item.intent}
                      </span>
                    )}
                    <span className="text-sm font-medium text-gray-900">{item.prompt ?? 'Untitled prompt'}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                    <span className="inline-flex items-center gap-1">
                      {item.brand_mentioned ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-gray-400" />
                      )}
                      Brand {item.brand_mentioned ? 'mentioned' : 'absent'}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 font-medium ${CITATION_CLASS[citation]}`}>
                      {CITATION_LABEL[citation]}
                    </span>
                    {(item.competitors_mentioned?.length ?? 0) > 0 && (
                      <span>{item.competitors_mentioned!.length} competitor mentions</span>
                    )}
                  </div>
                </div>
                {isOpen ? (
                  <ChevronDown className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-500" />
                ) : (
                  <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-500" />
                )}
              </button>
              {isOpen && (
                <div className="border-t border-gray-200 px-4 py-3 text-sm text-gray-700">
                  {item.raw_excerpt && (
                    <p className="mb-2"><strong>Simulated response excerpt:</strong> {item.raw_excerpt}</p>
                  )}
                  {(item.competitors_mentioned?.length ?? 0) > 0 && (
                    <p className="mb-2">
                      <strong>Competitors mentioned:</strong> {item.competitors_mentioned!.join(', ')}
                    </p>
                  )}
                  {(item.cited_urls?.length ?? 0) > 0 && (
                    <p className="mb-2">
                      <strong>URLs cited:</strong> {item.cited_urls!.join(', ')}
                    </p>
                  )}
                  {(item.missing_evidence?.length ?? 0) > 0 && (
                    <p className="text-gray-600">
                      <strong>Missing evidence:</strong> {item.missing_evidence!.join('; ')}
                    </p>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
