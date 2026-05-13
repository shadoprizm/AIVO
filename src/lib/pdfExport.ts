import { CategoryScores, Scan } from '../types/database';
import { categoryLabels, categoryDescriptions } from './reportGenerators';

type JsPDF = InstanceType<typeof import('jspdf').jsPDF>;
type RGB = [number, number, number];

interface ReportContext {
  scan: Scan;
  siteName: string;
  siteUrl: string;
}

interface ScoreBand {
  label: string;
  text: RGB;
  fill: RGB;
  border: RGB;
}

const BRAND_NAVY: RGB = [15, 23, 42];
const BODY_TEXT: RGB = [31, 41, 55];
const MUTED_TEXT: RGB = [107, 114, 128];
const HAIRLINE: RGB = [229, 231, 235];
const CARD_BG: RGB = [249, 250, 251];
const ACCENT_BLUE: RGB = [37, 99, 235];

const PAGE = {
  marginX: 48,
  marginTop: 56,
  marginBottom: 56,
};

const FOOTER_HEIGHT = 28;

function scoreBand(score: number): ScoreBand {
  if (score >= 80) return { label: 'Strong', text: [22, 163, 74], fill: [220, 252, 231], border: [187, 247, 208] };
  if (score >= 60) return { label: 'Good', text: [37, 99, 235], fill: [219, 234, 254], border: [191, 219, 254] };
  if (score >= 40) return { label: 'Needs work', text: [202, 138, 4], fill: [254, 249, 195], border: [253, 230, 138] };
  return { label: 'At risk', text: [220, 38, 38], fill: [254, 226, 226], border: [254, 202, 202] };
}

const severityOrder: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low'];

const severityStyle: Record<'high' | 'medium' | 'low', { label: string; text: RGB; fill: RGB; border: RGB }> = {
  high: { label: 'High Priority', text: [220, 38, 38], fill: [254, 242, 242], border: [254, 202, 202] },
  medium: { label: 'Medium Priority', text: [202, 138, 4], fill: [255, 251, 235], border: [253, 230, 138] },
  low: { label: 'Low Priority', text: [37, 99, 235], fill: [239, 246, 255], border: [191, 219, 254] },
};

const effortStyle: Record<'low' | 'medium' | 'high', { text: RGB; fill: RGB }> = {
  low: { text: [22, 163, 74], fill: [220, 252, 231] },
  medium: { text: [202, 138, 4], fill: [254, 249, 195] },
  high: { text: [220, 38, 38], fill: [254, 226, 226] },
};

function formatScanDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
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

class PdfWriter {
  pdf: JsPDF;
  pageWidth: number;
  pageHeight: number;
  contentWidth: number;
  y: number;
  page = 1;
  reportDate: string;

  constructor(pdf: JsPDF, reportDate: string) {
    this.pdf = pdf;
    this.pageWidth = pdf.internal.pageSize.getWidth();
    this.pageHeight = pdf.internal.pageSize.getHeight();
    this.contentWidth = this.pageWidth - PAGE.marginX * 2;
    this.y = PAGE.marginTop;
    this.reportDate = reportDate;
    this.drawFooter();
  }

  get availableSpace(): number {
    return this.pageHeight - PAGE.marginBottom - FOOTER_HEIGHT - this.y;
  }

  newPage(): void {
    this.pdf.addPage();
    this.page += 1;
    this.y = PAGE.marginTop;
    this.drawFooter();
  }

  ensureSpace(needed: number): void {
    if (this.availableSpace < needed) this.newPage();
  }

  setFill(color: RGB): void {
    this.pdf.setFillColor(color[0], color[1], color[2]);
  }

  setDraw(color: RGB): void {
    this.pdf.setDrawColor(color[0], color[1], color[2]);
  }

  setText(color: RGB): void {
    this.pdf.setTextColor(color[0], color[1], color[2]);
  }

