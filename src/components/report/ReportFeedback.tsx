import { FormEvent, useState } from 'react';
import Button from '../ui/Button';

interface ReportFeedbackProps {
  publicToken: string;
}

const roles = ['owner', 'marketer', 'developer', 'agency', 'other'];

function getFunctionsBaseUrl(): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) throw new Error('Feedback service is not configured.');
  return `${supabaseUrl.replace(/\/$/, '')}/functions/v1`;
}

export default function ReportFeedback({ publicToken }: ReportFeedbackProps) {
  const [usefulness, setUsefulness] = useState<'yes' | 'no' | 'partial' | ''>('');
  const [role, setRole] = useState('');
  const [freeText, setFreeText] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');

    if (!usefulness) {
      setMessage('Choose how useful this report was.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${getFunctionsBaseUrl()}/scan-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          public_token: publicToken,
          usefulness,
          role: role || undefined,
          free_text: freeText || undefined,
          email: email || undefined,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: 'Unable to submit feedback.' }));
        throw new Error(typeof body.error === 'string' ? body.error : 'Unable to submit feedback.');
      }

      setMessage('Thanks. Your feedback was recorded.');
      setUsefulness('');
      setRole('');
      setFreeText('');
      setEmail('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">Was this report useful?</h2>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          {(['yes', 'partial', 'no'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setUsefulness(option)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium capitalize ${usefulness === option ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
            >
              {option}
            </button>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <select value={role} onChange={(event) => setRole(event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="">Role (optional)</option>
            {roles.map((roleOption) => (
              <option key={roleOption} value={roleOption}>{roleOption}</option>
            ))}
          </select>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email (optional)"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <textarea
          value={freeText}
          onChange={(event) => setFreeText(event.target.value)}
          placeholder="What should improve? (optional)"
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit feedback'}</Button>
          {message && <p className="text-sm text-gray-600">{message}</p>}
        </div>
      </form>
    </section>
  );
}
