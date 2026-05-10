interface TechnicalFindingsProps {
  evidence: Record<string, unknown>;
}

export default function TechnicalFindings({ evidence }: TechnicalFindingsProps) {
  const entries = Object.entries(evidence);

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-xl font-semibold text-gray-900">Technical Findings</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {entries.length === 0 && <p className="text-gray-600">No technical evidence was returned.</p>}
        {entries.map(([key, value]) => (
          <div key={key} className="rounded-lg border border-gray-200 p-4">
            <h3 className="mb-2 font-medium capitalize text-gray-900">{key.replace(/_/g, ' ')}</h3>
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words text-xs text-gray-600">
              {JSON.stringify(value, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </section>
  );
}
