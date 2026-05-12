import { ReportEntityMap } from './reportTypes';

interface EntityMapProps {
  entityMap: ReportEntityMap | null;
}

function Chip({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'positive' | 'warning' | 'danger' }) {
  const toneClass = {
    neutral: 'bg-gray-100 text-gray-700',
    positive: 'bg-emerald-100 text-emerald-800',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-red-100 text-red-800',
  }[tone];
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${toneClass}`}>{label}</span>;
}

function EntityColumn({
  title,
  description,
  items,
  tone,
  emptyText,
}: {
  title: string;
  description: string;
  items: string[];
  tone: 'neutral' | 'positive' | 'warning' | 'danger';
  emptyText: string;
}) {
  return (
    <div>
      <div className="mb-1 text-sm font-semibold text-gray-900">{title}</div>
      <div className="mb-2 text-xs text-gray-600">{description}</div>
      <div className="flex flex-wrap gap-1.5">
        {items.length === 0
          ? <span className="text-xs text-gray-500">{emptyText}</span>
          : items.map((item, i) => <Chip key={`${item}-${i}`} label={item} tone={tone} />)
        }
      </div>
    </div>
  );
}

export default function EntityMap({ entityMap }: EntityMapProps) {
  if (!entityMap) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-xl font-semibold text-gray-900">Entity Map</h2>
        <p className="text-gray-600">Entity salience analysis was not available for this scan.</p>
      </section>
    );
  }

  const salience = typeof entityMap.salience_score === 'number' ? entityMap.salience_score : 0;
  const claimed = entityMap.claimed ?? [];
  const perceived = entityMap.perceived ?? [];
  const gaps = entityMap.gaps ?? [];
  const competitorOwned = entityMap.competitor_owned ?? [];

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-gray-900">Entity Map</h2>
        <p className="text-sm text-gray-600">
          What the site claims to own vs what AI engines actually associate with the brand — and where competitors are eating the entity space.
        </p>
      </div>

      <div className="mb-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase text-gray-500">Entity salience score</div>
            <div className="mt-1 text-3xl font-semibold text-gray-900">{salience}</div>
          </div>
          <div className="h-2 w-32 rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-blue-600"
              style={{ width: `${Math.min(Math.max(salience, 0), 100)}%` }}
            />
          </div>
        </div>
        {entityMap.notes && <p className="mt-3 text-sm text-gray-700">{entityMap.notes}</p>}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <EntityColumn
          title="Claimed"
          description="Entities the site puts forward in its own content."
          items={claimed}
          tone="neutral"
          emptyText="No claimed entities detected."
        />
        <EntityColumn
          title="Perceived by AI"
          description="Entities AI engines actually associate with the brand (from query battery)."
          items={perceived}
          tone="positive"
          emptyText="No entities were perceived — strong signal of low salience."
        />
        <EntityColumn
          title="Gaps"
          description="Claimed but not perceived. These need reinforcement to land in AI knowledge graphs."
          items={gaps}
          tone="warning"
          emptyText="No salience gaps detected."
        />
        <EntityColumn
          title="Competitors own"
          description="Entities competitors clearly claim but the target does not."
          items={competitorOwned}
          tone="danger"
          emptyText="No competitor-owned entities detected."
        />
      </div>
    </section>
  );
}
