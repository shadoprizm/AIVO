import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Copy, ExternalLink, Loader2 } from 'lucide-react';
import MarketingLayout from '../components/layouts/MarketingLayout';
import SEOHead from '../components/shared/SEOHead';
import Button from '../components/ui/Button';
import { fetchPublicReport } from '../lib/publicScan';
import { SITE } from '../config/site';

interface ReportSite {
  id: string;
  name: string;
  url: string;
}

interface Recommendation {
  title?: string;
  severity?: string;
  evidence?: string;
  why_it_matters?: string;
  exact_fix?: string;
  effort_estimate?: string;
  owner?: string;
  expected_impact?: string;
}

interface AnswerTest {
  prompt?: string;
  model?: string;
  brand_mentioned?: boolean;
  competitors_mentioned?: string[];
  cited_urls?: string[];
  sentiment?: string;
  confidence?: number;
  missing_evidence?: string[];
  raw_excerpt?: string;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

function scoreEntries(score: Record<string, unknown>) {
  return [
    ['crawl_access', 'Crawl Access'],
    ['entity_clarity', 'Entity Clarity'],
    ['answer_readiness', 'Answer Readiness'],
    ['citation_likelihood', 'Citation Likelihood'],
    ['trust_evidence', 'Trust Evidence'],
    ['competitive_presence', 'Competitive Presence'],
  ].map(([key, label]) => ({
    key,
    label,
    value: asNumber(score[key]) ?? 0,
  }));
}

export default function PublicReport() {
  const { token } = useParams<{ token: string }>();
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const siteUrl = SITE.url.replace(/\/$/, '');

  useEffect(() => {
    const robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex,nofollow';
    document.head.appendChild(robots);
    return () => {
      robots.remove();
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadReport() {
      if (!token) {
        setError('Report not found.');
        setLoading(false);
        return;
      }

      try {
        const data = await fetchPublicReport(token);
        if (mounted) {
          setReport(data);
        }
      } catch (reportError) {
        if (mounted) {
          setError(reportError instanceof Error ? reportError.message : 'Unable to load report.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadReport();
    return () => {
      mounted = false;
    };
  }, [token]);

  const score = useMemo(() => asRecord(report?.score), [report]);
  const evidence = useMemo(() => asRecord(report?.evidence), [report]);
  const technical = useMemo(() => asRecord(evidence.technical), [evidence]);
  const technicalEvidence = useMemo(() => asRecord(technical.evidence), [technical]);
  const recommendations = useMemo(() => asArray<Recommendation>(report?.recommendations), [report]);
  const answerTests = useMemo(() => asArray<AnswerTest>(report?.answerTests), [report]);
  const site = report?.site as ReportSite | null | undefined;
  const overall = asNumber(score.overall) ?? asNumber(report?.overall_score) ?? 0;
  const status = typeof report?.status === 'string' ? report.status : 'partial';

  const copyReportLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Unable to copy link. Copy it from the address bar instead.');
    }
  };

  return (
    <MarketingLayout>
      <SEOHead
        title="AIVO Public Scan Report"
        description="Unlisted AIVO Insights public scan report."
        canonical={`${siteUrl}/report/${token ?? ''}`}
        ogTitle="AIVO Public Scan Report"
        ogDescription="Evidence-based AI visibility scan report."
        ogImage={`${siteUrl}/og-image.png`}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading && (
          <div className="flex items-center justify-center py-24 text-gray-600">
            <Loader2 className="mr-3 h-6 w-6 animate-spin" />
            Loading report...
          </div>
        )}

        {!loading && error && !report && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5" />
              <div>
                <h1 className="text-lg font-semibold">Report unavailable</h1>
                <p className="mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {!loading && report && (
          <div className="space-y-8">
            <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="mb-3 inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                    {status === 'complete' ? 'Complete scan' : 'Partial scan'}
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {site?.name ?? 'Public Scan Report'}
                  </h1>
                  {site?.url && (
                    <a href={site.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-blue-600 hover:text-blue-700">
                      {site.url.replace(/^https?:\/\//, '')}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg border-2 border-blue-200 bg-blue-50 px-5 py-3 text-center">
                    <div className="text-4xl font-bold text-blue-700">{overall}</div>
                    <div className="text-xs font-medium uppercase tracking-wide text-blue-900">AIVO Score</div>
                  </div>
                  <Button type="button" variant="outline" onClick={copyReportLink} className="flex items-center gap-2">
                    <Copy className="h-4 w-4" />
                    {copied ? 'Copied' : 'Copy link'}
                  </Button>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-xl font-semibold text-gray-900">Sub-scores</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {scoreEntries(score).map((entry) => (
                  <div key={entry.key}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">{entry.label}</span>
                      <span className="font-semibold text-gray-900">{entry.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100">
                      <div className="h-2 rounded-full bg-blue-600" style={{ width: `${Math.min(entry.value, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-xl font-semibold text-gray-900">Evidence</h2>
              <div className="grid gap-4 md:grid-cols-3">
                {Object.entries(technicalEvidence).map(([key, value]) => (
                  <div key={key} className="rounded-lg border border-gray-200 p-4">
                    <h3 className="mb-2 font-medium capitalize text-gray-900">{key.replace(/_/g, ' ')}</h3>
                    <pre className="whitespace-pre-wrap break-words text-xs text-gray-600">
                      {JSON.stringify(value, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-xl font-semibold text-gray-900">Recommendations</h2>
              <div className="space-y-4">
                {recommendations.length === 0 && <p className="text-gray-600">No recommendations were returned for this scan.</p>}
                {recommendations.map((recommendation, index) => (
                  <article key={`${recommendation.title ?? 'recommendation'}-${index}`} className="rounded-lg border border-gray-200 p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{recommendation.title ?? 'Recommendation'}</h3>
                      {recommendation.severity && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium uppercase text-gray-700">
                          {recommendation.severity}
                        </span>
                      )}
                    </div>
                    {recommendation.evidence && <p className="text-sm text-gray-700"><strong>Evidence:</strong> {recommendation.evidence}</p>}
                    {recommendation.why_it_matters && <p className="mt-2 text-sm text-gray-700"><strong>Why it matters:</strong> {recommendation.why_it_matters}</p>}
                    {recommendation.exact_fix && <p className="mt-2 text-sm text-gray-700"><strong>Exact fix:</strong> {recommendation.exact_fix}</p>}
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-xl font-semibold text-gray-900">AI Answer Simulation</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {answerTests.length === 0 && <p className="text-gray-600">Answer simulations were not available for this scan.</p>}
                {answerTests.map((test, index) => (
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

            <section className="rounded-lg border border-blue-200 bg-blue-50 p-6 text-center">
              <h2 className="text-2xl font-bold text-gray-900">Save this report</h2>
              <p className="mt-2 text-gray-700">Create free account to save this report and track improvements.</p>
              <Link to={`/signup?redirect=/report/${token ?? ''}`} className="mt-4 inline-block">
                <Button>Create free account to save this report</Button>
              </Link>
            </section>
          </div>
        )}
      </main>
    </MarketingLayout>
  );
}
