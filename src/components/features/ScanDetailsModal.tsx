import { X, TrendingUp, AlertCircle, CheckCircle2, Info, FileText, Code, MessageSquare, Shield, Zap, Layout, Printer } from 'lucide-react';
import { Scan, CategoryScores } from '../../types/database';
import Button from '../ui/Button';

interface ScanDetailsModalProps {
  scan: Scan;
  siteName: string;
  siteUrl: string;
  onClose: () => void;
}

const categoryLabels: Record<keyof CategoryScores, string> = {
  content_clarity: 'Content Clarity',
  semantic_structure: 'Semantic Structure',
  schema_metadata: 'Schema & Metadata',
  qa_readiness: 'Q&A Readiness',
  authority_trust: 'Authority & Trust',
  technical_accessibility: 'Technical Accessibility',
};

const categoryDescriptions: Record<keyof CategoryScores, string> = {
  content_clarity: 'Clear, factual writing with scannable structure',
  semantic_structure: 'Proper HTML5 tags and heading hierarchy',
  schema_metadata: 'Schema.org markup and meta tags',
  qa_readiness: 'FAQ sections and Q&A formatting',
  authority_trust: 'Credentials, citations, and expertise signals',
  technical_accessibility: 'Fast loading and mobile-friendly',
};

const categoryIcons: Record<keyof CategoryScores, typeof FileText> = {
  content_clarity: FileText,
  semantic_structure: Layout,
  schema_metadata: Code,
  qa_readiness: MessageSquare,
  authority_trust: Shield,
  technical_accessibility: Zap,
};