  drawFooter(): void {
    const { pdf } = this;
    pdf.setDrawColor(HAIRLINE[0], HAIRLINE[1], HAIRLINE[2]);
    pdf.setLineWidth(0.5);
    pdf.line(PAGE.marginX, this.pageHeight - PAGE.marginBottom - 12, this.pageWidth - PAGE.marginX, this.pageHeight - PAGE.marginBottom - 12);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(MUTED_TEXT[0], MUTED_TEXT[1], MUTED_TEXT[2]);
    pdf.text(`AIVO Insights · ${this.reportDate}`, PAGE.marginX, this.pageHeight - PAGE.marginBottom + 2);
    pdf.text(`Page ${this.page}`, this.pageWidth - PAGE.marginX, this.pageHeight - PAGE.marginBottom + 2, { align: 'right' });
  }

  writeWrapped(text: string, opts: { font?: 'normal' | 'bold' | 'italic'; size: number; color?: RGB; indent?: number; lineHeight?: number; width?: number }): void {
    const { pdf } = this;
    pdf.setFont('helvetica', opts.font ?? 'normal');
    pdf.setFontSize(opts.size);
    this.setText(opts.color ?? BODY_TEXT);
    const indent = opts.indent ?? 0;
    const width = (opts.width ?? this.contentWidth) - indent;
    const lineHeight = opts.lineHeight ?? opts.size * 1.35;
    const lines = pdf.splitTextToSize(text, width) as string[];
    for (const line of lines) {
      this.ensureSpace(lineHeight);
      pdf.text(line, PAGE.marginX + indent, this.y + opts.size * 0.85);
      this.y += lineHeight;
    }
  }
}

