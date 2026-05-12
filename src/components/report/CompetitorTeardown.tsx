import { AlertCircle, ExternalLink } from 'lucide-react';
import { ReportCompetitorBreakdown } from './reportTypes';

interface CompetitorTeardownProps {
  competitors: ReportCompetitorBreakdown[];
}

function Chip({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
      {label}
    </span>
  );
}

export default function CompetitorTeardown({ competitors }: CompetitorTeardownProps) {
  if (!competitors.length) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-xl font-semibold text-gray-900">Competitor Teardown</h2>
        <p className="text-gray-600">
          No competitors were available for analysis. This typically means category inference did not complete.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-gray-900">Competitor Teardown</h2>
        <p className="text-sm text-gray-600">
          What each competitor's content owns, the schema they expose, and the formats AI engines extract well from.
        </p>
      </div>

      <div className="space-y-4">
        {competitors.map((c, index) => (
          <article key={`${c.url ?? 'competitor'}-${index}`} className="rounded-lg border border-gray-200 p-4">
            <header className="mb-3 flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-gray-900">{c.name ?? 'Competitor'}</h3>
              {c.url && (
                <a
                  href={c.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  {new URL(c.url).hostname.replace(/^www\./, '')}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {c.fetch_status === 'failed' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                  <AlertCircle className="h-3 w-3" />
                  Fetch failed
                </span>
              )}
            </header>

            {c.positioning_summary && (
              <p className="mb-3 text-sm text-gray-700">{c.positioning_summary}</p>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {(c.entities_owned?.length ?? 0) > 0 && (
                <div>
                  <div className="mb-1 text-xs font-semibold uppercase text-gray-500">Entities owned</div>
                  <div className="flex flex-wrap gap-1.5">
                    {c.entities_owned!.map((e, i) => <Chip key={`${e}-${i}`} label={e} />)}
                  </div>
                </div>
              )}
              {(c.faq_topics?.length ?? 0) > 0 && (
                <div>
                  <div className="mb-1 text-xs font-semibold uppercase text-gray-500">FAQ topics</div>
                  <div className="flex flex-wrap gap-1.5">
                    {c.faq_topics!.map((t, i) => <Chip key={`${t}-${i}`} label={t} />)}
                  </div>
                </div>
              )}
              {(c.schema_coverage?.length ?? 0) > 0 && (
                <div>
                  <div className="mb-1 text-xs font-semibold uppercase text-gray-500">Schema coverage</div>
                  <div className="flex flex-wrap gap-1.5">
                    {c.schema_coverage!.map((s, i) => <Chip key={`${s}-${i}`} label={s} />)}
                  </div>
                </div>
              )}
              {(c.citation_format_signals?.length ?? 0) > 0 && (
                <div>
                  <div className="mb-1 text-xs font-semibold uppercase text-gray-500">Citation-friendly formats</div>
                  <div className="flex flex-wrap gap-1.5">
                    {c.citation_format_signals!.map((s, i) => <Chip key={`${s}-${i}`} label={s} />)}
                  </div>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
