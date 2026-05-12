import { CategoryScores, Scan } from '../types/database';

export const categoryLabels: Record<keyof CategoryScores, string> = {
  content_clarity: 'Content Clarity',
  semantic_structure: 'Semantic Structure',
  schema_metadata: 'Schema & Metadata',
  qa_readiness: 'Q&A Readiness',
  authority_trust: 'Authority & Trust',
  technical_accessibility: 'Technical Accessibility',
};

export const categoryDescriptions: Record<keyof CategoryScores, string> = {
  content_clarity: 'Clear, factual writing with scannable structure',
  semantic_structure: 'Proper HTML5 tags and heading hierarchy',
  schema_metadata: 'Schema.org markup and meta tags',
  qa_readiness: 'FAQ sections and Q&A formatting',
  authority_trust: 'Credentials, citations, and expertise signals',
  technical_accessibility: 'Fast loading and mobile-friendly',
};

const severityRank: Record<string, number> = { high: 0, medium: 1, low: 2 };

interface ReportContext {
  scan: Scan;
  siteName: string;
  siteUrl: string;
}

function formatScanDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getStrengthsWeaknesses(scores: CategoryScores) {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  (Object.entries(scores) as Array<[keyof CategoryScores, number]>).forEach(([key, score]) => {
    const label = categoryLabels[key];
    if (score >= 70) strengths.push(label);
    else if (score < 60) weaknesses.push(label);
  });
  return { strengths, weaknesses };
}