function drawHero(w: PdfWriter, ctx: ReportContext): void {
  const { pdf } = w;
  const overall = ctx.scan.analysis_json!.overall_score;
  const band = scoreBand(overall);

  pdf.setFillColor(ACCENT_BLUE[0], ACCENT_BLUE[1], ACCENT_BLUE[2]);
  pdf.rect(0, 0, w.pageWidth, 6, 'F');

  w.y = PAGE.marginTop + 4;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(ACCENT_BLUE[0], ACCENT_BLUE[1], ACCENT_BLUE[2]);
  pdf.text('AIVO INSIGHTS', PAGE.marginX, w.y);
  w.y += 10;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(26);
  pdf.setTextColor(BRAND_NAVY[0], BRAND_NAVY[1], BRAND_NAVY[2]);
  pdf.text('AI Visibility Report', PAGE.marginX, w.y + 18);
  w.y += 32;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10.5);
  pdf.setTextColor(MUTED_TEXT[0], MUTED_TEXT[1], MUTED_TEXT[2]);
  const metaLines = [
    `Prepared for: ${ctx.siteName}`,
    `Website: ${ctx.siteUrl}`,
    `Scan date: ${formatScanDate(ctx.scan.created_at)}`,
  ];
  metaLines.forEach((line) => {
    pdf.text(line, PAGE.marginX, w.y + 9);
    w.y += 14;
  });
  w.y += 12;

  const cardX = PAGE.marginX;
  const cardWidth = w.contentWidth;
  const cardHeight = 132;

  w.setFill(band.fill);
  w.setDraw(band.border);
  pdf.setLineWidth(1);
  pdf.roundedRect(cardX, w.y, cardWidth, cardHeight, 10, 10, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(72);
  w.setText(band.text);
  pdf.text(String(overall), cardX + cardWidth / 2, w.y + 78, { align: 'center' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  w.setText(band.text);
  pdf.text('out of 100', cardX + cardWidth / 2, w.y + 94, { align: 'center' });

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  w.setText(band.text);
  pdf.text(band.label.toUpperCase(), cardX + cardWidth / 2, w.y + 116, { align: 'center' });

  w.y += cardHeight + 22;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10.5);
  w.setText(BODY_TEXT);
  const intro = `This report measures how AI assistants — ChatGPT, Claude, Gemini, and Perplexity — read, understand, and recommend ${ctx.siteName}. The overall score reflects six dimensions of AI visibility, broken down on the following pages with concrete recommendations.`;
  const lines = pdf.splitTextToSize(intro, w.contentWidth) as string[];
  lines.forEach((line) => {
    pdf.text(line, PAGE.marginX, w.y + 9);
    w.y += 14;
  });
}

function drawSectionTitle(w: PdfWriter, title: string, subtitle?: string): void {
  w.ensureSpace(subtitle ? 56 : 40);
  const { pdf } = w;
  pdf.setFillColor(ACCENT_BLUE[0], ACCENT_BLUE[1], ACCENT_BLUE[2]);
  pdf.rect(PAGE.marginX, w.y, 4, 22, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(17);
  w.setText(BRAND_NAVY);
  pdf.text(title, PAGE.marginX + 14, w.y + 17);
  w.y += 26;
  if (subtitle) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    w.setText(MUTED_TEXT);
    const lines = pdf.splitTextToSize(subtitle, w.contentWidth) as string[];
    lines.forEach((line) => {
      pdf.text(line, PAGE.marginX, w.y + 8);
      w.y += 13;
    });
    w.y += 4;
  } else {
    w.y += 4;
  }
}

function drawExecutiveSummary(w: PdfWriter, scores: CategoryScores): void {
  const { strengths, weaknesses } = getStrengthsWeaknesses(scores);
  if (strengths.length === 0 && weaknesses.length === 0) return;

  drawSectionTitle(w, 'Executive Summary');

  const { pdf } = w;
  const blockX = PAGE.marginX;
  const blockWidth = w.contentWidth;
  const items: Array<{ label: string; text: string; color: RGB }> = [];
  if (strengths.length > 0) {
    items.push({ label: 'Strengths', text: `Strong performance in ${strengths.join(', ')}.`, color: [22, 163, 74] });
  }
  if (weaknesses.length > 0) {
    items.push({ label: 'Areas for improvement', text: `Focus needed on ${weaknesses.join(', ')}.`, color: [220, 38, 38] });
  }

  items.forEach((item) => {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const lines = pdf.splitTextToSize(item.text, blockWidth - 16) as string[];
    const blockHeight = 18 + lines.length * 13 + 12;
    w.ensureSpace(blockHeight + 8);

    w.setFill(CARD_BG);
    w.setDraw(HAIRLINE);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(blockX, w.y, blockWidth, blockHeight, 6, 6, 'FD');

    w.setFill(item.color);
    pdf.rect(blockX, w.y, 3, blockHeight, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    w.setText(item.color);
    pdf.text(item.label, blockX + 12, w.y + 14);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    w.setText(BODY_TEXT);
    let textY = w.y + 30;
    lines.forEach((line) => {
      pdf.text(line, blockX + 12, textY);
      textY += 13;
    });

    w.y += blockHeight + 8;
  });

  w.y += 8;
}

function drawCategoryBreakdown(w: PdfWriter, ctx: ReportContext): void {
  const analysis = ctx.scan.analysis_json!;
  drawSectionTitle(w, 'Category Breakdown', 'Six dimensions of AI visibility, scored from the analysis.');

  const { pdf } = w;
  const entries = Object.entries(analysis.category_scores) as Array<[keyof CategoryScores, number]>;

  entries.forEach(([key, score]) => {
    const band = scoreBand(score);
    const feedback = analysis.category_feedback?.[key];
    const description = categoryDescriptions[key];
    const label = categoryLabels[key];

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const descLines = pdf.splitTextToSize(description, w.contentWidth - 100) as string[];
    const reasonLines = feedback?.score_reason
      ? pdf.splitTextToSize(feedback.score_reason, w.contentWidth - 24) as string[]
      : [];
    const pathLines = feedback?.improvement_path
      ? pdf.splitTextToSize(feedback.improvement_path, w.contentWidth - 24) as string[]
      : [];

    const headerBlock = 36;
    const descBlock = descLines.length * 13;
    const reasonBlock = reasonLines.length > 0 ? 16 + reasonLines.length * 13 + 4 : 0;
    const pathBlock = pathLines.length > 0 ? 16 + pathLines.length * 13 + 4 : 0;
    const cardHeight = 14 + headerBlock + descBlock + reasonBlock + pathBlock + 12;

    w.ensureSpace(cardHeight + 10);

    const cardX = PAGE.marginX;
    w.setFill(CARD_BG);
    w.setDraw(HAIRLINE);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(cardX, w.y, w.contentWidth, cardHeight, 8, 8, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12.5);
    w.setText(BRAND_NAVY);
    pdf.text(label, cardX + 14, w.y + 22);

    const badgeWidth = 60;
    const badgeHeight = 26;
    const badgeX = cardX + w.contentWidth - 14 - badgeWidth;
    const badgeY = w.y + 10;
    w.setFill(band.fill);
    w.setDraw(band.border);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 6, 6, 'FD');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    w.setText(band.text);
    pdf.text(`${score}`, badgeX + badgeWidth / 2, badgeY + 18, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9.5);
    w.setText(MUTED_TEXT);
    let textY = w.y + 40;
    descLines.forEach((line) => {
      pdf.text(line, cardX + 14, textY);
      textY += 13;
    });
    textY += 6;

    if (reasonLines.length > 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9.5);
      w.setText(BRAND_NAVY);
      pdf.text('Why this score', cardX + 14, textY);
      textY += 14;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      w.setText(BODY_TEXT);
      reasonLines.forEach((line) => {
        pdf.text(line, cardX + 14, textY);
        textY += 13;
      });
      textY += 4;
    }

    if (pathLines.length > 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9.5);
      w.setText(ACCENT_BLUE);
      pdf.text('Path to 100', cardX + 14, textY);
      textY += 14;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      w.setText(BODY_TEXT);
      pathLines.forEach((line) => {
        pdf.text(line, cardX + 14, textY);
        textY += 13;
      });
    }

    w.y += cardHeight + 10;
  });
}

