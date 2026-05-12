import { ArrowUpRight } from 'lucide-react';
import { ReportBlueprintItem, ReportBlueprintPageType } from './reportTypes';

interface ContentBlueprintProps {
  blueprint: ReportBlueprintItem[];
}

const PAGE_TYPE_LABEL: Record<ReportBlueprintPageType, string> = {
  vs_competitor: 'vs Competitor',
  glossary: 'Glossary',
  how_to: 'How-to',
  faq_expansion: 'FAQ expansion',
  use_case: 'Use case',
};

function pageTypeClass(pageType?: ReportBlueprintPageType): string {
  switch (pageType) {
    case 'vs_competitor': return 'bg-purple-100 text-purple-800';
    case 'glossary': return 'bg-sky-100 text-sky-800';
    case 'how_to': return 'bg-emerald-100 text-emerald-800';
    case 'faq_expansion': return 'bg-amber-100 text-amber-800';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function upliftClass(uplift?: 'low' | 'medium' | 'high'): string {
  switch (uplift) {
    case 'high': return 'bg-emerald-100 text-emerald-800';
    case 'medium': return 'bg-blue-100 text-blue-800';
    case 'low': return 'bg-gray-100 text-gray-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

export default function ContentBlueprint({ blueprint }: ContentBlueprintProps) {
  if (!blueprint.length) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-xl font-semibold text-gray-900">Content Blueprint</h2>
        <p className="text-gray-600">No blueprint pages were generated for this scan.</p>
      </section>
    );
  }

  const sorted = [...blueprint].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.expected_citation_uplift ?? 'low'] - order[b.expected_citation_uplift ?? 'low'];
  });

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-gray-900">Content Blueprint</h2>
        <p className="text-sm text-gray-600">
          Specific pages designed to be extracted and cited by AI engines. Each item lists the format, schema, and gaps it closes.
        </p>
      </div>

      <div className="space-y-4">
        {sorted.map((item, index) => (
          <article key={`${item.suggested_url ?? 'page'}-${index}`} className="rounded-lg border border-gray-200 p-4">
            <header className="mb-3 flex flex-wrap items-start justify-between gap-3">
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900">{item.title ?? 'Page'}</h3>
                {item.suggested_url && (
                  <code className="mt-1 inline-block rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">
                    {item.suggested_url}
                  </code>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {item.page_type && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${pageTypeClass(item.page_type)}`}>
                    {PAGE_TYPE_LABEL[item.page_type] ?? item.page_type}
                  </span>
                )}
                {item.expected_citation_uplift && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${upliftClass(item.expected_citation_uplift)}`}>
                    {item.expected_citation_uplift} uplift
                  </span>
                )}
              </div>
            </header>

            {item.sections && item.sections.length > 0 && (
              <ol className="mb-3 space-y-2 pl-4 text-sm text-gray-700">
                {item.sections.map((section, i) => (
                  <li key={`${section.heading ?? 'section'}-${i}`} className="list-decimal">
                    <div className="font-medium text-gray-900">{section.heading}</div>
                    {section.content_summary && <div className="text-gray-600">{section.content_summary}</div>}
                    {section.format && (
                      <div className="text-xs text-gray-500">Format: {section.format.replace(/_/g, ' ')}</div>
                    )}
                  </li>
                ))}
              </ol>
            )}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 text-sm">
              {(item.target_queries?.length ?? 0) > 0 && (
                <div>
                  <div className="mb-1 text-xs font-semibold uppercase text-gray-500">Target queries</div>
                  <div className="space-y-0.5">
                    {item.target_queries!.map((q, i) => (
                      <div key={`${q}-${i}`} className="text-gray-700">{q}</div>
                    ))}
                  </div>
                </div>
              )}
              {(item.target_entities?.length ?? 0) > 0 && (
                <div>
                  <div className="mb-1 text-xs font-semibold uppercase text-gray-500">Target entities</div>
                  <div className="flex flex-wrap gap-1.5">
                    {item.target_entities!.map((e, i) => (
                      <span key={`${e}-${i}`} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                        {e}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {item.schema_template && (
                <div>
                  <div className="mb-1 text-xs font-semibold uppercase text-gray-500">Schema</div>
                  <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">{item.schema_template}</code>
                </div>
              )}
              {(item.closes_gaps?.length ?? 0) > 0 && (
                <div>
                  <div className="mb-1 text-xs font-semibold uppercase text-gray-500">Closes gaps</div>
                  <div className="space-y-0.5 text-gray-700">
                    {item.closes_gaps!.map((g, i) => (
                      <div key={`${g}-${i}`} className="inline-flex items-center gap-1">
                        <ArrowUpRight className="h-3 w-3 text-gray-400" />
                        {g}
                      </div>
                    ))}
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
