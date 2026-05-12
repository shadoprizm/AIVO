import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';
import MarketingLayout from '../components/layouts/MarketingLayout';
import SEOHead from '../components/shared/SEOHead';
import Button from '../components/ui/Button';
import { claimPublicScan, fetchPublicReport } from '../lib/publicScan';
import { dateStamp, safeFilename } from '../lib/downloadBlob';
import { downloadPdfFromHtml } from '../lib/pdfExport';
import { SITE } from '../config/site';
import { useAuth } from '../contexts/AuthContext';
import { trackEvent } from '../lib/analytics';
import { rememberPostAuthRedirect } from '../lib/authRedirect';
import CompetitorTeardown from '../components/report/CompetitorTeardown';
import ContentBlueprint from '../components/report/ContentBlueprint';
import ContentGaps from '../components/report/ContentGaps';
import CustomerPrintReport from '../components/report/CustomerPrintReport';
import EntityMap from '../components/report/EntityMap';
import GenerativeAudit from '../components/report/GenerativeAudit';
import Recommendations from '../components/report/Recommendations';
import ReportHeader from '../components/report/ReportHeader';
import ScoreSummary from '../components/report/ScoreSummary';
import ShareActions from '../components/report/ShareActions';
import TechnicalFindings from '../components/report/TechnicalFindings';
import {
  AIFixPrompt,
  CustomerSummary,
  ReportBlueprintItem,
  ReportCompetitorBreakdown,
  ReportContentGap,
  ReportEntityMap,
  ReportGenerativeAudit,
  ReportQueryBatteryItem,
  ReportRecommendation,
  asNumber,
} from '../components/report/reportTypes';
import ReportFeedback from '../components/report/ReportFeedback';

