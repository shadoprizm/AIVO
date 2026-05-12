type PdfExportOptions = {
  margin: number | [number, number] | [number, number, number, number];
  image: {
    type: 'jpeg' | 'png' | 'webp';
    quality: number;
  };
  html2canvas: Record<string, unknown>;
  jsPDF: {
    unit: string;
    format: string | [number, number];
    orientation: 'portrait' | 'landscape';
  };
};

function createPdfSourceElement(html: string): HTMLDivElement {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const source = document.createElement('div');
  source.style.background = '#ffffff';

  parsed.head.querySelectorAll('style').forEach((style) => {
    source.appendChild(document.importNode(style, true));
  });

  parsed.body.childNodes.forEach((node) => {
    source.appendChild(document.importNode(node, true));
  });

  return source;
}

export async function downloadPdfFromHtml(
  html: string,
  filename: string,
  options?: Partial<PdfExportOptions>,
): Promise<void> {
  if (!html.trim()) {
    throw new Error('PDF source HTML was empty.');
  }

  const source = createPdfSourceElement(html);
  const { default: html2pdf } = await import('html2pdf.js');

  await html2pdf()
    .set({
      margin: options?.margin ?? 10,
      filename,
      image: options?.image ?? { type: 'jpeg', quality: 0.95 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        ...(options?.html2canvas ?? {}),
      },
      jsPDF: options?.jsPDF ?? { unit: 'mm', format: 'a4', orientation: 'portrait' },
    })
    .from(source)
    .save();
}
