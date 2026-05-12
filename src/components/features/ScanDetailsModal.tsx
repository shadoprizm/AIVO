import { useState } from 'react';
import { X, TrendingUp, AlertCircle, CheckCircle2, Info, FileText, Code, MessageSquare, Shield, Zap, Layout, FileJson, FileCode, Loader2 } from 'lucide-react';
import { Scan, CategoryScores } from '../../types/database';
import Button from '../ui/Button';
import { downloadBlob, dateStamp, safeFilename } from '../../lib/downloadBlob';
import {
  categoryLabels,
  categoryDescriptions,
  generateReportHTML,
  generateReportMarkdown,
  generateReportJSON,
} from '../../lib/reportGenerators';

interface ScanDetailsModalProps {
  scan: Scan;
  siteName: string;
  siteUrl: string;
  onClose: () => void;
}

const categoryIcons: Record<keyof CategoryScores, typeof FileText> = {
  content_clarity: FileText,
  semantic_structure: Layout,
  schema_metadata: Code,
  qa_readiness: MessageSquare,
  authority_trust: Shield,
  technical_accessibility: Zap,
};

export default function ScanDetailsModal({ scan, siteName, siteUrl, onClose }: ScanDetailsModalProps) {
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const filenameBase = `aivo-report-${safeFilename(siteName)}-${dateStamp()}`;

  const handleDownloadPDF = async () => {
    if (!scan.analysis_json || generatingPdf) return;
    setGeneratingPdf(true);
    try {
      const html = generateReportHTML({ scan, siteName, siteUrl });
      const container = document.createElement('div');
      container.innerHTML = html;
      container.style.position = 'fixed';
      container.style.left = '-10000px';
      container.style.top = '0';
      container.style.width = '800px';
      document.body.appendChild(container);

      const { default: html2pdf } = await import('html2pdf.js');
      await html2pdf()
        .set({
          margin: 10,
          filename: `${filenameBase}.pdf`,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(container)
        .save();

      document.body.removeChild(container);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleDownloadMarkdown = () => {
    const md = generateReportMarkdown({ scan, siteName, siteUrl });
    downloadBlob(md, `${filenameBase}.md`, 'text/markdown');
  };

  const handleDownloadJSON = () => {
    const json = generateReportJSON({ scan, siteName, siteUrl });
    downloadBlob(json, `${filenameBase}.json`, 'application/json');
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
                const feedback = analysis_json.category_feedback?.[key as keyof CategoryScores];

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
                          {feedback?.score_reason && (
                            <p className="text-sm text-gray-800 mt-2">
                              <span className="font-semibold text-gray-900">Why this score:</span> {feedback.score_reason}
                            </p>
                          )}
                          {feedback?.improvement_path && (
                            <p className="text-sm text-blue-800 mt-1">
                              <span className="font-semibold">Path to 100:</span> {feedback.improvement_path}
                            </p>
                          )}
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
                                  rec.implementation_effort === 'low'
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

        <div className="p-6 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-2">Download report</p>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleDownloadPDF}
              disabled={generatingPdf}
              className="flex items-center justify-center gap-2"
            >
              {generatingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  PDF
                </>
              )}
            </Button>
            <Button
              onClick={handleDownloadMarkdown}
              variant="outline"
              className="flex items-center justify-center gap-2"
            >
              <FileCode className="w-4 h-4" />
              Markdown
            </Button>
            <Button
              onClick={handleDownloadJSON}
              variant="outline"
              className="flex items-center justify-center gap-2"
            >
              <FileJson className="w-4 h-4" />
              JSON
            </Button>
            <Button onClick={onClose} variant="outline" className="ml-auto">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
