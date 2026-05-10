import { Download, FileJson, ListChecks, Printer, Share2 } from 'lucide-react';
import Button from '../ui/Button';
import { ReportRecommendation } from './reportTypes';

interface ShareActionsProps {
  reportUrl: string;
  recommendations: ReportRecommendation[];
  evidence: Record<string, unknown>;
  onAction?: (action: 'link' | 'checklist' | 'brief' | 'print' | 'json') => void;
}

function buildChecklist(recommendations: ReportRecommendation[]): string {
  return recommendations
    .map((recommendation) => `- [ ] ${recommendation.title ?? 'Recommendation'}: ${recommendation.exact_fix ?? recommendation.evidence ?? ''}`.trim())
    .join('\n');
}

function buildContentBrief(recommendations: ReportRecommendation[]): string {
  return recommendations
    .filter((recommendation) => recommendation.owner === 'content' || recommendation.owner === 'marketing')
    .map((recommendation) => `## ${recommendation.title ?? 'Content recommendation'}\n\nEvidence: ${recommendation.evidence ?? 'Not provided'}\n\nFix: ${recommendation.exact_fix ?? 'Not provided'}`)
    .join('\n\n');
}

function downloadJson(evidence: Record<string, unknown>): void {
  const blob = new Blob([JSON.stringify(evidence, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'aivo-report-evidence.json';
  link.click();
  URL.revokeObjectURL(url);
}

export default function ShareActions({ reportUrl, recommendations, evidence, onAction }: ShareActionsProps) {
  const copyText = async (text: string, action: 'link' | 'checklist' | 'brief') => {
    await navigator.clipboard.writeText(text);
    onAction?.(action);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" size="sm" className="flex items-center gap-2" onClick={() => copyText(reportUrl, 'link')}>
        <Share2 className="h-4 w-4" />
        Copy link
      </Button>
      <Button type="button" variant="outline" size="sm" className="flex items-center gap-2" onClick={() => copyText(buildChecklist(recommendations), 'checklist')}>
        <ListChecks className="h-4 w-4" />
        Copy checklist
      </Button>
      <Button type="button" variant="outline" size="sm" className="flex items-center gap-2" onClick={() => copyText(buildContentBrief(recommendations), 'brief')}>
        <Download className="h-4 w-4" />
        Copy brief
      </Button>
      <Button type="button" variant="outline" size="sm" className="flex items-center gap-2" onClick={() => { window.print(); onAction?.('print'); }}>
        <Printer className="h-4 w-4" />
        Print
      </Button>
      <Button type="button" variant="outline" size="sm" className="flex items-center gap-2" onClick={() => { downloadJson(evidence); onAction?.('json'); }}>
        <FileJson className="h-4 w-4" />
        JSON
      </Button>
    </div>
  );
}
