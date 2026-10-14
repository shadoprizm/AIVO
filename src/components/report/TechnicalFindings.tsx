interface TechnicalFindingsProps {
  evidence: Record<string, unknown>;
  findings?: Array<{ label: string; passed: boolean; evidence: string }>;
}

export default function TechnicalFindings({ evidence, findings = [] }: TechnicalFindingsProps) {
  const entries = Object.entries(evidence);

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-xl font-semibold text-gray-900">Technical Findings</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {entries.length === 0 && findings.length === 0 && <p className="text-gray-600">No technical evidence was returned.</p>}
        {findings.map((finding, index) => (<div key={index} className="rounded-lg border border-gray-200 p-4"><h3 className="font-medium text-gray-900">{finding.label}</h3><p className="my-2 text-sm font-medium">{finding.passed ? "Observed" : "Needs review"}</p><p className="break-words text-sm text-gray-700">{finding.evidence}</p></div>))}
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