export default function ScanDetailsModal({ scan, siteName, siteUrl, onClose }: ScanDetailsModalProps) {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print the report');
      return;
    }

    const htmlContent = generatePrintHTML();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const generatePrintHTML = () => {
    if (!scan.analysis_json) return '';
    const { analysis_json } = scan;

    const getScoreColorClass = (score: number) => {
      if (score >= 80) return 'score-high';
      if (score >= 60) return 'score-good';
      if (score >= 40) return 'score-medium';
      return 'score-low';
    };

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    Object.entries(analysis_json.category_scores).forEach(([key, score]) => {
      const label = categoryLabels[key as keyof CategoryScores];
      if (score >= 70) strengths.push(label);
      else if (score < 60) weaknesses.push(label);
    });

    const recommendationsByPriority = {
      high: analysis_json.recommendations?.filter(r => r.severity === 'high') || [],
      medium: analysis_json.recommendations?.filter(r => r.severity === 'medium') || [],
      low: analysis_json.recommendations?.filter(r => r.severity === 'low') || [],
    };

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>AIVO Insights Report - ${siteName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1f2937; padding: 40px; }
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
    .effort-easy { background: #dcfce7; color: #16a34a; }
    .effort-medium { background: #fef9c3; color: #ca8a04; }
    .effort-hard { background: #fee2e2; color: #dc2626; }
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
  <div class="header">
    <h1>AIVO Insights Report</h1>
    <div class="site-info">
      <div><strong>${siteName}</strong></div>
      <div>${siteUrl}</div>
      <div style="margin-top: 8px;">Scan Date: ${new Date(scan.created_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })}</div>
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
  ${Object.entries(analysis_json.category_scores).map(([key, score]) => `
    <div class="category">
      <div class="category-header">
        <span class="category-name">${categoryLabels[key as keyof CategoryScores]}</span>
        <span class="category-score ${getScoreColorClass(score)}">${score}</span>
      </div>
      <div class="category-desc">${categoryDescriptions[key as keyof CategoryScores]}</div>
    </div>
  `).join('')}

  ${analysis_json.recommendations && analysis_json.recommendations.length > 0 ? `
  <div class="page-break"></div>
  <h2>Recommendations</h2>

  ${recommendationsByPriority.high.length > 0 ? `
  <h3 style="color: #dc2626;">High Priority (${recommendationsByPriority.high.length} items)</h3>
  ${recommendationsByPriority.high.map(rec => `
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
  ${recommendationsByPriority.medium.map(rec => `
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
  ${recommendationsByPriority.low.map(rec => `
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
</body>
</html>
    `;
  };
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'medium':
        return <Info className="w-5 h-5 text-yellow-600" />;
      case 'low':
        return <CheckCircle2 className="w-5 h-5 text-blue-600" />;
      default:
        return null;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200';
      case 'low':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (!scan.analysis_json) {
    return null;
  }

  const { analysis_json } = scan;

  const getStrengthsAndWeaknesses = () => {
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    Object.entries(analysis_json.category_scores).forEach(([key, score]) => {
      const label = categoryLabels[key as keyof CategoryScores];
      if (score >= 70) {
        strengths.push(label);
      } else if (score < 60) {
        weaknesses.push(label);
      }
    });

    return { strengths, weaknesses };
  };

  const getTopPriorities = () => {
    if (!analysis_json.recommendations) return [];
    return analysis_json.recommendations
      .filter(rec => rec.severity === 'high')
      .slice(0, 3);
  };

  const { strengths, weaknesses } = getStrengthsAndWeaknesses();
  const topPriorities = getTopPriorities();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-slideUp">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">AIVO Insights Report</h2>
              <div className={`px-4 py-2 rounded-lg border-2 font-bold text-3xl ${getScoreColor(analysis_json.overall_score)}`}>
                {analysis_json.overall_score}
              </div>
            </div>
            <p className="text-sm text-gray-600">{siteName} • {siteUrl}</p>
            <p className="text-xs text-gray-500 mt-1">
              Scan Date: {new Date(scan.created_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto flex-grow p-6">
          <section className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Summary</h3>

            <div className="space-y-4">
              {strengths.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Your Strengths:</p>
                  <p className="text-gray-900">
                    Strong performance in {strengths.join(', ')}.
                  </p>
                </div>
              )}

              {weaknesses.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Areas for Improvement:</p>
                  <p className="text-gray-900">
                    Focus needed on {weaknesses.join(', ')}.
                  </p>
                </div>
              )}

              {topPriorities.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Top Priorities This Week:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {topPriorities.map((rec, idx) => (
                      <li key={idx} className="text-gray-900 text-sm">{rec.title}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Category Breakdown
            </h3>
            <div className="space-y-4">
              {Object.entries(analysis_json.category_scores).map(([key, score]) => {
                const Icon = categoryIcons[key as keyof CategoryScores];
                const isStrength = score >= 70;
                const isWeakness = score < 60;

                return (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-start gap-3 flex-grow">
                        <div className={`p-2 rounded-lg ${isStrength ? 'bg-green-100' : isWeakness ? 'bg-red-100' : 'bg-blue-100'}`}>
                          <Icon className={`w-5 h-5 ${isStrength ? 'text-green-600' : isWeakness ? 'text-red-600' : 'text-blue-600'}`} />
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">
                              {categoryLabels[key as keyof CategoryScores]}
                            </p>
                            {isStrength && (
                              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                                Strength
                              </span>
                            )}
                            {isWeakness && (
                              <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                                Weakness
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {categoryDescriptions[key as keyof CategoryScores]}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-lg font-semibold flex-shrink-0 ml-4 ${getScoreColor(score)}`}>
                        {score}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${getScoreBarColor(score)}`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {analysis_json.recommendations && analysis_json.recommendations.length > 0 && (
            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Recommendations
              </h3>

              {['high', 'medium', 'low'].map((priority) => {
                const priorityRecs = analysis_json.recommendations.filter(
                  (rec) => rec.severity === priority
                );

                if (priorityRecs.length === 0) return null;

                const priorityLabels: Record<string, string> = {
                  high: 'High Priority',
                  medium: 'Medium Priority',
                  low: 'Low Priority',
                };

                const priorityColors: Record<string, string> = {
                  high: 'text-red-600 bg-red-50 border-red-200',
                  medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
                  low: 'text-blue-600 bg-blue-50 border-blue-200',
                };

                return (
                  <div key={priority} className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {priorityLabels[priority]}
                      </h4>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${priorityColors[priority]}`}>
                        {priorityRecs.length} {priorityRecs.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {priorityRecs.map((rec) => (
                        <div
                          key={rec.id}
                          className={`p-4 rounded-lg border-2 ${getSeverityColor(rec.severity)}`}
                        >
                          <div className="flex items-start gap-3">
                            {getSeverityIcon(rec.severity)}
                            <div className="flex-grow">
                              <div className="flex items-start justify-between mb-2">
                                <h5 className="font-semibold text-gray-900">{rec.title}</h5>
                                <span className={`text-xs px-2 py-1 rounded border capitalize flex-shrink-0 ml-2 ${
                                  rec.implementation_effort === 'easy'
                                    ? 'bg-green-50 border-green-300 text-green-700'
                                    : rec.implementation_effort === 'medium'
                                    ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
                                    : 'bg-red-50 border-red-300 text-red-700'
                                }`}>
                                  {rec.implementation_effort} effort
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                              <div className="bg-white bg-opacity-50 p-3 rounded border border-gray-300">
                                <p className="text-sm font-medium text-gray-900 mb-1">Suggested Fix:</p>
                                <p className="text-sm text-gray-700">{rec.suggested_fix}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          {analysis_json.warnings && analysis_json.warnings.length > 0 && (
            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Warnings</h3>
              <div className="space-y-2">
                {analysis_json.warnings.map((warning, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-900">{warning}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {analysis_json.notes && analysis_json.notes.length > 0 && (
            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Positive Notes</h3>
              <div className="space-y-2">
                {analysis_json.notes.map((note, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-900">{note}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <Button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </Button>
          <Button onClick={onClose} variant="outline" className="flex-1">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
