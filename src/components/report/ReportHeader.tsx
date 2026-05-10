import { ExternalLink } from 'lucide-react';

interface ReportHeaderProps {
  siteName: string;
  siteUrl?: string;
  scanDate?: string;
  status: string;
  overallScore: number;
}

export default function ReportHeader({ siteName, siteUrl, scanDate, status, overallScore }: ReportHeaderProps) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium capitalize text-blue-700">
            {status === 'complete' ? 'Complete scan' : 'Partial scan'}
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{siteName}</h1>
          {siteUrl && (
            <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-blue-600 hover:text-blue-700">
              {siteUrl.replace(/^https?:\/\//, '')}
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          {scanDate && (
            <p className="mt-2 text-sm text-gray-500">
              Scanned {new Date(scanDate).toLocaleString()}
            </p>
          )}
        </div>
        <div className="rounded-lg border-2 border-blue-200 bg-blue-50 px-5 py-3 text-center">
          <div className="text-4xl font-bold text-blue-700">{overallScore}</div>
          <div className="text-xs font-medium uppercase tracking-wide text-blue-900">AIVO Score</div>
        </div>
      </div>
    </section>
  );
}
