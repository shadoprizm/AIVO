import { CheckCircle2 } from 'lucide-react';
import { ReportAnswerTest } from './reportTypes';

interface AnswerTestsProps {
  tests: ReportAnswerTest[];
}

export default function AnswerTests({ tests }: AnswerTestsProps) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-xl font-semibold text-gray-900">AI Answer Simulation</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {tests.length === 0 && <p className="text-gray-600">Answer simulations were not available for this scan.</p>}
        {tests.map((test, index) => (
          <article key={`${test.prompt ?? 'prompt'}-${index}`} className="rounded-lg border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900">{test.prompt}</h3>
            <p className="mt-2 text-sm text-gray-600">{test.raw_excerpt}</p>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <span>Brand mentioned: {test.brand_mentioned ? 'Yes' : 'No'}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