export function generateReportHTML({ scan, siteName, siteUrl }: ReportContext): string {
  if (!scan.analysis_json) return '';
  const { analysis_json } = scan;

  const getScoreColorClass = (score: number) => {
    if (score >= 80) return 'score-high';
    if (score >= 60) return 'score-good';
    if (score >= 40) return 'score-medium';
    return 'score-low';
  };

  const { strengths, weaknesses } = getStrengthsWeaknesses(analysis_json.category_scores);

  const recs = analysis_json.recommendations ?? [];
  const recommendationsByPriority = {
    high: recs.filter((r) => r.severity === 'high'),
    medium: recs.filter((r) => r.severity === 'medium'),
    low: recs.filter((r) => r.severity === 'low'),
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>AIVO Insights Report - ${siteName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body, .aivo-pdf-report { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1f2937; padding: 40px; background: #ffffff; }
    h1 { font-size: 28px; color: #1f2937; margin-bottom: 10px; }
    h2 { font-size: 20px; color: #1f2937; margin-top: 30px; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
    h3 { font-size: 16px; color: #1f2937; margin-top: 20px; margin-bottom: 10px; }
    .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #3b82f6; }
    .site-info { color: #6b7280; font-size: 14px; margin-top: 8px; }
    .score-badge { display: inline-block; padding: 15px 30px; border-radius: 8px; font-size: 36px; font-weight: bold; margin: 20px 0; }
    .score-high { background: #dcfce7; color: #16a34a; }
    .score-good { background: #dbeafe; color: #2563eb; }
    .score-medium { background: #fef9c3; color: #ca8a04; }
    .score-low { background: #fee2e2; color: #dc2626; }
    .summary { background: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #3b82f6; }
    .summary-section { margin-bottom: 15px; }
    .summary-label { font-weight: 600; color: #374151; margin-bottom: 5px; }
    .category { margin-bottom: 20px; padding: 15px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; }
    .category-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .category-name { font-weight: 600; font-size: 15px; }
    .category-score { font-weight: bold; padding: 4px 12px; border-radius: 6px; }
    .category-desc { color: #6b7280; font-size: 14px; }
    .recommendation { margin-bottom: 20px; padding: 15px; border-radius: 8px; border: 2px solid; page-break-inside: avoid; }
    .rec-high { background: #fef2f2; border-color: #fecaca; }
    .rec-medium { background: #fffbeb; border-color: #fde68a; }
    .rec-low { background: #eff6ff; border-color: #bfdbfe; }
    .rec-title { font-weight: 600; margin-bottom: 8px; font-size: 15px; }
    .rec-effort { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-bottom: 8px; }
    .effort-low { background: #dcfce7; color: #16a34a; }
    .effort-medium { background: #fef9c3; color: #ca8a04; }
    .effort-high { background: #fee2e2; color: #dc2626; }
    .rec-desc { color: #4b5563; font-size: 14px; margin-bottom: 10px; }
    .rec-fix { background: #fff; padding: 12px; border-radius: 6px; border: 1px solid #d1d5db; }
    .rec-fix-label { font-weight: 600; font-size: 13px; margin-bottom: 5px; }
    .rec-fix-text { font-size: 13px; color: #4b5563; }
    .warning, .note { padding: 12px; margin-bottom: 10px; border-radius: 6px; font-size: 14px; page-break-inside: avoid; }
    .warning { background: #fef2f2; border-left: 4px solid #ef4444; }
    .note { background: #f0fdf4; border-left: 4px solid #22c55e; }
    ul { margin-left: 20px; }
    @media print {
      body { padding: 20px; }
      .page-break { page-break-before: always; }
    }
  </style>
</head>
<body>
  <div class="aivo-pdf-report">
  <div class="header">
    <h1>AIVO Insights Report</h1>
    <div class="site-info">
      <div><strong>${siteName}</strong></div>
      <div>${siteUrl}</div>
      <div style="margin-top: 8px;">Scan Date: ${formatScanDate(scan.created_at)}</div>
    </div>
    <div class="score-badge ${getScoreColorClass(analysis_json.overall_score)}">
      ${analysis_json.overall_score}
    </div>
    <div style="color: #6b7280; font-size: 14px;">Overall AIVO Score</div>
  </div>

  ${strengths.length > 0 || weaknesses.length > 0 ? `
  <div class="summary">
    <h3 style="margin-top: 0;">Executive Summary</h3>
    ${strengths.length > 0 ? `
    <div class="summary-section">
      <div class="summary-label">Strengths:</div>
      <div>Strong performance in ${strengths.join(', ')}.</div>
    </div>` : ''}
    ${weaknesses.length > 0 ? `
    <div class="summary-section">
      <div class="summary-label">Areas for Improvement:</div>
      <div>Focus needed on ${weaknesses.join(', ')}.</div>
    </div>` : ''}
  </div>` : ''}

  <h2>Category Breakdown</h2>
  ${(Object.entries(analysis_json.category_scores) as Array<[keyof CategoryScores, number]>).map(([key, score]) => `
    <div class="category">
      <div class="category-header">
        <span class="category-name">${categoryLabels[key]}</span>
        <span class="category-score ${getScoreColorClass(score)}">${score}</span>
      </div>
      <div class="category-desc">${categoryDescriptions[key]}</div>
      ${analysis_json.category_feedback?.[key]?.score_reason ? `
      <div class="category-desc" style="color: #111827;"><strong>Why this score:</strong> ${analysis_json.category_feedback[key].score_reason}</div>` : ''}
      ${analysis_json.category_feedback?.[key]?.improvement_path ? `
      <div class="category-desc" style="color: #1d4ed8;"><strong>Path to 100:</strong> ${analysis_json.category_feedback[key].improvement_path}</div>` : ''}
    </div>
  `).join('')}

  ${recs.length > 0 ? `
  <div class="page-break"></div>
  <h2>Recommendations</h2>

  ${recommendationsByPriority.high.length > 0 ? `
  <h3 style="color: #dc2626;">High Priority (${recommendationsByPriority.high.length} items)</h3>
  ${recommendationsByPriority.high.map((rec) => `
    <div class="recommendation rec-high">
      <div class="rec-title">${rec.title}</div>
      <div class="rec-effort effort-${rec.implementation_effort}">${rec.implementation_effort} effort</div>
      <div class="rec-desc">${rec.description}</div>
      <div class="rec-fix">
        <div class="rec-fix-label">Suggested Fix:</div>
        <div class="rec-fix-text">${rec.suggested_fix}</div>
      </div>
    </div>
  `).join('')}` : ''}

  ${recommendationsByPriority.medium.length > 0 ? `
  <h3 style="color: #ca8a04;">Medium Priority (${recommendationsByPriority.medium.length} items)</h3>
  ${recommendationsByPriority.medium.map((rec) => `
    <div class="recommendation rec-medium">
      <div class="rec-title">${rec.title}</div>
      <div class="rec-effort effort-${rec.implementation_effort}">${rec.implementation_effort} effort</div>
      <div class="rec-desc">${rec.description}</div>
      <div class="rec-fix">
        <div class="rec-fix-label">Suggested Fix:</div>
        <div class="rec-fix-text">${rec.suggested_fix}</div>
      </div>
    </div>
  `).join('')}` : ''}

  ${recommendationsByPriority.low.length > 0 ? `
  <h3 style="color: #2563eb;">Low Priority (${recommendationsByPriority.low.length} items)</h3>
  ${recommendationsByPriority.low.map((rec) => `
    <div class="recommendation rec-low">
      <div class="rec-title">${rec.title}</div>
      <div class="rec-effort effort-${rec.implementation_effort}">${rec.implementation_effort} effort</div>
      <div class="rec-desc">${rec.description}</div>
      <div class="rec-fix">
        <div class="rec-fix-label">Suggested Fix:</div>
        <div class="rec-fix-text">${rec.suggested_fix}</div>
      </div>
    </div>
  `).join('')}` : ''}
  ` : ''}

  ${analysis_json.warnings && analysis_json.warnings.length > 0 ? `
  <h2>Warnings</h2>
  ${analysis_json.warnings.map((warning, idx) => `
    <div class="warning">${idx + 1}. ${warning}</div>
  `).join('')}` : ''}

  ${analysis_json.notes && analysis_json.notes.length > 0 ? `
  <h2>Positive Notes</h2>
  ${analysis_json.notes.map((note, idx) => `
    <div class="note">${idx + 1}. ${note}</div>
  `).join('')}` : ''}

  <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px;">
    Generated by AIVO Insights | Custom Built by Astra Web Dev
  </div>
  </div>
</body>
</html>
  `;
}

export function generateReportMarkdown({ scan, siteName, siteUrl }: ReportContext): string {
  if (!scan.analysis_json) return '';
  const { analysis_json } = scan;
  const { strengths, weaknesses } = getStrengthsWeaknesses(analysis_json.category_scores);
  const recs = [...(analysis_json.recommendations ?? [])].sort(
    (a, b) => severityRank[a.severity] - severityRank[b.severity],
  );

  const lines: string[] = [];
  lines.push(`# AIVO Insights Report`);
  lines.push('');
  lines.push(`**Site:** ${siteName}  `);
  lines.push(`**URL:** ${siteUrl}  `);
  lines.push(`**Scan Date:** ${formatScanDate(scan.created_at)}  `);
  lines.push(`**Overall AIVO Score:** ${analysis_json.overall_score}/100`);
  lines.push('');

  if (strengths.length > 0 || weaknesses.length > 0) {
    lines.push(`## Executive Summary`);
    lines.push('');
    if (strengths.length > 0) {
      lines.push(`**Strengths:** Strong performance in ${strengths.join(', ')}.`);
      lines.push('');
    }
    if (weaknesses.length > 0) {
      lines.push(`**Areas for Improvement:** Focus needed on ${weaknesses.join(', ')}.`);
      lines.push('');
    }
  }

  lines.push(`## Category Breakdown`);
  lines.push('');
  (Object.entries(analysis_json.category_scores) as Array<[keyof CategoryScores, number]>).forEach(([key, score]) => {
    lines.push(`### ${categoryLabels[key]} — ${score}/100`);
    lines.push('');
    lines.push(`${categoryDescriptions[key]}`);
    lines.push('');
    const feedback = analysis_json.category_feedback?.[key];
    if (feedback?.score_reason) {
      lines.push(`- **Why this score:** ${feedback.score_reason}`);
    }
    if (feedback?.improvement_path) {
      lines.push(`- **Path to 100:** ${feedback.improvement_path}`);
    }
    lines.push('');
  });

  if (recs.length > 0) {
    lines.push(`## Recommendations`);
    lines.push('');
    (['high', 'medium', 'low'] as const).forEach((sev) => {
      const items = recs.filter((r) => r.severity === sev);
      if (items.length === 0) return;
      const labels = { high: 'High Priority', medium: 'Medium Priority', low: 'Low Priority' };
      lines.push(`### ${labels[sev]} (${items.length} item${items.length === 1 ? '' : 's'})`);
      lines.push('');
      items.forEach((rec, idx) => {
        lines.push(`#### ${idx + 1}. ${rec.title}`);
        lines.push('');
        lines.push(`- **Effort:** ${rec.implementation_effort}`);
        lines.push(`- **Description:** ${rec.description}`);
        lines.push(`- **Suggested Fix:** ${rec.suggested_fix}`);
        lines.push('');
      });
    });
  }

  if (analysis_json.warnings && analysis_json.warnings.length > 0) {
    lines.push(`## Warnings`);
    lines.push('');
    analysis_json.warnings.forEach((w, i) => lines.push(`${i + 1}. ${w}`));
    lines.push('');
  }

  if (analysis_json.notes && analysis_json.notes.length > 0) {
    lines.push(`## Positive Notes`);
    lines.push('');
    analysis_json.notes.forEach((n, i) => lines.push(`${i + 1}. ${n}`));
    lines.push('');
  }

  lines.push(`---`);
  lines.push(`*Generated by AIVO Insights | Custom Built by Astra Web Dev*`);

  return lines.join('\n');
}

export function generateReportJSON({ scan, siteName, siteUrl }: ReportContext): string {
  const envelope = {
    site: {
      name: siteName,
      url: siteUrl,
    },
    scan: {
      id: scan.id,
      created_at: scan.created_at,
      completed_at: scan.completed_at,
      status: scan.status,
      overall_score: scan.overall_score,
    },
    analysis: scan.analysis_json,
    exported_at: new Date().toISOString(),
  };
  return JSON.stringify(envelope, null, 2);
}