function drawRecommendations(w: PdfWriter, ctx: ReportContext): void {
  const recs = ctx.scan.analysis_json!.recommendations ?? [];
  if (recs.length === 0) return;

  w.newPage();
  drawSectionTitle(w, 'Recommendations', `${recs.length} prioritized action${recs.length === 1 ? '' : 's'} to lift AI visibility.`);

  const { pdf } = w;

  severityOrder.forEach((sev) => {
    const items = recs.filter((r) => r.severity === sev);
    if (items.length === 0) return;

    const style = severityStyle[sev];
    w.ensureSpace(40);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    w.setText(style.text);
    pdf.text(`${style.label} (${items.length})`, PAGE.marginX, w.y + 12);
    w.y += 22;

    items.forEach((rec, idx) => {
      const titleLines = pdf.splitTextToSize(`${idx + 1}. ${rec.title}`, w.contentWidth - 24) as string[];
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const descLines = pdf.splitTextToSize(rec.description, w.contentWidth - 28) as string[];
      const fixLines = pdf.splitTextToSize(rec.suggested_fix, w.contentWidth - 40) as string[];

      const titleBlock = titleLines.length * 16 + 6;
      const effortBlock = 22;
      const descBlock = descLines.length * 13 + 10;
      const fixBlock = 18 + fixLines.length * 13 + 14;
      const cardHeight = 14 + titleBlock + effortBlock + descBlock + fixBlock;

      w.ensureSpace(cardHeight + 10);

      const cardX = PAGE.marginX;
      w.setFill(style.fill);
      w.setDraw(style.border);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(cardX, w.y, w.contentWidth, cardHeight, 8, 8, 'FD');

      w.setFill(style.text);
      pdf.rect(cardX, w.y, 3.5, cardHeight, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      w.setText(BRAND_NAVY);
      let textY = w.y + 22;
      titleLines.forEach((line) => {
        pdf.text(line, cardX + 14, textY);
        textY += 16;
      });
      textY += 2;

      const effort = effortStyle[rec.implementation_effort];
      const effortLabel = `${rec.implementation_effort.toUpperCase()} EFFORT`;
      const effortPadding = 8;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      const effortTextWidth = pdf.getTextWidth(effortLabel);
      const effortWidth = effortTextWidth + effortPadding * 2;
      w.setFill(effort.fill);
      pdf.roundedRect(cardX + 14, textY - 8, effortWidth, 14, 3, 3, 'F');
      w.setText(effort.text);
      pdf.text(effortLabel, cardX + 14 + effortPadding, textY + 1);
      textY += 18;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      w.setText(BODY_TEXT);
      descLines.forEach((line) => {
        pdf.text(line, cardX + 14, textY);
        textY += 13;
      });
      textY += 6;

      const fixBoxY = textY;
      const fixBoxHeight = 14 + fixLines.length * 13 + 4;
      w.setFill([255, 255, 255]);
      w.setDraw(HAIRLINE);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(cardX + 14, fixBoxY, w.contentWidth - 28, fixBoxHeight, 5, 5, 'FD');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      w.setText(BRAND_NAVY);
      pdf.text('Suggested fix', cardX + 22, fixBoxY + 12);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9.5);
      w.setText(BODY_TEXT);
      let fixY = fixBoxY + 26;
      fixLines.forEach((line) => {
        pdf.text(line, cardX + 22, fixY);
        fixY += 13;
      });

      w.y += cardHeight + 8;
    });

    w.y += 6;
  });
}