interface ReportSite {
  id: string;
  name: string;
  url: string;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

export default function PublicReport() {
  const { token } = useParams<{ token: string }>();
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [claimMessage, setClaimMessage] = useState('');
  const [claimAttempted, setClaimAttempted] = useState(false);
  const { user, loading: authLoading } = useAuth();
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
          trackEvent('report_viewed', { status: typeof data.status === 'string' ? data.status : 'unknown' });
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
  const recommendations = useMemo(() => asArray<ReportRecommendation>(report?.recommendations), [report]);
  const queryBattery = useMemo(() => asArray<ReportQueryBatteryItem>(report?.queryBattery), [report]);
  const generativeAudit = useMemo<ReportGenerativeAudit | null>(() => {
    const value = report?.generativeAudit;
    return value && typeof value === 'object' && !Array.isArray(value) ? value as ReportGenerativeAudit : null;
  }, [report]);
  const competitorTeardown = useMemo(() => asArray<ReportCompetitorBreakdown>(report?.competitorTeardown), [report]);
  const entityMap = useMemo<ReportEntityMap | null>(() => {
    const value = report?.entityMap;
    return value && typeof value === 'object' && !Array.isArray(value) ? value as ReportEntityMap : null;
  }, [report]);
  const contentGaps = useMemo(() => asArray<ReportContentGap>(report?.contentGaps), [report]);
  const contentBlueprint = useMemo(() => asArray<ReportBlueprintItem>(report?.contentBlueprint), [report]);
  const strategicReadinessScore = asNumber(report?.strategicReadinessScore);
  const strategicReadinessSummary = typeof report?.strategicReadinessSummary === 'string' ? report.strategicReadinessSummary : '';
  const aiFixPromptMarkdown = typeof evidence.ai_fix_prompt_markdown === 'string' ? evidence.ai_fix_prompt_markdown : undefined;
  const aiFixPromptStructured = evidence.ai_fix_prompt_structured && typeof evidence.ai_fix_prompt_structured === 'object'
    ? evidence.ai_fix_prompt_structured as AIFixPrompt
    : undefined;
  const customerSummary = evidence.customer_summary && typeof evidence.customer_summary === 'object'
    ? evidence.customer_summary as CustomerSummary
    : undefined;
  const site = report?.site as ReportSite | null | undefined;
  const overall = asNumber(score.overall) ?? asNumber(report?.overall_score) ?? 0;
  const scanDate = typeof report?.createdAt === 'string' ? report.createdAt : undefined;
  const status = typeof report?.status === 'string' ? report.status : 'partial';
  const visibility = typeof report?.visibility === 'string' ? report.visibility : 'unlisted';
  const reportRedirectPath = token ? `/report/${token}` : '/dashboard';

  useEffect(() => {
    if (authLoading || !user || !token || !report || claimAttempted || visibility === 'private') {
      return;
    }

    let mounted = true;
    setClaimAttempted(true);
    setClaiming(true);
    claimPublicScan(token)
      .then(() => {
        if (mounted) {
          setClaimMessage('Saved to your account.');
          setReport((current) => current ? { ...current, visibility: 'private' } : current);
          trackEvent('report_claimed');
        }
      })
      .catch((claimError) => {
        if (mounted) {
          setClaimMessage(claimError instanceof Error ? claimError.message : 'Unable to save report.');
        }
      })
      .finally(() => {
        if (mounted) {
          setClaiming(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [authLoading, claimAttempted, report, token, user, visibility]);

  const rememberReportRedirect = () => {
    rememberPostAuthRedirect(reportRedirectPath);
  };

  const customerReportProps = {
    siteName: site?.name ?? 'Public Scan Report',
    siteUrl: site?.url,
    scanDate,
    overallScore: overall,
    customerSummary,
    recommendations,
    strategicReadinessScore,
    strategicReadinessSummary,
    generativeAudit,
    entityMap,
    contentGaps,
    contentBlueprint,
    competitorTeardown,
  };

  const handleCustomerPdfDownload = async () => {
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      <CustomerPrintReport
        {...customerReportProps}
        mode="pdf"
      />,
    );

    await downloadPdfFromHtml(
      html,
      `aivo-customer-report-${safeFilename(customerReportProps.siteName)}-${dateStamp()}.pdf`,
    );
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
          <>
            <div className="space-y-8 print:hidden">
              <ReportHeader
                siteName={site?.name ?? 'Public Scan Report'}
                siteUrl={site?.url}
                scanDate={scanDate}
                status={status}
                overallScore={overall}
              />
              <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <ShareActions
                  reportUrl={window.location.href}
                  siteUrl={site?.url}
                  overallScore={overall}
                  scanDate={scanDate}
                  recommendations={recommendations}
                  aiFixPromptMarkdown={aiFixPromptMarkdown}
                  aiFixPromptStructured={aiFixPromptStructured}
                  onCustomerPdf={handleCustomerPdfDownload}
                  onAction={(action) => {
                    setError('');
                    if (action === 'link') trackEvent('report_shared');
                    if (action === 'customer_pdf') trackEvent('customer_pdf_exported');
                    if (action === 'checklist') trackEvent('checklist_copied');
                    if (action === 'ai_prompt_md') trackEvent('ai_prompt_downloaded', { format: 'markdown' });
                    if (action === 'ai_prompt_json') trackEvent('ai_prompt_downloaded', { format: 'json' });
                    if (action === 'recommendations_json') trackEvent('recommendations_downloaded');
                  }}
                />
                {(claiming || claimMessage) && (
                  <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                    {claiming ? 'Saving this report to your account...' : claimMessage}
                  </div>
                )}
              </section>

              <ScoreSummary score={score} />
              {(strategicReadinessScore !== null || strategicReadinessSummary) && (
                <section className="rounded-lg border border-blue-200 bg-blue-50 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-blue-900">Strategic Readiness</h2>
                      {strategicReadinessSummary && (
                        <p className="mt-1 text-sm text-blue-900/90">{strategicReadinessSummary}</p>
                      )}
                    </div>
                    {strategicReadinessScore !== null && (
                      <div className="flex items-center gap-3">
                        <div className="text-3xl font-bold text-blue-900">{strategicReadinessScore}</div>
                        <div className="text-xs text-blue-900/70">
                          out of 100<br />strategic readiness
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}
              <GenerativeAudit audit={generativeAudit} battery={queryBattery} />
              <CompetitorTeardown competitors={competitorTeardown} />
              <EntityMap entityMap={entityMap} />
              <ContentGaps gaps={contentGaps} />
              <ContentBlueprint blueprint={contentBlueprint} />
              <TechnicalFindings evidence={technicalEvidence} />
              <Recommendations recommendations={recommendations} />
              {token && <ReportFeedback publicToken={token} />}

              {!user && (
                <section className="rounded-lg border border-blue-200 bg-blue-50 p-6 text-center">
                  <h2 className="text-2xl font-bold text-gray-900">Save this report</h2>
                  <p className="mt-2 text-gray-700">Create free account to save this scan and track improvements.</p>
                  <Link to={`/signup?redirect=${encodeURIComponent(reportRedirectPath)}`} className="mt-4 inline-block" onClick={rememberReportRedirect}>
                    <Button>Create free account to save this scan</Button>
                  </Link>
                </section>
              )}
            </div>

            <CustomerPrintReport
              {...customerReportProps}
            />
          </>
        )}
      </main>
    </MarketingLayout>
  );
}
