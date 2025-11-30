import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Scan, CategoryScores } from '../types/database';

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

export function generateScanPDF(scan: Scan, siteName: string, siteUrl: string) {
  if (!scan.analysis_json) {
    throw new Error('No analysis data available');
  }

  const doc = new jsPDF();
  const { analysis_json } = scan;

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  let currentY = 20;

  doc.setFontSize(24);
  doc.setTextColor(31, 41, 55);
  doc.text('AIVO Insights Report', pageWidth / 2, currentY, { align: 'center' });

  currentY += 15;
  doc.setFontSize(12);
  doc.setTextColor(75, 85, 99);
  doc.text(siteName, pageWidth / 2, currentY, { align: 'center' });

  currentY += 6;
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text(siteUrl, pageWidth / 2, currentY, { align: 'center' });

  currentY += 6;
  const scanDate = new Date(scan.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  doc.text(`Scan Date: ${scanDate}`, pageWidth / 2, currentY, { align: 'center' });

  currentY += 15;

  const scoreColor = analysis_json.overall_score >= 80 ? [34, 197, 94] :
                     analysis_json.overall_score >= 60 ? [59, 130, 246] :
                     analysis_json.overall_score >= 40 ? [251, 191, 36] :
                     [239, 68, 68];

  doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.roundedRect(pageWidth / 2 - 20, currentY, 40, 20, 3, 3, 'F');

  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  doc.text(analysis_json.overall_score.toString(), pageWidth / 2, currentY + 14, { align: 'center' });

  currentY += 25;
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text('Overall AIVO Score', pageWidth / 2, currentY, { align: 'center' });

  currentY += 15;

  doc.setFontSize(14);
  doc.setTextColor(31, 41, 55);
  doc.text('Executive Summary', 15, currentY);

  currentY += 8;

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

  doc.setFontSize(10);
  doc.setTextColor(31, 41, 55);

  if (strengths.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('Strengths:', 15, currentY);
    currentY += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 85, 99);
    const strengthsText = doc.splitTextToSize(
      `Strong performance in ${strengths.join(', ')}.`,
      pageWidth - 30
    );
    doc.text(strengthsText, 15, currentY);
    currentY += strengthsText.length * 5 + 5;
  }

  if (weaknesses.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text('Areas for Improvement:', 15, currentY);
    currentY += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 85, 99);
    const weaknessText = doc.splitTextToSize(
      `Focus needed on ${weaknesses.join(', ')}.`,
      pageWidth - 30
    );
    doc.text(weaknessText, 15, currentY);
    currentY += weaknessText.length * 5 + 5;
  }

  currentY += 5;

  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(14);
  doc.setTextColor(31, 41, 55);
  doc.setFont('helvetica', 'bold');
  doc.text('Category Breakdown', 15, currentY);
  currentY += 5;

  const categoryData = Object.entries(analysis_json.category_scores).map(([key, score]) => {
    const feedback = analysis_json.category_feedback?.[key as keyof CategoryScores];
    return [
      categoryLabels[key as keyof CategoryScores],
      score.toString(),
      feedback?.score_reason || categoryDescriptions[key as keyof CategoryScores],
      feedback?.improvement_path || 'Follow recommended fixes to reach 100.',
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Category', 'Score', 'Why this score', 'Path to 100']],
    body: categoryData,
    theme: 'grid',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [31, 41, 55],
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 65 },
      3: { cellWidth: 'auto' },
    },
    didParseCell: function(data) {
      if (data.section === 'body' && data.column.index === 1) {
        const score = parseInt(data.cell.text[0]);
        if (score >= 80) {
          data.cell.styles.fillColor = [220, 252, 231];
          data.cell.styles.textColor = [22, 163, 74];
        } else if (score >= 60) {
          data.cell.styles.fillColor = [219, 234, 254];
          data.cell.styles.textColor = [37, 99, 235];
        } else if (score >= 40) {
          data.cell.styles.fillColor = [254, 249, 195];
          data.cell.styles.textColor = [202, 138, 4];
        } else {
          data.cell.styles.fillColor = [254, 226, 226];
          data.cell.styles.textColor = [220, 38, 38];
        }
      }
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  if (analysis_json.recommendations && analysis_json.recommendations.length > 0) {
    if (currentY > pageHeight - 60) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'bold');
    doc.text('Recommendations', 15, currentY);
    currentY += 5;

    const highPriority = analysis_json.recommendations.filter(r => r.severity === 'high');
    const mediumPriority = analysis_json.recommendations.filter(r => r.severity === 'medium');
    const lowPriority = analysis_json.recommendations.filter(r => r.severity === 'low');

    [
      { label: 'High Priority', recs: highPriority, color: [239, 68, 68] },
      { label: 'Medium Priority', recs: mediumPriority, color: [251, 191, 36] },
      { label: 'Low Priority', recs: lowPriority, color: [59, 130, 246] },
    ].forEach(({ label, recs, color }) => {
      if (recs.length === 0) return;

      if (currentY > pageHeight - 40) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(12);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(`${label} (${recs.length})`, 15, currentY);
      currentY += 8;

      recs.forEach((rec, idx) => {
        if (currentY > pageHeight - 50) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(31, 41, 55);
        doc.text(`${idx + 1}. ${rec.title}`, 20, currentY);
        currentY += 5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(75, 85, 99);

        const effortColor = rec.implementation_effort === 'easy' ? 'Easy' :
                           rec.implementation_effort === 'medium' ? 'Medium' : 'Hard';
        doc.text(`Effort: ${effortColor}`, 20, currentY);
        currentY += 5;

        const descLines = doc.splitTextToSize(rec.description, pageWidth - 45);
        doc.text(descLines, 20, currentY);
        currentY += descLines.length * 4 + 3;

        doc.setFont('helvetica', 'italic');
        doc.setTextColor(107, 114, 128);
        doc.text('Suggested Fix:', 20, currentY);
        currentY += 4;

        doc.setFont('helvetica', 'normal');
        const fixLines = doc.splitTextToSize(rec.suggested_fix, pageWidth - 45);
        doc.text(fixLines, 20, currentY);
        currentY += fixLines.length * 4 + 8;
      });
    });
  }

  if (analysis_json.warnings && analysis_json.warnings.length > 0) {
    if (currentY > pageHeight - 40) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(220, 38, 38);
    doc.setFont('helvetica', 'bold');
    doc.text('Warnings', 15, currentY);
    currentY += 8;

    analysis_json.warnings.forEach((warning, idx) => {
      if (currentY > pageHeight - 30) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(9);
      doc.setTextColor(75, 85, 99);
      doc.setFont('helvetica', 'normal');
      const warningLines = doc.splitTextToSize(`${idx + 1}. ${warning}`, pageWidth - 30);
      doc.text(warningLines, 20, currentY);
      currentY += warningLines.length * 4 + 5;
    });
  }

  if (analysis_json.notes && analysis_json.notes.length > 0) {
    if (currentY > pageHeight - 40) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(34, 197, 94);
    doc.setFont('helvetica', 'bold');
    doc.text('Positive Notes', 15, currentY);
    currentY += 8;

    analysis_json.notes.forEach((note, idx) => {
      if (currentY > pageHeight - 30) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(9);
      doc.setTextColor(75, 85, 99);
      doc.setFont('helvetica', 'normal');
      const noteLines = doc.splitTextToSize(`${idx + 1}. ${note}`, pageWidth - 30);
      doc.text(noteLines, 20, currentY);
      currentY += noteLines.length * 4 + 5;
    });
  }

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `Page ${i} of ${totalPages} | Generated by AIVO Insights`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );

    doc.text(
      'Custom Built by Astra Web Dev',
      pageWidth - 15,
      pageHeight - 10,
      { align: 'right' }
    );
  }

  const fileName = `AIVO-Report-${siteName.replace(/[^a-z0-9]/gi, '-')}-${new Date(scan.created_at).toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
