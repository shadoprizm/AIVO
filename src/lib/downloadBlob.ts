export function downloadBlob(content: string | Blob, filename: string, mime?: string): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime ?? 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export function safeFilename(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'report';
}
