import { FileCode, FileJson, FileText, ListChecks, Printer, Share2 } from 'lucide-react';
import { useState } from 'react';
import Button from '../ui/Button';
import { AIFixPrompt, ReportRecommendation } from './reportTypes';

export type ShareAction =
  | 'link'
  | 'checklist'
  | 'ai_prompt_md'
  | 'ai_prompt_json'
  | 'recommendations_json'
  | 'customer_pdf';

interface ShareActionsProps {
  reportUrl: string;
  siteUrl?: string;
  overallScore: number;
  scanDate?: string;
  recommendations: ReportRecommendation[];
  aiFixPromptMarkdown?: string;
  aiFixPromptStructured?: AIFixPrompt;
  onAction?: (action: ShareAction) => void;
}

const severityRank: Record<string, number> = { high: 0, medium: 1, low: 2 };

function buildChecklist(recommendations: ReportRecommendation[]): string {
  return recommendations
    .map((recommendation) => `- [ ] ${recommendation.title ?? 'Recommendation'}: ${recommendation.exact_fix ?? recommendation.evidence ?? ''}`.trim())
    .join('\n');
}

function sortBySeverity(recommendations: ReportRecommendation[]): ReportRecommendation[] {
  return [...recommendations].sort((first, second) => {
    return severityRank[first.severity ?? 'medium'] - severityRank[second.severity ?? 'medium'];
  });
}

function buildFallbackPromptMarkdown(
  recommendations: ReportRecommendation[],
  siteUrl: string | undefined,
  overallScore: number,
  scanDate: string | undefined,
): string {
  const ordered = sortBySeverity(recommendations);
  const header = [
    `# AIVO Scan Repair Prompt`,
    ``,
    `I just ran an AI-visibility audit${siteUrl ? ` on ${siteUrl}` : ''} and got a score of ${overallScore}/100.`,
    `Please fix the issues below in priority order, then re-run the AIVO scan and confirm the overall score has improved.`,
    ``,
    `## Context`,
    siteUrl ? `- Site: ${siteUrl}` : '',
    `- Overall score: ${overallScore}/100`,
    scanDate ? `- Scan date: ${scanDate}` : '',
    ``,
    `## Issues to fix`,
  ].filter(Boolean).join('\n');

  const body = ordered.map((recommendation, index) => {
    const lines = [
      ``,
      `### ${index + 1}. ${recommendation.title ?? 'Recommendation'} (${recommendation.severity ?? 'medium'} severity)`,
      ``,
      recommendation.evidence ? `**Evidence:** ${recommendation.evidence}` : '',
      recommendation.why_it_matters ? `**Why it matters:** ${recommendation.why_it_matters}` : '',
      recommendation.exact_fix ? `**Exact fix:** ${recommendation.exact_fix}` : '',
      recommendation.expected_impact ? `**Expected impact:** ${recommendation.expected_impact}` : '',
    ].filter(Boolean);
    return lines.join('\n');
  }).join('\n');

  const footer = `\n\n## Verification\n\nAfter applying the fixes, re-run the AIVO scan and confirm the overall score is higher than ${overallScore}.`;

  return header + body + footer;
}

function buildFallbackPromptJson(
  recommendations: ReportRecommendation[],
  siteUrl: string | undefined,
  overallScore: number,
  scanDate: string | undefined,
): AIFixPrompt {
  const ordered = sortBySeverity(recommendations);
  return {
    site_url: siteUrl,
    overall_score: overallScore,
    scan_date: scanDate,
    issues: ordered.map((recommendation, index) => ({
      priority: index + 1,
      severity: recommendation.severity,
      title: recommendation.title,
      files_or_locations: [],
      exact_change: recommendation.exact_fix,
      verification: recommendation.expected_impact,
    })),
    post_fix_action: `Re-run the AIVO scan and confirm the overall score is higher than ${overallScore}.`,
  };
}

function downloadBlob(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function ShareActions({
  reportUrl,
  siteUrl,
  overallScore,
  scanDate,
  recommendations,
  aiFixPromptMarkdown,
  aiFixPromptStructured,
  onAction,
}: ShareActionsProps) {
  const [message, setMessage] = useState('');

  const copyText = async (text: string, action: 'link' | 'checklist') => {
    try {
      await navigator.clipboard.writeText(text || 'No report content available.');
      setMessage(action === 'link' ? 'Report link copied.' : 'Developer checklist copied.');
      onAction?.(action);
    } catch {
      setMessage('Clipboard access was blocked by the browser.');
    }
  };

  const handleAIPromptMarkdown = () => {
    const content = aiFixPromptMarkdown
      ?? buildFallbackPromptMarkdown(recommendations, siteUrl, overallScore, scanDate);
    downloadBlob(content, `aivo-ai-fix-prompt-${dateStamp()}.md`, 'text/markdown');
    setMessage('AI fix prompt (Markdown) downloaded.');
    onAction?.('ai_prompt_md');
  };

  const handleAIPromptJson = () => {
    const data = aiFixPromptStructured
      ?? buildFallbackPromptJson(recommendations, siteUrl, overallScore, scanDate);
    downloadBlob(JSON.stringify(data, null, 2), `aivo-ai-fix-prompt-${dateStamp()}.json`, 'application/json');
    setMessage('AI fix prompt (JSON) downloaded.');
    onAction?.('ai_prompt_json');
  };

  const handleRecommendationsJson = () => {
    downloadBlob(
      JSON.stringify(recommendations, null, 2),
      `aivo-recommendations-${dateStamp()}.json`,
      'application/json',
    );
    setMessage('Recommendations JSON downloaded.');
    onAction?.('recommendations_json');
  };

  const handleCustomerPdf = () => {
    setMessage('Opening customer report for printing...');
    onAction?.('customer_pdf');
    window.print();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" className="flex items-center gap-2" onClick={() => copyText(reportUrl, 'link')}>
          <Share2 className="h-4 w-4" />
          Copy link
        </Button>
        <Button type="button" variant="outline" size="sm" className="flex items-center gap-2" onClick={() => copyText(buildChecklist(recommendations), 'checklist')}>
          <ListChecks className="h-4 w-4" />
          Copy checklist
        </Button>
        <Button type="button" variant="outline" size="sm" className="flex items-center gap-2" onClick={handleAIPromptMarkdown}>
          <FileCode className="h-4 w-4" />
          AI fix prompt (.md)
        </Button>
        <Button type="button" variant="outline" size="sm" className="flex items-center gap-2" onClick={handleAIPromptJson}>
          <FileJson className="h-4 w-4" />
          AI fix prompt (.json)
        </Button>
        <Button type="button" variant="outline" size="sm" className="flex items-center gap-2" onClick={handleRecommendationsJson}>
          <FileText className="h-4 w-4" />
          Recommendations (.json)
        </Button>
        <Button type="button" variant="outline" size="sm" className="flex items-center gap-2" onClick={handleCustomerPdf}>
          <Printer className="h-4 w-4" />
          Download customer PDF
        </Button>
      </div>
      {message && <p className="text-sm text-gray-600 print:hidden">{message}</p>}
    </div>
  );
}