function drawWarningsAndNotes(w: PdfWriter, ctx: ReportContext): void {
  const analysis = ctx.scan.analysis_json!;
  const warnings = analysis.warnings ?? [];
  const notes = analysis.notes ?? [];
  if (warnings.length === 0 && notes.length === 0) return;

  const { pdf } = w;

  if (warnings.length > 0) {
    drawSectionTitle(w, 'Warnings', 'Issues flagged by the scan that warrant attention.');
    warnings.forEach((warning, idx) => {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const lines = pdf.splitTextToSize(`${idx + 1}. ${warning}`, w.contentWidth - 24) as string[];
      const blockHeight = lines.length * 13 + 16;
      w.ensureSpace(blockHeight + 6);
      const cardX = PAGE.marginX;
      w.setFill([254, 242, 242]);
      w.setDraw([254, 202, 202]);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(cardX, w.y, w.contentWidth, blockHeight, 6, 6, 'FD');
      w.setFill([239, 68, 68]);
      pdf.rect(cardX, w.y, 3, blockHeight, 'F');
      w.setText(BODY_TEXT);
      let textY = w.y + 16;
      lines.forEach((line) => {
        pdf.text(line, cardX + 14, textY);
        textY += 13;
      });
      w.y += blockHeight + 6;
    });
    w.y += 6;
  }

  if (notes.length > 0) {
    drawSectionTitle(w, 'Positive Notes', 'Things the scan saw working well.');
    notes.forEach((note, idx) => {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const lines = pdf.splitTextToSize(`${idx + 1}. ${note}`, w.contentWidth - 24) as string[];
      const blockHeight = lines.length * 13 + 16;
      w.ensureSpace(blockHeight + 6);
      const cardX = PAGE.marginX;
      w.setFill([240, 253, 244]);
      w.setDraw([187, 247, 208]);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(cardX, w.y, w.contentWidth, blockHeight, 6, 6, 'FD');
      w.setFill([34, 197, 94]);
      pdf.rect(cardX, w.y, 3, blockHeight, 'F');
      w.setText(BODY_TEXT);
      let textY = w.y + 16;
      lines.forEach((line) => {
        pdf.text(line, cardX + 14, textY);
        textY += 13;
      });
      w.y += blockHeight + 6;
    });
  }
}

async function buildScanReportPdf(ctx: ReportContext): Promise<JsPDF> {
  if (!ctx.scan.analysis_json) {
    throw new Error('Scan has no analysis data to render.');
  }

  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
  const reportDate = formatScanDate(ctx.scan.created_at);
  const writer = new PdfWriter(pdf, reportDate);

  drawHero(writer, ctx);
  drawExecutiveSummary(writer, ctx.scan.analysis_json.category_scores);
  drawCategoryBreakdown(writer, ctx);
  drawRecommendations(writer, ctx);
  drawWarningsAndNotes(writer, ctx);

  return pdf;
}

export async function downloadScanReportPdf(ctx: ReportContext, filename: string): Promise<void> {
  const pdf = await buildScanReportPdf(ctx);
  pdf.save(filename);
}

export async function downloadPdfFromHtml(): Promise<void> {
  throw new Error('downloadPdfFromHtml has been replaced — use downloadScanReportPdf for the scan PDF flow.');
}
