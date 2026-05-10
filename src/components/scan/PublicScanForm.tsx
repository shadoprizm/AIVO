import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';
import { startPublicScan } from '../../lib/publicScan';
import { trackEvent } from '../../lib/analytics';

export default function PublicScanForm() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    trackEvent('landing_view');
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      trackEvent('public_scan_started', { has_protocol: /^https?:\/\//i.test(url.trim()) });
      const result = await startPublicScan(url);
      trackEvent('public_scan_completed', { status: result.status });
      navigate(`/report/${result.publicToken}`, {
        state: {
          status: result.status,
          message: result.message,
        },
      });
    } catch (scanError) {
      trackEvent('public_scan_failed');
      setError(scanError instanceof Error ? scanError.message : 'Unable to run scan. Try again in a minute.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-3">
        <label className="sr-only" htmlFor="public-scan-url">
          Website URL
        </label>
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            id="public-scan-url"
            type="text"
            inputMode="url"
            autoComplete="url"
            placeholder="example.com"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            disabled={loading}
            className="w-full h-14 pl-12 pr-4 rounded-lg border border-white/20 bg-white text-slate-950 placeholder:text-slate-500 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100"
          />
        </div>
        <Button type="submit" size="lg" disabled={loading} className="h-14 whitespace-nowrap">
          {loading ? 'Scanning...' : 'Run free AI visibility scan'}
        </Button>
      </div>

      {loading && (
        <p className="mt-3 text-sm text-blue-100">
          Analyzing crawl access, schema, AI readability, and answer readiness...
        </p>
      )}

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p>{error} If this keeps happening, wait a minute and try another public URL.</p>
        </div>
      )}
    </form>
  );
}
